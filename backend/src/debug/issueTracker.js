/* Issue tracker — promotes an error_log entry into a tracked issue with a
   stable code, status, and lifecycle (open → investigating → resolved/failed). */

const fs = require('fs');
const path = require('path');
const { getDB } = require('../db/connection');
const { DEBUG_ISSUES } = require('../config/paths');

function genIssueCode() {
  const d = new Date();
  const stamp = d.toISOString().slice(0, 10).replace(/-/g, '');
  // Count today's issues + 1
  const db = getDB();
  let n = 1;
  if (db) {
    try {
      const r = db.prepare(`SELECT COUNT(*) AS c FROM debug_issues WHERE issue_code LIKE ?`).get(`ISSUE-${stamp}-%`);
      n = (r?.c || 0) + 1;
    } catch {}
  }
  return `ISSUE-${stamp}-${String(n).padStart(3, '0')}`;
}

function createIssue({ title, description, severity = 'medium', source = 'backend', detected_from_log_id = null }) {
  const code = genIssueCode();
  const db = getDB();
  if (db) {
    db.prepare(`INSERT INTO debug_issues (issue_code, title, description, severity, source, status, detected_from_log_id) VALUES (?, ?, ?, ?, ?, 'open', ?)`)
      .run(code, title, description, severity, source, detected_from_log_id);
  }
  // Also write to filesystem (open folder)
  const file = path.join(DEBUG_ISSUES, 'open', `${code}.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `# ${code} — ${title}\n\n**Severity:** ${severity}\n**Source:** ${source}\n**Status:** open\n**Created:** ${new Date().toISOString()}\n\n## Description\n${description || '(no description)'}\n`);
  return { code, file };
}

function listOpen() {
  const db = getDB();
  if (!db) return [];
  try { return db.prepare(`SELECT * FROM debug_issues WHERE status IN ('open','investigating') ORDER BY created_at DESC`).all(); }
  catch { return []; }
}

function listResolved(limit = 50) {
  const db = getDB();
  if (!db) return [];
  try { return db.prepare(`SELECT * FROM debug_issues WHERE status = 'resolved' ORDER BY resolved_at DESC LIMIT ?`).all(limit); }
  catch { return []; }
}

function updateStatus(code, status, fix_summary = null) {
  const db = getDB();
  if (!db) return false;
  try {
    db.prepare(`UPDATE debug_issues SET status = ?, fix_summary = COALESCE(?, fix_summary), updated_at = datetime('now'), resolved_at = CASE WHEN ? = 'resolved' THEN datetime('now') ELSE resolved_at END WHERE issue_code = ?`)
      .run(status, fix_summary, status, code);
    // Move filesystem file
    const folder = status === 'resolved' ? 'resolved' : status === 'failed' ? 'failed' : 'open';
    const old = ['open', 'resolved', 'failed'].map(f => path.join(DEBUG_ISSUES, f, `${code}.md`)).find(p => fs.existsSync(p));
    if (old) {
      const dest = path.join(DEBUG_ISSUES, folder, `${code}.md`);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.renameSync(old, dest);
    }
    return true;
  } catch (e) { console.warn('[issueTracker] updateStatus failed:', e.message); return false; }
}

module.exports = { createIssue, listOpen, listResolved, updateStatus };
