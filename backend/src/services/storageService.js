/* File-based fallback storage — works without a DB.
   Each resource is a JSON file under storage/db-fallback/.
   When better-sqlite3 IS available, services use the DB instead.
   This keeps the platform fully functional even on machines without
   Visual Studio Build Tools.
*/
const fs = require('fs');
const path = require('path');
const { STORAGE } = require('../config/paths');

const FALLBACK_DIR = path.join(STORAGE, 'db-fallback');
fs.mkdirSync(FALLBACK_DIR, { recursive: true });

function file(resource) {
  return path.join(FALLBACK_DIR, `${resource}.json`);
}

function readAll(resource) {
  const p = file(resource);
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { console.warn(`[storage] read ${resource} failed:`, e.message); return []; }
}

function writeAll(resource, rows) {
  const p = file(resource);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(rows, null, 2), 'utf8');
}

function nextId(rows) {
  return rows.length ? Math.max(...rows.map(r => r.id || 0)) + 1 : 1;
}

function insert(resource, row) {
  const rows = readAll(resource);
  row.id = nextId(rows);
  row.created_at = row.created_at || new Date().toISOString();
  row.updated_at = new Date().toISOString();
  rows.push(row);
  writeAll(resource, rows);
  return row;
}

function update(resource, id, patch) {
  const rows = readAll(resource);
  const i = rows.findIndex(r => r.id == id);
  if (i === -1) return null;
  rows[i] = { ...rows[i], ...patch, id: rows[i].id, updated_at: new Date().toISOString() };
  writeAll(resource, rows);
  return rows[i];
}

function get(resource, id) {
  return readAll(resource).find(r => r.id == id) || null;
}

function list(resource, filter = {}) {
  const rows = readAll(resource);
  if (!Object.keys(filter).length) return rows;
  return rows.filter(r => Object.entries(filter).every(([k, v]) => r[k] === v));
}

function remove(resource, id) {
  const rows = readAll(resource);
  const i = rows.findIndex(r => r.id == id);
  if (i === -1) return false;
  rows.splice(i, 1);
  writeAll(resource, rows);
  return true;
}

module.exports = { insert, update, get, list, remove, readAll, writeAll };
