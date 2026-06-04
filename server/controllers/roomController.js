const db = require("../db");
const roomManager = require("../roomManger");
const buildPublicState = require("../utils/buildPublicState");
exports.createRoom = async (req, res) => {
  try {
    const { maxPlayers, displayName, avatarEmoji } = req.body;
    const room = await roomManager.createRoom(req.user.user_id, {
      maxPlayers,
      displayName,
      avatarEmoji,
    });
    res.json({ room });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { roomCode, guestName } = req.body;
    const userId = req.user?.userId || null;

    if (guestName !== undefined) {
      if (typeof guestName !== "string" || guestName.trim().length < 2) {
        return res
          .status(400)
          .json({ error: "Name must be at least 2 characters." });
      }
      if (guestName.trim().length > 32) {
        return res
          .status(400)
          .json({ error: "Name must be 32 characters or less." });
      }
    }
    if (userId && guestName) {
      return res.status(400).json({
        error: "Authenticated users cannot provide a guest name.",
      });
    }

    const result = await roomManager.joinRoom(
      roomCode,
      userId,
      guestName ? guestName.trim() : null,
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getRoomCode = async (req, res) => {
  try {
    const state = await roomManager.getRoomState(req.params.roomCode);
    res.json(state);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.getGameState = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const userId = req.user?.user_id || req.user?.userId || null;
    const reconnectToken = req.reconnectToken || null;

    if (!userId && !reconnectToken) {
      return res.status(400).json({ error: "No identity provided" });
    }

    const result = await db.query(
      `SELECT r.game_state, r.status, rp.user_id, rp.reconnect_token
       FROM rooms r
       JOIN room_players rp ON rp.room_id = r.room_id
       WHERE r.room_code = $1
         AND (
           ($2::uuid IS NOT NULL AND rp.user_id = $2::uuid)
           OR
           ($3::text IS NOT NULL AND rp.reconnect_token = $3::text)
         )
       LIMIT 1`,
      [roomCode, userId, reconnectToken],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Room not found or you are not in this room" });
    }

    const row = result.rows[0];
    const gameState = row.game_state;

    if (!gameState || row.status !== "active") {
      return res.json({ gameState: null });
    }

    const playerId = userId || reconnectToken;

    res.json({
      gameState: buildPublicState.buildPublicState(gameState, playerId),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.leavePlayer = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.user_id || null;
    const reconnectToken = req.reconnectToken || null;

    if (!userId && !reconnectToken) {
      return res.status(400).json({ error: "No identity provided" });
    }

    const state = await roomManager.leaveRoom(
      req.params.roomCode,
      userId,
      reconnectToken,
    );

    const io = req.app.get("io");

    if (state === null) {
      io.to(req.params.roomCode).emit("room_deleted");
      return res.json({ roomDeleted: true });
    }

    io.to(req.params.roomCode).emit("room_update", state);
    res.json(state);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateRoomPlayerProfile = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { displayName, avatarEmoji } = req.body;
    const userId = req.user?.userId || req.user?.user_id || null;
    const reconnectToken = req.reconnectToken || null;

    if (!userId && !reconnectToken) {
      return res.status(400).json({ error: "No identity provided" });
    }

    let updatedName = displayName ? displayName.trim() : null;

    if (userId) {
      if (updatedName) {
        await db.query(`UPDATE users SET username = $1 WHERE user_id = $2`, [updatedName, userId]);
      }
      if (avatarEmoji) {
        await db.query(`UPDATE users SET avatar_emoji = $1 WHERE user_id = $2`, [avatarEmoji, userId]);
      }
    }

    if (userId) {
      await db.query(
        `UPDATE room_players SET avatar_emoji = $1 WHERE room_id = (SELECT room_id FROM rooms WHERE room_code = $2) AND user_id = $3`,
        [avatarEmoji || null, roomCode, userId]
      );
    } else {
      await db.query(
        `UPDATE room_players SET guest_name = $1, avatar_emoji = $2 WHERE room_id = (SELECT room_id FROM rooms WHERE room_code = $3) AND reconnect_token = $4`,
        [updatedName, avatarEmoji || null, roomCode, reconnectToken]
      );
    }

    const state = await roomManager.getRoomState(roomCode);
    const io = req.app.get("io");
    io.to(roomCode).emit("room_update", state);

    res.json({ success: true, ...state });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
