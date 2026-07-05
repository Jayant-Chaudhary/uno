const roomManager = require("../roomManger");
const buildPublicState = require("../utils/buildPublicState");
const db = require("../db");
const {
  generateDeck,
  shuffleDeck,
  dealCard,
  playCard,
  drawCards,
  callOut,
  isValidPlay,
  nextTurn,
} = require("../gameEngine");
const {
  startTurnTimer,
  clearTurnTimer,
  resumeTurnTimer,
} = require("./TurnTimer");

async function saveGameState(roomId, gameState) {
  await db.query(
    `UPDATE rooms SET game_state = $1, last_activity = now() WHERE room_id = $2`,
    [JSON.stringify(gameState), roomId],
  );
}

async function updateSocketId(roomId, userId, reconnectToken, socketId) {
  if (userId) {
    await db.query(
      `UPDATE room_players SET socket_id = $1 WHERE room_id = $2 AND user_id = $3`,
      [socketId, roomId, userId],
    );
  } else if (reconnectToken) {
    await db.query(
      `UPDATE room_players SET socket_id = $1 WHERE room_id = $2 AND reconnect_token = $3`,
      [socketId, roomId, reconnectToken],
    );
  }
}
function broadcastGameUpdate(io, roomCode, gameState, extraData = {}) {
  // personalised — each player sees their own hand
  gameState.players.forEach((p) => {
    if (p.socketId) {
      io.to(p.socketId).emit("game_update", {
        gameState: buildPublicState.buildPublicState(gameState, p.id),
        ...extraData,
      });
    } else {
      // socketId missing — log it so you know who needs a reconnect
      console.warn(
        `broadcastGameUpdate: player ${p.id} has no socketId, skipping`,
      );
    }
  });
}

function stampTurnTimer(gameState, startedAt = Date.now()) {
  gameState.turnTimer = {
    startedAt,
    durationMs: 30_000,
  };
  return startedAt;
}

