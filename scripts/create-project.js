#!/usr/bin/env node
/* npm run create:project -- "My Comic Title" comic-book "Optional description" */
const { createProject } = require('../backend/src/services/projectService');

const [, , title, type = 'comic-book', desc = ''] = process.argv;
if (!title) {
  console.error('Usage: npm run create:project -- "<title>" [type] [description]');
  console.error('  types: comic-book | image-generation | character | video-generation | brand-asset');
  process.exit(1);
}
try {
  const r = createProject({ title, project_type: type, description: desc });
  console.log('✓ Project created');
  console.log('  ID:    ', r.id);
  console.log('  Slug:  ', r.slug);
  console.log('  Folder:', r.folder);
} catch (e) {
  console.error('✗ Failed:', e.message);
  process.exit(1);
}
