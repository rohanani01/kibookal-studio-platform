/* Project service — creates the on-disk folder tree, project.json, and DB row. */
const fs = require('fs');
const path = require('path');
const { getDB } = require('../db/connection');
const { slugify } = require('../utils/slugify');
const P = require('../config/paths');

const FOLDER_TEMPLATES = {
  'comic-book': [
    'brief', 'script', 'prompts', 'reference-images', 'character-sheets',
    'character-vault', 'style-vault', 'page-plans',
    'renders/drafts', 'renders/approved', 'renders/rejected',
    'pdf', 'exports', 'logs', 'versions/v001'
  ],
  'image-generation': [
    'prompts', 'references',
    'renders/drafts', 'renders/approved', 'renders/rejected',
    'exports', 'logs', 'versions/v001'
  ],
  'character': [
    'reference-images', 'sheets', 'poses', 'approved-renders', 'versions/v001'
  ],
  'video-generation': [
    'prompts', 'references', 'shots', 'clips', 'audio', 'exports', 'logs', 'versions/v001'
  ]
};

const TYPE_TO_PARENT = {
  'comic-book': 'comic-books',
  'image-generation': 'image-generations',
  'character': 'characters',
  'video-generation': 'video-generations',
  'brand-asset': 'brand-assets'
};

function createProject({ title, project_type = 'comic-book', description = '', metadata = {} }) {
  if (!title) throw new Error('Project title required');
  const slug = slugify(title);
  const parent = TYPE_TO_PARENT[project_type] || 'comic-books';
  const folder = path.join(P.STORAGE_PROJECTS, parent, slug);

  if (fs.existsSync(folder)) {
    throw new Error(`Project folder already exists: ${folder}`);
  }
  fs.mkdirSync(folder, { recursive: true });

  // Create sub-folders
  (FOLDER_TEMPLATES[project_type] || FOLDER_TEMPLATES['comic-book']).forEach(sub => {
    fs.mkdirSync(path.join(folder, sub), { recursive: true });
  });

  // project.json
  const projectJson = {
    project_id: null, // filled in after DB insert
    title, slug, type: project_type, description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    current_version: 1,
    folder_path: folder,
    linked_characters: [],
    linked_style: null,
    linked_references: [],
    generation_history: [],
    render_history: [],
    export_history: [],
    metadata
  };

  // Insert into DB
  const db = getDB();
  let id = null;
  if (db) {
    const info = db.prepare(`INSERT INTO projects (project_type, title, slug, description, folder_path, current_version, metadata_json) VALUES (?, ?, ?, ?, ?, 1, ?)`)
      .run(project_type, title, slug, description, folder, JSON.stringify(metadata));
    id = info.lastInsertRowid;
    projectJson.project_id = id;
  }

  fs.writeFileSync(path.join(folder, 'project.json'), JSON.stringify(projectJson, null, 2), 'utf8');

  // Activity log
  if (db) {
    db.prepare(`INSERT INTO activity_logs (action_type, source, project_id, message) VALUES (?, ?, ?, ?)`)
      .run('project.create', 'backend', id, `Created ${project_type} project '${title}'`);
  }

  return { id, slug, folder, project: projectJson };
}

function listProjects() {
  const db = getDB();
  if (!db) return [];
  try { return db.prepare(`SELECT * FROM projects ORDER BY created_at DESC`).all(); }
  catch { return []; }
}

function getProject(id) {
  const db = getDB();
  if (!db) return null;
  try { return db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id); }
  catch { return null; }
}

module.exports = { createProject, listProjects, getProject };
