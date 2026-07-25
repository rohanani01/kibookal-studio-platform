# Generation Workflow

## 1 — Create project

`POST /api/projects` (or `npm run create:project -- "Title" comic-book`)

Creates:
- DB row in `projects`
- `storage/projects/<type>/<slug>/` folder tree
- `project.json` inside the folder

## 2 — Add references + style + characters

- `POST /api/vault/references`, `/api/vault/styles`, `/api/characters`
- Files saved under `storage/vault/<vault-type>/<slug>/`
- DB rows in `reference_assets`, `style_assets`, `characters`

## 3 — Save prompts

`POST /api/prompts` with `{ project_id, prompt_type, prompt_text }`
- DB row in `prompts` with auto-incremented `version`

## 4 — Trigger generation

`POST /api/projects/:id/generations` with `{ prompt_id, model, settings }`
- DB row in `generations` (status `pending` → `running`)
- Output folder: `storage/projects/<type>/<slug>/renders/drafts/`

## 5 — Save renders

`POST /api/renders` per output file
- File saved with `_v00N.png` versioning
- Status starts as `draft`

## 6 — Approve / reject

`PATCH /api/renders/:id/status` with `{ status: 'approved' }` (or 'rejected')
- File **moves** to `renders/approved/` or `renders/rejected/` — never deleted
- DB row updated, `project.json` history appended

## 7 — Export

`POST /api/exports` with `{ project_id, export_type: 'pdf'|'zip'|'shot-list' }`
- Output written to `outputs/<exports|pdfs|zips>/`
- DB row in `exports`

## Versioning rules

- Every render is `v001`, `v002`, etc. — never overwritten
- `current_version` on `projects` row tracks "current production version"
- All historical files preserved under `versions/v00N/`
- Approved file in `renders/approved/` is always the latest accepted

## File flow diagram

```
prompt.txt
   │
   ▼
generation (DB row, status: running)
   │
   ▼
renders/drafts/spread-001_draft_v001.png   (initial)
   │  approve
   ▼
renders/approved/spread-001_approved_v001.png
   │  re-render later
   ▼
renders/approved/spread-001_approved_v002.png  (old v001 stays in /versions)
```
