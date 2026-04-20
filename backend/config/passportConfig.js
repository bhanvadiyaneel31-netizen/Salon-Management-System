const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { db } = require('../db');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const emailVerified = profile._json.email_verified;
        const mode = req.query.state; // 'login' or 'signup'

        // 1. Critical Rule: Only allow verified Google emails
        if (!emailVerified) {
          return done(null, false, { message: 'Google account email is not verified' });
        }

        // 2. Check if user exists (email match)
        let user = await db.getAsync("SELECT * FROM users WHERE email = ?", [email]);

        if (user) {
          // If user exists, update googleId and authProvider if not already set
          if (!user.googleId) {
            await db.runAsync(
              "UPDATE users SET googleId = ?, authProvider = 'google' WHERE id = ?",
              [profile.id, user.id]
            );
            user.googleId = profile.id;
            user.authProvider = 'google';
          }
          return done(null, user);
        } else {
          // 3. New User Handling: Only create if mode is 'signup'
          if (mode === 'signup') {
            await db.runAsync(
              "INSERT INTO users (name, email, googleId, authProvider, role, password_hash) VALUES (?, ?, ?, 'google', 'customer', 'GOOGLE_OAUTH_USER')",
              [profile.displayName, email, profile.id]
            );
            
            user = await db.getAsync("SELECT * FROM users WHERE email = ?", [email]);
            return done(null, user);
          } else {
            // Mode is 'login' but user doesn't exist
            return done(null, false, { message: 'No account found with this Google email. Please register first.' });
          }
        }
      } catch (err) {
        return done(err, null);
      }
    }
  ));

} else {
  console.warn('⚠️ Google OAuth credentials missing. Google login will be disabled.');
}


// We don't necessarily need session-based serialization if we're using JWT,
// but passport requires these if we use passport.session()
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.getAsync("SELECT * FROM users WHERE id = ?", [id]);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
