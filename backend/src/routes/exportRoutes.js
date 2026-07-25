const router = require('express').Router();
const storage = require('../services/storageService');
const RESOURCE = 'exports';

router.get('/', (req, res) => {
  const filter = {};
  if (req.query.project_id) filter.project_id = parseInt(req.query.project_id);
  if (req.query.export_type) filter.export_type = req.query.export_type;
  res.json({ ok: true, items: storage.list(RESOURCE, filter) });
});

router.post('/', (req, res) => {
  if (!req.body?.file_name) return res.status(400).json({ ok: false, error: 'file_name required' });
  const row = storage.insert(RESOURCE, { version: 1, ...req.body });
  res.json({ ok: true, export: row });
});

router.get('/:id', (req, res) => {
  const row = storage.get(RESOURCE, req.params.id);
  if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, export: row });
});

module.exports = router;
