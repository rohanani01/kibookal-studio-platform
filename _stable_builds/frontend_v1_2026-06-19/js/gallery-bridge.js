/* ============================================================
   Kibookal Studio → Gallery bridge
   ------------------------------------------------------------
   Adds a "Gallery" tab to the Studio and auto-sends EVERY new
   render to the local Kibookal Gallery (which then mirrors to
   Vercel every 30 min).

   Non-invasive: this is a separate file loaded after app.js.
   Everything is wrapped so it can NEVER break the Studio.

   Config (optional) — define before this script if you need to
   point at a different gallery:
     <script>window.KIBOOKAL_GALLERY = { url:'http://localhost:4000' }</script>
   ============================================================ */
(function () {
  'use strict';
  try {
    var CFG = window.KIBOOKAL_GALLERY || {};
    var GALLERY_URL = String(CFG.url || 'http://localhost:4000').replace(/\/+$/, '');
    var TOKEN = CFG.token || null;
    var sent = 0, online = false, lastErr = '';

    function log() { try { console.log.apply(console, ['[gallery-bridge]'].concat([].slice.call(arguments))); } catch (e) {} }

    // ---- discover the ingest token (localhost-only endpoint) ----
    function ensureToken() {
      if (TOKEN) return Promise.resolve(true);
      return fetch(GALLERY_URL + '/api/ingest/token')
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.ok && j.token) { TOKEN = j.token; return true; } return false; })
        .catch(function () { return false; });
    }

    // ---- push one render to the gallery ----
    function push(r) {
      if (!TOKEN || !r || !r.dataUrl) return Promise.resolve(false);
      return fetch(GALLERY_URL + '/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: TOKEN,
          style_id: r.style_id || 'UNSORTED',
          style_name: r.name || r.style_id || '',
          dataUrl: r.dataUrl,
          subject: r.subject || '',
          model: r.model || '',
          section: r.section || 'StyleLock',   // section folder (Comic / Magazine / Diary / StyleLock ...)
          version: r.version || 'v1'           // version folder (v1, v2 ...)
        })
      }).then(function (res) { return res.json(); })
        .then(function (j) { return !!(j && j.ok); })
        .catch(function (e) { lastErr = e.message; return false; });
    }

    // ---- collect EVERY render not yet sent: Style Lock + global HISTORY ----
    function activeStyleId() {
      try { return (localStorage.getItem('kibookal_active_style_id_v1') || ''); } catch (e) { return ''; }
    }
    function collectRenders() {
      var out = [];
      // 1. Style Lock renders (already shaped { style_id, name, dataUrl, subject })
      try { if (typeof KBS_STATE !== 'undefined' && KBS_STATE.renders) out = out.concat(KBS_STATE.renders); } catch (e) {}
      // 1b. Diary renders (section: Diary)
      try { if (typeof DIARY_STATE !== 'undefined' && DIARY_STATE.renders) out = out.concat(DIARY_STATE.renders); } catch (e) {}
      // 1c. Trigun Kit renders (section: TrigunKit)
      try { if (typeof TRIGUN_STATE !== 'undefined' && TRIGUN_STATE.renders) out = out.concat(TRIGUN_STATE.renders); } catch (e) {}
      // 1d. Style Convert renders (section: StyleConvert)
      try { if (typeof SCV_STATE !== 'undefined' && SCV_STATE.renders) out = out.concat(SCV_STATE.renders); } catch (e) {}
      // 2. Global studio HISTORY (Studio / Comic / Magazine / Batch etc.) — map to the gallery shape.
      try {
        if (typeof HISTORY !== 'undefined' && Array.isArray(HISTORY)) {
          for (var i = 0; i < HISTORY.length; i++) {
            var h = HISTORY[i];
            if (!h || !h.image) continue;
            // wrap so __inGallery flag persists on the HISTORY entry itself
            if (!h.__galWrap) {
              Object.defineProperty(h, '__galWrap', {
                value: {
                  get dataUrl() { return h.image; },
                  style_id: activeStyleId() || (h.style_id || 'UNSORTED'),
                  name: h.style_id || '',
                  subject: h.characterName || h.scenarioTitle || (h.prompt ? String(h.prompt).slice(0, 80) : ''),
                  model: h.provider || h.mode || '',
                  get __inGallery() { return h.__inGallery; },
                  set __inGallery(v) { h.__inGallery = v; }
                },
                enumerable: false
              });
            }
            out.push(h.__galWrap);
          }
        }
      } catch (e) {}
      return out;
    }

    function tick() {
      ensureToken().then(function (haveToken) {
        online = !!haveToken;
        if (!haveToken) { paint(); return; }
        var arr = collectRenders();
        var chain = Promise.resolve();
        arr.forEach(function (r) {
          if (r && r.dataUrl && !r.__inGallery) {
            r.__inGallery = true; // optimistic; undo on failure so it retries
            chain = chain.then(function () {
              return push(r).then(function (ok) { if (ok) sent++; else r.__inGallery = false; });
            });
          }
        });
        chain.then(paint);
      });
    }

    // ---- the in-Studio "Gallery" panel ----
    function panelHTML() {
      return ''
        + '<div style="max-width:780px;margin:0 auto;padding:30px 8px;">'
        + '  <h2 style="font-family:Georgia,serif;font-size:24px;margin:0 0 6px;">Kibookal Gallery</h2>'
        + '  <p style="color:var(--ash,#8a7a63);margin:0 0 20px;">Every render you create is sent here automatically, organised by style. '
        +      'The gallery mirrors to the published website every 30 minutes.</p>'
        + '  <div id="gbStatus" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:20px;'
        +      'background:#f3ead6;border:1px solid #e3d9c4;font-size:13px;font-weight:600;margin-bottom:22px;"></div>'
        + '  <div style="display:flex;gap:10px;flex-wrap:wrap;">'
        + '    <a href="' + GALLERY_URL + '" target="_blank" rel="noopener" '
        +       'style="background:var(--saffron,#b85c3c);color:#fff;text-decoration:none;padding:10px 18px;border-radius:9px;font-weight:600;">Open Gallery &#8599;</a>'
        + '    <button id="gbResync" class="btn ghost" style="padding:10px 18px;border-radius:9px;">Re-sync now</button>'
        + '  </div>'
        + '  <p style="color:var(--ash,#8a7a63);font-size:12px;margin-top:22px;">Gallery address: <code>' + GALLERY_URL + '</code> '
        +     '&middot; if it is offline, start it with <code>start.bat</code> in the kibookal-gallery folder.</p>'
        + '</div>';
    }

    function paint() {
      var s = document.getElementById('gbStatus');
      if (!s) return;
      var dot = online ? '#3c7a4e' : '#b23a32';
      s.innerHTML = '<span style="width:9px;height:9px;border-radius:50%;background:' + dot + ';display:inline-block;"></span>'
        + (online ? ('Connected &middot; ' + sent + ' render' + (sent === 1 ? '' : 's') + ' sent this session')
                  : 'Gallery offline &middot; will connect when it is running');
    }

    // ---- inject the tab + view panel (retry until the Studio DOM is ready) ----
    function injectUI() {
      var tabs = document.querySelector('nav.tabs');
      var anyView = document.querySelector('.view');
      if (!tabs || !anyView) return false;

      if (!document.getElementById('galleryTab')) {
        var b = document.createElement('button');
        b.className = 'tab'; b.id = 'galleryTab';
        b.setAttribute('data-view', 'gallery');
        b.textContent = 'Gallery';
        b.onclick = function () { try { setView('gallery'); } catch (e) {} paint(); };
        tabs.appendChild(b);
      }
      if (!document.getElementById('viewGallery')) {
        var v = document.createElement('div');
        v.className = 'view'; v.id = 'viewGallery';
        v.innerHTML = panelHTML();
        anyView.parentNode.appendChild(v);
        var rb = v.querySelector('#gbResync');
        if (rb) rb.onclick = function () {
          collectRenders().forEach(function (r) { if (r) r.__inGallery = false; });
          tick();
        };
      }
      paint();
      return true;
    }

    function start() {
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        if (injectUI() || tries > 40) clearInterval(iv);
      }, 250);
      setInterval(tick, 4000);
      setTimeout(tick, 1500);
      log('ready · gallery at', GALLERY_URL);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  } catch (e) {
    try { console.warn('[gallery-bridge] disabled:', e.message); } catch (x) {}
  }
})();
