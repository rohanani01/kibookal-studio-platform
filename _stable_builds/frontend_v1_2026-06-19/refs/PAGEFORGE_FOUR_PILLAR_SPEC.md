# Kibookal PageForge Engine — Four-Pillar Production Lock

The production system behind Kibookal Studio. Goal: **professional, consistent, print-ready
comic & magazine pages** — not random AI images. Every page is forged from four locked pillars.

## The Four Pillars
| # | Pillar | Vault | Status |
|---|--------|-------|--------|
| 1 | **Character Consistency** | Character Vault (per-character JSON: face, hair, costume, colours, turnarounds, do-not-change rules, refs) | Partial — character bibles + clean figure-crop refs in use (e.g. Trigun `ekta_fig`, Kali/Devi/Raktabija locks). Formal per-character JSON vault = next. |
| 2 | **Style Consistency** | Style Vault — `kibookal_engine_v2_31styles.json` | **Live — 41 locked styles** (each: medium/linework/palette/texture/finish + prompt_core + negatives + refs). |
| 3 | **Layout Accuracy** | Layout Vault — `kibookal_layout_vault.json` (+ `.xlsx`) | **Live — 50 comic + 50 magazine** layouts, each with a precise zone-map (panels, text/typography zones, safe-margin, gutter, border, aspect, reading-flow). |
| 4 | **Typography & Text** | Typography Vault — `kibookal_typography_vault.json` | **Live — 20 systems** (10 comic + 10 magazine): display/heading/body/caption/SFX rules per layout. |

## The non-negotiable rule
**AI generates artwork; the studio sets final text.** Image models render the illustration with
**blank/placeholder text zones**; final typography is added as **clean, editable, vector text** in
the layout layer. No AI-gibberish text in final books.

## Page generation pipeline (PageForge)
1. Pick project type (comic / magazine / activity / cover / character-sheet).
2. Load **Character lock** (JSON + approved refs).
3. Load **Style lock** (one of 41).
4. Load **Layout lock** (a vault ID → its zone-map).
5. Load **Typography system** (matched to the layout).
6. Build the **page blueprint** from the layout's zone-map (panels, art zones, text zones, safe margins).
7. Generate the **artwork layer only** — blank text zones.
8. Add the **typography layer** — editable vector text in the reserved zones.
9. Run **Four-Pillar QC** (scores below).
10. Export: print-ready page + image layer + text layer + layout JSON + QC report.

## QC scoring (target gates)
Character /100 · Style /100 · Layout /100 · Typography /100 · Print-readiness /100 · Story-continuity /100
Gates: Draft 70+ · Internal 80+ · Client 90+ · Print-ready 95+. On a failed pillar, fix **only that layer** (auto-repair), not the whole page.

## Layout zone-map schema (each vault entry)
`aspect_ratio · safe_margin · gutter · border_rule · reading_flow · panel_count ·
panels[{id,kind,x,y,w,h}] · typography_zones[{id,role,x,y,w,h}]` — all coords normalized 0–1.
Plus the descriptive fields: name, type, best-for, architecture, typography system, display/heading/body/caption/SFX type, placement rules, art inspiration, best style pairing, generation prompt, negative prompt, QC checklist, tags.

## Recommended folder structure (target)
```
/vaults  /characters /styles /layouts(/comic /magazine) /typography /props /environments /palettes
/projects  /comic_books /magazines /activity_books
/outputs  /drafts /review /approved /print_ready
/qc_reports   /exports(/png /pdf /editable /json)
```

## Best extra tools to add (roadmap, priority order)
1. **Typography Overlay Engine** — editable vector text over blank zones (biggest quality lever).
2. **Layout Vault picker** in Studio (choose a vault ID → blueprint preview).
3. **Style + Layout compatibility checker** (warn on mismatches before generating).
4. **Approved presets** (Character + Style + Layout + Typography saved as one production preset).
5. **Auto-repair** (regenerate only the failed pillar/layer).
6. **Character Vault JSON** (formalize Pillar 1) + continuity timeline.
7. **Print-safety checker** (trim/bleed/margin/contrast/min text size).
8. **Page Bible** per book (page-by-page: chars, location, emotion, layout, style, typography, props, continuity).

## What is LIVE today vs roadmap
- **Live:** 41 Style locks · 100 Layout blueprints (precise zone-maps) · 20 Typography systems ·
  Style Convert tool · per-style book rendering with character refs · A5 300-DPI export · gallery auto-filing.
- **Roadmap:** formal Character Vault JSON · the editable typography overlay engine · the in-Studio PageForge
  picker + QC dashboard · auto-repair. (These make it a full publishing pipeline; build post-launch.)

*One-line daily command:* "Create this page with the Four-Pillar lock — selected character JSON + style JSON
+ layout ID + typography system; keep characters 100% consistent, no style drift, follow the layout zone-map
exactly, keep all typography clean & editable, run QC before output."
