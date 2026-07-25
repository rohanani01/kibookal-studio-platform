#!/usr/bin/env node
/* npm run health — verify every subsystem. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const required = [
  ['frontend',          path.join(ROOT, 'frontend')],
  ['frontend/index.html', path.join(ROOT, 'frontend', 'index.html')],
  ['backend',           path.join(ROOT, 'backend', 'src', 'server.js')],
  ['database folder',   path.join(ROOT, 'database')],
  ['storage/projects',  path.join(ROOT, 'storage', 'projects')],
  ['storage/vault',     path.join(ROOT, 'storage', 'vault')],
  ['outputs',           path.join(ROOT, 'outputs')],
  ['debug/logs',        path.join(ROOT, 'debug', 'logs')],
  ['debug/issues',      path.join(ROOT, 'debug', 'issues')],
  ['debug/receipts',    path.join(ROOT, 'debug', 'receipts')],
  ['docs',              path.join(ROOT, 'docs')]
];

let passed = 0, failed = 0;
console.log('\n🩺 Kibookal Studio · Health Check\n');
for (const [name, p] of required) {
  const ok = fs.existsSync(p);
  console.log(`  ${ok ? '✓' : '✗'} ${name.padEnd(28)} ${ok ? '' : '— MISSING'}  ${p}`);
  ok ? passed++ : failed++;
}

// Check writable storage + debug
try {
  const probe = path.join(ROOT, 'debug', 'logs', '_health_probe.txt');
  fs.writeFileSync(probe, 'ok\n');
  fs.unlinkSync(probe);
  console.log('  ✓ debug/logs writable');
  passed++;
} catch (e) {
  console.log('  ✗ debug/logs NOT writable —', e.message);
  failed++;
}

// Check DB
try {
  const Database = require('better-sqlite3');
  const dbPath = path.join(ROOT, 'database', 'studio.sqlite');
  if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath);
    const c = db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table'").get();
    console.log(`  ✓ database connected (${c.c} tables)`);
    db.close();
    passed++;
  } else {
    console.log('  ⚠ database not initialised — run `npm run db:migrate`');
  }
} catch (e) {
  console.log('  ⚠ better-sqlite3 not installed — run `npm install`');
}

console.log(`\n${failed === 0 ? '✓ All checks passed' : `✗ ${failed} check(s) failed`} (${passed} passed)\n`);
process.exit(failed === 0 ? 0 : 1);
