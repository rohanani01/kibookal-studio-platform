# Kibookal Studio — Pre-Launch Checklist

Status as of 2026-06-19. ✅ done · 🟡 partial · 🔴 to-do.

## 0. Launch blockers (must clear before any user touches it)
- 🔴 **API keys / security** — studio calls fal + Anthropic directly from the browser with keys in localStorage. Fine for each-artist-own-key local use; **a shared/hosted URL needs a backend key-proxy** (keys server-side) or keys leak + cost runs wild.
- 🔴 **Freeze a stable build** — tag a known-good version for the team; keep developing on a separate copy so live work doesn't break mid-task.
- 🟡 **Decide run mode** — (A) each artist runs locally with own key (ready now) vs (B) one hosted URL (needs proxy + login). Pick one.
- 🟡 **Global error handling** — make sure a failed render/section never hard-crashes the page; show a clear message + retry.

## 1. The big quality lever (highest impact)
- 🔴 **Editable Typography Overlay Engine** — the #1 thing separating "good" from "publishing-grade". AI makes art with blank text zones (already enforced in PageForge); add a real **editable vector-text layer** over the zone-map so final copy is crisp, correctable, multilingual (Devanagari). Without it, final text is the weakest part.

## 2. Four-Pillar systems
- ✅ **Style Vault** — 41 locked styles.
- ✅ **Layout Vault** — 50 comic + 50 magazine, precise zone-maps, studio-loadable; **PageForge picker live**.
- ✅ **Typography Vault** — 20 systems; each layout bound to its own + swappable.
- 🟡 **Character Vault** — bibles + clean figure-crop refs work (Ekta/Kali/Devi/Raktabija). 🔴 Formalize per-character JSON (turnarounds, do-not-change rules, approved refs) + a character picker.
- 🔴 **QC scoring dashboard** — character/style/layout/typography/print scores per page + gates (70/80/90/95). Today QC is manual (me eyeballing).
- 🔴 **Auto-repair** — on a failed pillar, regenerate only that layer, not the whole page.

## 3. Per-section sweep (test every tab end-to-end before launch)
- 🟡 Studio · Characters · Story · Comic · Magazine (+ Diary) · Style Lock · 🧩 Trigun Kit · 📐 PageForge · 🎨 Style Convert (Batch) · Library · Compose · Upscale · 3D Lab · Animate · Look Dev · Memory · Gallery.
- 🔴 For each: loads without console errors, controls work, a test render succeeds, results push to gallery. (PageForge, Style Convert, Trigun, Diary, Style Lock verified; the rest need a pass.)
- 🔴 **JSON integrity check** — validate every config the studio loads (engine, layouts, layout_vault, typography_vault, trigun, style_locks) on startup; fail gracefully if one is bad.

## 4. Consistency & content
- ✅ Style transfer pipeline (proven across 9 styles, 144 pages).
- 🟡 **Character consistency** — strong but not pixel-perfect; document the "clean figure-crop ref" trick as the standard workflow for artists.
- 🔴 **Sample library** — ship 2–3 finished example books (e.g., the Kali book, a Trigun sample) so artists see the target quality + as templates.

## 5. Export & print
- ✅ A5 300-DPI fit + PDF assembly.
- 🔴 **Print-safety checker** — trim/bleed/margins/min text size/contrast before export.
- 🔴 **Layered export** — art layer + editable text layer + layout JSON + QC report per page (ties to the typography engine).

## 6. Ops & team enablement
- 🔴 **One-click launcher + setup guide** — package START-EVERYTHING.bat + a 1-page "how to use" for non-technical artists (keys, where to click, how to save).
- 🟡 **Gallery** — auto-files by section/style/version ✅; 🔴 confirm it runs reliably on each machine + add a simple backup of the gallery folder.
- 🔴 **Cost/usage view** — per-render ≈ $0.15; show a running spend so Finance has visibility.
- 🔴 **Presets** — save Character + Style + Layout + Typography as a reusable production preset.

## 7. Nice-to-have (post-launch)
- Style+Layout compatibility checker · Page Bible per book · Continuity timeline · Reference-lock mode · Variation control (same layout/diff character, etc.) · Layout preview sheets per style.

---
### Recommended path for "go live tomorrow"
1. Clear **§0 blockers** (keys decision + freeze build).
2. Do the **§3 per-section sweep** + JSON integrity check (catch breakage).
3. Ship **§4 sample books** + **§6 setup guide** so the team can start.
4. Schedule the **§1 typography overlay** as the immediate post-launch build (biggest quality jump).
Everything else is iterative once artists are creating.
