/* Platform banner — shows a small status pill in the top-right corner indicating
   whether the backend is reachable + DB state. Auto-hides if the user clicks
   dismiss. Pure cosmetic — does not interfere with studio behavior. */
(function () {
  function el(tag, attrs = {}, html = '') {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'style') e.style.cssText = v;
      else if (k === 'onclick') e.onclick = v;
      else e.setAttribute(k, v);
    });
    if (html) e.innerHTML = html;
    return e;
  }

  function inject() {
    if (document.getElementById('kibookal-platform-banner')) return;
    const b = el('div', {
      id: 'kibookal-platform-banner',
      style: 'position:fixed;top:8px;right:12px;z-index:9998;display:flex;align-items:center;gap:6px;padding:5px 10px;background:rgba(45,30,20,.85);color:#e8d4b8;border:1px solid #5a7a44;border-radius:14px;font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.04em;box-shadow:0 4px 12px rgba(0,0,0,.3);cursor:default;'
    });
    b.innerHTML = `
      <span id="kpb-dot" style="width:7px;height:7px;border-radius:50%;background:#888;display:inline-block;"></span>
      <span id="kpb-text">platform · checking…</span>
      <span id="kpb-dismiss" style="margin-left:4px;cursor:pointer;opacity:.5;font-size:13px;" title="Hide">×</span>
    `;
    document.body.appendChild(b);
    b.querySelector('#kpb-dismiss').onclick = () => b.remove();

    // Auto-hide after 6 seconds if backend is OK
    setTimeout(() => {
      const dot = document.getElementById('kpb-dot');
      if (dot && dot.style.background.includes('5a7a44')) b?.remove();
    }, 6000);
  }

  async function check() {
    inject();
    const dot = document.getElementById('kpb-dot');
    const text = document.getElementById('kpb-text');
    if (!dot || !text) return;
    if (!window.KIBOOKAL_API) {
      dot.style.background = '#9b3f2c';
      text.textContent = 'platform · API client missing';
      return;
    }
    const r = await window.KIBOOKAL_API.health();
    if (r.ok) {
      dot.style.background = '#5a7a44';
      const dbState = r.db === 'connected' ? 'db ✓' : 'db off';
      text.textContent = `platform · backend ✓ · ${dbState}`;
    } else {
      dot.style.background = '#b85c3c';
      text.textContent = r.offline
        ? 'platform · backend offline (file mode)'
        : `platform · backend error (${r.status || '—'})`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', check);
  } else {
    check();
  }
})();
