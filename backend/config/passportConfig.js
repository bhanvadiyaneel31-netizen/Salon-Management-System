const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../db');
const crypto = require('crypto');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    scope:        ['profile', 'email'],
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || profile._json?.email || null;
      if (!email) return done(new Error('No email found in Google profile'), null);

      const emailVerified = profile._json?.email_verified ?? false;
      const mode = req.query.state; // 'login' or 'signup'

      if (!emailVerified)
        return done(null, false, { message: 'Google account email is not verified' });

      // Check if user exists
      let user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        // Update googleId if not already set
        if (!user.googleId) {
          user.googleId     = profile.id;
          user.authProvider = 'google';
          await user.save();
        }
        return done(null, user);
      }

      // New user — only create on signup mode
      if (mode === 'signup') {
        const randomPassword = crypto.randomUUID();
        user = await User.create({
          name:         profile.displayName,
          email:        email.toLowerCase(),
          googleId:     profile.id,
          authProvider: 'google',
          role:         'customer',
          passwordHash: randomPassword,
        });
        return done(null, user);
      }

      return done(null, false, { message: 'No account found with this Google email. Please register first.' });
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.warn('⚠️  Google OAuth credentials missing. Google login will be disabled.');
}

passport.serializeUser((user, done) => done(null, user._id.toString()));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
