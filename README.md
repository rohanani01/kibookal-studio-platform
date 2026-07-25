# Kibookal Studio — Platform

A world-class GenAI production platform for generating comic books, character bibles, image sets, and video stories — with persistent project memory, full versioning, and a built-in debug/repair system.

## What it is

- **Frontend** — the working browser studio (HTML/CSS/JS, no framework required to run) at `/frontend`
- **Backend** — Node.js + Express API that persists projects, characters, prompts, renders, exports, and debug records to a local SQLite database + on-disk storage tree
- **Database** — local SQLite (`/database/studio.sqlite`)
- **Storage** — versioned project + vault folders (`/storage`)
- **Outputs** — PDF / ZIP / render exports (`/outputs`)
- **Debug** — error logs, open/resolved issues, repair receipts (`/debug`)

The frontend works standalone (just open `frontend/index.html` via any static server) — backend persistence is additive and optional.

## Quick start

### Windows (easiest)
Double-click these two files in order:
1. **`setup.bat`** — installs everything + initialises the database (run once)
2. **`start.bat`** — starts both backend and frontend in separate windows, opens browser

### Mac / Linux / manual
Run each command on its own line (no inline comments — they confuse some shells):

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run health
npm run backend
# (in a separate terminal):
npm run frontend
```

Then open `http://localhost:8770` in your browser.

## All dependencies install locally only

The included `.npmrc` ensures every package installs into `./node_modules` inside this folder — nothing global. The total size is roughly **30-50 MB** of `node_modules` for the full stack.

## Folder structure

```
/frontend         The studio UI (legacy working files preserved in src/scripts_legacy + src/styles_legacy)
/backend          Express API + services + DB layer
/database         SQLite file + migrations + seed
/storage          /projects + /vault folders (auto-created per project/character)
/outputs          PDFs, ZIPs, render exports
/debug            Error logs, open/resolved issues, repair receipts
/docs             Architecture, schema, naming, debug system, generation workflow
/scripts          health-check, create-project, export, backup-db, debug commands
/backup           Backups of the original working studio (untouched reference)
```

## Repository contents (what git tracks)

This repo holds **source code only** (~6 MB). To stay lean and within GitHub's
file-size limits, these heavy binary assets are intentionally **not tracked**
(see `.gitignore`) — they remain on the working machine and are served/regenerated
at runtime:

- `frontend/refs/` — reference-image library (~535 MB)
- `kibookal-gallery/` — bundled gallery archive (~964 MB, incl. a 259 MB zip that
  exceeds GitHub's 100 MB per-file limit). The gallery has its own repo:
  **[kibookal-gallery](https://github.com/rohanani01/kibookal-gallery)**
- `outputs/`, `storage/`, `backup/`, `database/*.sqlite`, `.env` — runtime data & secrets

To version the excluded images too, use **Git LFS** or attach them as a GitHub
release asset.

## Existing studio preserved

The original working studio at `C:\Users\Admin\Desktop\new work on html\studio` is **completely untouched**. This platform mirrors it into `frontend/` so refactoring can proceed safely without ever risking the production-ready studio.

## Documentation

Full developer docs in `/docs`:
- `architecture.md` — frontend / backend / database / storage / debug architectures
- `setup.md` — install + run + first-project walkthrough
- `developer-guide.md` — how to add pages, components, API routes, DB tables, generation types
- `database-schema.md` — every table, every field, every relationship
- `naming-conventions.md` — files, folders, versions, renders, receipts
- `generation-workflow.md` — project → prompt → render → version → approval → export
- `debug-system.md` — error capture, issue tracking, repair receipts, health checks

## Key features

- **Project memory** — every project has a `project.json` + folder tree + DB record
- **Versioning** — every render is `v001`, `v002`, etc. — old versions never overwritten
- **Character Vault** — 150-field identity bibles per character, reusable across projects
- **Style Vault** — extracted style JSONs, reusable across projects
- **Prompt Vault** — saved prompts with version history
- **Reference Vault** — image references with metadata
- **Debug Center** — frontend page + backend API for inspecting errors, issues, repair receipts
- **Repair receipts** — every fix generates a markdown receipt explaining root cause + change

## Health check

```bash
npm run health
```

Verifies: backend port, SQLite connection, storage folders exist + writable, debug folders exist, frontend present.

## Debug commands

```bash
npm run debug:check    # scan logs + issues + folders, report problems
npm run debug:report   # generate a full markdown debug report
npm run debug:repair   # attempt safe repairs from open issues (with repair receipts)
```

## License

Private — Buzzi Ventures / Kibookal Studio. All rights reserved.
