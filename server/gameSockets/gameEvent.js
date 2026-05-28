const roomManager = require("../roomManger");
const db = require("../db");
const {
  generateDeck,
  shuffleDeck,
  dealCard,
  playCard,
  drawCards,
  callOut,
  isValidPlay,
} = require("../gameEngine");

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

function buildPublicState(gameState, forPlayerId = null) {
  return {
    ...gameState,
    players: gameState.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatarEmoji: p.avatarEmoji,
      cardCount: p.hand.length,
      hand: p.id === forPlayerId ? p.hand : undefined,
    })),
    deck: undefined,
  };
}

function registerGameEvents(io) {
  io.on("connection", (socket) => {
    // ← lowercase, everything inside
    console.log(`socket connected: ${socket.id}`);

    socket.onAny((eventName, ...args) => {
      console.log("EVENT RECEIVED:", eventName, JSON.stringify(args));
    });

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
        const socketsInRoom = await io.in(roomCode).allSockets();
        console.log("sockets in room after join:", [...socketsInRoom]);
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
          id: p.user_id || `guest_${p.id}`,
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
        };

        gameState = dealCard(gameState); // not async

        await db.query(
          `UPDATE rooms SET status = 'active', game_state = $1 WHERE room_id = $2`,
          [JSON.stringify(gameState), room.room_id],
        );

        gamePlayers.forEach((p) => {
          if (p.socketId) {
            io.to(p.socketId).emit("game_started", {
              gameState: buildPublicState(gameState, p.id),
            });
          }
        });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── play_card ────────────────────────────────────────────────────────────
    socket.on(
      "PlayCards",
      async ({ roomCode, playerId, cardId, chosenColor }) => {
        try {
          const roomResult = await db.query(
            `SELECT * FROM rooms WHERE room_code = $1`,
            [roomCode],
          );
          if (roomResult.rows.length === 0) {
            return socket.emit("error", { message: "Room not found" });
          }
          const room = roomResult.rows[0]; // ← .rows[0]
          let gameState = room.game_state;

          gameState = playCard(
            gameState,
            playerId,
            cardId,
            chosenColor || null,
          );
          await saveGameState(room.room_id, gameState);

          gameState.players.forEach((p) => {
            if (p.socketId) {
              io.to(p.socketId).emit("game_update", {
                gameState: buildPublicState(gameState, p.id),
                event: "card_played",
                by: playerId,
                cardId,
              });
            }
          });

          if (gameState.gameOver) {
            io.to(roomCode).emit("game_over", {
              winner: gameState.winner,
              winnerName: gameState.players.find(
                (p) => p.id === gameState.winner,
              )?.name,
            });
            await db.query(
              `UPDATE rooms SET status = 'finished' WHERE room_id = $1`,
              [room.room_id],
            );
          }
        } catch (err) {
          socket.emit("error", { message: err.message });
        }
      },
    );

    // ── draw_card ────────────────────────────────────────────────────────────
    socket.on("draw_card", async ({ roomCode, playerId }) => {
      try {
        const roomResult = await db.query(
          `SELECT * FROM rooms WHERE room_code = $1`,
          [roomCode],
        );
        const room = roomResult.rows[0];
        let gameState = room.game_state;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.id !== playerId) {
          return socket.emit("error", { message: "Not your turn" });
        }

        const player = gameState.players.find((p) => p.id === playerId);
        drawCards(gameState, player, 1);

        const drawnCard = player.hand[player.hand.length - 1];
        const canPlay = isValidPlay(drawnCard, gameState);

        if (!canPlay) {
          const playercount = gameState.players.length;
          gameState.currentPlayerIndex =
            (gameState.currentPlayerIndex + gameState.direction + playercount) %
            playercount;
        }

        await saveGameState(room.room_id, gameState);

        gameState.players.forEach((p) => {
          if (p.socketId) {
            io.to(p.socketId).emit("game_update", {
              gameState: buildPublicState(gameState, p.id),
              event: "card_drawn",
              by: playerId,
              canPlay,
              drawnCard: p.id === playerId ? drawnCard : undefined,
            });
          }
        });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── say_uno ──────────────────────────────────────────────────────────────
    socket.on("SayUno", async ({ roomCode, playerId }) => {
      // ← destructure
      try {
        const roomResult = await db.query(
          `SELECT * FROM rooms WHERE room_code = $1`,
          [roomCode],
        );
        const room = roomResult.rows[0];
        let gameState = room.game_state;

        if (gameState.pendingUno?.playerId === playerId) {
          gameState.pendingUno = null;
          await saveGameState(room.room_id, gameState);
        }
        io.to(roomCode).emit("uno_called", { playerId });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── call_out ─────────────────────────────────────────────────────────────
    socket.on("CallOut", async ({ roomCode, callerId, targetId }) => {
      try {
        const roomResult = await db.query(
          `SELECT * FROM rooms WHERE room_code = $1`,
          [roomCode],
        );
        const room = roomResult.rows[0];
        let gameState = room.game_state;

        gameState = callOut(gameState, callerId, targetId);
        await saveGameState(room.room_id, gameState);

        gameState.players.forEach((p) => {
          if (p.socketId) {
            io.to(p.socketId).emit("game_update", {
              gameState: buildPublicState(gameState, p.id),
              event: "callout",
              callerId,
              targetId,
            });
          }
        });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── play_again ───────────────────────────────────────────────────────────
    socket.on("play_again", async ({ roomCode, hostId }) => {
      try {
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

          const gameState = result.gameState;
          const playerId = userId || `guest_${result.player.id}`;

          socket.emit("reconnected", {
            gameState: gameState ? buildPublicState(gameState, playerId) : null,
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
      try {
        const roomResult = await db.query(
          `SELECT * FROM rooms WHERE room_code = $1`,
          [roomCode],
        );
        const room = roomResult.rows[0];
        let gameState = room.game_state;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.id !== playerId) {
          return socket.emit("error", { message: "Not your turn" });
        }

        const playercount = gameState.players.length;
        gameState.currentPlayerIndex =
          (gameState.currentPlayerIndex + gameState.direction + playercount) %
          playercount;

        await saveGameState(room.room_id, gameState);

        gameState.players.forEach((p) => {
          if (p.socketId) {
            io.to(p.socketId).emit("game_update", {
              gameState: buildPublicState(gameState, p.id),
              event: "turn_passed",
              by: playerId,
            });
          }
        });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnecting", async () => {
      if (socket.intentionalLeave) return;
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);
      for (const roomCode of rooms) {
        try {
          const updated = await roomManager.disconnectPlayer(
            roomCode,
            socket.id,
          );
          if (updated === null) {
            // Room was deleted (host left)
            io.to(roomCode).emit("room_deleted");
          } else if (updated) {
            io.to(roomCode).emit("player_disconnected", {
              socketId: socket.id,
            });
          }
        } catch (_) {}
      }
    });

    socket.on("intentional_leave", () => {
      socket.intentionalLeave = true;
    });
  });
}

module.exports = { registerGameEvents }; // ← matches the export name
