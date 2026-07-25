/* ============================================================================
   Kibookal — Master-JSON / Story Planner  (spec §1 — Core Orchestrator intake)
   Turns a brief or rough story into a per-page execution plan and writes it into
   the Comic page-prompts box (PAGE-marker format the existing parser consumes),
   stores STATE.comicPagePlan, and offers a downloadable Master JSON.
   Each page prompt bakes: panel beats, the best KLOS layout, the cast (with costume
   locks from the vault), per-page camera/lighting/exaggeration and exact dialogue.
   Style + typography + global cinematic acting are added by the central injectors.
   Self-contained, additive. Uses the studio's Anthropic key + Claude.
   ========================================================================== */
(function () {
  'use strict';
  const B = location.origin;

  function lsKey() { try { for (const k of Object.keys(localStorage)) { if (/setting/i.test(k)) { const v = JSON.parse(localStorage.getItem(k) || '{}'); if (v && v.anthropicKey) return v.anthropicKey; } } } catch (e) {} return ''; }
  function key() {
    try { if (window.SETTINGS && SETTINGS.anthropicKey) return SETTINGS.anthropicKey; } catch (e) {}
    try { if (typeof EMBEDDED_KEYS !== 'undefined' && EMBEDDED_KEYS.anthropic) return EMBEDDED_KEYS.anthropic; } catch (e) {} // top-level const → lexical, not on window
    return lsKey();
  }
  async function claude(system, user, maxTokens) {
    const k = key();
    if (!k) throw new Error('No Anthropic key found (set it in ⚙ Settings).');
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: maxTokens || 8000, system, messages: [{ role: 'user', content: user }] })
    });
    if (!r.ok) throw new Error('Claude ' + r.status + ' ' + (await r.text()).slice(0, 160));
    const d = await r.json();
    return (d.content && d.content[0] && d.content[0].text) || '';
  }

  let LAYOUTS = null;
  async function loadLayouts() {
    if (LAYOUTS) return LAYOUTS;
    try {
      const j = await (await fetch(B + '/refs/kibookal_layout_vault.json')).json();
      LAYOUTS = (j.comic_layouts || []).map(x => ({ id: x['Layout ID'], name: x['Layout Name'], best: x['Best For'], panels: x['Panel/Zones'], arch: (x['Layout Architecture'] || '').slice(0, 110), flow: x['Reading Flow'] }));
    } catch (e) { LAYOUTS = []; }
    return LAYOUTS;
  }
  const byId = id => (LAYOUTS || []).find(x => x.id === id);

  // cast: locked sheets first (name + costume description), else comicCast text, else master JSON
  function gatherCast() {
    const out = [];
    try {
      const sheets = (window.STATE && STATE.comicCharSheets) || {};
      Object.keys(sheets).forEach(name => { if (sheets[name] && sheets[name].approved) out.push({ name, desc: (sheets[name].description || '').slice(0, 200) }); });
    } catch (e) {}
    if (!out.length) {
      const t = (document.getElementById('comicCast') || {}).value || '';
      t.split('\n').map(l => l.trim()).filter(Boolean).forEach(l => { const m = l.match(/^([^:]{1,40}):\s*(.*)$/); if (m) out.push({ name: m[1].trim(), desc: m[2].trim().slice(0, 200) }); else out.push({ name: l.slice(0, 40), desc: '' }); });
    }
    if (!out.length) { try { const ch = STATE.comicMasterJson && STATE.comicMasterJson.characters; if (ch) (Array.isArray(ch) ? ch : Object.values(ch)).forEach(c => out.push({ name: c.name || c.id || 'Character', desc: (c.one_line || c.description || '').slice(0, 200) })); } catch (e) {} }
    return out;
  }

  function compilePagePrompt(p, lay, cast) {
    const names = (p.characterIds || []).join(', ');
    const costume = cast.filter(c => (p.characterIds || []).some(id => c.name.toLowerCase().includes(String(id).toLowerCase()) || String(id).toLowerCase().includes(c.name.toLowerCase())))
      .map(c => '  • ' + c.name + (c.desc ? ' — ' + c.desc : '')).join('\n');
    const dlg = (p.dialogue || []).map(d => {
      const t = (d.type || 'speech').toLowerCase();
      if (t === 'caption') return '  • caption box — letter exactly: ' + d.text;
      if (t === 'sfx') return '  • hand-drawn SFX — letter exactly: ' + d.text;
      return '  • ' + (d.speaker || '') + ' speech bubble — letter exactly: ' + d.text;
    }).join('\n');
    const lines = [];
    lines.push('PURPOSE: ' + (p.page_purpose || p.title || ''));
    if (lay) lines.push(`Compose this page as KLOS comic layout ${lay.id} — "${lay.name}" (${lay.arch}; reading flow: ${lay.flow}; ${lay.panels}).`);
    lines.push('PANELS (' + ((p.panels || []).length || p.panelCount || 0) + '):');
    lines.push((p.panels || []).map(x => '  • ' + x).join('\n'));
    if (names) lines.push('CHARACTERS ON PAGE (keep EXACTLY on-model from their locked sheets): ' + names);
    if (costume) lines.push('COSTUME LOCK (every panel):\n' + costume);
    if (p.cameraSpec || p.lighting) lines.push('CAMERA: ' + (p.cameraSpec || 'natural') + ' · LIGHTING: ' + (p.lighting || 'story-appropriate') + (p.exaggeration ? ' · ACTING: ' + p.exaggeration : ''));
    if (dlg) lines.push('DIALOGUE — letter EXACTLY the words after "letter exactly:"; never the speaker name, labels, colons or quote marks:\n' + dlg);
    return lines.join('\n');
  }

  async function run(btn) {
    const box = document.getElementById('comicStory');
    if (!box) { alert('Comic page-prompts box not found.'); return; }
    const brief = (box.value || '').trim();
    if (!brief) { alert('Paste a brief or rough story into the page-prompts box first, then click again.'); return; }
    const status = document.getElementById('kbPlannerStatus');
    const set = (t, c) => { if (status) { status.textContent = t; status.style.color = c || 'var(--ash)'; } };
    if (btn) btn.disabled = true; set('Reading cast + layouts…', 'var(--saffron)');
    try {
      const cast = gatherCast();
      const layouts = await loadLayouts();
      const want = parseInt((document.getElementById('comicPageCount') || {}).value) || 0;
      const castStr = cast.length ? cast.map(c => '- ' + c.name + (c.desc ? ': ' + c.desc : '')).join('\n') : '(no locked cast — infer characters from the brief and give each a stable id)';
      const layStr = layouts.map(x => `${x.id} | ${x.name} | best:${x.best} | ${x.panels}`).join('\n');
      const sys = 'You are a comic story-breakdown engine for a children\'s graphic novel. Given a brief/story, the cast, and a layout catalogue, produce a per-page execution plan. Reply with ONLY a JSON array (no prose). Each element: {"page":int,"title":str,"page_purpose":str,"characterIds":[str from the cast],"panelCount":int,"panels":[str, one vivid beat per panel],"suggestedLayoutId":"Cxxx (MUST be from the catalogue; pick the best fit per page; prefer variety — avoid repeating a layout),"cameraSpec":"shot + lens","lighting":str,"exaggeration":"subtle|moderate|high|extreme","dialogue":[{"speaker":str,"text":str,"type":"speech|caption|sfx"}]}. Keep it age-appropriate and visually clear. Use ONLY characters from the cast (by name).';
      set('Planning pages with Claude…', 'var(--saffron)');
      const usr = `BRIEF / STORY:\n${brief}\n\nCAST:\n${castStr}\n\nLAYOUT CATALOGUE (comic, C001–C050):\n${layStr}\n\n${want ? 'Target about ' + want + ' pages.' : 'Choose a sensible page count (8–26).'}\nReturn the JSON array now.`;
      const txt = await claude(sys, usr, 8000);
      let plan;
      try { plan = JSON.parse(txt.match(/\[[\s\S]*\]/)[0]); } catch (e) { throw new Error('Could not parse the plan JSON. Try again or shorten the brief.'); }
      if (!Array.isArray(plan) || !plan.length) throw new Error('Empty plan returned.');
      // enforce distinct layouts where possible
      const used = new Set();
      plan.forEach((p, i) => { p.page = p.page || (i + 1); let lid = byId(p.suggestedLayoutId) ? p.suggestedLayoutId : null; if (!lid || used.has(lid)) { const free = layouts.find(L => !used.has(L.id)); lid = (free || layouts[i % layouts.length] || {}).id; } p.suggestedLayoutId = lid; if (lid) used.add(lid); });
      // write PAGE-marker doc the existing parser consumes
      const doc = plan.map(p => `PAGE ${p.page} — ${p.title || ''}\n\n${compilePagePrompt(p, byId(p.suggestedLayoutId), cast)}`).join('\n\n' + '='.repeat(48) + '\n\n');
      box.value = doc;
      box.dispatchEvent(new Event('input', { bubbles: true }));
      try { STATE.comicPagePlan = plan; } catch (e) {}  // lexical global (STATE is a top-level const, not on window)
      // master JSON
      const master = {
        project: 'Kibookal Master Plan',
        generated_from: brief.slice(0, 120),
        style_id: (window.kbsGetActiveStyleId && kbsGetActiveStyleId()) || null,
        typography_id: (window.kbsGetActiveTypo && (kbsGetActiveTypo() || {})['Typography System ID']) || null,
        cast: cast,
        pages: plan
      };
      window.__kbMasterPlan = master;
      const dl = document.getElementById('kbPlannerDownload');
      if (dl) { dl.style.display = ''; dl.onclick = () => { const blob = new Blob([JSON.stringify(master, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kibookal_master_plan.json'; a.click(); }; }
      set('✓ ' + plan.length + ' pages planned + written to the box (distinct layouts assigned). Review, then Generate.', 'var(--green)');
    } catch (e) {
      set('⚠ ' + (e.message || e), 'var(--red)');
    } finally { if (btn) btn.disabled = false; }
  }

  function mount() {
    const c = document.getElementById('viewComic');
    if (!c || document.getElementById('kbPlannerBar')) return;
    const box = document.getElementById('comicStory');
    const bar = document.createElement('div');
    bar.id = 'kbPlannerBar';
    bar.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin:8px 0;background:var(--paper-2,rgba(255,255,255,.03));';
    bar.innerHTML =
      `<strong style="font-size:12px;">🧩 Master Plan</strong>
       <span style="font-size:10.5px;color:var(--ash);">brief / rough story in the box →</span>
       <button id="kbPlannerRun" class="btn sm" style="font-size:11px;">⚡ Build per-page plan (AI)</button>
       <button id="kbPlannerDownload" class="btn sm" style="font-size:11px;display:none;">⬇ Master JSON</button>
       <span id="kbPlannerStatus" style="font-size:10.5px;color:var(--ash);"></span>`;
    if (box && box.parentNode) box.parentNode.insertBefore(bar, box);
    else c.insertBefore(bar, c.firstChild);
    document.getElementById('kbPlannerRun').addEventListener('click', function () { run(this); });
  }

  window.KBPlanner = { run, mount };
  function tick() { try { mount(); } catch (e) {} }
  if (document.readyState !== 'loading') setTimeout(tick, 700); else document.addEventListener('DOMContentLoaded', () => setTimeout(tick, 700));
  document.addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('[data-view]')) setTimeout(tick, 300); }, true);
  setInterval(tick, 3000);
})();
