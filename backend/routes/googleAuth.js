const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// ✅ removed SECRET_KEY import and debug console.log

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ✅ FIX SEV-005: one-time code store — JWT never goes in the URL
const oauthCodes = new Map();

// Purge expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of oauthCodes.entries()) {
    if (data.expiresAt < now) oauthCodes.delete(code);
  }
}, 5 * 60 * 1000);

const generateToken = (user) =>
  jwt.sign(
    { user_id: user.id, role: user.role },
    process.env.JWT_SECRET_KEY,  // ✅ direct env access, no import
    { expiresIn: '24h' }
  );

// GET /api/auth/google
router.get('/google', (req, res, next) => {
  const mode = req.query.mode || 'login';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: mode
  })(req, res, next);
});

// GET /api/auth/google/callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Google Auth Error:', err);
      return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
    }

    if (!user) {
      const message = info ? info.message : 'Authentication failed';
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
    }

    const token = generateToken(user);

    // ✅ FIX SEV-005: put a short-lived code in URL, not the JWT
    const code = crypto.randomBytes(32).toString('hex');
    oauthCodes.set(code, { token, expiresAt: Date.now() + 60_000 }); // 60 seconds

    res.redirect(`${FRONTEND_URL}/auth-success?code=${code}`);
  })(req, res, next);
});

// POST /api/auth/google/exchange
// Frontend exchanges the one-time code for the real JWT
router.post('/google/exchange', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const entry = oauthCodes.get(code);
  oauthCodes.delete(code); // ✅ delete on first use — one-time only

  if (!entry) return res.status(400).json({ error: 'Invalid or already used code' });
  if (entry.expiresAt < Date.now()) return res.status(400).json({ error: 'Code expired. Please log in again.' });

  res.json({ token: entry.token });
});

module.exports = router;