const router = require('express').Router();
const storage = require('../services/storageService');
const RESOURCE = 'generations';

router.get('/', (req, res) => {
  const filter = {};
  if (req.query.project_id) filter.project_id = parseInt(req.query.project_id);
  if (req.query.status) filter.status = req.query.status;
  res.json({ ok: true, items: storage.list(RESOURCE, filter) });
});

router.post('/', (req, res) => {
  const row = storage.insert(RESOURCE, { status: 'pending', ...req.body });
  res.json({ ok: true, generation: row });
});

router.get('/:id', (req, res) => {
  const row = storage.get(RESOURCE, req.params.id);
  if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, generation: row });
});

router.patch('/:id', (req, res) => {
  const row = storage.update(RESOURCE, req.params.id, req.body || {});
  if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, generation: row });
});

module.exports = router;
