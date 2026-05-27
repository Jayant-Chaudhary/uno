require("dotenv").config();

const jwt = require("jsonwebtoken");

const db = require("../db");
module.exports = async function (req, res, next) {
  try {
    console.log(req.cookies);
    console.log(req.cookies.token);
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.query(
      `
          SELECT
            user_id,
            username,
            email,
            avatar_emoji,
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
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
      });
    }

    return res.status(401).json({
      error: "Invalid token",
    });
  }
};
