// routes/test.js
// Test & Question Bank CRUD + Student test-taking + Results
const express = require('express');
const router = express.Router();

const Question = require('../models/Question');
const QuestionBank = require('../models/QuestionBank');
const Test = require('../models/Test');
const Attempt = require('../models/Attempt');
const CodingTest = require('../models/CodingTest');
const CodingAttempt = require('../models/CodingAttempt');

const { shuffleArray } = require('../utils/helpers');
const { protect } = require('../middleware/auth');
const {
  caches,
  invalidateQuestionData,
} = require('../utils/cache');

const DEPARTMENTS = [
  'CSE',
  'CSE(AI&ML)',
  'CSE(DS)',
  'IT',
  'ECE',
  'EEE',
  'CIVIL',
  'MECH',
  'EIE',
  'AI&DS',
  'AI&ML',
];

const YEARS = ['1', '2', '3', '4'];

const getCachedQuizTest = async (uniqueLink) => {
  const cacheKey = `test-${uniqueLink}`;
  let test = await caches.test.get(cacheKey);

  if (!test) {
    test = await Test.findOne({ uniqueLink })
      .populate({
        path: 'questionBank',
        populate: { path: 'questions', model: 'Question' },
      })
      .lean();

    if (!test) {
      return null;
    }

    await caches.test.set(cacheKey, test);
  }

  return test;
};

const getCachedCodingTest = async (uniqueLink) => {
  const cacheKey = `coding-test-${uniqueLink}`;
  let codingTest = await caches.codingTest.get(cacheKey);

  if (!codingTest) {
    codingTest = await CodingTest.findOne({ uniqueLink })
      .select('_id linkExpiresAt')
      .lean();

    if (!codingTest) {
      return null;
    }

    await caches.codingTest.set(cacheKey, codingTest);
  }

  return codingTest;
};

// ===================================
// --- Question Bank Routes (Protected) ---
// ===================================

// POST /api/banks
router.post('/banks', protect, async (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'Bank title is required.' });
    }

    const newBank = new QuestionBank({ title });
    await newBank.save();
    
    await caches.banks.flushAll();
    await caches.pages.flushAll();
    
    res.status(201).json(newBank);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/banks/:bankId/questions
