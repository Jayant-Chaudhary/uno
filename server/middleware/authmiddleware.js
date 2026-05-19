require("dotenv").config();

const jwt = require("jsonwebtoken");

const db = require("../db");

module.exports = async function (req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const session = await db.query(
      `
          SELECT *
          FROM sessions
          WHERE token = $1
          AND expires_at > now()
        `,
      [token],
    );

    if (session.rows.length === 0) {
      return res.status(401).json({
        error: "Session expired",
      });
    }
    const user = await db.query(
      `
          SELECT
            user_id,
            username,
            email,
            avatar_index,
            created_at
          FROM users
          WHERE user_id = $1
        `,
      [decoded.user_id],
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        error: "User not found",
      });
    }
    req.user = user.rows[0];
    req.token = token;

    next();
  } catch (err) {
    console.error(err);

    return res.status(401).json({
      error: "Invalid token",
    });
  }
};
