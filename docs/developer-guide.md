# Developer Guide

## Adding an API route

1. Create `backend/src/routes/<name>Routes.js`
2. Export an Express router with your endpoints
3. Mount it in `backend/src/server.js`:
   ```js
   app.use('/api/<name>', require('./routes/<name>Routes'));
   ```

## Adding a database table

1. Append a `CREATE TABLE IF NOT EXISTS ...` block to `backend/src/db/schema.sql`
2. Run `npm run db:migrate`
3. Use `getDB()` from `backend/src/db/connection.js` in any service

## Adding a service

Drop a file in `backend/src/services/<name>Service.js` and import it from your route. Services should be pure (no Express objects).

## Adding a frontend page

1. Create `frontend/src/pages/<name>/index.html` (or a folder of components)
2. Add a link to it from the main studio navigation
3. Talk to the backend via `frontend/src/services/<resource>Service.js`

## Adding a generation type

1. Add to `FOLDER_TEMPLATES` in `backend/src/services/projectService.js`
2. Add to `TYPE_TO_PARENT` mapping
3. Optionally add a dedicated service file for the type's pipeline

## Reading logs

```bash
tail -f debug/logs/backend-errors.log
tail -f debug/logs/frontend-errors.log
```

Or via API: `GET /api/debug/errors?limit=50`.

## Creating a repair receipt

```js
const { createReceipt } = require('./backend/src/debug/repairReceipt');
createReceipt({
  issue_code: 'ISSUE-20260604-001',
  title: 'Sheet generation failed on empty refs',
  root_cause: '...',
  files_changed: ['backend/src/services/sheetService.js'],
  changes_made: '...',
  tests_run: 'npm run health',
  result: 'resolved'
});
```
