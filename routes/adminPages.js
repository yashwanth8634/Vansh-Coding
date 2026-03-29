// routes/adminPages.js
// Admin page-rendering routes (dashboard, question banks, tests)
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { protect } = require('../middleware/auth');
const { caches } = require('../utils/cache');

const QuestionBank = require('../models/QuestionBank');
const Test = require('../models/Test');
const CodingChallenge = require('../models/CodingChallenge');
const CodingBank = require('../models/CodingBank');
const CodingTest = require('../models/CodingTest');
const CodingAttempt = require('../models/CodingAttempt');

function sanitizeFilename(value, fallback) {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

function drawRankingPdf({ res, title, subtitle, rows }) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 36,
  });

  doc.pipe(res);

  const headers = ['Rank', 'Name', 'Roll No', 'Year', 'Department', 'Section', 'Clg'];
  const columnWidths = [45, 145, 110, 55, 120, 70, 150];
  const startX = doc.page.margins.left;
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  let y = doc.page.margins.top;

  const drawTableHeader = () => {
    let x = startX;
    const headerHeight = 24;

    doc.font('Helvetica-Bold').fontSize(10);
    headers.forEach((header, index) => {
      doc.rect(x, y, columnWidths[index], headerHeight).fillAndStroke('#1c1a18', '#1c1a18');
      doc.fillColor('#ffffff').text(header, x + 6, y + 7, {
        width: columnWidths[index] - 12,
        align: index === 0 || index === 3 ? 'center' : 'left',
      });
      x += columnWidths[index];
    });

    y += headerHeight;
  };

  doc.font('Helvetica-Bold').fontSize(16).fillColor('#111111').text(title, startX, y);
  y += 22;
  doc.font('Helvetica').fontSize(10).fillColor('#555555').text(subtitle, startX, y);
  y += 22;

  drawTableHeader();

  rows.forEach((row, rowIndex) => {
    const values = [
      String(row.rank),
      row.studentName || '',
      row.studentRollNo || '',
      row.studentYear || '',
      row.studentDepartment || '',
      row.studentSection || '-',
      row.studentCollege || 'Vignan',
    ];

    const cellHeights = values.map((value, index) => (
      doc.heightOfString(String(value), {
        width: columnWidths[index] - 12,
        align: index === 0 || index === 3 ? 'center' : 'left',
      })
    ));

    const rowHeight = Math.max(24, Math.max(...cellHeights) + 10);

    if (y + rowHeight > bottomLimit) {
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
      y = doc.page.margins.top;
      drawTableHeader();
    }

    let x = startX;
    values.forEach((value, index) => {
      const fillColor = rowIndex % 2 === 0 ? '#f7f7f7' : '#ffffff';
      doc.rect(x, y, columnWidths[index], rowHeight).fillAndStroke(fillColor, '#d6d6d6');
      doc.fillColor('#111111')
        .font(index === 1 ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(10)
        .text(String(value), x + 6, y + 6, {
          width: columnWidths[index] - 12,
          align: index === 0 || index === 3 ? 'center' : 'left',
        });
      x += columnWidths[index];
    });

    y += rowHeight;
  });

  doc.end();
}

