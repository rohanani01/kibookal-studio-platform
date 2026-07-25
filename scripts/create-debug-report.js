#!/usr/bin/env node
/* npm run debug:report — generate a full markdown debug report. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function readLogTail(file, n = 50) {
  if (!fs.existsSync(file)) return '(no log file)';
  return fs.readFileSync(file, 'utf8').split('\n').slice(-n).join('\n');
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const out = path.join(ROOT, 'debug', 'reports', `debug-report_${stamp}.md`);
fs.mkdirSync(path.dirname(out), { recursive: true });

const sections = [
  '# Debug Report',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Backend errors (last 50 lines)',
  '```\n' + readLogTail(path.join(ROOT, 'debug/logs/backend-errors.log')) + '\n```',
  '',
  '## Frontend errors (last 50 lines)',
  '```\n' + readLogTail(path.join(ROOT, 'debug/logs/frontend-errors.log')) + '\n```',
  '',
  '## Database errors',
  '```\n' + readLogTail(path.join(ROOT, 'debug/logs/database-errors.log')) + '\n```',
  '',
  '## Open issues',
  (() => {
    const dir = path.join(ROOT, 'debug/issues/open');
    if (!fs.existsSync(dir)) return '(none)';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    if (!files.length) return '(none)';
    return files.map(f => `- ${f}`).join('\n');
  })(),
  '',
  '## Recent repair receipts',
  (() => {
    const dir = path.join(ROOT, 'debug/receipts/repair-receipts');
    if (!fs.existsSync(dir)) return '(none)';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).slice(-10);
    if (!files.length) return '(none)';
    return files.map(f => `- ${f}`).join('\n');
  })()
];

fs.writeFileSync(out, sections.join('\n'), 'utf8');
console.log(`✓ Debug report written: ${out}`);
