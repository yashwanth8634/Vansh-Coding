// routes/api.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');

// Import Models
const User = require('../models/User');
const Question = require('../models/Question');
const QuestionBank = require('../models/QuestionBank');
const Test = require('../models/Test');
const Attempt = require('../models/Attempt');

// Import Helpers & Auth
const { shuffleArray } = require('../utils/helpers');
const { protect } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key'; 
const testCache = new NodeCache({ stdTTL: 3600 });

// ===================================
// --- Admin Auth Routes (Public) ---
// ===================================

// POST /api/admin/register
router.post('/admin/register', async (req, res) => {
  try {
    const existingUser = await User.findOne();
    if (existingUser) {
        return res.status(403).json({ 
            message: 'Registration is disabled. An admin account already exists.' 
        });
    }

    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }
    
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'Admin registered successfully. Registration is now closed.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600 * 1000,
    });

    res.json({ message: 'Logged in successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/logout
router.post('/admin/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ message: 'Logged out successfully.' });
});

// ===================================
// --- Question Bank Routes (Protected) ---
// ===================================

// POST /api/banks
router.post('/banks', protect, async (req, res) => {
  try {
    const { title } = req.body;
    const newBank = new QuestionBank({ title });
    await newBank.save();
    res.status(201).json(newBank);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/banks/:bankId/questions (UPDATED)
router.post('/banks/:bankId/questions', protect, async (req, res) => {
  try {
    const { questionText, options, correctAnswer, imageUrl } = req.body; // Added imageUrl
    const bank = await QuestionBank.findById(req.params.bankId);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }
    const newQuestion = new Question({ 
      questionText, 
      options, 
      correctAnswer, 
      imageUrl // Added imageUrl
    });
    await newQuestion.save();
    bank.questions.push(newQuestion._id);
    await bank.save();
    
    testCache.flushAll();
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/banks
router.get('/banks', protect, async (req, res) => {
  try {
    const banks = await QuestionBank.find().select('title _id');
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
        
        testCache.flushAll();
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
    const bank = await QuestionBank.findById(questionBankId).populate('questions');
    if (!bank) {
      return res.status(404).json({ message: 'Question bank not found' });
    }
    if (bank.questions.length < numQuestions) {
        return res.status(400).json({ message: `Bank only has ${bank.questions.length} questions.` });
    }
    
    const expires = new Date();
    expires.setHours(expires.getHours() + parseInt(linkExpiryHours, 10));

    const newTest = new Test({
      questionBank: questionBankId,
      numQuestions,
      duration,
      linkExpiresAt: expires,
    });
    await newTest.save();

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

// POST /api/test/start
router.post('/test/start', async (req, res) => {
  try {
    let { uniqueLink, rollNo } = req.body;
    if (!uniqueLink || !rollNo) {
      return res.status(400).json({ message: 'Link and Roll No are required.' });
    }
    rollNo = rollNo.trim().toLowerCase();

    const cacheKey = `test-${uniqueLink}`;
    let cachedTest = testCache.get(cacheKey);
    let test;

    if (cachedTest) {
      test = cachedTest;
    } else {
      test = await Test.findOne({ uniqueLink }).populate({
        path: 'questionBank',
        populate: { path: 'questions', model: 'Question' },
      });

      if (!test) return res.status(404).json({ message: 'Test link is invalid.' });
      testCache.set(cacheKey, test);
    }

    if (new Date() > new Date(test.linkExpiresAt)) return res.status(400).json({ message: 'This test link has expired.' });

    const existingAttempt = await Attempt.findOne({ test: test._id, studentRollNo: rollNo });
    if (existingAttempt) {
      return res.status(403).json({ message: 'You have already attempted this test.' });
    }
    
    let allQuestions = test.questionBank.questions;
    let randomizedQuestions = shuffleArray([...allQuestions]);
    let selectedQuestions = randomizedQuestions.slice(0, test.numQuestions);

    const questionsForStudent = selectedQuestions.map((q) => {
      const questionData = q.toObject ? q.toObject() : q; 
      return {
        _id: questionData._id,
        questionText: questionData.questionText,
        imageUrl: questionData.imageUrl, // Send image to student
        options: shuffleArray([...questionData.options]),
      };
    });

    const newAttempt = new Attempt({ test: test._id, studentRollNo: rollNo });
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
        return res.status(403).json({ message: 'You have already attempted this test.' });
    }
    res.status(500).json({ message: 'Server error starting test.' });
  }
});

// POST /api/test/submit (UPDATED)
router.post('/test/submit', async (req, res) => {
  try {
    const { attemptId, answers } = req.body; 
    if (!attemptId || !answers) {
        return res.status(400).json({ message: 'Missing attempt ID or answers.' });
    }
    
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found.' });
    if (attempt.submittedAt) return res.status(400).json({ message: 'Test already submitted.' });

    let score = 0;
    let gradedAnswers = [];

    for (const answer of answers) {
      const question = await Question.findById(answer.questionId);
      if (question) {
        const isCorrect = (question.correctAnswer === answer.selectedOption);
        if (isCorrect) score++;
        
        gradedAnswers.push({
          question: question._id,
          questionText: question.questionText,
          imageUrl: question.imageUrl, // Added imageUrl
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
    console.error(error)
    res.status(500).json({ message: 'Error submitting test.' });
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
        .sort({ score: -1 });
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
    rollNo = rollNo.trim().toLowerCase();

    const attempts = await Attempt.find({
        test: req.params.testId,
        studentRollNo: { $regex: rollNo, $options: 'i' }
    });

    if (!attempts.length) {
        return res.status(404).json({ message: 'No attempts found for this Roll No.' });
    }
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Error searching attempts.' });
  }
});

// ===================================
// --- Question Update Route (Protected) ---
// ===================================

// PUT /api/questions/:questionId (UPDATED)
router.put('/questions/:questionId', protect, async (req, res) => {
    try {
        const { questionId } = req.params;
        const { questionText, options, correctAnswer, imageUrl } = req.body; // Added imageUrl

        if (!options || !options.includes(correctAnswer)) {
            return res.status(400).json({ message: 'The correct answer must be one of the provided options.' });
        }

        const updatedQuestion = await Question.findByIdAndUpdate(
            questionId,
            {
                questionText,
                options,
                correctAnswer,
                imageUrl // Added imageUrl
            },
            { new: true } 
        );

        if (!updatedQuestion) {
            return res.status(404).json({ message: 'Question not found.' });
        }
        
        testCache.flushAll();
        res.json(updatedQuestion);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while updating question.' });
    }
});

router.delete('/questions/:questionId', protect, async (req, res) => {
    try {
        const { questionId } = req.params;

        // 1. Find the question to make sure it exists
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question not found.' });
        }

        // 2. Find the Question Bank that contains this question
        //    (We need to remove the reference from the bank)
        const bank = await QuestionBank.findOne({ questions: questionId });
        if (bank) {
            // Remove the question ID from the bank's 'questions' array
            bank.questions.pull(questionId);
            await bank.save();
        }

        // 3. Delete the Question document itself
        await Question.findByIdAndDelete(questionId);

        // 4. Clear the cache as deleting a question affects tests
        testCache.flushAll();

        res.json({ message: 'Question deleted successfully.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while deleting question.' });
    }
});

module.exports = router;