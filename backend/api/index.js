const app = require('./app');

const PORT = process.env.PORT || 5006;

app.listen(PORT, () => {
  console.log(`🚀 HR HUB Backend API running at http://localhost:${PORT}`);
  console.log(`📑 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
