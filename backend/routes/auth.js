const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { verifyToken, SECRET_KEY } = require('../middleware/authMiddleware');

const formatUserResponse = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    address: user.address || '',
    profile_image: user.profile_image || '',
    loyalty_points: user.loyalty_points || 0,
    rating: user.rating || 0,
    review_count: user.review_count || 0,
    reminders: {
      email: Boolean(user.reminder_email),
      sms: Boolean(user.reminder_sms),
      timing: user.reminder_timing || '24h'
    },
    created_at: user.created_at
  };
};

const generateToken = (user) => {
  return jwt.sign(
    { user_id: user.id, role: user.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const existing = await db.getAsync("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Force role to customer
    await db.runAsync(
      "INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, 'customer')",
      [name, email, passwordHash, phone || null]
    );

    const newUser = await db.getAsync(`
      SELECT u.*, sp.rating, 
             (SELECT COUNT(*) FROM appointments a WHERE a.staff_id = u.id AND a.status = 'completed') as review_count
      FROM users u 
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id 
      WHERE u.email = ?
    `, [email]);
    const token = generateToken(newUser);

    res.status(201).json({
      user: formatUserResponse(newUser),
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await db.getAsync(`
      SELECT u.*, sp.rating, 
             (SELECT COUNT(*) FROM appointments a WHERE a.staff_id = u.id AND a.status = 'completed') as review_count
      FROM users u 
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id 
      WHERE u.email = ?
    `, [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.status(200).json({
      user: formatUserResponse(user),
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.getAsync(`
      SELECT u.*, sp.rating, 
             (SELECT COUNT(*) FROM appointments a WHERE a.staff_id = u.id AND a.status = 'completed') as review_count
      FROM users u 
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id 
      WHERE u.id = ?
    `, [req.user.user_id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', verifyToken, (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
