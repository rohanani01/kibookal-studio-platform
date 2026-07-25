/* ============================================================================
   Kibookal — Cinematic & Acting Engine  (spec §3)
   Self-contained, additive. Adds two GLOBAL prompt modifiers that ride along on
   every Comic / generic-Magazine / Studio render via a single hook in generateImage:
     1. Exaggeration Controller (subtle → extreme) — acting / pose / expression intensity
     2. Cinematography & Lighting engine — shot type, lens, lighting, mood
   Scope-aware: never injects into Diary / Creature magazine modules (they own their look).
   State persists in localStorage. UI mounts into #viewComic and #magViewKBS.
   ========================================================================== */
(function () {
  'use strict';
  const KEY = 'kb_cine_v1';
  const DEFAULT = { on: true, exaggeration: 'moderate', shot: 'auto', lens: 'auto', lighting: 'auto', mood: 'auto', look: 'auto' };

  function load() { try { return Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return Object.assign({}, DEFAULT); } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  let S = load();

  // ---- option vocabularies ----
  const EXAG = {
    subtle:   { v: 0.25, txt: 'Grounded, naturalistic acting — restrained, subtle facial expressions and realistic, understated body poses. Minimal theatrics.' },
    moderate: { v: 0.50, txt: 'Clear, readable expressions and natural dynamic poses; balanced, believable staging — neither flat nor over-acted.' },
    high:     { v: 0.75, txt: 'Expressive, energetic acting — strong facial expressions, dynamic gestures and lively, dramatic body poses.' },
    extreme:  { v: 1.00, txt: 'Highly exaggerated cartoon acting — extreme expressions, dramatic foreshortening, bold dynamic action poses and intense emotional delivery.' }
  };
  const SHOT = {
    auto: '', 'extreme close-up': 'extreme close-up (eyes / detail filling the frame)', 'close-up': 'close-up on the face',
    'medium': 'medium shot (waist up)', 'wide': 'wide establishing shot showing the full location',
    'birds-eye': "bird's-eye / top-down view", 'low-angle': 'dramatic low camera angle looking up', 'dutch': 'tilted Dutch-angle for unease', 'ots': 'over-the-shoulder framing'
  };
  const LENS = { auto: '', '24mm': '24mm wide-angle (expansive, slight distortion)', '35mm': '35mm documentary feel', '50mm': '50mm natural perspective', '85mm': '85mm portrait compression, shallow depth of field', 'macro': 'macro close detail' };
  const LIGHT = {
    auto: '', 'soft-day': 'soft natural daylight', 'golden': 'warm golden-hour light', 'chiaroscuro': 'dramatic chiaroscuro — deep shadows, bright highlights',
    'rim': 'rim / back lighting separating subject from background', 'volumetric': 'volumetric god-rays through the haze', 'high-key': 'bright high-key, low contrast', 'low-key': 'moody low-key, mostly shadow', 'warm-diya': 'warm diya / lamp glow'
  };
  const MOOD = { auto: '', calm: 'calm and quiet', tense: 'tense and suspenseful', mysterious: 'mysterious and uncertain', joyful: 'warm and joyful', melancholic: 'melancholic and reflective', epic: 'epic and awe-struck' };
  // combined "looks" (spec: Cinematography & Lighting presets, reused from Look Dev intent)
  const LOOKS = {
    auto: null,
    'noir-mystery':   { shot: 'close-up', lens: '85mm', lighting: 'chiaroscuro', mood: 'mysterious' },
    'epic-reveal':    { shot: 'wide',     lens: '24mm', lighting: 'volumetric',  mood: 'epic' },
    'tender-moment':  { shot: 'close-up', lens: '85mm', lighting: 'golden',      mood: 'joyful' },
    'storm-tension':  { shot: 'dutch',    lens: '35mm', lighting: 'low-key',     mood: 'tense' },
    'lamp-lit-night': { shot: 'medium',   lens: '50mm', lighting: 'warm-diya',   mood: 'calm' }
  };

  // ---- the prompt block ----
  function buildBlock() {
    if (!S.on) return '';
    let shot = S.shot, lens = S.lens, lighting = S.lighting, mood = S.mood;
    const lk = LOOKS[S.look];
    if (lk) { if (shot === 'auto') shot = lk.shot; if (lens === 'auto') lens = lk.lens; if (lighting === 'auto') lighting = lk.lighting; if (mood === 'auto') mood = lk.mood; }
    const cam = [];
    if (SHOT[shot]) cam.push('Shot: ' + SHOT[shot]);
    if (LENS[lens]) cam.push('Lens: ' + LENS[lens]);
    if (LIGHT[lighting]) cam.push('Lighting: ' + LIGHT[lighting]);
    if (MOOD[mood]) cam.push('Mood: ' + MOOD[mood]);
    const ex = EXAG[S.exaggeration] || EXAG.moderate;
    const out = [];
    out.push('🎬 CINEMATOGRAPHY & ACTING DIRECTION (apply as overall direction; let individual panels vary naturally within it):');
    if (cam.length) out.push(cam.map(c => '  • ' + c).join('\n'));
    out.push('  • Acting / exaggeration (' + ex.v.toFixed(2) + '): ' + ex.txt);
    return out.join('\n');
  }

  // ---- scope: only comic / studio / generic-magazine (KBS). Never diary/creature ----
  function visible(id) { const e = document.getElementById(id); return !!(e && e.offsetParent !== null); }
  function currentScope() {
    if (visible('viewComic')) return 'comic';
    if (visible('viewStudio')) return 'studio';
    if (visible('viewMagazine')) { return visible('magViewKBS') ? 'magazine' : null; }
    return null;
  }

  // ---- the hook generateImage calls ----
  function apply(prompt, opts) {
    try {
      if (opts && opts.skipCinematics) return prompt;
      if (!S.on) return prompt;
      if (!currentScope()) return prompt;            // skip diary/creature/other tabs
      const b = buildBlock();
      if (!b) return prompt;
      if (String(prompt || '').includes('CINEMATOGRAPHY & ACTING DIRECTION')) return prompt; // no double-inject on retries
      return (prompt || '') + '\n\n' + b;
    } catch (e) { return prompt; }
  }

  // ---- UI ----
  function sel(id, label, map, val) {
    const opts = Object.keys(map).map(k => `<option value="${k}"${k === val ? ' selected' : ''}>${k === 'auto' ? 'auto' : k}</option>`).join('');
    return `<label style="display:flex;flex-direction:column;gap:2px;font-size:10px;color:var(--ash);">${label}<select data-cine="${id}" style="font-size:11px;padding:3px 4px;">${opts}</select></label>`;
  }
  function panel(scope) {
    const wrap = document.createElement('div');
    wrap.className = 'kb-cine-panel';
    wrap.dataset.cineScope = scope;
    wrap.style.cssText = 'border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin:10px 0;background:var(--paper-2,rgba(255,255,255,.03));';
    wrap.innerHTML =
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
         <strong style="font-size:12px;">🎬 Cinematic + Acting Engine</strong>
         <label style="margin-left:auto;font-size:11px;display:flex;align-items:center;gap:5px;cursor:pointer;">
           <input type="checkbox" data-cine="on"${S.on ? ' checked' : ''}> apply to every page
         </label>
       </div>
       <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
         ${sel('look', 'Look preset', LOOKS, S.look)}
         ${sel('shot', 'Shot', SHOT, S.shot)}
         ${sel('lens', 'Lens', LENS, S.lens)}
         ${sel('lighting', 'Lighting', LIGHT, S.lighting)}
         ${sel('mood', 'Mood', MOOD, S.mood)}
         ${sel('exaggeration', 'Exaggeration', EXAG, S.exaggeration)}
       </div>
       <div data-cine="preview" style="margin-top:8px;font-size:10px;color:var(--ash);white-space:pre-wrap;line-height:1.35;max-height:64px;overflow:auto;"></div>`;
    wrap.querySelectorAll('[data-cine]').forEach(el => {
      const k = el.getAttribute('data-cine');
      if (k === 'on') el.addEventListener('change', () => { S.on = el.checked; save(S); syncAll(); });
      else if (el.tagName === 'SELECT') el.addEventListener('change', () => { S[k] = el.value; save(S); syncAll(); });
    });
    refreshPreview(wrap);
    return wrap;
  }
  function refreshPreview(wrap) { const p = wrap.querySelector('[data-cine="preview"]'); if (p) p.textContent = S.on ? (buildBlock() || '(all auto — minimal direction)') : '(engine off)'; }
  function syncAll() {
    document.querySelectorAll('.kb-cine-panel').forEach(w => {
      w.querySelectorAll('select[data-cine]').forEach(s => { const k = s.getAttribute('data-cine'); if (S[k] != null) s.value = S[k]; });
      const on = w.querySelector('[data-cine="on"]'); if (on) on.checked = S.on;
      refreshPreview(w);
    });
  }
  function mountInto(containerId, anchorId) {
    const c = document.getElementById(containerId);
    if (!c) return;
    if (c.querySelector(':scope > .kb-cine-panel')) return; // already mounted
    const p = panel(containerId);
    const anchor = anchorId ? document.getElementById(anchorId) : null;
    if (anchor && anchor.parentNode === c) c.insertBefore(p, anchor);
    else c.insertBefore(p, c.firstChild);
  }
  function mountAll() {
    mountInto('viewComic', 'comicGenerateMainBtn');
    mountInto('magViewKBS', null);
  }

  // expose
  window.KBCinematics = { apply, buildBlock, mount: mountAll, _state: () => S };

  // mount on load + when tabs switch (views toggle display)
  function tick() { try { mountAll(); } catch (e) {} }
  if (document.readyState !== 'loading') setTimeout(tick, 600); else document.addEventListener('DOMContentLoaded', () => setTimeout(tick, 600));
  document.addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('[data-view],[onclick*="setView"]')) setTimeout(tick, 250); }, true);
  setInterval(tick, 2500); // safety: ensure panels exist after dynamic re-renders
})();
