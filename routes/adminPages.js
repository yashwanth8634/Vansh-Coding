// routes/adminPages.js
// Admin page-rendering routes (dashboard, question banks, tests)
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { caches } = require('../utils/cache');

const QuestionBank = require('../models/QuestionBank');
const Test = require('../models/Test');
const CodingChallenge = require('../models/CodingChallenge');
const CodingBank = require('../models/CodingBank');
const CodingTest = require('../models/CodingTest');
const CodingAttempt = require('../models/CodingAttempt');

// GET /admin - Show Overview page
router.get('/', protect, async (req, res) => {
  try {
    const cacheKey = 'admin-overview';
    let data = caches.pages.get(cacheKey);
    
    if (!data) {
      const banks = await QuestionBank.find().sort({ title: 1 });
      const tests = await Test.find()
        .populate('questionBank', 'title')
        .sort({ createdAt: -1 });
        
      const codingBanks = await CodingBank.countDocuments();
      const codingTests = await CodingTest.countDocuments();
      const codingChallenges = await CodingChallenge.countDocuments();
      
      const stats = {
          banks: banks.length,
          tests: tests.length,
          codingBanks: codingBanks || 0,
          codingTests: codingTests || 0,
          codingChallenges: codingChallenges || 0,
          questions: banks.reduce((sum, b) => sum + (b.questions ? b.questions.length : 0), 0)
      };

      data = { banks, tests, stats };
      caches.pages.set(cacheKey, data);
    }
    
    // Pass the activeTab variable so the sidebar highlights correctly (if we add sidebar later)
    res.render('overview', { ...data, activeTab: 'overview' }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading admin page');
  }
});

// GET /admin/banks - Show Question Banks page
router.get('/banks', protect, async (req, res) => {
  try {
    const cacheKey = 'admin-banks';
    let data = caches.pages.get(cacheKey);
    
    if (!data) {
      const banks = await QuestionBank.find().sort({ title: 1 });
      data = { banks };
      caches.pages.set(cacheKey, data);
    }
    
    res.render('banks', { ...data, activeTab: 'banks' }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading banks page');
  }
});

// GET /admin/tests - Show Tests page
router.get('/tests', protect, async (req, res) => {
  try {
    const cacheKey = 'admin-tests';
    let data = caches.pages.get(cacheKey);
    
    if (!data) {
      const banks = await QuestionBank.find().sort({ title: 1 });
      const tests = await Test.find()
        .populate('questionBank', 'title')
        .sort({ createdAt: -1 });
      data = { banks, tests };
      caches.pages.set(cacheKey, data);
    }
    
    res.render('tests', { ...data, activeTab: 'tests' }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading tests page');
  }
});

// GET /admin/bank/:bankId - Page to add questions
router.get('/bank/:bankId', protect, async (req, res) => {
  try {
    const cacheKey = `bank-page-${req.params.bankId}`;
    let data = caches.pages.get(cacheKey);
    
    if (!data) {
      const bank = await QuestionBank.findById(req.params.bankId).populate('questions');
      if (!bank) {
        return res.status(404).send('Question bank not found');
      }
      data = { bank, questions: bank.questions };
      caches.pages.set(cacheKey, data);
    }
    
    res.render('add-questions', { ...data, activeTab: 'banks' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading bank page');
  }
});

// GET /admin/coding - Show Coding Platform page
router.get('/coding', protect, async (req, res) => {
  try {
    const cacheKey = 'admin-coding';
    let data = caches.pages.get(cacheKey);
    
    if (!data) {
      const challenges = await CodingChallenge.find().sort({ createdAt: -1 });
      data = { challenges };
      caches.pages.set(cacheKey, data);
    }
    
    res.render('coding-admin', { ...data, activeTab: 'coding' }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading coding admin page');
  }
});

// GET /admin/coding/banks - Show Coding Banks page
router.get('/coding/banks', protect, async (req, res) => {
  try {
    const banks = await CodingBank.find().populate('challenges').sort({ createdAt: -1 });
    const challenges = await CodingChallenge.find().sort({ createdAt: -1 });
    res.render('coding-banks', { banks, challenges, activeTab: 'coding-banks' }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading coding banks page');
  }
});

// GET /admin/coding/tests - Show Coding Tests page
router.get('/coding/tests', protect, async (req, res) => {
  try {
    const tests = await CodingTest.find().populate('codingBank').sort({ createdAt: -1 });
    const banks = await CodingBank.find().sort({ createdAt: -1 });
    res.render('coding-tests', { tests, banks, activeTab: 'coding-tests' }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading coding tests page');
  }
});

// GET /admin/coding/results/:testId - View Coding Test Results
router.get('/coding/results/:testId', protect, async (req, res) => {
  try {
    const test = await CodingTest.findById(req.params.testId).populate('codingBank');
    if (!test) return res.status(404).send('Coding test not found');
    
    // Get attempts, select answers for detailed code view
    const attempts = await CodingAttempt.find({ codingTest: test._id })
        .populate('answers.challenge', 'title')
        .sort({ submittedAt: -1 });
        
    res.render('coding-results', { test, attempts, activeTab: 'coding-tests' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading coding results page');
  }
});

module.exports = router;
