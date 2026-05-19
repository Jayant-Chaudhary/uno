const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const db = require("../db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const existing = await db.query(
          `
            SELECT *
            FROM users
            WHERE oauth_provider=$1
            AND oauth_id=$2
          `,
          ["google", profile.id],
        );

        if (existing.rows.length > 0) {
          return done(null, existing.rows[0]);
        }

        const user = await db.query(
          `
            INSERT INTO users (
              username,
              email,
              oauth_provider,
              oauth_id
            )
            VALUES ($1,$2,$3,$4)
            RETURNING *
          `,
          [
            profile.displayName.replace(/\s+/g, "_"),
            profile.emails[0].value,
            "google",
            profile.id,
          ],
        );

        done(null, user.rows[0]);
      } catch (err) {
        done(err, null);
      }
    },
  ),
);
