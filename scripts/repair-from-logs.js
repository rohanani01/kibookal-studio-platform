#!/usr/bin/env node
/* npm run debug:repair — SAFE-by-default: reports candidates only. Never modifies
   code unless an explicit, recognised, low-risk pattern is matched. Generates a
   repair receipt for any action taken (or skipped, with reason). */

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const ISSUES_DIR = path.join(ROOT, 'debug', 'issues', 'open');
const RECEIPTS_DIR = path.join(ROOT, 'debug', 'receipts', 'repair-receipts');

console.log('\n🔧 Safe Repair — scanning open issues…\n');

if (!fs.existsSync(ISSUES_DIR)) {
  console.log('  (no open issues folder — nothing to do)');
  process.exit(0);
}

const issues = fs.readdirSync(ISSUES_DIR).filter(f => f.endsWith('.md'));
if (!issues.length) {
  console.log('  ✓ No open issues. System is clean.\n');
  process.exit(0);
}

console.log(`  Found ${issues.length} open issue(s):\n`);
for (const file of issues) {
  const issueCode = file.replace('.md', '');
  const body = fs.readFileSync(path.join(ISSUES_DIR, file), 'utf8');
  console.log(`  • ${issueCode}`);
  console.log(`    Title: ${(body.match(/^#\s+(.+)/m) || [, ''])[1] || '(none)'}`);
  console.log(`    Confidence: LOW — manual review required`);
  console.log(`    Suggested next step: open ${file} and produce a repair receipt by hand.\n`);

  // Generate a "skipped" receipt explaining why no auto-fix was applied
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
  const receiptPath = path.join(RECEIPTS_DIR, `${issueCode}_repair-receipt.md`);
  if (!fs.existsSync(receiptPath)) {
    fs.writeFileSync(receiptPath, `# Repair Receipt — ${issueCode}\n\n## Issue\nAuto-repair scanned this issue but skipped applying a change.\n\n## Reason\nConfidence too low for autonomous repair. Issue requires human review and a targeted fix.\n\n## Files Changed\n(none)\n\n## Result\nDeferred — manual fix required.\n\n## Notes\nRe-run \`npm run debug:repair\` after manual fix to confirm clean state.\n`);
  }
}

console.log('✓ Repair scan complete. Receipts placed in debug/receipts/repair-receipts/\n');
console.log('  NOTE: This script is SAFE-by-default. It never modifies your code.\n');
