#!/usr/bin/env node
/* npm run debug:check — scan logs + open issues + folder integrity. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const LOG_DIR = path.join(ROOT, 'debug', 'logs');
const ISSUES_DIR = path.join(ROOT, 'debug', 'issues');

console.log('\n🔍 Debug Check\n');

// 1. Log files
if (fs.existsSync(LOG_DIR)) {
  const files = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.log'));
  files.forEach(f => {
    const stat = fs.statSync(path.join(LOG_DIR, f));
    const lines = fs.readFileSync(path.join(LOG_DIR, f), 'utf8').split('\n').filter(Boolean).length;
    console.log(`  · ${f.padEnd(28)} ${(stat.size/1024).toFixed(1)} KB · ${lines} entries`);
  });
  if (!files.length) console.log('  (no log files yet — fresh state)');
} else {
  console.log('  ⚠ debug/logs folder missing');
}

// 2. Open issues
const openDir = path.join(ISSUES_DIR, 'open');
if (fs.existsSync(openDir)) {
  const open = fs.readdirSync(openDir).filter(f => f.endsWith('.md'));
  console.log(`\n  ${open.length} open issue(s)`);
  open.slice(0, 5).forEach(f => console.log(`    · ${f}`));
}

console.log('\n✓ Debug check complete\n');
