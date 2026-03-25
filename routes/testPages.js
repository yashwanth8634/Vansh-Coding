// routes/testPages.js
// Test page-rendering routes (student test page, admin results view)
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { caches } = require('../utils/cache');

const Test = require('../models/Test');
const Attempt = require('../models/Attempt');

// GET /admin/test/:testId/results - Page to view attempts (cached, protected)
router.get('/admin/test/:testId/results', protect, async (req, res) => {
    try {
        const cacheKey = `test-results-${req.params.testId}`;
        let data = caches.pages.get(cacheKey);
        
        if (!data) {
          const test = await Test.findById(req.params.testId).populate('questionBank', 'title');
          if (!test) {
              return res.status(404).send('Test not found');
          }
          const attempts = await Attempt.find({ test: test._id })
              .select('studentRollNo score submittedAt')
              .sort({ score: -1 });
          data = { test, attempts };
          caches.pages.set(cacheKey, data);
        }
        
        res.render('test-results', data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading results page');
    }
});

// GET /test/:link - Show the student test "login" page (Public)
router.get('/test/:link', async (req, res) => {
  try {
    const uniqueLink = req.params.link;
    const test = await Test.findOne({ uniqueLink });
    if (!test) {
      return res.status(404).send('Test link not found.');
    }
    if (new Date() > test.linkExpiresAt) {
      return res.status(400).send('This test link has expired.');
    }
    res.render('test', { uniqueLink: uniqueLink });
  } catch (error) {
    res.status(500).send('Error loading test page');
  }
});

module.exports = router;
