# Debug System

## Layers

1. **Capture** — every frontend + backend + DB + generation error is logged to file + DB.
2. **Promote** — repeated or severe errors get promoted to a tracked **Issue** with a stable code.
3. **Fix** — each fix produces a **Repair Receipt** (markdown) documenting root cause + change.
4. **Verify** — `npm run health` + `npm run debug:check` confirm system state.

## Where errors live

- **File:** `debug/logs/<source>-errors.log` — append-only, one line per error
- **Database:** `error_logs` table — searchable, statuses, project links

## Capturing errors

### Backend (automatic)
Every Express route is wrapped by `debugMiddleware`. Throw an error, it gets logged. Process-level handlers catch uncaught exceptions and unhandled rejections.

### Frontend (automatic when `frontendErrorCapture.js` is loaded)
```html
<script src="src/debug/frontendErrorCapture.js"></script>
```
Captures `error` and `unhandledrejection` events → POSTs to `/api/debug/errors`.

### Manual
```js
fetch('/api/debug/errors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ source: 'frontend', severity: 'warn', error_type: 'CustomCheck', message: '...' })
});
```

## Promoting an error to an issue

```bash
curl -X POST http://localhost:3001/api/debug/issues \
  -H 'Content-Type: application/json' \
  -d '{"title":"Sheet fails on empty refs","severity":"high","source":"backend","description":"..."}'
```

Issue gets a stable code `ISSUE-YYYYMMDD-NNN`, plus a markdown file in `debug/issues/open/`.

## Resolving an issue + writing a repair receipt

```bash
curl -X POST http://localhost:3001/api/debug/receipts \
  -H 'Content-Type: application/json' \
  -d '{"issue_code":"ISSUE-20260604-001","root_cause":"...","files_changed":["..."],"changes_made":"...","tests_run":"npm run health","result":"resolved"}'

# Then mark issue resolved:
curl -X PATCH http://localhost:3001/api/debug/issues/ISSUE-20260604-001 \
  -d '{"status":"resolved","fix_summary":"..."}'
```

The issue's markdown file moves from `debug/issues/open/` → `debug/issues/resolved/`. The receipt is written to `debug/receipts/repair-receipts/<code>_repair-receipt.md`.

## Debug Center UI

Future page at `/pages/debug-center/` will surface:
- Open issues count + list
- Resolved issues table
- Recent errors stream
- Repair receipts library
- System health summary
- Database health
- Storage health

For now, all data is accessible via API.

## Health check

```bash
npm run health         # checks all folders + DB + writable permissions
npm run debug:check    # scans logs + open issues
npm run debug:report   # generates a markdown debug report
npm run debug:repair   # SAFE-by-default scan; creates "skip" receipts, never auto-modifies code
```

## Safety rules

- `npm run debug:repair` **never** modifies code without explicit pattern match. Default behavior is to produce a "manual review required" receipt for each open issue.
- Repair receipts include `result: pending | resolved | partial | failed`.
- Failed issues move to `debug/issues/failed/` — not silently deleted.
- All snapshots before any auto-fix go to `debug/snapshots/before-fix/`.
