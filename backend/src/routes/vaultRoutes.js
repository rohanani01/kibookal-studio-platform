const router = require('express').Router();
const storage = require('../services/storageService');

// Vault sub-collections — characters, styles, prompts, references
['characters', 'styles', 'prompts', 'references'].forEach(kind => {
  const resource = `vault_${kind}`;
  router.get(`/${kind}`, (req, res) => {
    res.json({ ok: true, items: storage.list(resource) });
  });
  router.post(`/${kind}`, (req, res) => {
    const row = storage.insert(resource, req.body || {});
    res.json({ ok: true, item: row });
  });
  router.get(`/${kind}/:id`, (req, res) => {
    const row = storage.get(resource, req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, item: row });
  });
  router.patch(`/${kind}/:id`, (req, res) => {
    const row = storage.update(resource, req.params.id, req.body || {});
    if (!row) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, item: row });
  });
  router.delete(`/${kind}/:id`, (req, res) => {
    res.json({ ok: storage.remove(resource, req.params.id) });
  });
});

// Vault overview
router.get('/', (req, res) => {
  res.json({
    ok: true,
    summary: {
      characters: storage.list('vault_characters').length,
      styles:     storage.list('vault_styles').length,
      prompts:    storage.list('vault_prompts').length,
      references: storage.list('vault_references').length
    }
  });
});

module.exports = router;
