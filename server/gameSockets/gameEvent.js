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
} = require("./gameEngine");
const { Connection } = require("pg");
const { Socket } = require("socket.io");

//helper functions

//game state updater
async function saveGameState(roomId, gameState) {
  await db.query(
    `UPDATE rooms SET game_state = $1, last_activity = now() WHERE room_id = $2`,
    [JSON.stringify(gameState), roomId],
  );
}

//updat the socket id
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

//givin the player hand
function buildPublicState(gameState, forPlayerId = null) {
  return {
    ...gameState,
    players: gameState.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatarIndex: p.avatarIndex,
      cardCount: p.hand.length,
      hand: p.id === forPlayerId ? p.hand : undefined,
    })),
    deck: undefined, // never send deck to clients
  };
}

//working functions
function registerGameEvent(io) {
  io.on("Connection", (socket) => {
    console.log(`socket connected successfully ${socket.id}`); //debugers and checkers
    //join room
    socket.on("joinRoom", async ({ roomCode, userId, reconnectToken }) => {
      try {
        const { room, players } = await roomManager.getRoomState(roomCode);
        await updateSocketId(
          room.room_id,
          userId || null,
          reconnectToken || null,
          socket.id,
        );
        socket.join(roomCode);
        io.to(roomCode).emit("room_update", { room, players });
        socket.emit("joined", { roomCode, room, players });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    //buidling the initial game state
    socket.on("StartGame", async (roomCode, hostId) => {
      try {
        const { room, players } = roomManager.getRoomState(roomCode);
        if (room.host_id !== hostId) {
          return socket.emit("error", {
            message: "Only the host can start the game",
          });
        }
        if (players.length < 2) {
          return socket.emit("error", {
            message: "Need at least 2 players to start",
          });
        }
        if (room.status !== "waiting") {
          return socket.emit("error", { message: "Game already started" });
        }
        if (players.length < 2) {
          return socket.emit("error", {
            message: "Need at least 2 players to start",
          });
        }
        if (room.status !== "waiting") {
          return socket.emit("error", { message: "Game already started" });
        }
        const gamePlayers = players.map((p, i) => ({
          id: p.user_id || `guest_${p.id}`,
          name: p.username || p.guest_name,
          avatarIndex: p.avatar_index ?? i,
          hand: [],
          socketId: p.socket_id,
        }));
        let gameState = {
          players: gamePlayers,
          deck: await shuffleDeck(generateDeck()),
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
        gameState = await dealCard(gameState);
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
    //playing cards
    socket.on("PlayCards", async (roomCode, playerId, cardId, choosenColor) => {
      try {
        const roomResult = await db.query(
          `SELECT * FROM rooms WHERE room_code= $1`,
          [roomCode],
        );
        if (roomResult.length == 0)
          return socket.emit("error", { message: err.message });
        const room = roomResult[0];
        let gameState = room.game_state;
        gameState = playCard(gameState, playerId, cardId, chosenColor || null);
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
            winnerName: gameState.players.find((p) => p.id === gameState.winner)
              ?.name,
          });
          await db.query(
            `UPDATE rooms SET status = 'finished' WHERE room_id = $1`,
            [room.room_id],
          );
        }
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });
  });
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
      const deckBefore = player.hand.length;
      drawCards(gameState, player, 1);

      // the card they just drew
      const drawnCard = player.hand[player.hand.length - 1];
      const canPlay = isValidPlay(drawnCard, gameState);

      if (!canPlay) {
        // can't play it — turn passes immediately
        const playercount = gameState.players.length;
        gameState.currentPlayerIndex =
          (gameState.currentPlayerIndex + gameState.direction + playercount) %
          playercount;
      }
      //pass or play
      await saveGameState(room.room_id, gameState);

      gameState.players.forEach((p) => {
        if (p.socketId) {
          io.to(p.socketId).emit("game_update", {
            gameState: buildPublicState(gameState, p.id),
            event: "card_drawn",
            by: playerId,
            canPlay, // frontend uses this to show/hide play button
            drawnCard: p.id === playerId ? drawnCard : undefined, // only tell the drawer
          });
        }
      });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });
  socket.on("SayUno", async (roomCode, playerId) => {
    try {
      const roomResult = await db.query(
        `SELECT * FROM rooms WHERE room_code = $1`,
        [roomCode],
      );
      const room = roomResult.rows[0];
      let gameState = room.game_state;
      // Clear pendingUno
      if (gameState.pendingUno?.playerId === playerId) {
        gameState.pendingUno = null;
        await saveGameState(room.room_id, gameState);
      }
      io.to(roomCode).emit("uno_called", { playerId });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

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

  socket.on("play_again", async ({ roomCode, hostId }) => {
    try {
      const state = await roomManager.playAgain(roomCode, hostId);
      io.to(roomCode).emit("room_update", state);
      io.to(roomCode).emit("back_to_lobby");
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

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

  socket.on("disconnecting", async () => {
    const rooms = [...socket.rooms].filter((r) => r !== socket.id);

    for (const roomCode of rooms) {
      try {
        const updated = await roomManager.disconnectPlayer(roomCode, socket.id);
        if (updated) {
          io.to(roomCode).emit("player_disconnected", { socketId: socket.id });
        }
      } catch (_) {

      }
    }
  });
}

module.exports = { registerGameEvents };
