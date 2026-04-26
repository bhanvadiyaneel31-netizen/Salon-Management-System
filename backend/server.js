require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const staffRoutes = require('./routes/staff');
const appointmentsRoutes = require('./routes/appointments');
const analyticsRoutes = require('./routes/analytics');
const notificationsRoutes = require('./routes/notifications');
const usersRoutes = require('./routes/users');
const reportsRoutes = require('./routes/reports');
const reviewsRoutes = require('./routes/reviews');
const googleAuthRoutes = require('./routes/googleAuth');
const loyaltyRoutes = require('./routes/loyalty');   // ← moved to top with other requires
const passport = require('./config/passportConfig');

const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ FIX 1 — Startup guard: crash immediately if critical env vars are missing
// (prevents silent fallback to weak defaults)
if (!process.env.JWT_SECRET_KEY) throw new Error('FATAL: JWT_SECRET_KEY is not set');
if (!process.env.MONGODB_URI) throw new Error('FATAL: MONGODB_URI is not set');
if (!process.env.FRONTEND_URL) throw new Error('FATAL: FRONTEND_URL is not set');

// Trust proxy (needed for rate limiter behind Render/Railway)
app.set('trust proxy', 1);

// ✅ FIX 2 — Define rate limiters BEFORE using them
// General limiter for all API routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,                   // 200 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Strict limiter for auth endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // only 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' }
});

// ✅ FIX 3 — Restrict CORS to your actual frontend URL only
const allowedOrigins = [
  process.env.FRONTEND_URL,           // e.g. https://your-app.vercel.app
  'http://localhost:5173',            // Vite dev
  'http://localhost:3000',            // CRA dev
].filter(Boolean);                    // removes undefined if FRONTEND_URL not set

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security & performance middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(compression());
app.use(morgan('short'));   // ✅ FIX 4 — 'short' instead of 'combined' (avoids logging sensitive query params)

// ✅ FIX 5 — Apply rate limiters correctly
app.use('/api/auth/login', authLimiter);   // strict on login
app.use('/api/auth/forgot-password', authLimiter);   // strict on password reset
app.use('/api/', generalLimiter); // general on everything else

app.use(express.json({ limit: '10mb' }));
app.use(passport.initialize());
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/auth', googleAuthRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Salon Backend is running smoothly.' });
});

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);

  // ✅ FIX 6 — Don't leak CORS errors as 500 (confuses debugging)
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Initialize DB then start server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });