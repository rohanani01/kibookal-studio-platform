/* ============================================================
   Kibookal — AI Layout Brain (Comic + Magazine)
   Self-contained, additive. When the toggle is ON, Claude reads each
   page (story + panels + characters) and picks the best KLOS layout
   for THAT page from the real layout vault, considering action vs quiet,
   panel count and character staging. Produces a per-page plan and
   applies it through the existing active-layout mechanism.
   No existing studio code is modified.
   ============================================================ */
(function () {
  'use strict';
  const VAULT_URL = 'refs/kibookal_layout_vault.json';
  let VAULT = null;

  async function loadVault() {
    if (VAULT) return VAULT;
    const r = await fetch(VAULT_URL, { cache: 'no-store' });
    VAULT = await r.json();
    return VAULT;
  }
  const EMB = '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';
  function lsKey(){ try { for (const k of Object.keys(localStorage)) { if (/setting/i.test(k)) { const v = JSON.parse(localStorage.getItem(k) || '{}'); if (v && v.anthropicKey) return v.anthropicKey; } } } catch (e) {} return ''; }
  const key = () => (window.SETTINGS && SETTINGS.anthropicKey) || (window.EMBEDDED_KEYS && EMBEDDED_KEYS.anthropic) || lsKey() || EMB;
  const model = () => (window.SETTINGS && SETTINGS.claudeModel) || 'claude-sonnet-4-5';

  async function claude(system, user, maxTok) {
    const k = key();
    if (!k) throw new Error('No Anthropic key — paste one in ⚙ Settings');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: model(), max_tokens: maxTok || 1024, system, messages: [{ role: 'user', content: user }] })
    });
    if (!res.ok) throw new Error('Claude ' + res.status + ': ' + (await res.text()).slice(0, 200));
    const d = await res.json();
    return (d.content && d.content[0] && d.content[0].text) || '';
  }

  function layoutsFor(mode) {
    const v = VAULT || {};
    const arr = mode === 'comic' ? (v.comic_layouts || []) : (v.magazine_layouts || []);
    return arr.map(L => ({
      id: L['Layout ID'], name: L['Layout Name'], best: L['Best For'],
      arch: (L['Layout Architecture'] || '').slice(0, 100), flow: L['Reading Flow'], panels: L['Panel/Zones']
    }));
  }

  /* derive the page list:
     1) from a pasted page-prompts JSON ({page_prompts:[...]}/array) or plain "PAGE n" text in the panel textarea
     2) else from STATE.comicPages (comic) */
  function parsePagesFromText(txt) {
    txt = (txt || '').trim();
    if (!txt) return [];
    try {
      const j = JSON.parse(txt);
      const arr = Array.isArray(j) ? j : (j.page_prompts || j.pages || []);
      if (Array.isArray(arr) && arr.length) return arr.map((p, i) => ({
        page: p.page || i + 1, title: p.title || ('Page ' + (i + 1)),
        text: (p.prompt || p.panel_plan && p.panel_plan.join(' | ') || p.text || JSON.stringify(p)).slice(0, 1200),
        characters: Array.isArray(p.characters) ? p.characters.join(', ') : (Array.isArray(p.active_character_ids) ? p.active_character_ids.join(', ') : (p.characters || ''))
      }));
    } catch (e) { /* not JSON — fall through to text split */ }
    const blocks = txt.split(/\n(?=\s*={3,}|\s*PAGE\s*\d+)/i).filter(b => b.trim());
    const byPage = {};
    blocks.forEach((b) => { const m = b.match(/PAGE\s*(\d+)/i); if (!m) return; const pg = +m[1]; if (!byPage[pg] || b.length > byPage[pg].length) byPage[pg] = b; });
    if (!Object.keys(byPage).length) return [{ page: 1, title: 'Page 1', text: txt.slice(0, 1200), characters: '' }];
    return Object.keys(byPage).map(Number).sort((a, b) => a - b).map(pg => {
      const b = byPage[pg]; const m = b.match(/PAGE\s*\d+\s*[—:\-]?\s*([^\n]*)/i);
      return { page: pg, title: ((m && m[1]) ? m[1] : ('Page ' + pg)).slice(0, 60), text: b.slice(0, 1200), characters: '' };
    });
  }
  function comicPages() {
    const ps = (window.STATE && STATE.comicPages) || [];
    return ps.map((p, i) => ({
      page: i + 1, title: p.title || ('Page ' + (i + 1)),
      text: ((p.panels || []).map(pn => pn.prompt || pn.desc || pn.text || '').join(' | ') || p.script || p.story || '').slice(0, 1200),
      characters: ((p.characters || p.cast || []).join ? (p.characters || p.cast).join(', ') : '')
    }));
  }

  async function pickForPage(page, mode, layouts) {
    const list = layouts.map(L => `${L.id} | ${L.name} | best: ${L.best} | ${L.panels || ''} | ${L.arch}`).join('\n');
    const sys = 'You are a senior comic & magazine art director. From the supplied KLOS layout catalogue, choose the SINGLE best page layout for the given page, judging by: number of story beats / panels, action vs quiet mood, how the characters must be staged, and the reading flow. Reply with ONLY compact JSON: {"layoutId":"<exact id from the list>","reason":"<=12 words"}.';
    const usr = `MODE: ${mode}\nPAGE ${page.page}: ${page.title}\nSTORY / PANELS:\n${page.text}\nCHARACTERS: ${page.characters || '(unspecified)'}\n\nLAYOUT CATALOGUE (id | name | best-for | zones | architecture):\n${list}\n\nReturn JSON only with an id that exactly matches one from the catalogue.`;
    const out = await claude(sys, usr, 300);
    let j; try { j = JSON.parse(out.match(/\{[\s\S]*\}/)[0]); } catch (e) { j = { layoutId: '', reason: 'could not parse AI reply' }; }
    const meta = layouts.find(L => L.id === j.layoutId) || {};
    return { page: page.page, title: page.title, layoutId: j.layoutId || '', name: meta.name || '(unknown)', reason: j.reason || '' };
  }

  async function run(mode, pastedText, onProgress) {
    await loadVault();
    const layouts = layoutsFor(mode);
    if (!layouts.length) throw new Error('No ' + mode + ' layouts found in the vault');
    let pages = parsePagesFromText(pastedText);
    if (!pages.length && mode === 'comic') pages = comicPages();
    if (!pages.length) throw new Error('No pages found. Paste your page-prompts JSON / page text above (or load comic pages).');
    const plan = [];
    // small concurrency pool of 2
    let i = 0;
    async function worker() {
      while (i < pages.length) {
        const idx = i++;
        onProgress && onProgress(idx + 1, pages.length);
        try { plan[idx] = await pickForPage(pages[idx], mode, layouts); }
        catch (e) { plan[idx] = { page: pages[idx].page, title: pages[idx].title, layoutId: '', name: '', reason: 'error: ' + e.message }; }
      }
    }
    await Promise.all([worker(), worker()]);
    window.__autoLayoutPlan = window.__autoLayoutPlan || {};
    window.__autoLayoutPlan[mode] = plan;
    return plan;
  }

  function applyLayout(id, mode) {
    if (!id) return;
    if (typeof window.kbsSetActiveLayoutId === 'function') window.kbsSetActiveLayoutId(id);
    const sel = document.getElementById(mode === 'magazine' ? 'magKbsLayoutSelect' : null);
    if (sel) { sel.value = id; try { sel.dispatchEvent(new Event('change')); } catch (e) {} }
    if (window.toast) toast('📐 Layout → ' + id, 'ok');
  }

  /* Per-page auto-apply: when the toggle is ON and a plan exists, override the
     active-layout getter so each page renders with its AI-chosen layout. */
  let _origGetId = null;
  function autoOn(mode) { const cb = document.getElementById('kbAutoLayoutToggle_' + mode); return cb && cb.checked; }
  function curPageIdx(mode) {
    if (mode === 'comic') return (window.STATE && (STATE.comicCurrentPage || 0)) || 0;
    return (window.STATE && (STATE.magCurrentPage || 0)) || 0;
  }
  function installHook() {
    if (_origGetId || typeof window.kbsGetActiveLayoutId !== 'function') return;
    _origGetId = window.kbsGetActiveLayoutId;
    window.kbsGetActiveLayoutId = function () {
      for (const mode of ['comic', 'magazine']) {
        if (autoOn(mode)) {
          const plan = (window.__autoLayoutPlan || {})[mode] || [];
          const e = plan[curPageIdx(mode)];
          if (e && e.layoutId) return e.layoutId;
        }
      }
      return _origGetId.apply(this, arguments);
    };
  }

  function planRows(plan, mode) {
    return plan.map(e => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid rgba(0,0,0,.06);font-size:11.5px;">
      <b style="min-width:34px;">p${String(e.page).padStart(2, '0')}</b>
      <span style="min-width:120px;color:var(--maroon,#7a2722);font-weight:700;">${e.layoutId || '—'}</span>
      <span style="flex:1;color:var(--ash,#888);">${e.name} — ${e.reason}</span>
      <button class="btn ghost sm" data-applyid="${e.layoutId}" data-mode="${mode}" style="padding:2px 8px;font-size:10px;">apply</button>
    </div>`).join('');
  }

  function buildPanel(mode) {
    const wrap = document.createElement('div');
    wrap.className = 'kb-autolayout-panel';
    wrap.style.cssText = 'margin:10px 0;padding:12px 14px;border:1px solid var(--line,#d8cdb8);border-radius:8px;background:var(--paper-2,rgba(0,0,0,.03));';
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <label style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:12.5px;cursor:pointer;">
          <input type="checkbox" id="kbAutoLayoutToggle_${mode}" style="width:auto;margin:0;"> 🧠 Auto-pick layout per page (AI)
        </label>
        <button class="btn sm" id="kbAutoLayoutRun_${mode}" type="button" style="padding:4px 10px;">Run AI layout planner</button>
        <span id="kbAutoLayoutStatus_${mode}" style="font-size:11px;color:var(--ash,#888);"></span>
      </div>
      <div style="font-size:10.5px;color:var(--ash,#888);margin-top:6px;line-height:1.45;">
        Claude reads each page's story, panels and characters and chooses the best KLOS ${mode} layout for it. With the toggle ON, every page renders with its own AI-chosen layout. Reference images stay optional — the selected Style sets the look.
      </div>
      <textarea id="kbAutoLayoutPages_${mode}" rows="3" placeholder="Paste your page-prompts JSON (e.g. bone_puzzle_page_prompts.json) or plain 'PAGE 1 … PAGE 2 …' text — total pages are detected automatically. Leave blank to use the loaded ${mode} pages." style="width:100%;margin-top:8px;font-family:'JetBrains Mono',monospace;font-size:10.5px;"></textarea>
      <div id="kbAutoLayoutCount_${mode}" style="font-size:11.5px;color:var(--accent,#b9551f);font-weight:700;margin-top:5px;"></div>
      <div id="kbAutoLayoutResults_${mode}" style="margin-top:8px;max-height:260px;overflow:auto;"></div>`;
    return wrap;
  }

  function wirePanel(wrap, mode) {
    // live page-count detection on paste/typing
    const ta = wrap.querySelector('#kbAutoLayoutPages_' + mode);
    const cnt = wrap.querySelector('#kbAutoLayoutCount_' + mode);
    const detect = () => {
      let pages = parsePagesFromText(ta.value);
      if (!pages.length && mode === 'comic') pages = comicPages();
      cnt.textContent = pages.length ? ('📄 Detected ' + pages.length + ' page' + (pages.length === 1 ? '' : 's') + ' — click “Run AI layout planner” to assign a layout to each.') : '';
      cnt.dataset.n = pages.length;
      return pages.length;
    };
    ta.addEventListener('input', detect);
    setTimeout(detect, 300);
    wrap.querySelector('#kbAutoLayoutRun_' + mode).addEventListener('click', async () => {
      const st = wrap.querySelector('#kbAutoLayoutStatus_' + mode);
      const res = wrap.querySelector('#kbAutoLayoutResults_' + mode);
      const txt = wrap.querySelector('#kbAutoLayoutPages_' + mode).value;
      st.textContent = 'thinking…';
      try {
        const plan = await run(mode, txt, (n, t) => { st.textContent = `analyzing page ${n}/${t}…`; });
        res.innerHTML = planRows(plan, mode);
        const okCount = plan.filter(p => p.layoutId).length;
        st.innerHTML = `✓ planned <b>${okCount}/${plan.length}</b> pages` + (autoOn(mode) ? ' · auto-apply ON' : ' · turn the toggle ON to auto-apply');
        installHook();
      } catch (e) { st.textContent = '✗ ' + e.message; }
    });
    wrap.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-applyid]'); if (!b) return;
      applyLayout(b.getAttribute('data-applyid'), b.getAttribute('data-mode'));
    });
    wrap.querySelector('#kbAutoLayoutToggle_' + mode).addEventListener('change', installHook);
  }

  function mountOnce() {
    // Comic — above the "Generate all pages" button (dedupe by unique toggle id)
    if (!document.getElementById('kbAutoLayoutToggle_comic')) {
      const anchor = document.getElementById('comicGenerateMainBtn');
      if (anchor && anchor.parentElement) {
        const p = buildPanel('comic'); anchor.parentElement.insertBefore(p, anchor); wirePanel(p, 'comic');
      }
    }
    // Magazine (KBS view) — inside #magViewKBS, under the style/layout selectors
    if (!document.getElementById('kbAutoLayoutToggle_magazine')) {
      const mag = document.getElementById('magViewKBS');
      if (mag) {
        const p = buildPanel('magazine');
        const sel = document.getElementById('magKbsLayoutSelect');
        const row = sel ? sel.closest('div') : null;
        if (row && mag.contains(row)) row.parentElement.insertBefore(p, row.nextSibling);
        else mag.insertBefore(p, mag.firstChild);
        wirePanel(p, 'magazine');
      }
    }
    installHook();
  }

  window.KBAutoLayout = { loadVault, layoutsFor, pickForPage, run, applyLayout, mount: mountOnce, _parse: parsePagesFromText, _hasKey: () => !!key(), layoutFor: (mode, i) => ((window.__autoLayoutPlan || {})[mode] || [])[i]?.layoutId || '' };
  document.addEventListener('DOMContentLoaded', () => setTimeout(mountOnce, 800));
  setTimeout(mountOnce, 2000);
  // re-mount when sections become visible (views toggle display)
  document.addEventListener('click', e => { if (e.target.closest('[data-view="comic"],[data-view="magazine"]')) setTimeout(mountOnce, 300); });
})();
