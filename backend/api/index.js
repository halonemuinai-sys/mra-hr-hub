const app = require('./app');

const PORT = process.env.PORT || 5006;

// On Vercel the exported app is the serverless handler (vercel.json routes every path here)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 HR HUB Backend API running at http://localhost:${PORT}`);
    console.log(`📑 Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
