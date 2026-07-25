#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const src = path.join(ROOT, 'database', 'studio.sqlite');
if (!fs.existsSync(src)) { console.error('No database file to back up'); process.exit(1); }
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dest = path.join(ROOT, 'backup', `studio_${stamp}.sqlite`);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log(`✓ Database backed up: ${dest}`);
