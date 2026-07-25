const router = require('express').Router();
const storage = require('../services/storageService');
const RESOURCE = 'settings';

// GET all settings — returns key/value object
router.get('/', (req, res) => {
  const rows = storage.list(RESOURCE);
  const settings = {};
  rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
  res.json({ ok: true, settings });
});

// POST — upsert key/value
router.post('/', (req, res) => {
  const { setting_key, setting_value } = req.body || {};
  if (!setting_key) return res.status(400).json({ ok: false, error: 'setting_key required' });
  const existing = storage.list(RESOURCE).find(r => r.setting_key === setting_key);
  if (existing) {
    storage.update(RESOURCE, existing.id, { setting_value });
  } else {
    storage.insert(RESOURCE, { setting_key, setting_value });
  }
  res.json({ ok: true });
});

// GET single key
router.get('/:key', (req, res) => {
  const row = storage.list(RESOURCE).find(r => r.setting_key === req.params.key);
  if (!row) return res.status(404).json({ ok: false, error: 'Key not found' });
  res.json({ ok: true, value: row.setting_value });
});

module.exports = router;
