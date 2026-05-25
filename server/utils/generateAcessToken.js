const jwt = require("jsonwebtoken");
module.exports = function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15min",
    }
  );
};