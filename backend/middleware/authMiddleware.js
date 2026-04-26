const jwt = require('jsonwebtoken');

// ✅ FIX 1 — Crash on startup if secret is missing, no silent fallback
if (!process.env.JWT_SECRET_KEY) {
  throw new Error('FATAL: JWT_SECRET_KEY environment variable is not set');
}

const SECRET_KEY = process.env.JWT_SECRET_KEY;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // { user_id, role }
    next();
  } catch (error) {
    // ✅ FIX 2 — Distinguish expired vs invalid for better client handling
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please log in again' });
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

const requireAdminOrStaff = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Admin or Staff access required' });
    }
    next();
  });
};

// ✅ FIX 3 — SECRET_KEY removed from exports (no route file should ever sign tokens directly)
module.exports = { verifyToken, requireAdmin, requireAdminOrStaff };