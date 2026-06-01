const TURN_DURATION_MS = 30_000;

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

function startTurnTimer(io, roomCode, db, saveGameStateFn, broadcastFn) {
  clearTurnTimer(roomCode);

  const gen = roomGen.get(roomCode) ?? 0;

  const timeoutId = setTimeout(
    () => _onTimerFired(io, roomCode, gen, db, saveGameStateFn, broadcastFn),
    TURN_DURATION_MS,
  );

  roomTimers.set(roomCode, timeoutId);
}

async function _onTimerFired(
  io,
  roomCode,
  gen,
  db,
  saveGameStateFn,
  broadcastFn,
) {
  if ((roomGen.get(roomCode) ?? 0) !== gen) return;

  try {
    // ── 1. Fetch fresh state from DB ────────────────────────────────────────
    const roomResult = await db.query(
      `SELECT * FROM rooms WHERE room_code = $1`,
      [roomCode],
    );
    if (roomResult.rows.length === 0) return;

    const room = roomResult.rows[0];
    if (room.status !== "active" || !room.game_state) return;

    let gameState = room.game_state;
    if (gameState.gameOver) return;

    // ── 2. Identify whose turn it is ────────────────────────────────────────
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    // Initialise helpers on gameState if first timer ever
    if (!gameState.disconnectedSkips) gameState.disconnectedSkips = {};
    if (!gameState.turnTimer) gameState.turnTimer = {};

    // ── 3. Advance turns — resolve ALL consecutive disconnected+graced players
    //       in one synchronous loop. No setTimeout(0) re-entry needed. ────────
    let advanceCount = 0;
    const maxAdvances = gameState.players.length;

    while (advanceCount < maxAdvances) {
      const player = gameState.players[gameState.currentPlayerIndex];
      if (!player) break;

      const statusResult = await db.query(
        `SELECT status FROM room_players
     WHERE room_id = $1
       AND (user_id::text = $2 OR reconnect_token = $2)`,
        [room.room_id, player.id],
      );

      const isDisconnected = statusResult.rows[0]?.status === "disconnected";

      if (!isDisconnected) {
        // Connected player — normal expiry, advance once and stop.
        _advanceOne(gameState);
        advanceCount++;
        break;
      }

      const graceUsed = gameState.disconnectedSkips[player.id] === true;

      if (!graceUsed) {
        // First timeout while disconnected — consume grace, advance once, stop.
        // Next timer will deal with them if still disconnected.
        gameState.disconnectedSkips[player.id] = true;
        _advanceOne(gameState);
        advanceCount++;
        break;
      }

      // Grace already used — skip immediately and keep looping.
      _advanceOne(gameState);
      advanceCount++;
      // loop continues: next player might also need immediate skipping
    }

    if (advanceCount === 0) return;

    // ── 4. Check if all remaining players are disconnected ──────────────────
    const allDisconnected = await _allPlayersDisconnected(
      db,
      room.room_id,
      gameState,
    );
    if (allDisconnected) {
      clearTurnTimer(roomCode);
      return;
    }

    // ── 5. Stamp new timer info and persist ─────────────────────────────────
    gameState.turnTimer = {
      startedAt: Date.now(),
      durationMs: TURN_DURATION_MS,
    };

    await saveGameStateFn(room.room_id, gameState);

    // ── 6. Broadcast once — all skips already resolved above ────────────────
    broadcastFn(io, roomCode, gameState);

    // ── 7. Start one normal timer — no special-case setTimeout(0) ───────────
    startTurnTimer(io, roomCode, db, saveGameStateFn, broadcastFn);
  } catch (err) {
    console.error(`[turnTimer] error in room ${roomCode}:`, err.message);
  }
}

/** Advance currentPlayerIndex by one step (respects direction, no skip logic). */
function _advanceOne(gameState) {
  const count = gameState.players.length;
  gameState.currentPlayerIndex =
    (gameState.currentPlayerIndex + gameState.direction + count) % count;
  // Clear any leftover pending draw flag from the player who timed out
  delete gameState.pendingDraw;
}

/** Returns true if every player in gameState is disconnected in the DB. */
async function _allPlayersDisconnected(db, roomId, gameState) {
  const ids = gameState.players.map((p) => p.id);
  if (ids.length === 0) return true;

  const result = await db.query(
    `SELECT COUNT(*)::int AS active_count
     FROM room_players
     WHERE room_id = $1
       AND status = 'active'
       AND (
         user_id::text = ANY($2)
         OR reconnect_token = ANY($2)
       )`,
    [roomId, ids],
  );

  return (result.rows[0]?.active_count ?? 0) === 0;
}

module.exports = { startTurnTimer, clearTurnTimer };
