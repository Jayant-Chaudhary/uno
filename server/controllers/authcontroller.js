require("dotenv").config();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../db");
const generateAccessToken = require("../utils/generateAcessToken");
const generateRefreshToken = require("../utils/generateRefreshToken");
const createSession = require("../utils/createSession");

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    const existingUser = await db.query(
      `
        SELECT user_id
        FROM users
        WHERE email = $1
           OR username = $2
      `,
      [email, username],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.query(
      `
        INSERT INTO users (
          username,
          email,
          pass
        )
        VALUES ($1, $2, $3)
        RETURNING
          user_id,
          username,
          email,
          avatar_emoji
          created_at
      `,
      [username, email, hashedPassword],
    );

    const user = result.rows[0];

    const accessToken = generateAccessToken(user);

    const refreshToken = generateRefreshToken(user);

    await createSession(user.user_id, refreshToken, req);

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Signup successful",
      user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    const result = await db.query(
      `
        SELECT *
        FROM users
        WHERE email = $1
      `,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "username not found",
      });
    }

    const user = result.rows[0];

    // OAuth users cannot login with password
    if (!user.pass && user.oauth_provider == "google") {
      return res.status(400).json({
        error: "Use Google login",
      });
    }
    const validPassword = await bcrypt.compare(password, user.pass);
    if (!validPassword) {
      return res.status(401).json({
        error: "Incorrect password",
      });
    }

    await db.query(
      `
        UPDATE users
        SET last_login = now()
        WHERE user_id = $1
      `,
      [user.user_id],
    );

    const accessToken = generateAccessToken(user);

    const refreshToken = generateRefreshToken(user);

    await createSession(user.user_id, refreshToken, req);

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",

      user: {
        user_id: user.user_id,

        username: user.username,

        email: user.email,

        avatar_emoji: user.avatar_emoji,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Internal server error",
    });
  }
};
//google
exports.googleSuccess = async (req, res) => {
  try {
    const user = req.user;

    const token = generateJwt(user);

    await createSession(user.user_id, token, req);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect("http://localhost:5000"); //frontend url
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "OAuth failed",
    });
  }
};
//logout

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (token) {
      await db.query(
        `
          DELETE FROM sessions
          WHERE token = $1
        `,
        [token],
      );
    }

    res.clearCookie("token");

    res.json({
      message: "Logout successful",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Internal server error",
    });
  }
};

//current veiwer
exports.me = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        user_id,
        username,
        email,
        created_at,
        last_login,
        avatar_emoji
      FROM users
      WHERE user_id = $1
      `,
      [req.user.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Internal server error",
    });
  }
};

//forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await db.query(
      `
            SELECT *
            FROM users
            WHERE email = $1
          `,
      [email],
    );

    // Prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({
        message: "If account exists, reset link sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await db.query(
      `
          UPDATE users
          SET
            reset_token = $1,
            reset_token_expiry = $2
          WHERE email = $3
        `,
      [resetToken, expiry, email],
    );

    // TODO:
    // send reset email here

    console.log(
      `Reset Link:
http://localhost:3000/reset-password/${resetToken}`,
    );

    res.json({
      message: "Reset link sent",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Internal server error",
    });
  }
};
//reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: "Password required",
      });
    }

    const result = await db.query(
      `
            SELECT *
            FROM users
            WHERE
              reset_token = $1
              AND reset_token_expiry > now()
          `,
      [token],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "Invalid or expired token",
      });
    }

    const user = result.rows[0];

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.query(
      `
          UPDATE users
          SET
            pass = $1,
            reset_token = NULL,
            reset_token_expiry = NULL
          WHERE user_id = $2
        `,
      [hashedPassword, user.user_id],
    );

    res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Internal server error",
    });
  }
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        error: "No refresh token",
      });
    }

    // verify token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // check DB session
    const session = await db.query(
      `
      SELECT *
      FROM sessions
      WHERE refresh_token = $1
      AND expires_at > now()
      `,
      [refreshToken],
    );

    if (session.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid session",
      });
    }

    // get user
    const userResult = await db.query(
      `
      SELECT *
      FROM users
      WHERE user_id = $1
      `,
      [decoded.user_id],
    );

    const user = userResult.rows[0];

    // new access token
    const newAccessToken = generateAccessToken(user);

    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      message: "Token refreshed",
    });
  } catch (err) {
    console.error(err);

    res.status(401).json({
      error: "Invalid refresh token",
    });
  }
};

exports.updateAvatar = async (req, res) => {
  const { avatarEmoji } = req.body;

  if (!avatarEmoji || typeof avatarEmoji !== "string") {
    return res.status(400).json({ error: "Invalid emoji" });
  }
  // strip anything longer than 10 chars (malicious input)
  const clean = avatarEmoji.trim().slice(0, 10);

  await db.query(`UPDATE users SET avatar_emoji = $1 WHERE user_id = $2`, [
    clean,
    req.user.user_id,
  ]);
  res.json({ success: true, avatarEmoji: clean });
};
