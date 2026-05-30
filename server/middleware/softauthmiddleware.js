const jwt = require("jsonwebtoken");
const db = require("../db");

async function softAuth(req, res, next) {
  const token = req.cookies?.access_token;

  if (token) {
    //logged-in user
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const session = await db.query(
        `SELECT user_id, username, email, avatar_emoji, created_at
         FROM users WHERE user_id = $1`,
        [decoded.user_id],
      );
      if (session.rows.length > 0) {
        req.user = { userId: decoded.user_id };
        req.reconnectToken = null;
        return next();
      }
    } catch (_) {}
  }

  // guest
  const reconnectToken =
    req.query.reconnectToken || req.cookies?.reconnectToken || null;

  if (reconnectToken) {
    req.user = null;
    req.reconnectToken = reconnectToken;
    return next();
  }

  req.user = null;
  req.reconnectToken = null;
  next();
}

module.exports = softAuth;
