// routes/codingStudent.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const CodingChallenge = require('../models/CodingChallenge');
const CodingAttempt = require('../models/CodingAttempt');

// Rate limiting specifically to prevent DDoS on execution APIs
const executionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // limit each IP to 15 executions per minute
  message: { message: 'Too many run attempts. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Wandbox API mapping for languages
const WANDBOX_API_URL = 'https://wandbox.org/api/compile.json';
const LANGUAGE_MAP = {
  javascript: 'nodejs-16.14.0',
  python: 'cpython-3.10.2',
  java: 'openjdk-jdk-15.0.3+2',
  cpp: 'gcc-12.1.0',
  c: 'gcc-12.1.0-c',
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
      return { status: 'Compilation Error', output: data.compiler_error || data.program_error || 'Execution Error' };
    }
    return { status: 'Success', output: (data.program_message || '').trim() };
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
  const { studentRollNo, testId, submissions } = req.body;
  // submissions: [ { challengeId, code, language } ]
  
  if (!studentRollNo || !testId || !submissions) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const finalAnswers = [];
    
    // Evaluate each submission sequentially to respect Wandbox compiler limits
    for (const sub of submissions) {
      if (!sub.code || sub.code.trim() === '') {
        finalAnswers.push({
          challenge: sub.challengeId,
          code: '', language: sub.language,
          status: 'Unattempted', passedCases: 0, totalCases: 0
        });
        continue;
      }
      
      const challenge = await CodingChallenge.findById(sub.challengeId);
      if (!challenge) continue;

      let passedCases = 0;
      let finalStatus = 'Accepted';

      for (const testCase of challenge.testCases) {
        try {
          const result = await executeCode(sub.code, sub.language, testCase.input);
          
          if (result.status === 'Compilation Error') {
            finalStatus = 'Compilation Error'; break;
          }
          if (result.output === testCase.expectedOutput.trim()) {
            passedCases++;
          } else {
            finalStatus = 'Wrong Answer'; break; 
          }
        } catch(e) {
          finalStatus = 'Runtime Error'; break;
        }
      }

      finalAnswers.push({
        challenge: sub.challengeId,
        code: sub.code,
        language: sub.language,
        status: finalStatus,
        passedCases,
        totalCases: challenge.testCases.length
      });
    }

    // Save Unified Attempt to DB
    const attempt = new CodingAttempt({
      studentRollNo,
      codingTest: testId,
      answers: finalAnswers
    });
    await attempt.save();

    res.json({ message: 'Test submitted successfully', result: finalAnswers });

  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'You have already submitted this test.' });
    console.error(err);
    res.status(500).json({ message: 'Execution failed', error: err.message });
  }
});

module.exports = router;
