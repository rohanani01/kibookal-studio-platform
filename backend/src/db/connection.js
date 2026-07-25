/* SQLite connection — uses better-sqlite3 (synchronous, fast, simple).
   When better-sqlite3 isn't installed (e.g. no Visual Studio C++ Build Tools),
   getDB() returns null cleanly and only warns ONCE (not on every call). */
const path = require('path');
const fs = require('fs');
const { DATABASE } = require('../config/paths');

let _db = null;
let _attempted = false;

function getDB() {
  if (_db) return _db;
  if (_attempted) return null;          // Don't re-try after first failure
  _attempted = true;
  try {
    const Database = require('better-sqlite3');
    fs.mkdirSync(path.dirname(DATABASE), { recursive: true });
    _db = new Database(DATABASE);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    console.log(`[db] connected to SQLite at ${DATABASE}`);
    return _db;
  } catch (e) {
    console.warn('[db] better-sqlite3 not available — running with file-based logging only.');
    console.warn('     To enable DB features: install Visual Studio Build Tools, then `npm install better-sqlite3`');
    return null;
  }
}

function isAvailable() {
  return !!getDB();
}

module.exports = { getDB, isAvailable };
