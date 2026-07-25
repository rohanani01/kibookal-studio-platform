/* Express middleware — logs every request, captures errors thrown in routes,
   and adds a `req.logError` helper. Registers process-level handlers for
   uncaught exceptions and unhandled rejections. */

const errorLogger = require('./errorLogger');

function debugMiddleware(req, res, next) {
  req.logError = (err, meta = {}) => errorLogger.logError({
    source: 'backend',
    severity: 'error',
    error_type: err.name || 'Error',
    message: err.message || String(err),
    stack_trace: err.stack || null,
    route: req.path,
    metadata: { method: req.method, ...meta }
  });
  next();
}

function registerGlobalErrorHandler() {
  process.on('uncaughtException', (err) => {
    errorLogger.logError({
      source: 'backend',
      severity: 'critical',
      error_type: 'UncaughtException',
      message: err.message,
      stack_trace: err.stack
    });
    console.error('[uncaughtException]', err);
  });
  process.on('unhandledRejection', (reason) => {
    errorLogger.logError({
      source: 'backend',
      severity: 'critical',
      error_type: 'UnhandledRejection',
      message: reason?.message || String(reason),
      stack_trace: reason?.stack
    });
    console.error('[unhandledRejection]', reason);
  });
}

module.exports = { debugMiddleware, registerGlobalErrorHandler };
