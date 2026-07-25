const router = require('express').Router();
const storage = require('../services/storageService');
const RESOURCE = 'prompts';

router.get('/', (req, res) => {
  const filter = {};
  if (req.query.project_id) filter.project_id = parseInt(req.query.project_id);
  if (req.query.prompt_type) filter.prompt_type = req.query.prompt_type;
  res.json({ ok: true, items: storage.list(RESOURCE, filter) });
});

router.post('/', (req, res) => {
  if (!req.body?.prompt_text) return res.status(400).json({ ok: false, error: 'prompt_text required' });
  const row = storage.insert(RESOURCE, { version: 1, ...req.body });
  res.json({ ok: true, prompt: row });
});

router.get('/:id', (req, res) => {
  const row = storage.get(RESOURCE, req.params.id);
  if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, prompt: row });
});

router.patch('/:id', (req, res) => {
  const row = storage.update(RESOURCE, req.params.id, req.body || {});
  if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, prompt: row });
});

module.exports = router;
