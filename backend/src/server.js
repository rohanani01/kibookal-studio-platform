/* Kibookal Studio — Backend entry point.
   Express server + route mounting + global error handler + debug middleware.
   Safe-by-default — does not modify any frontend or storage files unless an
   explicit API call requests it. */

const path = require('path');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const PORT = process.env.PORT || 3001;
const ROOT = path.resolve(__dirname, '../..');
const FRONTEND_PATH = path.resolve(ROOT, process.env.FRONTEND_PATH || 'frontend');

const { debugMiddleware, registerGlobalErrorHandler } = require('./debug/debugMiddleware');
const errorLogger = require('./debug/errorLogger');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(debugMiddleware);

// Static frontend
app.use(express.static(FRONTEND_PATH));

// Serve user outputs (read-only) and storage (read-only)
app.use('/outputs', express.static(path.join(ROOT, 'outputs')));
app.use('/storage', express.static(path.join(ROOT, 'storage')));

// Mount API routes
app.use('/api/health',      require('./routes/healthRoutes'));
app.use('/api/projects',    require('./routes/projectRoutes'));
app.use('/api/characters',  require('./routes/characterRoutes'));
app.use('/api/prompts',     require('./routes/promptRoutes'));
app.use('/api/generations', require('./routes/generationRoutes'));
app.use('/api/renders',     require('./routes/renderRoutes'));
app.use('/api/exports',     require('./routes/exportRoutes'));
app.use('/api/vault',       require('./routes/vaultRoutes'));
app.use('/api/debug',       require('./routes/debugRoutes'));
app.use('/api/settings',    require('./routes/settingsRoutes'));

// 404 for unknown API routes (frontend SPA fallback handled below)
app.use('/api/*', (req, res) => {
  res.status(404).json({ ok: false, error: `Unknown API route: ${req.path}` });
});

// SPA fallback for /pages/* (so future SPA routes don't 404)
app.get('/pages/*', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

// Global error handler — never silently fail
app.use((err, req, res, next) => {
  let body_size = 0;
  try { body_size = JSON.stringify(req.body || {}).length; } catch {}  // circular-ref safe
  const errId = errorLogger.logError({
    source: 'backend',
    severity: 'error',
    error_type: err.name || 'UnknownError',
    message: err.message || String(err),
    stack_trace: err.stack || null,
    route: req.path,
    metadata: { method: req.method, body_size }
  });
  res.status(err.statusCode || 500).json({
    ok: false,
    error: err.message || 'Internal server error',
    error_id: errId
  });
});

registerGlobalErrorHandler();

// Start server — if PORT is busy, auto-try the next 5 ports before giving up.
function startServer(port, attempt = 0) {
  const server = app.listen(port);
  server.on('listening', () => {
    console.log(`\n🎬 Kibookal Studio backend listening at http://localhost:${port}`);
    console.log(`   • Frontend served from: ${FRONTEND_PATH}`);
    console.log(`   • API root: http://localhost:${port}/api`);
    console.log(`   • Health:   http://localhost:${port}/api/health`);
    if (attempt > 0) {
      console.log(`   ⚠ Original port ${PORT} was busy — using ${port} instead.`);
      console.log(`   ⚠ Update your frontend's KIBOOKAL_API_BASE or close the other instance.`);
    }
    console.log('');
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (attempt < 5) {
        console.warn(`[server] port ${port} is in use, trying ${port + 1}…`);
        startServer(port + 1, attempt + 1);
      } else {
        console.error(`\n✗ Could not bind any port between ${PORT} and ${PORT + 5}.`);
        console.error(`  Another process is using all of them. To find and kill it:\n`);
        console.error(`    Windows: for /f "tokens=5" %i in ('netstat -ano ^| findstr :${PORT}') do taskkill /pid %i /f`);
        console.error(`    Mac/Linux: lsof -ti:${PORT} | xargs kill -9\n`);
        process.exit(1);
      }
    } else {
      console.error('[server] listen error:', err.message);
      process.exit(1);
    }
  });
}

startServer(parseInt(PORT));
