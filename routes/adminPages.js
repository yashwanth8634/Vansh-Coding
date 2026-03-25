// routes/adminPages.js
// Admin page-rendering routes (dashboard, question banks, tests)
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { caches } = require('../utils/cache');

const QuestionBank = require('../models/QuestionBank');
const Test = require('../models/Test');

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
      data = { banks, tests };
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

module.exports = router;
