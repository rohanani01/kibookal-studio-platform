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
          version: r.version || 'v1',          // version folder (v1, v2 ...)
          kind: r.kind || '',                  // comic / magazine (facet)
          layout: r.layout || '',              // layout id+name (facet)
          typography: r.typography || ''       // typography id+name (facet)
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
      // 1e. PageForge renders (carry full facets: kind / layout / typography)
      try { if (typeof PF_STATE !== 'undefined' && PF_STATE.renders) out = out.concat(PF_STATE.renders); } catch (e) {}
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

    // ---- in-Studio Gallery view: wire the STATIC panel (index.html #viewGallery) + embed the site ----
    // v3.0: the Gallery is now a first-class static section. The bridge no longer injects a tab/view;
    // it just wires the static controls, paints connection status, and lazy-loads the gallery in an iframe.
    var frameLoaded = false;
    function gEl(id) { return document.getElementById(id); }

    function loadFrame() {
      var f = gEl('gbFrame');
      if (f && online && !frameLoaded) { f.src = GALLERY_URL; frameLoaded = true; }
    }

    function paint() {
      var s = gEl('gbStatus');
      if (s) {
        var dot = online ? '#3c7a4e' : '#b23a32';
        s.innerHTML = '<span style="width:9px;height:9px;border-radius:50%;background:' + dot + ';display:inline-block;"></span>'
          + (online ? ('Connected &middot; ' + sent + ' sent this session') : 'Offline &middot; queuing locally');
      }
      var off = gEl('gbOffline'); if (off) off.style.display = online ? 'none' : 'grid';
      loadFrame();
    }

    // Wire the static Gallery panel buttons (idempotent — safe to call repeatedly).
    function wireGalleryView() {
      var open = gEl('gbOpen');
      if (open && !open.__wired) { open.__wired = 1; open.addEventListener('click', function () { window.open(GALLERY_URL, '_blank', 'noopener'); }); }
      var rb = gEl('gbResync');
      if (rb && !rb.__wired) { rb.__wired = 1; rb.addEventListener('click', function () { collectRenders().forEach(function (r) { if (r) r.__inGallery = false; }); tick(); }); }
      var retry = gEl('gbRetry');
      if (retry && !retry.__wired) { retry.__wired = 1; retry.addEventListener('click', function () { frameLoaded = false; tick(); }); }
    }

    // Hook called by setView('gallery') so opening the tab refreshes status + loads the embed on demand.
    window.__kibookalGalleryOpen = function () { wireGalleryView(); tick(); };

    function start() {
      wireGalleryView();
      setInterval(tick, 4000);
      setTimeout(tick, 1200);
      log('ready · gallery at', GALLERY_URL);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  } catch (e) {
    try { console.warn('[gallery-bridge] disabled:', e.message); } catch (x) {}
  }
})();