// GET /admin - Show Overview page
router.get('/', protect, async (req, res) => {
  try {
    const cacheKey = 'admin-overview';
    let data = caches.pages.get(cacheKey);
    
    if (!data) {
      const banks = await QuestionBank.find().sort({ title: 1 }).lean();
      const tests = await Test.find()
        .populate('questionBank', 'title')
        .sort({ createdAt: -1 })
        .lean();
        
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
      const banks = await QuestionBank.find().sort({ title: 1 }).lean();
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
      const banks = await QuestionBank.find().sort({ title: 1 }).lean();
      const tests = await Test.find()
        .populate('questionBank', 'title')
        .sort({ createdAt: -1 })
        .lean();
      data = { banks, tests };
      caches.pages.set(cacheKey, data);
    }
    
    res.render('tests', { ...data, activeTab: 'tests' }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading tests page');
  }
});

router.get('/tests/links', protect, async (req, res) => {
  try {
    const tests = await Test.find()
      .populate('questionBank', 'title')
      .sort({ createdAt: -1 });

    res.render('tests-links', { tests, activeTab: 'tests' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading test links page');
  }
});

// GET /admin/bank/:bankId - Page to add questions
router.get('/bank/:bankId', protect, async (req, res) => {
  try {
    const cacheKey = `bank-page-${req.params.bankId}`;
    let data = caches.pages.get(cacheKey);
    
    if (!data) {
      const bank = await QuestionBank.findById(req.params.bankId).populate('questions').lean();
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
      const challenges = await CodingChallenge.find().sort({ createdAt: -1 }).lean();
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
    const banks = await CodingBank.find().populate('challenges').sort({ createdAt: -1 }).lean();
    const challenges = await CodingChallenge.find().sort({ createdAt: -1 }).lean();
    res.render('coding-banks', { banks, challenges, activeTab: 'coding-banks' }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading coding banks page');
  }
});

// GET /admin/coding/tests - Show Coding Tests page
router.get('/coding/tests', protect, async (req, res) => {
  try {
    const tests = await CodingTest.find().populate('codingBank').sort({ createdAt: -1 }).lean();
    const banks = await CodingBank.find().sort({ createdAt: -1 }).lean();
    res.render('coding-tests', { tests, banks, activeTab: 'coding-tests' }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading coding tests page');
  }
});

router.get('/coding/tests/links', protect, async (req, res) => {
  try {
    const tests = await CodingTest.find().populate('codingBank').sort({ createdAt: -1 }).lean();
    res.render('coding-test-links', { tests, activeTab: 'coding-tests' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading coding session links page');
  }
});

// GET /admin/coding/results/:testId - View Coding Test Results
router.get('/coding/results/:testId', protect, async (req, res) => {
  try {
    const test = await CodingTest.findById(req.params.testId).populate('codingBank').lean();
    if (!test) return res.status(404).send('Coding test not found');
    
    // Get attempts, select answers for detailed code view
    const attempts = await CodingAttempt.find({ codingTest: test._id })
        .populate('answers.challenge', 'title')
        .lean();

    const rankedAttempts = attempts
      .map((attempt) => ({
        ...attempt,
        solvedCount: (attempt.answers || []).filter((answer) => answer.status === 'Accepted').length,
      }))
      .sort((a, b) => {
        if (b.solvedCount !== a.solvedCount) {
          return b.solvedCount - a.solvedCount;
        }
        return new Date(a.submittedAt) - new Date(b.submittedAt);
      })
      .map((attempt, index) => ({
        ...attempt,
        rank: index + 1,
      }));
        
    res.render('coding-results', { test, attempts: rankedAttempts, activeTab: 'coding-tests' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading coding results page');
  }
});

router.get('/coding/results/:testId/pdf', protect, async (req, res) => {
  try {
    const test = await CodingTest.findById(req.params.testId).populate('codingBank');
    if (!test) return res.status(404).send('Coding test not found');

    const attempts = await CodingAttempt.find({ codingTest: test._id })
      .select('studentName studentRollNo studentDepartment studentYear studentSection studentCollege submittedAt answers')
      .lean();

    if (!attempts.length) {
      return res.status(400).send('No attempts available to export.');
    }

    const rankedAttempts = attempts
      .map((attempt) => ({
        ...attempt,
        solvedCount: (attempt.answers || []).filter((answer) => answer.status === 'Accepted').length,
      }))
      .sort((a, b) => {
        if (b.solvedCount !== a.solvedCount) {
          return b.solvedCount - a.solvedCount;
        }
        return new Date(a.submittedAt) - new Date(b.submittedAt);
      })
      .map((attempt, index) => ({
        ...attempt,
        rank: index + 1,
      }));

    const testTitle = test.codingBank ? test.codingBank.title : 'Coding';
    const filename = `${sanitizeFilename(testTitle, 'coding')}-coding-ranks.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    drawRankingPdf({
      res,
      title: `${testTitle} - Coding Rankings`,
      subtitle: `${test.durationMinutes || 30} Minutes`,
      rows: rankedAttempts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating coding ranking PDF');
  }
});

module.exports = router;
