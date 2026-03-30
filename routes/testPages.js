// routes/testPages.js
// Test page-rendering routes (student test page, admin results view)
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { caches } = require('../utils/cache');
const { sanitizeFilename, drawRankingPdf } = require('../utils/helpers');

const Test = require('../models/Test');
const Attempt = require('../models/Attempt');
const CodingTest = require('../models/CodingTest');


// GET /admin/test/:testId/results - Page to view attempts (cached, protected)
router.get('/admin/test/:testId/results', protect, async (req, res) => {
    try {
        const cacheKey = `test-results-${req.params.testId}`;
        let data = await caches.pages.get(cacheKey);
        
        if (!data) {
          const test = await Test.findById(req.params.testId).populate('questionBank', 'title');
          if (!test) {
              return res.status(404).send('Test not found');
          }
          const attempts = await Attempt.find({ test: test._id })
              .select('studentName studentRollNo studentDepartment studentYear studentSection studentCollege score submittedAt answers')
              .sort({ score: -1, submittedAt: 1 });
          data = { test, attempts };
          await caches.pages.set(cacheKey, data);
        }
        
        res.render('test-results', data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading results page');
    }
});

router.get('/admin/test/:testId/results/pdf', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId).populate('questionBank', 'title');
    if (!test) {
      return res.status(404).send('Test not found');
    }

    const attempts = await Attempt.find({ test: test._id })
      .select('studentName studentRollNo studentDepartment studentYear studentSection studentCollege score submittedAt')
      .sort({ score: -1, submittedAt: 1 })
      .lean();

    if (!attempts.length) {
      return res.status(400).send('No attempts available to export.');
    }

    const rankedAttempts = attempts.map((attempt, index) => ({
      ...attempt,
      rank: index + 1,
    }));

    const testTitle = test.questionBank ? test.questionBank.title : 'Quiz';
    const filename = `${sanitizeFilename(testTitle, 'quiz')}-quiz-ranks.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    drawRankingPdf({
      res,
      title: `${testTitle} - Quiz Rankings`,
      subtitle: `${test.numQuestions} Questions | ${test.duration} Minutes`,
      rows: rankedAttempts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating quiz ranking PDF');
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

// GET /coding/test/:link - Show the student coding workspace with all questions
router.get('/coding/test/:link', async (req, res) => {
  try {
    const test = await CodingTest.findOne({ uniqueLink: req.params.link }).populate({
      path: 'codingBank',
      populate: { path: 'challenges' }
    });

    if (!test) {
      return res.status(404).send('Coding test link not found.');
    }
    if (new Date() > test.linkExpiresAt) {
      return res.status(400).send('This test link has expired.');
    }

    if (!test.codingBank || !test.codingBank.challenges || test.codingBank.challenges.length === 0) {
      return res.status(400).send('This coding test has no challenges configured.');
    }

    res.render('coding-workspace', { test });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading coding workspace');
  }
});

module.exports = router;
