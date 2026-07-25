/* Centralized path resolution — every other file imports these constants
   so no module hardcodes a path. */
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');

module.exports = {
  ROOT,
  FRONTEND:  path.join(ROOT, 'frontend'),
  BACKEND:   path.join(ROOT, 'backend'),
  DATABASE:  path.join(ROOT, 'database', 'studio.sqlite'),
  STORAGE:   path.join(ROOT, 'storage'),
  STORAGE_PROJECTS: path.join(ROOT, 'storage', 'projects'),
  STORAGE_VAULT:    path.join(ROOT, 'storage', 'vault'),
  OUTPUTS:   path.join(ROOT, 'outputs'),
  DEBUG:     path.join(ROOT, 'debug'),
  DEBUG_LOGS:     path.join(ROOT, 'debug', 'logs'),
  DEBUG_ISSUES:   path.join(ROOT, 'debug', 'issues'),
  DEBUG_RECEIPTS: path.join(ROOT, 'debug', 'receipts'),
  DEBUG_SNAPSHOTS:path.join(ROOT, 'debug', 'snapshots'),
  DEBUG_REPORTS:  path.join(ROOT, 'debug', 'reports'),
  DOCS: path.join(ROOT, 'docs'),
  BACKUP: path.join(ROOT, 'backup')
};
