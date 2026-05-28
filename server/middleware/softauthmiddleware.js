const jwt = require("jsonwebtoken");
const db = require("../db");

async function softAuth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const session = await db.query(
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
    console.log(decoded);
    console.log(session);

    if (session.rows.length > 0) {
      req.user = { userId: decoded.user_id }; // attach if valid
    }
  } catch (_) {}
  next();
}

module.exports = softAuth;
