const db = require("../db");
module.exports = async function createSession(user_id, token, req) {
  await db.query(
    `
      INSERT INTO sessions (
        user_id,
        token,
        ip_address,
        user_agent
      )
      VALUES ($1,$2,$3,$4)
    `,
    [user_id, token, req.ip, req.headers["user-agent"]],
  );
};
