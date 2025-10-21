// routes/pages.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Import middleware

// Import Models
const QuestionBank = require('../models/QuestionBank');
const Test = require('../models/Test');
const Attempt = require('../models/Attempt'); // We need this now

// GET /login - Show the admin login page
router.get('/login', (req, res) => {
  if (req.cookies.token) {
    return res.redirect('/admin');
  }
  res.render('login');
});

// GET /admin - Show the main admin dashboard (Protected)
router.get('/admin', protect, async (req, res) => {
  try {
    // Fetch both banks AND tests
    const banks = await QuestionBank.find().sort({ title: 1 });
    
    const tests = await Test.find()
      .populate('questionBank', 'title') // Get the bank's title
      .sort({ createdAt: -1 }); // Show newest tests first
    
    // Render the 'admin.ejs' template and pass both banks and tests
    res.render('admin', { banks: banks, tests: tests }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading admin page');
  }
});

// GET /admin/bank/:bankId - Page to add questions
router.get('/admin/bank/:bankId', protect, async (req, res) => {
  try {
    const bank = await QuestionBank.findById(req.params.bankId).populate('questions');
    if (!bank) {
      return res.status(404).send('Question bank not found');
    }
    res.render('add-questions', { bank: bank, questions: bank.questions });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading bank page');
  }
});

// --- NEW ROUTE for Viewing Test Results ---
// GET /admin/test/:testId/results - Page to view attempts
router.get('/admin/test/:testId/results', protect, async (req, res) => {
    try {
        const test = await Test.findById(req.params.testId).populate('questionBank', 'title');
        if (!test) {
            return res.status(404).send('Test not found');
        }

        // Fetch all attempts for this test
        const attempts = await Attempt.find({ test: test._id })
            .select('studentRollNo score submittedAt')
            .sort({ score: -1 });
        
        res.render('test-results', { test: test, attempts: attempts });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading results page');
    }
});
// --- END NEW ROUTE ---

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

// GET / - Homepage
router.get('/', (req, res) => {
  res.redirect('/login');
});

module.exports = router;