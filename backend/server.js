const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const staffRoutes = require('./routes/staff');
const appointmentsRoutes = require('./routes/appointments');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
app.use(express.json());

// Main API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Salon Backend is running smoothly.' });
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // Initialize Database on startup
  try {
    await initDb();
  } catch (err) {
    console.error("Failed to initialize database", err);
  }
});
