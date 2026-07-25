const router = require('express').Router();
const { createProject, listProjects, getProject } = require('../services/projectService');

router.get('/', (req, res) => res.json({ ok: true, projects: listProjects() }));

router.post('/', (req, res) => {
  try {
    const result = createProject(req.body || {});
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.get('/:id', (req, res) => {
  const p = getProject(req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'Project not found' });
  res.json({ ok: true, project: p });
});

router.patch('/:id', (req, res) => res.json({ ok: true, note: 'PATCH stub — implement updates via projectService.updateProject' }));
router.get('/:id/generations', (req, res) => res.json({ ok: true, generations: [] }));
router.post('/:id/generations', (req, res) => res.json({ ok: true, note: 'POST generation stub' }));

module.exports = router;
