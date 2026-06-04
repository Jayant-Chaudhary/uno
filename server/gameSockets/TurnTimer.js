const TURN_DURATION_MS = 30_000;
const { drawCards } = require("../gameEngine");

const roomTimers = new Map();
const roomGen = new Map();

function clearTurnTimer(roomCode) {
  const id = roomTimers.get(roomCode);
  if (id !== undefined) {
    clearTimeout(id);
    roomTimers.delete(roomCode);
  }
  roomGen.set(roomCode, (roomGen.get(roomCode) ?? 0) + 1);
}

function startTurnTimer(io, roomCode, db, saveGameStateFn, broadcastFn, startedAt) {
  clearTurnTimer(roomCode);
  const gen = roomGen.get(roomCode) ?? 0;
  const actualStartedAt = startedAt ?? Date.now();
  const timeoutId = setTimeout(
    () => _onTimerFired(io, roomCode, gen, actualStartedAt, db, saveGameStateFn, broadcastFn),
    TURN_DURATION_MS,
  );
  roomTimers.set(roomCode, timeoutId);
}


function resumeTurnTimer(io, roomCode, db, saveGameStateFn, broadcastFn, startedAt) {
  clearTurnTimer(roomCode);
  const elapsed = Date.now() - (startedAt ?? 0);
  const remaining = Math.max(0, TURN_DURATION_MS - elapsed);
  const gen = roomGen.get(roomCode) ?? 0;
  const timeoutId = setTimeout(
    () => _onTimerFired(io, roomCode, gen, startedAt, db, saveGameStateFn, broadcastFn),
    remaining,
  );
  roomTimers.set(roomCode, timeoutId);
}

async function _onTimerFired(io, roomCode, gen, expectedStartedAt, db, saveGameStateFn, broadcastFn) {
  if ((roomGen.get(roomCode) ?? 0) !== gen) return;

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const roomResult = await client.query(
      `SELECT * FROM rooms WHERE room_code = $1 FOR UPDATE`,
      [roomCode],
    );
    if (roomResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return;
    }

    const room = roomResult.rows[0];
    if (room.status !== "active" || !room.game_state) {
      await client.query("ROLLBACK");
      return;
    }

    let gameState = room.game_state;
    if (gameState.gameOver) {
      await client.query("ROLLBACK");
      return;
    }

    // Verify expectedStartedAt to prevent stale turn executions
    if (!gameState.turnTimer || gameState.turnTimer.startedAt !== expectedStartedAt) {
      await client.query("ROLLBACK");
      return;
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) {
      await client.query("ROLLBACK");
      return;
    }

    if (!gameState.afkCounts) gameState.afkCounts = {};
    if (!gameState.turnTimer) gameState.turnTimer = {};

    // Increment consecutive AFK count for the timed-out player
    gameState.afkCounts[currentPlayer.id] = (gameState.afkCounts[currentPlayer.id] || 0) + 1;

    let removed = false;
    if (gameState.afkCounts[currentPlayer.id] > 2) {
      // AFK count > 2 (i.e. 3 consecutive timeouts) — remove the player!
      const leavingId = currentPlayer.id;
      const leavingIndex = gameState.players.findIndex((p) => p.id === leavingId);

      if (leavingIndex !== -1) {
        // Return their cards back to the deck
        const leavingCards = gameState.players[leavingIndex].hand;
        gameState.deck.push(...leavingCards);

        // Remove player from the array
        gameState.players.splice(leavingIndex, 1);

        // Remove player in the database
        await client.query(
          `UPDATE room_players SET status = 'left', socket_id = NULL
           WHERE room_id = $1 AND (user_id::text = $2 OR reconnect_token = $2)`,
          [room.room_id, leavingId]
        );

        removed = true;

        // If active player becomes one (1)
        if (gameState.players.length === 1) {
          gameState.gameOver = true;
          gameState.winner = gameState.players[0].id;

          await client.query(
            `UPDATE rooms SET status = 'finished', game_state = $1, last_activity = now() WHERE room_id = $2`,
            [JSON.stringify(gameState), room.room_id]
          );

          await client.query("COMMIT");

          broadcastFn(io, roomCode, gameState);
          io.to(roomCode).emit("game_over", {
            winner: gameState.winner,
            winnerName: gameState.players[0].name,
          });
          clearTurnTimer(roomCode);
          return;
        }

        // Adjust index: since we spliced, next player falls into leavingIndex
        if (leavingIndex < gameState.currentPlayerIndex) {
          gameState.currentPlayerIndex = Math.max(0, gameState.currentPlayerIndex - 1);
        }
        gameState.currentPlayerIndex = gameState.currentPlayerIndex % gameState.players.length;
      }
    }

    if (!removed) {
      // Normal AFK timeout — apply 1-card draw penalty and advance turn
      drawCards(gameState, currentPlayer, 1);
      _advanceOne(gameState);
    }

    const allDisconnected = await _allPlayersDisconnected(client, room.room_id, gameState);
    if (allDisconnected) {
      await client.query(
        `UPDATE rooms SET game_state = $1, last_activity = now() WHERE room_id = $2`,
        [JSON.stringify(gameState), room.room_id],
      );
      await client.query("COMMIT");
      broadcastFn(io, roomCode, gameState);
      clearTurnTimer(roomCode);
      return;
    }

    const nextStartedAt = Date.now();
    gameState.turnTimer = {
      startedAt: nextStartedAt,
      durationMs: TURN_DURATION_MS,
    };

    await client.query(
      `UPDATE rooms SET game_state = $1, last_activity = now() WHERE room_id = $2`,
      [JSON.stringify(gameState), room.room_id],
    );

    await client.query("COMMIT");

    broadcastFn(io, roomCode, gameState);
    startTurnTimer(io, roomCode, db, saveGameStateFn, broadcastFn, nextStartedAt);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    console.error(`[turnTimer] error in room ${roomCode}:`, err.message);
  } finally {
    client.release();
  }
}

function _advanceOne(gameState) {
  const count = gameState.players.length;
  gameState.currentPlayerIndex =
    (gameState.currentPlayerIndex + gameState.direction + count) % count;
  delete gameState.pendingDraw;
}

async function _allPlayersDisconnected(db, roomId, gameState) {
  const ids = gameState.players.map((p) => p.id);
  if (ids.length === 0) return true;
  const result = await db.query(
    `SELECT COUNT(*)::int AS active_count
     FROM room_players
     WHERE room_id = $1
       AND status = 'active'
       AND (user_id::text = ANY($2) OR reconnect_token = ANY($2))`,
    [roomId, ids],
  );
  return (result.rows[0]?.active_count ?? 0) === 0;
}

module.exports = { startTurnTimer, clearTurnTimer, resumeTurnTimer };