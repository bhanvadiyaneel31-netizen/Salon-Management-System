const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User, StaffProfile, Appointment } = require('../db');
const { verifyToken, SECRET_KEY } = require('../middleware/authMiddleware');
const { sendPasswordResetEmail } = require('../services/emailService');

// ---------- Helpers ----------

const getUserDetails = async (userId) => {
  const user = await User.findById(userId);
  const profile = await StaffProfile.findOne({ userId });
  const reviewCount = await Appointment.countDocuments({ staffId: userId, status: 'completed' });
  return { user, profile, reviewCount };
};

const formatUserResponse = (user, profile = null, reviewCount = 0) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  address: user.address || '',
  profile_image: user.profileImage || '',
  loyalty_points: user.loyaltyPoints || 0,
  rating: profile?.rating || 0,
  review_count: reviewCount,
  reminders: {
    email: user.reminderEmail !== false,
    sms: user.reminderSms !== false,
    timing: user.reminderTiming || '24h',
  },
  created_at: user.createdAt,
});

const generateToken = (user) =>
  jwt.sign({ user_id: user._id.toString(), role: user.role }, SECRET_KEY, { expiresIn: '24h' });

// ---------- Routes ----------

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required' });

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({ name, email, passwordHash, phone: phone || null, role: 'customer' });
    const token = generateToken(newUser);

    res.status(201).json({ user: formatUserResponse(newUser), token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.authProvider === 'google')
      return res.status(401).json({ error: 'This account uses Google Login. Please use the "Continue with Google" button.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const profile = await StaffProfile.findOne({ userId: user._id });
    const reviewCount = await Appointment.countDocuments({ staffId: user._id, status: 'completed' });
    const token = generateToken(user);

    res.status(200).json({ user: formatUserResponse(user, profile, reviewCount), token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { user, profile, reviewCount } = await getUserDetails(req.user.user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(formatUserResponse(user, profile, reviewCount));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', verifyToken, (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const GENERIC_RESPONSE = { message: 'If that email is registered, a reset link has been sent.' };

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() }, 'name email authProvider');
    if (!user || user.authProvider === 'google') return res.status(200).json(GENERIC_RESPONSE);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expireTimestamp = Date.now() + 15 * 60 * 1000;

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: expireTimestamp,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl, user.name);
    } catch (emailError) {
      console.error('[FORGOT PASSWORD] Email send failed:', emailError);
    }

    return res.status(200).json(GENERIC_RESPONSE);
  } catch (error) {
    console.error('[FORGOT PASSWORD] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password)
    return res.status(400).json({ error: 'Token and new password are required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  if (!/\d/.test(password))
    return res.status(400).json({ error: 'Password must contain at least one number' });

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ error: 'Invalid or expired password reset link. Please request a new one.' });

    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(password, salt);

    await User.findByIdAndUpdate(user._id, {
      passwordHash: newPasswordHash,
      resetPasswordToken: null,
      resetPasswordExpire: null,
    });

    return res.status(200).json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('[RESET PASSWORD] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { user, profile, reviewCount } = await getUserDetails(req.user.user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(formatUserResponse(user, profile, reviewCount));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;