const jwt = require("jsonwebtoken");

module.exports = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );
};
