const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/authMiddleware');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const generateToken = (user) => {
  return jwt.sign(
    { user_id: user.id, role: user.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
};

// GET /api/auth/google?mode=login|signup
// Redirects to Google login
router.get('/google', (req, res, next) => {
  const mode = req.query.mode || 'login';
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: mode 
  })(req, res, next);
});


// GET /api/auth/google/callback
// Handles Google response
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

    // Successful authentication
    const token = generateToken(user);
    
    // Redirect to frontend with token
    // The frontend will handle this in App.tsx
    res.redirect(`${FRONTEND_URL}/auth-success?token=${token}`);
  })(req, res, next);
});

module.exports = router;
