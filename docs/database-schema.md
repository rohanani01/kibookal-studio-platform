# Database Schema

Single SQLite file at `database/studio.sqlite`. Defined in `backend/src/db/schema.sql`.

## Tables

### projects
Root record per project. `slug` is unique. `metadata_json` for arbitrary blobs.

### characters / character_versions
Characters can belong to a project OR live in the vault (project_id NULL). `character_versions` keeps every revision of identity JSON + sheet image.

### prompts
Every saved prompt — has a `prompt_type` (page, panel, character, style, etc.) and a `version` counter.

### generations
A generation request — links prompt → model → output folder. Status: `pending` / `running` / `succeeded` / `failed`.

### renders
A concrete rendered file. Multiple renders per generation when retries / variants happen. Status: `draft` / `approved` / `rejected`.

### exports
PDFs / ZIPs / shot lists. Each export gets its own row with file path + metadata.

### reference_assets / style_assets
Reusable images + extracted style JSONs. Linked to projects OR vault.

### settings
Global key/value store for studio configuration.

### activity_logs
Append-only audit trail of every project / generation / export action.

### error_logs
Every runtime error from frontend or backend. Source, severity, route, stack trace, status.

### debug_issues
Promoted errors — get a stable code `ISSUE-YYYYMMDD-NNN` and a lifecycle (open / investigating / resolved / failed).

### repair_receipts
Markdown + DB record of every fix attempt — root cause, files changed, changes made, tests run, result.

## Relationships

- project ← character (many)
- character ← character_version (many)
- project ← prompt (many)
- project ← generation (many)
- generation ← render (many)
- project ← export (many)
- error_log → debug_issue (1:1, optional)
- debug_issue → repair_receipt (1:many)
