# Kibookal Studio — Image Generation & Style Consistency

_Last updated: 2026-06-15_

This document explains how Kibookal Studio generates images, the idea behind it, and how we keep **style + character consistent** across a whole book.

---

## 1. The core idea

A Kibookal page is the product of three independent choices the user makes, then a strict render pipeline:

```
🎨 STYLE   (how it looks)   ×   📐 LAYOUT (how the page is arranged)   ×   🖨️ PRINTABLE (page-only, no background)
                                   ↓
                        STYLE DNA + prompt → fal.ai (Nano Banana Pro) → QC → auto-fix → printable page
```

- **Style** — one of 33 locked Kibookal styles (`KBS001`–`KBS033`), each a JSON "style-lock" with a `prompt_core`, `visual_traits`, `style_lock` (medium/linework/palette/texture/finish), built-in reference images, and a `render_directive`.
- **Layout** — one of the page structures (`LAY01` six-layer spread A5+A5 … `LAY06` map page), each with a `structure_block` and a fixed `canvas`.
- **Printable** — a hard rule that the image **is** the page, edge to edge, with no desk/props/mockup/background.

Any style × any layout combine, so the same subject can be rendered many ways.

## 2. Why consistency is hard

Image models drift. The same prompt twice gives two different "hands." Across a 20-page book this reads as a mess. The three failure modes we hit:

1. **Reference/prompt conflict** — if a style's reference images don't match its description, refs fight the prompt. (We found 3 styles — KBS001/002/023 — had cartoon-buffalo refs wrongly attached during a rapid expansion. Fixed 2026-06-15.)
2. **Background / mockup drift** — the model loves to render an "open book on a desk" instead of a flat page.
3. **Page-to-page drift** — line weight, palette and paper change subtly per page.

## 3. How we solve it (the pipeline)

**A. STYLE DNA leads, refs reinforce.**
Every render begins with a locked, deterministic **Style DNA** signature derived from the style-lock (`medium · linework · palette · texture · finish`). This pins the look *textually* so output stays on-style even when reference images are weak. Reference images are secondary reinforcement, never the sole anchor.

**B. Strong prompt_core + render_directive.**
Each style carries a 100-180 word `prompt_core` and a `render_directive` ("render ANY subject INTO this style; never bend the style toward the subject"). This is what lets one style render Durga, Hanuman or a temple bell and still look like one book.

**C. Printable rule (flat, full-bleed).**
A hard rule injected on every render: the artwork fills 100% of the frame, zero border/margin/mockup/desk. Straight-on flat scan.

**D. Consistency directive.**
Every page declares it is "page N of one book — hold the STYLE DNA and palette byte-for-byte identical across every page." The subject changes; the style never does.

**E. QC + auto-fix (Strong Mode).**
After each render, Claude vision scores it: (1) does it match the style refs? (2) is it flat/no-background? Anything that fails is re-rendered with specific fix instructions, and the higher-scoring version is kept. This is how we caught and removed every "3D book mockup on a desk" automatically.

**F. Self-consistency bootstrapping.**
When a style's stock refs are wrong or weak, we promote a *verified-good generated page* to be the new reference. The output becomes the reference — the style converges on its own best result. (Used to repair KBS001/002/023.)

## 4. The 33-style library — audit status (2026-06-15)

A full ref-vs-description audit was run with Claude vision:
- **20 styles** — refs match (good)
- **7 styles** — partial match (acceptable): KBS011, 016, 019, 024, 028, 029, 033
- **3 styles repaired** — KBS001, KBS002, KBS023 had mismatched cartoon-buffalo refs → replaced with verified dossier renders
- Audit saved at `Documents/Kibookal/style_ref_audit.json`

## 5. Worked example — the Nava Durga books

The same 20-page Nava Durga story was rendered two ways to prove the system:
- **Book 1** — `KBS001` style × `LAY02` notebook (single A5) — `Documents/Kibookal/NavaDurga_Book/`
- **Book 2** — `KBS001` style × `LAY01` spread (A5+A5) — `Documents/Kibookal/NavaDurga_Book_Spread/`

Both: one style, one layout each, printable/no-background, QC'd flat. Book 1's QC caught 10 pages with mockup/desk artifacts and auto-fixed them.

## 6. Where it lives in the app

- **🎨 Style Lock** tab — full hub: pick style + layout, subject + story, render, render-all, add custom style.
- **Comic** and **Magazine** — each has its own 🎨 Style + 📐 Layout + 🖨️ Printable picker.
- Engine: `frontend/refs/kibookal_engine_v2_31styles.json` (33 styles) · Layouts: `frontend/refs/kibookal_layouts.json`.
- Every render auto-syncs to the **Gallery** via `gallery-bridge.js`.

## 7. Operating rules for consistent output

1. Pick **one style + one layout** for a whole book. Don't mix.
2. Keep **Strong Mode ON** — it QCs and auto-fixes every page.
3. Keep **Printable ON** for anything you'll print.
4. If a style drifts, **re-research it** (➕ Add → re-research) or promote a good page to its refs.
5. Trust the **Style DNA** — it's the anchor; refs only reinforce.
