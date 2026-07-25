const router = require('express').Router();
const storage = require('../services/storageService');
const RESOURCE = 'characters';

router.get('/', (req, res) => {
  res.json({ ok: true, items: storage.list(RESOURCE) });
});

router.post('/', (req, res) => {
  if (!req.body?.character_name) return res.status(400).json({ ok: false, error: 'character_name required' });
  const row = storage.insert(RESOURCE, req.body);
  res.json({ ok: true, character: row });
});

router.get('/:id', (req, res) => {
  const row = storage.get(RESOURCE, req.params.id);
  if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, character: row });
});

router.patch('/:id', (req, res) => {
  const row = storage.update(RESOURCE, req.params.id, req.body || {});
  if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, character: row });
});

router.delete('/:id', (req, res) => {
  res.json({ ok: storage.remove(RESOURCE, req.params.id) });
});

// Character versions
router.post('/:id/versions', (req, res) => {
  const char = storage.get(RESOURCE, req.params.id);
  if (!char) return res.status(404).json({ ok: false, error: 'Character not found' });
  const ver = storage.insert('character_versions', { character_id: char.id, ...req.body });
  res.json({ ok: true, version: ver });
});

module.exports = router;
