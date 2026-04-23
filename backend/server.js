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
const passport = require('./config/passportConfig');




const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy
app.set('trust proxy', 1);

// ✅ 1. CORS MUST BE FIRST
// ✅ CORS FIRST
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ FIXED preflight handler
app.options('/*', cors());

// ✅ 3. Then security & performance
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(compression());
app.use(morgan('combined'));

// ❌ TEMPORARILY DISABLE RATE LIMIT
// app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(passport.initialize());
app.use('/uploads', express.static('uploads'));


// Main API Routes
const loyaltyRoutes = require('./routes/loyalty');

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
app.use('/api/auth', googleAuthRoutes); // Google Auth routes




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
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Initialize DB first, then start listening
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