// routes/codingStudent.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const CodingChallenge = require('../models/CodingChallenge');
const CodingAttempt = require('../models/CodingAttempt');
const CodingTest = require('../models/CodingTest');

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

// Rate limiting specifically to prevent DDoS on execution APIs
const executionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 8, // limit each IP to 8 executions per minute
  message: { message: 'Too many code runs right now. Please wait a minute before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Wandbox API mapping for languages
const WANDBOX_API_URL = 'https://wandbox.org/api/compile.json';
const LANGUAGE_MAP = {
  javascript: 'nodejs-20.17.0',
  cpp: 'gcc-13.2.0',
};

// Helper function to call Wandbox API with strict timeout
async function executeCode(code, language, input = "") {
  if (code.length > 50000) throw new Error('Code too large (Max 50KB limit)');

  const compiler = LANGUAGE_MAP[language];
  if (!compiler) throw new Error('Unsupported language');

  const payload = {
    code: code,
    compiler: compiler,
    stdin: input,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second kill switch

  try {
    const response = await fetch(WANDBOX_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error('Wandbox API Error:', errText);
      throw new Error('Code execution API failed: ' + errText);
    }
    
    const data = await response.json();
    
    if (data.status !== '0') {
      return {
        status: 'Compilation Error',
        output: data.compiler_error || data.program_error || data.compiler_message || 'Execution Error',
      };
    }

    const stdout = data.program_output || data.program_message || '';
    return { status: 'Success', output: String(stdout).trim() };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { status: 'Time Limit Exceeded', output: 'Execution Timed Out (Possible Infinite Loop detected)' };
    }
    throw err;
  }
}

// POST /api/coding/execute - Run test code without saving (for visible test cases)
router.post('/execute', executionLimiter, async (req, res) => {
  const { code, language, input } = req.body;
  if (!code || !language) return res.status(400).json({ message: 'Missing code or language' });

  try {
    const result = await executeCode(code, language, input);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Execution failed', error: err.message });
  }
});

// POST /api/coding/submit - Run against multiple challenges and save unified test attempt
router.post('/submit', executionLimiter, async (req, res) => {
  let {
    studentName,
    studentRollNo,
    studentDepartment,
    studentYear,
    studentSection,
    studentCollege,
    testId,
    submissions,
  } = req.body;
  // submissions: [ { challengeId, code, language } ]
  
  if (!studentName || !studentRollNo || !studentDepartment || !studentYear || !testId || !Array.isArray(submissions)) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  studentName = studentName.trim();
  studentRollNo = studentRollNo.trim().toUpperCase();
  studentDepartment = studentDepartment.trim();
  studentYear = studentYear.trim();
  studentSection = (studentSection || '').trim();
  studentCollege = (studentCollege || '').trim() || 'Vignan';

  if (!DEPARTMENTS.includes(studentDepartment)) {
    return res.status(400).json({ message: 'Invalid department selected.' });
  }

  if (!YEARS.includes(studentYear)) {
    return res.status(400).json({ message: 'Invalid year selected.' });
  }

  if (submissions.length === 0) {
    return res.status(400).json({ message: 'At least one submission is required' });
  }

  try {
    const codingTest = await CodingTest.findById(testId).populate('codingBank', 'challenges');
    if (!codingTest || !codingTest.codingBank) {
      return res.status(404).json({ message: 'Coding test not found' });
    }

    if (new Date() > codingTest.linkExpiresAt) {
      return res.status(400).json({ message: 'This coding test link has expired.' });
    }

    const allowedChallengeIds = new Set(
      (codingTest.codingBank.challenges || []).map((id) => id.toString()),
    );

    const requestedChallengeIds = submissions
      .map((sub) => sub.challengeId)
      .filter(Boolean)
      .map((id) => id.toString());

    const uniqueRequestedChallengeIds = [...new Set(requestedChallengeIds)];
    const fetchedChallenges = await CodingChallenge.find({ _id: { $in: uniqueRequestedChallengeIds } });
    const challengeMap = new Map(fetchedChallenges.map((challenge) => [challenge._id.toString(), challenge]));

    // Process challenges in parallel with concurrency limit to avoid overwhelming Wandbox
    const CONCURRENCY_LIMIT = 2;
    const finalAnswers = [];
    
    // Helper to evaluate a single submission
    const evaluateSubmission = async (sub) => {
      if (!sub.challengeId || !allowedChallengeIds.has(sub.challengeId.toString())) {
        return null;
      }

      if (!sub.code || sub.code.trim() === '') {
        return {
          challenge: sub.challengeId,
          code: '', language: sub.language,
          status: 'Unattempted', passedCases: 0, totalCases: 0
        };
      }
      
      const challenge = challengeMap.get(sub.challengeId.toString());
      if (!challenge) return null;

      let passedCases = 0;
      let finalStatus = 'Accepted';

      // Run test cases sequentially per challenge (they depend on same code)
      for (const testCase of challenge.testCases) {
        try {
          const result = await executeCode(sub.code, sub.language, testCase.input);
          
          if (result.status === 'Compilation Error') {
            finalStatus = 'Compilation Error'; break;
          }
          if (result.status === 'Time Limit Exceeded') {
            finalStatus = 'Time Limit Exceeded'; break;
          }
          if (result.output === testCase.expectedOutput.trim()) {
            passedCases++;
          } else {
            finalStatus = 'Wrong Answer';
          }
        } catch(e) {
          finalStatus = 'Runtime Error'; break;
        }
      }

      return {
        challenge: sub.challengeId,
        code: sub.code,
        language: sub.language,
        status: finalStatus,
        passedCases,
        totalCases: challenge.testCases.length
      };
    };

    // Process submissions with controlled concurrency
    for (let i = 0; i < submissions.length; i += CONCURRENCY_LIMIT) {
      const batch = submissions.slice(i, i + CONCURRENCY_LIMIT);
      const results = await Promise.all(batch.map(evaluateSubmission));
      finalAnswers.push(...results.filter(Boolean));
    }

    // Save Unified Attempt to DB - Update existing draft if found
    let attempt = await CodingAttempt.findOne({
      studentRollNo,
      codingTest: testId,
    });

    if (attempt) {
      attempt.answers = finalAnswers;
      await attempt.save();
    } else {
      attempt = new CodingAttempt({
        studentName,
        studentRollNo,
        studentDepartment,
        studentYear,
        studentSection,
        studentCollege,
        codingTest: testId,
        answers: finalAnswers
      });
      await attempt.save();
    }

    // Invalidate cached pages so admin results page shows new submission
    const { invalidatePages } = require('../utils/cache');
    await invalidatePages();

    res.json({ message: 'Test submitted successfully', result: finalAnswers });

  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'You have already submitted this test.' });
    console.error(err);
    res.status(500).json({ message: 'Execution failed', error: err.message });
  }
});

module.exports = router;
