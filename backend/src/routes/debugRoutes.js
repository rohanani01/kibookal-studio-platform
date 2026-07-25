const router = require('express').Router();
const errorLogger = require('../debug/errorLogger');
const issueTracker = require('../debug/issueTracker');
const repairReceipt = require('../debug/repairReceipt');

// Error logs
router.get('/errors', (req, res) => {
  res.json({ ok: true, errors: errorLogger.recentErrors(parseInt(req.query.limit) || 50) });
});

router.post('/errors', (req, res) => {
  const id = errorLogger.logError(req.body || {});
  res.json({ ok: true, id });
});

// Issues
router.get('/issues', (req, res) => {
  res.json({ ok: true, issues: issueTracker.listOpen().concat(issueTracker.listResolved(20)) });
});
router.get('/issues/open',     (req, res) => res.json({ ok: true, issues: issueTracker.listOpen() }));
router.get('/issues/resolved', (req, res) => res.json({ ok: true, issues: issueTracker.listResolved() }));

router.post('/issues', (req, res) => {
  try { res.json({ ok: true, issue: issueTracker.createIssue(req.body || {}) }); }
  catch (e) { res.status(400).json({ ok: false, error: e.message }); }
});

router.patch('/issues/:code', (req, res) => {
  const { status, fix_summary } = req.body || {};
  const ok = issueTracker.updateStatus(req.params.code, status, fix_summary);
  res.json({ ok });
});

// Repair receipts
router.get('/receipts', (req, res) => {
  res.json({ ok: true, receipts: repairReceipt.listReceipts() });
});

router.post('/receipts', (req, res) => {
  try {
    const r = repairReceipt.createReceipt(req.body || {});
    res.json({ ok: true, ...r });
  } catch (e) { res.status(400).json({ ok: false, error: e.message }); }
});

router.post('/report', (req, res) => {
  res.json({
    ok: true,
    summary: {
      recent_errors: errorLogger.recentErrors(20).length,
      open_issues: issueTracker.listOpen().length,
      resolved_issues: issueTracker.listResolved(100).length,
      recent_receipts: repairReceipt.listReceipts(20).length
    }
  });
});

module.exports = router;
