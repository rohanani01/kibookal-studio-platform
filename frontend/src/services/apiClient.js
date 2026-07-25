/* Thin wrapper around fetch — always returns { ok, data, error }.
   Auto-detects backend URL:
     - If accessed via :3001 → use same-origin /api
     - If accessed via :8770 (http-server) or file:// → point at :3001 explicitly
     - Override via window.KIBOOKAL_API_BASE before this script loads */
function detectApiBase() {
  if (typeof window !== 'undefined' && window.KIBOOKAL_API_BASE) return window.KIBOOKAL_API_BASE;
  if (typeof location === 'undefined') return 'http://localhost:3001/api';
  // file:// origin or different port → use explicit backend
  if (location.protocol === 'file:' || location.port === '8770') {
    return 'http://localhost:3001/api';
  }
  // Same-origin (likely :3001 already)
  return `${location.origin}/api`;
}

const BASE = detectApiBase();

async function request(method, path, body) {
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}`, status: res.status };
    return { ok: true, ...json };
  } catch (e) {
    return { ok: false, error: e.message || String(e), offline: true };
  }
}

const apiClient = {
  base:   BASE,
  get:    (p)    => request('GET',    p),
  post:   (p, b) => request('POST',   p, b),
  patch:  (p, b) => request('PATCH',  p, b),
  del:    (p)    => request('DELETE', p),
  health: ()     => request('GET', '/health'),
  // Returns true if backend is reachable
  async ping() {
    const r = await this.health();
    return r.ok && r.backend !== 'down';
  }
};

if (typeof window !== 'undefined') window.KIBOOKAL_API = apiClient;
if (typeof module !== 'undefined') module.exports = apiClient;
