# Architecture

## Layers

```
┌──────────────────────────────────────────────────────┐
│  FRONTEND (HTML/CSS/JS, no framework required)       │
│  - frontend/index.html — single-page studio          │
│  - src/styles_legacy  + src/scripts_legacy            │
│  - src/services       — API client + per-resource    │
│  - src/debug          — frontend error capture        │
└──────────────────────────────────────────────────────┘
         │   HTTP (fetch) via /api
         ▼
┌──────────────────────────────────────────────────────┐
│  BACKEND (Node.js + Express, port 3001)              │
│  - backend/src/server.js — entry                     │
│  - routes/  — REST endpoints                         │
│  - services/ — business logic                        │
│  - debug/   — error logger, issue tracker, receipts   │
│  - db/      — SQLite connection + migrations          │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  STORAGE LAYER                                       │
│  - database/studio.sqlite — metadata, projects,      │
│    characters, prompts, renders, exports, errors      │
│  - storage/projects/<type>/<slug>/ — per-project tree │
│  - storage/vault/<vault>/<slug>/ — reusable assets    │
│  - outputs/ — exports (PDF / ZIP / renders)           │
│  - debug/ — logs, issues, receipts, reports           │
└──────────────────────────────────────────────────────┘
```

## Frontend architecture

- **Legacy preserved**: existing working studio at `src/styles_legacy/` + `src/scripts_legacy/` — does not depend on the backend
- **Services layer**: small fetch wrappers in `src/services/` — opt-in API integration
- **Debug capture**: `src/debug/frontendErrorCapture.js` POSTs runtime errors to `/api/debug/errors`
- **No framework lock-in**: pure HTML/CSS/JS; future React/Vue migration is possible per-page

## Backend architecture

- **Express** server with route modules
- **SQLite** via `better-sqlite3` (synchronous, zero-config, single file)
- **better-sqlite3** is optional — if not installed, backend still boots; DB-backed routes degrade gracefully
- **Debug middleware** logs every error to file + DB
- **Process-level handlers** catch uncaught exceptions and unhandled rejections

## Database architecture

13 tables — see `database-schema.md` for full reference. Every render, prompt, character, export, error, issue, and repair receipt has its own table with timestamps + JSON metadata column.

## Storage architecture

Every project type has its own folder template. See `generation-workflow.md` for the layout.

## Debug architecture

Every error → file log + DB row. Promotable to a tracked issue with a stable code. Every fix → markdown repair receipt + DB row. See `debug-system.md`.
