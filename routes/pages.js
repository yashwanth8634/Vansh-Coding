// routes/pages.js
// Thin aggregator — mounts all page-rendering sub-routers
const express = require('express');
const router = express.Router();

const adminPages = require('./adminPages');
const testPages = require('./testPages');
const Test = require('../models/Test');
const CodingTest = require('../models/CodingTest');

async function getActiveTests() {
  const now = new Date();
  const [quizTests, codingTests] = await Promise.all([
    Test.find({ linkExpiresAt: { $gt: now } })
      .populate('questionBank', 'title')
      .sort({ createdAt: -1 })
      .lean(),
    CodingTest.find({ linkExpiresAt: { $gt: now } })
      .populate('codingBank', 'title')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const activeQuizTests = quizTests.map((test) => ({
    id: test._id,
    title: test.questionBank ? test.questionBank.title : 'Quiz Test',
    type: 'Quiz',
    duration: test.duration,
    link: `/test/${test.uniqueLink}`,
    expiresAt: test.linkExpiresAt,
  }));

  const activeCodingTests = codingTests.map((test) => ({
    id: test._id,
    title: test.codingBank ? test.codingBank.title : 'Coding Test',
    type: 'Coding',
    duration: test.durationMinutes,
    link: `/coding/test/${test.uniqueLink}`,
    expiresAt: test.linkExpiresAt,
  }));

  return [...activeQuizTests, ...activeCodingTests].sort(
    (a, b) => new Date(a.expiresAt) - new Date(b.expiresAt),
  );
}

// GET / - Homepage Marketing Landing
router.get('/', (req, res) => {
  res.render('index');
});

router.get('/active-tests', async (req, res) => {
  try {
    const activeTests = await getActiveTests();
    res.render('active-tests', { activeTests });
  } catch (error) {
    console.error(error);
    res.render('active-tests', { activeTests: [] });
  }
});

// GET /login - Show the admin login page
router.get('/login', (req, res) => {
  if (req.cookies.token) {
    return res.redirect('/admin');
  }
  res.render('login');
});

// Mount sub-routers
router.use('/admin', adminPages);  // /admin, /admin/bank/:bankId
router.use('/', testPages);        // /admin/test/:testId/results, /test/:link

module.exports = router;
