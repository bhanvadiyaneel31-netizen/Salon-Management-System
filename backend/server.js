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

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'] }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Main API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users', usersRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Salon Backend is running smoothly.' });
});

// Auto-clear any ghost process holding our port before starting
const { execSync } = require('child_process');
function clearPort(port) {
  try {
    const pid = execSync(`lsof -t -i:${port} 2>/dev/null`, { encoding: 'utf8' }).trim();
    if (pid) {
      execSync(`kill -9 ${pid} 2>/dev/null`);
      console.log(`🔧 Cleared ghost process (PID ${pid}) from port ${port}`);
      // Small wait for OS to release the port
      execSync('sleep 0.5');
    }
  } catch (_) { /* port was free, nothing to do */ }
}

clearPort(PORT);

// Initialize DB first, then start listening
initDb()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} still in use. Please close other apps and retry.\n`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});