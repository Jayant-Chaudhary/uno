const roomManager = require("../roomManger");

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

    let userId = null;
    const token = req.cookies?.token;
    if (token) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const db = require("../db");
        const session = await db.query(
          `SELECT * FROM sessions WHERE user_id=$1 AND token=$2 AND expires_at > now()`,
          [decoded.userId, token],
        );
        if (session.rows.length > 0) userId = decoded.userId;
      } catch (_) {}
    }

    const result = await roomManager.joinRoom(
      roomCode,
      userId,
      guestName ? guestName.trim() : null, // trim whitespace too
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

exports.leavePlayer = async (req, res) => {
  try {
    const state = await roomManager.leaveRoom(
      req.params.roomCode,
      req.user.userId,
    );
    res.json(state);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
