/* Kibookal — Active Typography lock UI (additive).
   The render path (app.js _kbsMaybeInjectActiveStyle) injects the active typography
   system into EVERY comic + magazine generation. This module just gives the user a
   working picker: it revives the comic typography selector (comicKrTypo) and adds one
   to the Magazine. Picking a typography sets the global active typo (localStorage),
   exactly like the active-style picker. */
(function () {
  'use strict';
  let VAULT = null;
  async function loadVault() {
    if (VAULT) return VAULT;
    try { const r = await fetch('refs/kibookal_typography_vault.json'); const j = await r.json(); VAULT = j.typography_systems || []; }
    catch (e) { VAULT = []; }
    return VAULT;
  }
  const tid = t => t['Typography System ID'] || t.id || '';
  const tname = t => t['Name'] || '';
  const tcat = t => t['Category'] || '';
  const active = () => (window.kbsGetActiveTypoId ? kbsGetActiveTypoId() : localStorage.getItem('kibookal_active_typo_id_v1')) || '';
  function setActive(id) {
    if (window.kbsSetActiveTypoId) kbsSetActiveTypoId(id);
    else { if (id) localStorage.setItem('kibookal_active_typo_id_v1', id); else localStorage.removeItem('kibookal_active_typo_id_v1'); }
    reflect();
    if (window.toast) toast(id ? ('Typography set: ' + id + ' — applied to every render') : 'Typography cleared', 'info');
  }
  function reflect() { const a = active(); document.querySelectorAll('.kbTypoSelect').forEach(s => { if (s.value !== a) s.value = a; }); }

  // 1) Revive the comic typography selector so it actually applies.
  function wireComic() {
    const s = document.getElementById('comicKrTypo');
    if (!s || s.dataset.kbTypoWired) return;
    s.dataset.kbTypoWired = '1'; s.classList.add('kbTypoSelect');
    if (![...s.options].some(o => o.value === '')) s.insertBefore(new Option('— typography: none —', ''), s.firstChild);
    const a = active(); if (a && [...s.options].some(o => o.value === a)) s.value = a;
    s.addEventListener('change', () => setActive(s.value));
  }
  // 2) Add a typography picker to the Magazine (Generic) view.
  async function wireMagazine() {
    const host = document.getElementById('magViewGeneric');
    if (!host || document.getElementById('magTypoSelect')) return;
    const v = await loadVault(); if (!v.length) return;
    const anchorField = document.getElementById('magAge') || document.getElementById('magPages');
    const anchor = anchorField ? (anchorField.closest('div') || host.firstElementChild) : host.firstElementChild;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin:8px 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;';
    wrap.innerHTML = '<label style="font-size:12px;font-weight:700;opacity:.85;">🔤 Typography</label>';
    const sel = document.createElement('select');
    sel.id = 'magTypoSelect'; sel.className = 'kbTypoSelect';
    sel.style.cssText = 'flex:1;min-width:220px;padding:5px 8px;border:1px solid var(--line,#ccc);border-radius:6px;';
    sel.innerHTML = '<option value="">— typography: none —</option>' +
      v.map(t => `<option value="${tid(t)}">${tid(t)} — ${tname(t)} (${tcat(t)})</option>`).join('');
    const a = active(); if (a) sel.value = a;
    sel.addEventListener('change', () => setActive(sel.value));
    wrap.appendChild(sel);
    const hint = document.createElement('span');
    hint.style.cssText = 'font-size:11px;opacity:.6;'; hint.textContent = 'applied to every page render';
    wrap.appendChild(hint);
    (anchor && anchor.parentElement ? anchor.parentElement : host).insertBefore(wrap, anchor ? anchor.nextSibling : null);
  }
  function tick() { try { wireComic(); } catch (e) {} try { wireMagazine(); } catch (e) {} reflect(); }
  document.addEventListener('DOMContentLoaded', () => { loadVault().then(() => { tick(); setTimeout(tick, 1500); setTimeout(tick, 3500); }); });
  document.addEventListener('click', e => { const t = e.target; if (t && /mag|comic|nav|view/i.test((t.id || '') + ' ' + (t.className || ''))) setTimeout(tick, 400); });
  window.KBTypo = { tick, setActive, active, loadVault };
})();
