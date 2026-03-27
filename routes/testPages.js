// routes/testPages.js
// Test page-rendering routes (student test page, admin results view)
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { protect } = require('../middleware/auth');
const { caches } = require('../utils/cache');

const Test = require('../models/Test');
const Attempt = require('../models/Attempt');
const CodingTest = require('../models/CodingTest');

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
              .select('studentName studentRollNo studentDepartment studentYear studentSection studentCollege score submittedAt answers')
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
