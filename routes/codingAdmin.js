// routes/codingAdmin.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const CodingChallenge = require('../models/CodingChallenge');
const CodingBank = require('../models/CodingBank');
const CodingTest = require('../models/CodingTest');
const CodingAttempt = require('../models/CodingAttempt');
const { caches } = require('../utils/cache');
const { v4: uuidv4 } = require('uuid');

// Create Challenge
router.post('/create', protect, async (req, res) => {
  try {
    const { title, description, difficulty, testCases } = req.body;
    const newChallenge = new CodingChallenge({
      title,
      description,
      difficulty,
      testCases,
    });
    await newChallenge.save();
    caches.pages.del('admin-coding'); // clear admin page cache
    res.status(201).json({ message: 'Challenge created successfully', challenge: newChallenge });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) return res.status(400).json({ message: 'Challenge title must be unique.' });
    res.status(500).json({ message: 'Error creating challenge' });
  }
});

// Delete Challenge
router.delete('/:id', protect, async (req, res) => {
  try {
    const challenge = await CodingChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    await CodingChallenge.findByIdAndDelete(req.params.id);
    await CodingBank.updateMany(
      { challenges: req.params.id },
      { $pull: { challenges: req.params.id } },
    );
    caches.pages.del('admin-coding');
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting challenge' });
  }
});

// ---------------- CODING BANKS ----------------

// Create Bank
router.post('/banks', protect, async (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    const description = (req.body.description || '').trim();

    if (!title) {
      return res.status(400).json({ message: 'Bank title is required.' });
    }

    const newBank = new CodingBank({ title, description: description || undefined, challenges: [] });
    await newBank.save();
    res.status(201).json({ message: 'Bank created successfully', bank: newBank });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) return res.status(400).json({ message: 'Bank title must be unique.' });
    res.status(500).json({ message: 'Error creating coding bank' });
  }
});

// Delete Bank
router.delete('/banks/:id', protect, async (req, res) => {
  try {
    const bank = await CodingBank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }

    const activeTests = await CodingTest.countDocuments({ codingBank: req.params.id });
    if (activeTests > 0) {
      return res.status(400).json({ message: `Cannot delete bank. It is used by ${activeTests} active test(s).` });
    }

    await CodingBank.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bank deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coding bank' });
  }
});

// Add Challenge to Bank
router.post('/banks/:bankId/challenges', protect, async (req, res) => {
  try {
    const { challengeId } = req.body;
    if (!challengeId) {
      return res.status(400).json({ message: 'challengeId is required' });
    }

    const bank = await CodingBank.findById(req.params.bankId);
    if (!bank) return res.status(404).json({ message: 'Bank not found' });

    const challenge = await CodingChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    const alreadyAdded = bank.challenges.some((id) => id.toString() === challengeId.toString());
    if (!alreadyAdded) {
      bank.challenges.push(challengeId);
      await bank.save();
    }
    res.json({ message: 'Challenge added to bank', bank });
  } catch (error) {
    res.status(500).json({ message: 'Error adding challenge to bank' });
  }
});

// Remove Challenge from Bank
router.delete('/banks/:bankId/challenges/:challengeId', protect, async (req, res) => {
  try {
    const bank = await CodingBank.findById(req.params.bankId);
    if (!bank) return res.status(404).json({ message: 'Bank not found' });
    
    bank.challenges = bank.challenges.filter(id => id.toString() !== req.params.challengeId);
    await bank.save();
    res.json({ message: 'Challenge removed from bank', bank });
  } catch (error) {
    res.status(500).json({ message: 'Error removing challenge from bank' });
  }
});

// ---------------- CODING TESTS (LINKS) ----------------

// Create Test (Link)
router.post('/tests', protect, async (req, res) => {
  try {
    const { codingBankId, validityHours, durationMinutes } = req.body;
    const parsedValidityHours = Number.parseInt(validityHours, 10);
    const parsedDurationMinutes = Number.parseInt(durationMinutes, 10);
    if (!codingBankId || Number.isNaN(parsedValidityHours) || parsedValidityHours <= 0) {
      return res.status(400).json({ message: 'Invalid codingBankId or validityHours.' });
    }

    if (Number.isNaN(parsedDurationMinutes) || parsedDurationMinutes <= 0) {
      return res.status(400).json({ message: 'Invalid durationMinutes.' });
    }

    const bank = await CodingBank.findById(codingBankId);
    if (!bank) {
      return res.status(404).json({ message: 'Coding bank not found' });
    }

    if (!bank.challenges || bank.challenges.length === 0) {
      return res.status(400).json({ message: 'Cannot create test from an empty coding bank' });
    }

    const expiresAt = new Date(Date.now() + parsedValidityHours * 60 * 60 * 1000);
    const uniqueLink = uuidv4().slice(0, 8); 

    const newTest = new CodingTest({
      codingBank: codingBankId,
      uniqueLink,
      linkExpiresAt: expiresAt,
      durationMinutes: parsedDurationMinutes,
    });
    await newTest.save();
    res.status(201).json({ message: 'Test link generated', test: newTest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating test link' });
  }
});

// Delete Test
router.delete('/tests/:id', protect, async (req, res) => {
  try {
    await CodingTest.findByIdAndDelete(req.params.id);
    await CodingAttempt.deleteMany({ codingTest: req.params.id }); 
    res.json({ message: 'Test and attempts deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting test' });
  }
});

module.exports = router;
