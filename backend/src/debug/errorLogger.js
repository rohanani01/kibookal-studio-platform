/* Error logger — writes to both SQLite (error_logs table) and append-only log file.
   Returns the inserted row ID so callers can correlate. Safe-by-default: NEVER
   throws back to the caller. */

const fs = require('fs');
const path = require('path');
const { DEBUG_LOGS } = require('../config/paths');
const { getDB } = require('../db/connection');

function logFor(source) {
  const file = {
    backend: 'backend-errors.log',
    frontend: 'frontend-errors.log',
    database: 'database-errors.log',
    generation: 'generation-errors.log',
    api: 'api-errors.log'
  }[source] || 'backend-errors.log';
  fs.mkdirSync(DEBUG_LOGS, { recursive: true });
  return path.join(DEBUG_LOGS, file);
}

function logError(entry) {
  const safeEntry = {
    source: entry.source || 'backend',
    severity: entry.severity || 'error',
    error_type: entry.error_type || 'Unknown',
    message: entry.message || '',
    stack_trace: entry.stack_trace || null,
    route: entry.route || null,
    file_path: entry.file_path || null,
    project_id: entry.project_id || null,
    generation_id: entry.generation_id || null,
    metadata_json: JSON.stringify(entry.metadata || {})
  };

  // Append to log file
  try {
    const line = `[${new Date().toISOString()}] [${safeEntry.severity.toUpperCase()}] ${safeEntry.error_type}: ${safeEntry.message}${safeEntry.route ? ' · route=' + safeEntry.route : ''}\n${safeEntry.stack_trace ? safeEntry.stack_trace + '\n' : ''}\n`;
    fs.appendFileSync(logFor(safeEntry.source), line, 'utf8');
  } catch (e) {
    // Logging itself failed — last resort to stderr
    console.error('[errorLogger] file append failed:', e.message);
  }

  // Insert into DB
  try {
    const db = getDB();
    if (db) {
      const stmt = db.prepare(`INSERT INTO error_logs
        (source, severity, error_type, message, stack_trace, route, file_path, project_id, generation_id, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const info = stmt.run(
        safeEntry.source, safeEntry.severity, safeEntry.error_type, safeEntry.message,
        safeEntry.stack_trace, safeEntry.route, safeEntry.file_path,
        safeEntry.project_id, safeEntry.generation_id, safeEntry.metadata_json
      );
      return info.lastInsertRowid;
    }
  } catch (e) {
    console.error('[errorLogger] DB insert failed:', e.message);
  }
  return null;
}

function recentErrors(limit = 50) {
  const db = getDB();
  if (!db) return [];
  try {
    return db.prepare('SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  } catch { return []; }
}

module.exports = { logError, recentErrors };
