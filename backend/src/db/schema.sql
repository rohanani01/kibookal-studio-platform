-- Kibookal Studio · Database Schema v1.0
-- Local SQLite. Run via `npm run db:migrate`.

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_type TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  folder_path TEXT,
  current_version INTEGER DEFAULT 1,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  character_slug TEXT NOT NULL,
  character_data_json TEXT,
  reference_image_path TEXT,
  vault_path TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS character_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  data_json TEXT,
  image_path TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL,
  title TEXT,
  prompt_text TEXT NOT NULL,
  model TEXT,
  version INTEGER DEFAULT 1,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL,
  prompt_id INTEGER REFERENCES prompts(id),
  model TEXT,
  status TEXT DEFAULT 'pending',
  output_folder TEXT,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS renders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  generation_id INTEGER REFERENCES generations(id),
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  width INTEGER,
  height INTEGER,
  notes TEXT,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  file_name TEXT,
  file_path TEXT,
  version INTEGER DEFAULT 1,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reference_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  asset_type TEXT,
  title TEXT,
  file_name TEXT,
  file_path TEXT,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS style_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  style_name TEXT,
  style_slug TEXT,
  file_path TEXT,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_type TEXT NOT NULL,
  source TEXT,
  project_id INTEGER,
  message TEXT,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT,
  severity TEXT,
  error_type TEXT,
  message TEXT,
  stack_trace TEXT,
  route TEXT,
  file_path TEXT,
  project_id INTEGER,
  generation_id INTEGER,
  metadata_json TEXT,
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS debug_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_code TEXT UNIQUE,
  title TEXT,
  description TEXT,
  severity TEXT,
  source TEXT,
  status TEXT DEFAULT 'open',
  detected_from_log_id INTEGER REFERENCES error_logs(id),
  assigned_to TEXT,
  fix_summary TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS repair_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_id INTEGER REFERENCES debug_issues(id),
  receipt_title TEXT,
  before_summary TEXT,
  root_cause TEXT,
  files_changed_json TEXT,
  changes_made TEXT,
  tests_run TEXT,
  result_status TEXT,
  unresolved_notes TEXT,
  receipt_file_path TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_projects_slug    ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_chars_project    ON characters(project_id);
CREATE INDEX IF NOT EXISTS idx_prompts_project  ON prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_gens_project     ON generations(project_id);
CREATE INDEX IF NOT EXISTS idx_renders_project  ON renders(project_id);
CREATE INDEX IF NOT EXISTS idx_errors_source    ON error_logs(source);
CREATE INDEX IF NOT EXISTS idx_errors_status    ON error_logs(status);
CREATE INDEX IF NOT EXISTS idx_issues_status    ON debug_issues(status);
