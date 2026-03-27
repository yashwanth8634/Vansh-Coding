// utils/cache.js
// Centralized cache module — all cache instances in one place
const NodeCache = require('node-cache');

const caches = {
  test:  new NodeCache({ stdTTL: 3600 }),  // test data with questions (1 hour)
  codingTest: new NodeCache({ stdTTL: 3600 }), // coding test link data (1 hour)
  user:  new NodeCache({ stdTTL: 300 }),   // authenticated users (5 min)
  banks: new NodeCache({ stdTTL: 600 }),   // question bank lists (10 min)
  pages: new NodeCache({ stdTTL: 120 }),   // rendered page data (2 min)
};

// --- Targeted Invalidation Helpers ---

const invalidateTest = (uniqueLink) => {
  caches.test.del(`test-${uniqueLink}`);
};

const invalidateAllTests = () => caches.test.flushAll();

const invalidateCodingTest = (uniqueLink) => {
  caches.codingTest.del(`coding-test-${uniqueLink}`);
};

const invalidateAllCodingTests = () => caches.codingTest.flushAll();

const invalidateBanks = () => caches.banks.flushAll();

const invalidatePages = () => caches.pages.flushAll();

const invalidateUser = (userId) => {
  caches.user.del(`user-${userId}`);
};

// Invalidate everything related to question data changes
const invalidateQuestionData = () => {
  invalidateAllTests();
  invalidateBanks();
  invalidatePages();
};

module.exports = {
  caches,
  invalidateTest,
  invalidateAllTests,
  invalidateCodingTest,
  invalidateAllCodingTests,
  invalidateBanks,
  invalidatePages,
  invalidateUser,
  invalidateQuestionData,
};
