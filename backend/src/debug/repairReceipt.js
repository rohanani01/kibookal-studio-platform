/* Repair receipt — write a markdown file documenting the fix + persist to DB. */
const fs = require('fs');
const path = require('path');
const { getDB } = require('../db/connection');
const { DEBUG_RECEIPTS } = require('../config/paths');

function buildReceiptMarkdown({ issue_code, title, root_cause, files_changed, changes_made, tests_run, result, notes }) {
  return `# Repair Receipt

**Issue:** ${issue_code}
**Title:** ${title || '(untitled)'}
**Created:** ${new Date().toISOString()}

## Root Cause
${root_cause || '(not specified)'}

## Files Changed
${(files_changed || []).map(f => `- ${f}`).join('\n') || '(none)'}

## Changes Made
${changes_made || '(not specified)'}

## Tests / Checks Run
${tests_run || '(none)'}

## Result
${result || 'pending'}

## Notes
${notes || '(none)'}
`;
}

function createReceipt(receipt) {
  const issueCode = receipt.issue_code || 'UNCODED';
  const filename = `${issueCode}_repair-receipt.md`;
  const filePath = path.join(DEBUG_RECEIPTS, 'repair-receipts', filename);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buildReceiptMarkdown(receipt), 'utf8');

  const db = getDB();
  if (db) {
    try {
      db.prepare(`INSERT INTO repair_receipts
        (issue_id, receipt_title, root_cause, files_changed_json, changes_made, tests_run, result_status, unresolved_notes, receipt_file_path)
        VALUES (
          (SELECT id FROM debug_issues WHERE issue_code = ?),
          ?, ?, ?, ?, ?, ?, ?, ?
        )`).run(
          issueCode,
          receipt.title || null,
          receipt.root_cause || null,
          JSON.stringify(receipt.files_changed || []),
          receipt.changes_made || null,
          receipt.tests_run || null,
          receipt.result || 'pending',
          receipt.notes || null,
          filePath
        );
    } catch (e) {
      console.warn('[repairReceipt] DB insert failed:', e.message);
    }
  }
  return { filePath };
}

function listReceipts(limit = 50) {
  const db = getDB();
  if (!db) return [];
  try { return db.prepare(`SELECT * FROM repair_receipts ORDER BY created_at DESC LIMIT ?`).all(limit); }
  catch { return []; }
}

module.exports = { createReceipt, listReceipts, buildReceiptMarkdown };
