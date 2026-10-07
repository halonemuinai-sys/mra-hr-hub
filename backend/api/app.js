/**
 * Express app (routes + middleware) without listening — imported by api/index.js and by the API tests.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const express = require('express');
const cors = require('cors');

const atsRoutes = require('../routes/atsRoutes');
const templateRoutes = require('../routes/templateRoutes');
const candidateRoutes = require('../routes/candidateRoutes');
const userRoutes = require('../routes/userRoutes');
const teamRoutes = require('../routes/teamRoutes');
const reminderRoutes = require('../routes/reminderRoutes');
const reportRoutes = require('../routes/reportRoutes');
const employeeRoutes = require('../routes/employeeRoutes');
const announcementRoutes = require('../routes/announcementRoutes');
const talentaRoutes = require('../routes/talentaRoutes');
const companyRoutes = require('../routes/companyRoutes');
const manpowerRoutes = require('../routes/manpowerRoutes');
const jobRoutes = require('../routes/jobRoutes');
const statsRoutes = require('../routes/statsRoutes');
const authRoutes = require('../routes/authRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'HR HUB — ATS Automation & Talent Profiling Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/talenta', talentaRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/manpower', manpowerRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Format data JSON tidak valid.' });
  }
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
