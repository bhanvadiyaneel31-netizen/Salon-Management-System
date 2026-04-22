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

// Trust proxy for Render/Vercel
app.set('trust proxy', 1);

// Security & Performance Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow images to be served from the same domain
}));
app.use(compression());
app.use(morgan('combined')); // Production logging

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

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