const router = require('express').Router();
const storage = require('../services/storageService');
const RESOURCE = 'renders';

router.get('/', (req, res) => {
  const filter = {};
  if (req.query.project_id) filter.project_id = parseInt(req.query.project_id);
  if (req.query.status) filter.status = req.query.status;
  if (req.query.generation_id) filter.generation_id = parseInt(req.query.generation_id);
  res.json({ ok: true, items: storage.list(RESOURCE, filter) });
});

router.post('/', (req, res) => {
  if (!req.body?.file_name) return res.status(400).json({ ok: false, error: 'file_name required' });
  const row = storage.insert(RESOURCE, { status: 'draft', version: 1, ...req.body });
  res.json({ ok: true, render: row });
});

router.get('/:id', (req, res) => {
  const row = storage.get(RESOURCE, req.params.id);
  if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, render: row });
});

router.patch('/:id/status', (req, res) => {
  const { status, notes } = req.body || {};
  if (!['draft', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ ok: false, error: 'status must be draft / approved / rejected' });
  }
  const row = storage.update(RESOURCE, req.params.id, { status, notes });
  if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, render: row });
});

module.exports = router;
