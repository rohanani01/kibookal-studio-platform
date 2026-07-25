/* Capture frontend errors → POST to /api/debug/errors. Loaded as a regular
   <script> so the existing studio JS doesn't need any changes.
   Auto-detects backend URL the same way apiClient does. */
(function () {
  function backendBase() {
    if (typeof window !== 'undefined' && window.KIBOOKAL_API_BASE) return window.KIBOOKAL_API_BASE;
    if (location.protocol === 'file:' || location.port === '8770') return 'http://localhost:3001/api';
    return `${location.origin}/api`;
  }
  const BASE = backendBase();
  function post(payload) {
    try {
      fetch(BASE + '/debug/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {}); // silent — never throw, never block UI
    } catch {}
  }
  window.addEventListener('error', (e) => {
    post({
      source: 'frontend', severity: 'error', error_type: 'JSError',
      message: e.message, stack_trace: e.error?.stack || null,
      route: location.pathname,
      metadata: { file: e.filename, line: e.lineno, col: e.colno, userAgent: navigator.userAgent }
    });
  });
  window.addEventListener('unhandledrejection', (e) => {
    post({
      source: 'frontend', severity: 'error', error_type: 'UnhandledRejection',
      message: e.reason?.message || String(e.reason || 'rejection'),
      stack_trace: e.reason?.stack || null,
      route: location.pathname
    });
  });
  console.log('[debug] frontend error capture armed');
})();
