require('dotenv').config();
const express = require('express');
const cors = require('cors');

const atsRoutes = require('../routes/atsRoutes');
const templateRoutes = require('../routes/templateRoutes');
const candidateRoutes = require('../routes/candidateRoutes');
const jobRoutes = require('../routes/jobRoutes');
const statsRoutes = require('../routes/statsRoutes');
const authRoutes = require('../routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5006;

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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 HR HUB Backend API running at http://localhost:${PORT}`);
  console.log(`📑 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
