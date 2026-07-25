/* Run the schema.sql against the SQLite database. Idempotent — re-running is safe. */
const fs = require('fs');
const path = require('path');
const { getDB } = require('./connection');

function run() {
  const db = getDB();
  if (!db) {
    console.log('⚠ better-sqlite3 not installed — skipping DB migration.');
    console.log('  The backend will still run with file-based logging only.');
    console.log('  To enable DB features, install Visual Studio Build Tools and run:');
    console.log('    npm install better-sqlite3');
    process.exit(0);  // exit cleanly so setup.bat continues
  }
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  console.log('✓ Database schema applied.');
  // Quick sanity check — list tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log(`✓ ${tables.length} tables present: ${tables.map(t => t.name).join(', ')}`);
}

if (require.main === module) run();

module.exports = { run };
