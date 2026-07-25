const router = require('express').Router();
const fs = require('fs');
const { getDB, isAvailable } = require('../db/connection');
const P = require('../config/paths');

router.get('/', (req, res) => {
  const checks = {
    backend: 'up',
    db: isAvailable() ? 'connected' : 'not_installed',
    folders: {
      storage:  fs.existsSync(P.STORAGE),
      outputs:  fs.existsSync(P.OUTPUTS),
      debug:    fs.existsSync(P.DEBUG),
      frontend: fs.existsSync(P.FRONTEND)
    },
    timestamp: new Date().toISOString()
  };
  res.json({ ok: true, ...checks });
});

module.exports = router;