function registerGameEvents(io) {
  io.on("connection", (socket) => {
    // ← lowercase, everything inside
    console.log(`socket connected: ${socket.id}`);

    socket.onAny((eventName) => {
      console.log(`[SOCKET] Event: ${eventName} from ${socket.id}`);
    });
    // Log all outgoing emits from this socket
    const originalEmit = socket.emit.bind(socket);
    socket.emit = (event, ...args) => {
      console.log(`[SOCKET] Emit: ${event} to ${socket.id}`);
      return originalEmit(event, ...args);
    };
    socket.intentionalLeave = false;

    // ── join_room ────────────────────────────────────────────────────────────
    socket.on("joinRoom", async ({ roomCode, userId, reconnectToken }) => {
      try {
        const { room, players } = await roomManager.getRoomState(roomCode);
        await updateSocketId(
          room.room_id,
          userId || null,
          reconnectToken || null,
          socket.id,
        );
        socket.join(roomCode); // join FIRST then emit
        if (room.status === "active" && room.game_state) {
          const playerId = userId || reconnectToken;
          const playerInState = room.game_state.players.find(
            (p) => p.id === playerId,
          );
          if (playerInState) {
            playerInState.socketId = socket.id;
            await saveGameState(room.room_id, room.game_state);
          }
        }
        const socketsInRoom = await io.in(roomCode).allSockets();

        io.to(roomCode).emit("room_update", { room, players });
        socket.emit("joined", { roomCode, room, players });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── start_game ───────────────────────────────────────────────────────────
    socket.on("StartGame", async ({ roomCode, hostId }) => {
      // ← destructure object
      try {
        const { room, players } = await roomManager.getRoomState(roomCode); // ← await
        if (room.host_id !== hostId) {
          return socket.emit("error", { message: "Only the host can start" });
        }
        if (players.length < 2) {
          return socket.emit("error", { message: "Need at least 2 players" });
        }
        if (room.status !== "waiting") {
          return socket.emit("error", { message: "Game already started" });
        }

        const gamePlayers = players.map((p, i) => ({
          id: p.user_id || p.reconnect_token,
          name: p.display_name || p.username || p.guest_name,
          avatarEmoji: p.avatar_emoji || null,
          hand: [],
          socketId: p.socket_id,
        }));


        let gameState = {
          players: gamePlayers,
          deck: shuffleDeck(generateDeck()), // not async, no await needed
          discardPile: [],
          currentPlayerIndex: 0,
          direction: 1,
          currentColor: null,
          currentValue: null,
          currentType: null,
          skip: false,
          pendingUno: null,
          gameOver: false,
          winner: null,
          disconnectedSkips: {},
        };

        gameState = dealCard(gameState); // not async
        const startedAt = stampTurnTimer(gameState);

        await db.query(
          `UPDATE rooms SET status = 'active', game_state = $1 WHERE room_id = $2`,
          [JSON.stringify(gameState), room.room_id],
        );

        gamePlayers.forEach((p) => {
          if (p.socketId) {
            io.to(p.socketId).emit("game_started", {
              gameState: buildPublicState.buildPublicState(gameState, p.id),
            });
          }
        });
        startTurnTimer(io, roomCode, db, saveGameState, broadcastGameUpdate, startedAt);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── play_card ────────────────────────────────────────────────────────────
    socket.on(
      "PlayCards",
      async ({ roomCode, playerId, cardId, chosenColor }) => {
        const client = await db.connect();
        let startedAt;
        try {
          clearTurnTimer(roomCode);
          await client.query("BEGIN");

          const roomResult = await client.query(
            `SELECT * FROM rooms WHERE room_code = $1 FOR UPDATE`,
            [roomCode],
          );
          if (roomResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return socket.emit("error", { message: "Room not found" });
          }
          const room = roomResult.rows[0];
          let gameState = room.game_state;
          const currentPlayer = gameState.players[gameState.currentPlayerIndex];
          if (currentPlayer.id !== playerId) {
            await client.query("ROLLBACK");
            return socket.emit("error", { message: "Not your turn" });
          }

          gameState = playCard(
            gameState,
            playerId,
            cardId,
            chosenColor || null,
          );
          if (gameState.disconnectedSkips)
            delete gameState.disconnectedSkips[playerId];
          if (!gameState.afkCounts) gameState.afkCounts = {};
          gameState.afkCounts[playerId] = 0;
          startedAt = stampTurnTimer(gameState);

          await client.query(
            `UPDATE rooms SET game_state = $1, last_activity = now() WHERE room_id = $2`,
            [JSON.stringify(gameState), room.room_id],
          );

          if (gameState.gameOver) {
            await client.query(
              `UPDATE rooms SET status = 'finished' WHERE room_id = $1`,
              [room.room_id],
            );
          }

          await client.query("COMMIT");

          broadcastGameUpdate(io, roomCode, gameState, {
            event: "card_played",
            by: playerId,
            cardId,
          });

          if (gameState.gameOver) {
            io.to(roomCode).emit("game_over", {
              winner: gameState.winner,
              winnerName: gameState.players.find(
                (p) => p.id === gameState.winner,
              )?.name,
            });
          }
          startTurnTimer(io, roomCode, db, saveGameState, broadcastGameUpdate, startedAt);
        } catch (err) {
          try {
            await client.query("ROLLBACK");
          } catch (_) {}
          startTurnTimer(io, roomCode, db, saveGameState, broadcastGameUpdate, startedAt);
          socket.emit("error", { message: err.message });
        } finally {
          client.release();
        }
      },
    );

    // ── draw_card ────────────────────────────────────────────────────────────
    socket.on("draw_card", async ({ roomCode, playerId }) => {
      const client = await db.connect();
      let startedAt;
      try {
        clearTurnTimer(roomCode);
        await client.query("BEGIN");

        const roomResult = await client.query(
          `SELECT * FROM rooms WHERE room_code = $1 FOR UPDATE`,
          [roomCode],
        );
        if (roomResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return socket.emit("error", { message: "Room not found" });
        }
        const room = roomResult.rows[0];
        let gameState = room.game_state;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.id !== playerId) {
          await client.query("ROLLBACK");
          return socket.emit("error", { message: "Not your turn" });
        }

        const player = gameState.players.find((p) => p.id === playerId);
        drawCards(gameState, player, 1);

        const drawnCard = player.hand[player.hand.length - 1];
        const canPlay = isValidPlay(drawnCard, gameState);

        if (!canPlay) {
          gameState = nextTurn(gameState);
        }
        if (gameState.disconnectedSkips)
          delete gameState.disconnectedSkips[playerId];
        if (!gameState.afkCounts) gameState.afkCounts = {};
        gameState.afkCounts[playerId] = 0;
        startedAt = stampTurnTimer(gameState);

        await client.query(
          `UPDATE rooms SET game_state = $1, last_activity = now() WHERE room_id = $2`,
          [JSON.stringify(gameState), room.room_id],
        );

        await client.query("COMMIT");

        broadcastGameUpdate(io, roomCode, gameState, {
          event: "card_drawn",
          by: playerId,
          canPlay,
        });
        startTurnTimer(io, roomCode, db, saveGameState, broadcastGameUpdate, startedAt);
      } catch (err) {
        try {
          await client.query("ROLLBACK");
        } catch (_) {}
        startTurnTimer(io, roomCode, db, saveGameState, broadcastGameUpdate, startedAt);
        socket.emit("error", { message: err.message });
      } finally {
        client.release();
      }
    });

    // ── say_uno ──────────────────────────────────────────────────────────────
    socket.on("SayUno", async ({ roomCode, playerId }) => {
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        const roomResult = await client.query(
          `SELECT * FROM rooms WHERE room_code = $1 FOR UPDATE`,
          [roomCode],
        );
        if (roomResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return socket.emit("error", { message: "Room not found" });
        }
        const room = roomResult.rows[0];
        let gameState = room.game_state;

        if (gameState.pendingUno?.playerId === playerId) {
          gameState.pendingUno = null;
          await client.query(
            `UPDATE rooms SET game_state = $1, last_activity = now() WHERE room_id = $2`,
            [JSON.stringify(gameState), room.room_id],
          );
        }
        await client.query("COMMIT");
        io.to(roomCode).emit("uno_called", { playerId });
        broadcastGameUpdate(io, roomCode, gameState);
      } catch (err) {
        try {
          await client.query("ROLLBACK");
        } catch (_) {}
        socket.emit("error", { message: err.message });
      } finally {
        client.release();
      }
    });

    // ── call_out ─────────────────────────────────────────────────────────────
    socket.on("CallOut", async ({ roomCode, callerId, targetId }) => {
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        const roomResult = await client.query(
          `SELECT * FROM rooms WHERE room_code = $1 FOR UPDATE`,
          [roomCode],
        );
        if (roomResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return socket.emit("error", { message: "Room not found" });
        }
        const room = roomResult.rows[0];
        let gameState = room.game_state;

        gameState = callOut(gameState, callerId, targetId);
        await client.query(
          `UPDATE rooms SET game_state = $1, last_activity = now() WHERE room_id = $2`,
          [JSON.stringify(gameState), room.room_id],
        );
        await client.query("COMMIT");

        broadcastGameUpdate(io, roomCode, gameState, {
          event: "callout",
          callerId,
          targetId,
        });
      } catch (err) {
        try {
          await client.query("ROLLBACK");
        } catch (_) {}
        socket.emit("error", { message: err.message });
      } finally {
        client.release();
      }
    });

    // ── play_again ───────────────────────────────────────────────────────────
    socket.on("play_again", async ({ roomCode, hostId }) => {
      try {
        clearTurnTimer(roomCode);
        const state = await roomManager.playAgain(roomCode, hostId);
        io.to(roomCode).emit("room_update", state);
        io.to(roomCode).emit("back_to_lobby");
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── reconnect ────────────────────────────────────────────────────────────
    socket.on(
      "reconnect_player",
      async ({ roomCode, userId, reconnectToken }) => {
        try {
          const result = await roomManager.reconnectPlayer(
            roomCode,
            userId || null,
            reconnectToken || null,
            socket.id,
          );

          socket.join(roomCode);

          let gameState = result.gameState;

          const playerId = userId || reconnectToken;

          if (gameState) {
            const playerInState = gameState.players.find(
              (p) => p.id === playerId,
            );
            if (playerInState) {
              playerInState.socketId = socket.id;
            } else {
              console.warn(
                `[RECONNECT] player ${playerId} not found in gameState`,
              );
            }

            await saveGameState(result.room.room_id, gameState);

            const currentPlayer =
              gameState.players[gameState.currentPlayerIndex];
            const activePlayersCount = gameState.players.filter(
              (p) => p.socketId !== null,
            ).length;

            // ── 2-player: notify everyone the opponent is back, resume timer ─────
            if (activePlayersCount === 2) {
              io.to(roomCode).emit("opponent_reconnected", {
                reconnectedId: playerId,
              });

              if (currentPlayer?.id === playerId) {
                // it was their turn when they disconnected — resume remaining time
                const startedAt = gameState.turnTimer?.startedAt ?? Date.now();
                resumeTurnTimer(
                  io,
                  roomCode,
                  db,
                  saveGameState,
                  broadcastGameUpdate,
                  startedAt,
                );
              }
              broadcastGameUpdate(io, roomCode, gameState);
            } else {
              // 3 and more players
              if (currentPlayer?.id === playerId) {
                const startedAt = gameState.turnTimer?.startedAt ?? Date.now();
                resumeTurnTimer(
                  io,
                  roomCode,
                  db,
                  saveGameState,
                  broadcastGameUpdate,
                  startedAt,
                );
                broadcastGameUpdate(io, roomCode, gameState);
              }
            }
          }

          socket.emit("reconnected", {
            gameState: gameState
              ? buildPublicState.buildPublicState(gameState, playerId)
              : null,
            room: result.room,
          });

          io.to(roomCode).emit("player_reconnected", { playerId });
        } catch (err) {
          socket.emit("error", { message: err.message });
        }
      },
    );

    // ── pass_turn ────────────────────────────────────────────────────────────
    socket.on("pass_turn", async ({ roomCode, playerId }) => {
      const client = await db.connect();
      let startedAt;
      try {
        clearTurnTimer(roomCode);
        await client.query("BEGIN");

        const roomResult = await client.query(
          `SELECT * FROM rooms WHERE room_code = $1 FOR UPDATE`,
          [roomCode],
        );
        if (roomResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return socket.emit("error", { message: "Room not found" });
        }
        const room = roomResult.rows[0];
        let gameState = room.game_state;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.id !== playerId) {
          await client.query("ROLLBACK");
          return socket.emit("error", { message: "Not your turn" });
        }

        const playerObj = gameState.players.find((p) => p.id === playerId);
        const hasPlayableCard = playerObj?.hand?.some((card) => isValidPlay(card, gameState));
        if (!hasPlayableCard) {
          await client.query("ROLLBACK");
          return socket.emit("error", { message: "You must draw a card because you have no playable cards." });
        }

        gameState = nextTurn(gameState);

        if (gameState.disconnectedSkips)
          delete gameState.disconnectedSkips[playerId];
        if (!gameState.afkCounts) gameState.afkCounts = {};
        gameState.afkCounts[playerId] = 0;
        startedAt = stampTurnTimer(gameState);

        await client.query(
          `UPDATE rooms SET game_state = $1, last_activity = now() WHERE room_id = $2`,
          [JSON.stringify(gameState), room.room_id],
        );

        await client.query("COMMIT");

        broadcastGameUpdate(io, roomCode, gameState, {
          event: "turn_passed",
          by: playerId,
        });
        startTurnTimer(io, roomCode, db, saveGameState, broadcastGameUpdate, startedAt);
      } catch (err) {
        try {
          await client.query("ROLLBACK");
        } catch (_) {}
        startTurnTimer(io, roomCode, db, saveGameState, broadcastGameUpdate, startedAt);
        socket.emit("error", { message: err.message });
      } finally {
        client.release();
      }
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnecting", async () => {
      const DISCONNECT_GRACE_MS = 3000;
      if (socket.intentionalLeave) return;
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);
      console.log(`[SOCKET] Disconnecting: socket ${socket.id}`);
      for (const roomCode of rooms) {
        setTimeout(async () => {
          console.log(`[SOCKET] Disconnect timer fired for socket ${socket.id} in room ${roomCode}`);
          try {
            const updated = await roomManager.disconnectPlayer(
              roomCode,
              socket.id,
            );


            if (updated === null) {
              io.to(roomCode).emit("room_deleted");
              return;
            }
            if (!updated) return;

            // ── fetch fresh room state ───────────────────────────────────────────
            const roomResult = await db.query(
              `SELECT * FROM rooms WHERE room_code = $1`,
              [roomCode],
            );
            if (roomResult.rows.length === 0) return;
            const room = roomResult.rows[0];

            const disconnectedId = updated.user_id || updated.reconnect_token;
            const disconnectedName = updated.display_name || updated.username || updated.guest_name;

            io.to(roomCode).emit("player_disconnected", {
              disconnectedId,
              disconnectedName,
            });

            if (room.status !== "active" || !room.game_state) return;

            const gameState = room.game_state;

            //null out socketId in gameState
            const playerInState = gameState.players.find(
              (p) => p.id === disconnectedId,
            );
            if (playerInState) {
              playerInState.socketId = null;
              await saveGameState(room.room_id, gameState);
            }

            // Always broadcast the state change so everyone knows they are offline
            broadcastGameUpdate(io, roomCode, gameState);

            // If it was their turn when they disconnected, ensure the turn timer continues running
            const currentPlayer =
              gameState.players[gameState.currentPlayerIndex];
            if (currentPlayer?.id === disconnectedId) {
              const startedAt = gameState.turnTimer?.startedAt ?? Date.now();
              resumeTurnTimer(
                io,
                roomCode,
                db,
                saveGameState,
                broadcastGameUpdate,
                startedAt,
              );
            }
          } catch (err) {
            console.error(
              `[DISCONNECT_TIMER] error for room ${roomCode}:`,
              err.message,
              err.stack,
            );
          }
        }, DISCONNECT_GRACE_MS);
      }
    });

    socket.on("intentional_leave", () => {
      socket.intentionalLeave = true;
    });
  });
}

module.exports = { registerGameEvents }; // ← matches the export name