router.post('/banks/:bankId/questions', protect, async (req, res) => {
  try {
    const questionText = (req.body.questionText || '').trim();
    const imageUrl = (req.body.imageUrl || '').trim();
    const options = Array.isArray(req.body.options)
      ? req.body.options.map((option) => String(option || '').trim())
      : [];
    const correctAnswer = String(req.body.correctAnswer || '').trim();

    if (!questionText) {
      return res.status(400).json({ message: 'Question text is required.' });
    }

    if (options.length !== 4 || options.some((option) => !option)) {
      return res.status(400).json({ message: 'Exactly four non-empty options are required.' });
    }

    if (!options.includes(correctAnswer)) {
      return res.status(400).json({ message: 'Correct answer must match one of the options.' });
    }

    const bank = await QuestionBank.findById(req.params.bankId);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }
    const newQuestion = new Question({ 
      questionText, 
      options, 
      correctAnswer, 
      imageUrl: imageUrl || null,
    });
    await newQuestion.save();
    bank.questions.push(newQuestion._id);
    await bank.save();
    
    await invalidateQuestionData();
    
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/banks (cached)
router.get('/banks', protect, async (req, res) => {
  try {
    const cacheKey = 'all-banks';
    let banks = await caches.banks.get(cacheKey);
    
    if (!banks) {
      banks = await QuestionBank.find().select('title _id');
      await caches.banks.set(cacheKey, banks);
    }
    
    res.json(banks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/banks/:bankId
router.delete('/banks/:bankId', protect, async (req, res) => {
    try {
        const { bankId } = req.params;
        const activeTests = await Test.find({ questionBank: bankId });
        if (activeTests.length > 0) {
            return res.status(400).json({ 
                message: `Cannot delete bank. It is being used by ${activeTests.length} test(s).` 
            });
        }
        const bank = await QuestionBank.findById(bankId);
        if (!bank) {
            return res.status(404).json({ message: 'Bank not found' });
        }
        if (bank.questions && bank.questions.length > 0) {
            await Question.deleteMany({ _id: { $in: bank.questions } });
        }
        await QuestionBank.findByIdAndDelete(bankId);
        
        await invalidateQuestionData();
        
        res.json({ message: 'Bank and all its questions were deleted.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while deleting bank.' });
    }
});

// ===================================
// --- Test Creation Route (Protected) ---
// ===================================

// POST /api/tests
router.post('/tests', protect, async (req, res) => {
  try {
    const { questionBankId, numQuestions, duration, linkExpiryHours } = req.body;
    const parsedNumQuestions = Number.parseInt(numQuestions, 10);
    const parsedDuration = Number.parseInt(duration, 10);
    const parsedExpiryHours = Number.parseInt(linkExpiryHours, 10);

    if (!questionBankId || Number.isNaN(parsedNumQuestions) || Number.isNaN(parsedDuration) || Number.isNaN(parsedExpiryHours)) {
      return res.status(400).json({ message: 'Invalid test configuration.' });
    }

    if (parsedNumQuestions <= 0 || parsedDuration <= 0 || parsedExpiryHours <= 0) {
      return res.status(400).json({ message: 'numQuestions, duration, and linkExpiryHours must be greater than zero.' });
    }

    const bank = await QuestionBank.findById(questionBankId).populate('questions');
    if (!bank) {
      return res.status(404).json({ message: 'Question bank not found' });
    }
    if (bank.questions.length < parsedNumQuestions) {
        return res.status(400).json({ message: `Bank only has ${bank.questions.length} questions.` });
    }
    
    const expires = new Date();
    expires.setHours(expires.getHours() + parsedExpiryHours);

    const newTest = new Test({
      questionBank: questionBankId,
      numQuestions: parsedNumQuestions,
      duration: parsedDuration,
      linkExpiresAt: expires,
    });
    await newTest.save();

    await caches.pages.flushAll();
    await caches.test.set(`test-${newTest.uniqueLink}`, {
      _id: newTest._id,
      uniqueLink: newTest.uniqueLink,
      linkExpiresAt: newTest.linkExpiresAt,
      duration: newTest.duration,
      numQuestions: newTest.numQuestions,
      questionBank: {
        _id: bank._id,
        title: bank.title,
        questions: bank.questions.map((question) => question.toObject()),
      },
    });

    const fullLink = `/test/${newTest.uniqueLink}`; 
    res.status(201).json({
      message: 'Test created successfully!',
      link: fullLink,
      testId: newTest._id
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ===================================
// --- Test-Taking Routes (Public) ---
// ===================================

// POST /api/test/start (cached test lookup)
router.post('/test/start', async (req, res) => {
  try {
    let {
      uniqueLink,
    name,
    rollNo,
    department,
    year,
    section,
    collegeName,
  } = req.body;

    if (!uniqueLink || !name || !rollNo || !department || !year) {
      return res.status(400).json({ message: 'Name, Roll No, Department, and Year are required.' });
    }

    name = name.trim();
    rollNo = rollNo.trim().toUpperCase();
    department = department.trim();
    year = year.trim();
    section = (section || '').trim();
    collegeName = (collegeName || '').trim() || 'Vignan';

    if (!DEPARTMENTS.includes(department)) {
      return res.status(400).json({ message: 'Invalid department selected.' });
    }

    if (!YEARS.includes(year)) {
      return res.status(400).json({ message: 'Invalid year selected.' });
    }

    const test = await getCachedQuizTest(uniqueLink);
    if (!test) {
      return res.status(404).json({ message: 'Test link is invalid.' });
    }

    if (!test.questionBank || !Array.isArray(test.questionBank.questions) || test.questionBank.questions.length === 0) {
      return res.status(400).json({ message: 'This test has no questions configured.' });
    }

    if (new Date() > new Date(test.linkExpiresAt)) return res.status(400).json({ message: 'This test link has expired.' });

    const existingAttempt = await Attempt.findOne({ test: test._id, studentRollNo: rollNo });
    if (existingAttempt) {
      return res.status(403).json({ message: 'Test taken already for this roll number.' });
    }
    
    let allQuestions = test.questionBank.questions;
    let randomizedQuestions = shuffleArray([...allQuestions]);
    let selectedQuestions = randomizedQuestions.slice(0, test.numQuestions);
    if (selectedQuestions.length === 0) {
      return res.status(400).json({ message: 'This test has no available questions.' });
    }

    const questionsForStudent = selectedQuestions.map((q) => {
      return {
        _id: q._id,
        questionText: q.questionText,
        imageUrl: q.imageUrl,
        options: shuffleArray([...q.options]),
      };
    });

    const newAttempt = new Attempt({
      test: test._id,
      studentName: name,
      studentRollNo: rollNo,
      studentDepartment: department,
      studentYear: year,
      studentSection: section,
      studentCollege: collegeName,
    });
    await newAttempt.save();

    res.json({
      attemptId: newAttempt._id,
      questions: questionsForStudent,
      duration: test.duration,
      startedAt: newAttempt.startedAt,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
        return res.status(403).json({ message: 'Test already taken.' });
    }
    res.status(500).json({ message: 'Server error starting test.' });
  }
});

// POST /api/test/submit (batch query)
router.post('/test/submit', async (req, res) => {
  try {
    const { attemptId, answers } = req.body; 
    if (!attemptId || !Array.isArray(answers)) {
        return res.status(400).json({ message: 'Missing attempt ID or answers.' });
    }
    
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found.' });
    if (attempt.submittedAt) return res.status(400).json({ message: 'Test already submitted.' });

    // Batch fetch all questions in a single query
    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

    let score = 0;
    let gradedAnswers = [];

    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (question) {
        const isCorrect = (question.correctAnswer === answer.selectedOption);
        if (isCorrect) score++;
        
        gradedAnswers.push({
          question: question._id,
          questionText: question.questionText,
          imageUrl: question.imageUrl,
          options: question.options,
          selectedOption: answer.selectedOption,
          correctAnswer: question.correctAnswer,
          isCorrect: isCorrect,
        });
      }
    }

    attempt.score = score;
    attempt.submittedAt = new Date();
    attempt.answers = gradedAnswers;
    await attempt.save();

    res.json({
      message: 'Test submitted successfully!',
      score: score,
      total: gradedAnswers.length,
      results: gradedAnswers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting test.' });
  }
});

router.post('/coding/student/start', async (req, res) => {
  try {
    let {
      uniqueLink,
      name,
      rollNo,
      department,
      year,
      section,
      collegeName,
    } = req.body;

    if (!uniqueLink || !name || !rollNo || !department || !year) {
      return res.status(400).json({ message: 'Name, Roll No, Department, and Year are required.' });
    }

    name = name.trim();
    rollNo = rollNo.trim().toUpperCase();
    department = department.trim();
    year = year.trim();
    section = (section || '').trim();
    collegeName = (collegeName || '').trim() || 'Vignan';

    if (!DEPARTMENTS.includes(department)) {
      return res.status(400).json({ message: 'Invalid department selected.' });
    }

    if (!YEARS.includes(year)) {
      return res.status(400).json({ message: 'Invalid year selected.' });
    }

    const codingTest = await CodingTest.findOne({ uniqueLink })
      .populate({
        path: 'codingBank',
        populate: { path: 'challenges' }
      })
      .lean();

    if (!codingTest) {
      return res.status(404).json({ message: 'Coding test link is invalid.' });
    }

    if (new Date() > new Date(codingTest.linkExpiresAt)) {
      return res.status(400).json({ message: 'This coding test link has expired.' });
    }

    const existingAttempt = await CodingAttempt.findOne({
      codingTest: codingTest._id,
      studentRollNo: rollNo,
    }).select('_id');

    if (existingAttempt) {
      return res.status(403).json({ message: 'Test already taken.' });
    }

    // New attempt - handle randomization
    let selectedChallenges = [];
    const allChallenges = (codingTest.codingBank && codingTest.codingBank.challenges) || [];

    if (codingTest.numChallenges > 0 && allChallenges.length > 0) {
      selectedChallenges = shuffleArray([...allChallenges]).slice(0, codingTest.numChallenges);
    } else {
      selectedChallenges = allChallenges;
    }

    if (selectedChallenges.length === 0) {
      return res.status(400).json({ message: 'No challenges available in this test.' });
    }

    // Create Draft Attempt
    const newAttempt = new CodingAttempt({
      studentName: name,
      studentRollNo: rollNo,
      studentDepartment: department,
      studentYear: year,
      studentSection: section,
      studentCollege: collegeName,
      codingTest: codingTest._id,
      answers: selectedChallenges.map(c => ({
        challenge: c._id,
        status: 'Unattempted'
      }))
    });
    await newAttempt.save();

    const questionsForStudent = selectedChallenges.map(c => ({
      id: c._id,
      title: c.title,
      difficulty: c.difficulty,
      description: c.description,
      sampleTest: (c.testCases || []).find(tc => !tc.isHidden) || null,
    }));

    res.json({
      message: 'Student details accepted. Test started.',
      student: {
        name,
        rollNo,
        department,
        year,
        section,
        collegeName,
      },
      challenges: questionsForStudent,
      durationMinutes: codingTest.durationMinutes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error starting coding test.' });
  }
});

// ===================================
// --- Results Routes (Protected) ---
// ===================================

// GET /api/tests/:testId/attempts
router.get('/tests/:testId/attempts', protect, async (req, res) => {
  try {
    const attempts = await Attempt.find({ test: req.params.testId })
        .select('studentRollNo score submittedAt')
        .sort({ score: -1, submittedAt: 1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attempts.' });
  }
});

// GET /api/tests/:testId/search
router.get('/tests/:testId/search', protect, async (req, res) => {
  try {
    let { rollNo } = req.query;
    if (!rollNo) {
        return res.status(400).json({ message: 'Roll No is required.' });
    }
    rollNo = rollNo.trim().toUpperCase();

    const attempts = await Attempt.find({
        test: req.params.testId,
        studentRollNo: { $regex: rollNo, $options: 'i' }
    }).sort({ score: -1, submittedAt: 1 });

    if (!attempts.length) {
        return res.status(404).json({ message: 'No attempts found for this Roll No.' });
    }
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Error searching attempts.' });
  }
});

// DELETE /api/tests/:testId
router.delete('/tests/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params;
    const deletedTest = await Test.findByIdAndDelete(testId);
    if (!deletedTest) {
      return res.status(404).json({ message: 'Test not found.' });
    }

    await Attempt.deleteMany({ test: testId });
    await invalidateQuestionData();

    res.json({ message: 'Test and related attempts deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting test.' });
  }
});

module.exports = router;
