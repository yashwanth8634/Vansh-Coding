// routes/pages.js
// Thin aggregator — mounts all page-rendering sub-routers
const express = require('express');
const router = express.Router();

const adminPages = require('./adminPages');
const testPages = require('./testPages');
const Test = require('../models/Test');
const CodingTest = require('../models/CodingTest');
const { caches } = require('../utils/cache');

async function getActiveTests() {
  const cacheKey = 'active-tests-list';
  const cachedData = await caches.pages.get(cacheKey).catch(() => null);
  
  if (cachedData) {
    return cachedData;
  }
  const now = new Date();
  const [quizTests, codingTests] = await Promise.all([
    Test.find({ linkExpiresAt: { $gt: now } })
      .select('questionBank duration uniqueLink linkExpiresAt createdAt')
      .populate('questionBank', 'title text description') // Populate only needed fields if bank was larger
      .sort({ createdAt: -1 })
      .lean(),
    CodingTest.find({ linkExpiresAt: { $gt: now } })
      .select('codingBank durationMinutes uniqueLink linkExpiresAt createdAt')
      .populate('codingBank', 'title description')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const LOCALE = 'en-IN';

  const activeQuizTests = quizTests.map((test) => ({
    id: test._id,
    title: test.questionBank?.title || 'Quiz Test',
    type: 'Quiz',
    duration: test.duration,
    link: `/test/${test.uniqueLink}`,
    expiresAt: test.linkExpiresAt,
    expiryText: test.linkExpiresAt ? new Date(test.linkExpiresAt).toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }) : 'No expiry set',
  }));

  const activeCodingTests = codingTests.map((test) => ({
    id: test._id,
    title: test.codingBank?.title || 'Coding Test',
    type: 'Coding',
    duration: test.durationMinutes,
    link: `/coding/test/${test.uniqueLink}`,
    expiresAt: test.linkExpiresAt,
    expiryText: test.linkExpiresAt ? new Date(test.linkExpiresAt).toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }) : 'No expiry set',
  }));

  const result = [...activeQuizTests, ...activeCodingTests].sort(
    (a, b) => new Date(a.expiresAt) - new Date(b.expiresAt),
  );

  // Cache for 2 minutes
  await caches.pages.set(cacheKey, result).catch(() => null);
  return result;
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
