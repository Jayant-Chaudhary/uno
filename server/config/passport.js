const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const db = require("../db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      proxy: true,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if we already have this user registered via google oauth
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

        // 2. Check if a user with the same email already exists (e.g. signed up via password)
        const emailVal = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (emailVal) {
          const emailExisting = await db.query(
            `SELECT * FROM users WHERE email = $1`,
            [emailVal]
          );

          if (emailExisting.rows.length > 0) {
            // Link Google OAuth to this existing account
            const linkedUser = await db.query(
              `
                UPDATE users
                SET oauth_provider = $1, oauth_id = $2
                WHERE user_id = $3
                RETURNING *
              `,
              ["google", profile.id, emailExisting.rows[0].user_id]
            );
            return done(null, linkedUser.rows[0]);
          }
        }

        // 3. Generate a unique username if username is taken
        let baseUsername = (profile.displayName || "user").replace(/\s+/g, "_");
        let uniqueUsername = baseUsername;
        let isTaken = true;
        let tries = 0;
        
        while (isTaken && tries < 10) {
          const usernameCheck = await db.query(
            `SELECT user_id FROM users WHERE username = $1`,
            [uniqueUsername]
          );
          if (usernameCheck.rows.length === 0) {
            isTaken = false;
          } else {
            uniqueUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
            tries++;
          }
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
            uniqueUsername,
            emailVal || `google_${profile.id}@uno.game`,
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
