# Naming Conventions

## Files

- Comic renders: `spread-001_draft_v001.png`, `spread-001_approved_v003.png`, `spread-001_rejected_v002.png`
- Character sheets: `<character-name>_sheet_v001.png`, `<character-name>_pose-001_v001.png`
- PDFs: `<comic-name>_final_v001.pdf`, `<comic-name>_preview_v001.pdf`
- Prompts: `prompt_spread-001_v001.txt`, `prompt_<character>_v001.txt`
- Receipts: `ISSUE-YYYYMMDD-NNN_repair-receipt.md`
- Debug reports: `debug-report_YYYY-MM-DD_HH-MM.md`

## Folders

- Projects: `storage/projects/<type>/<slug>/` — slug from `slugify(title)`
- Vault: `storage/vault/<vault-type>/<slug>/`

## Versions

- `v001`, `v002`, ... — zero-padded to 3 digits
- Never overwrite an existing file — bump version
- Drafts in `/drafts`, approved in `/approved`, rejected in `/rejected`

## Issue codes

`ISSUE-YYYYMMDD-NNN` — date-stamped, daily counter.

## Render statuses

- `draft` — initial render, awaiting review
- `approved` — accepted, locked
- `rejected` — failed QC, kept for reference
- `pending` / `running` / `succeeded` / `failed` — for generations (the parent)
