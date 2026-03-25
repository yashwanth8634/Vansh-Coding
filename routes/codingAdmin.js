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
    await CodingChallenge.findByIdAndDelete(req.params.id);
    caches.pages.del('admin-coding');
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting challenge' });
  }
});

// ---------------- CODING BANKS ----------------

// Create Bank
router.post('/bank/create', protect, async (req, res) => {
  try {
    const { title, challenges } = req.body;
    const newBank = new CodingBank({ title, challenges: challenges || [] });
    await newBank.save();
    res.status(201).json({ message: 'Bank created successfully', bank: newBank });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) return res.status(400).json({ message: 'Bank title must be unique.' });
    res.status(500).json({ message: 'Error creating coding bank' });
  }
});

// Delete Bank
router.delete('/bank/:id', protect, async (req, res) => {
  try {
    await CodingBank.findByIdAndDelete(req.params.id);
    // Optional: cascade delete associated tests
    res.json({ message: 'Bank deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coding bank' });
  }
});

// ---------------- CODING TESTS (LINKS) ----------------

// Create Test (Link)
router.post('/test/create', protect, async (req, res) => {
  try {
    const { codingBankId, validityHours } = req.body;
    const expiresAt = new Date(Date.now() + parseInt(validityHours) * 60 * 60 * 1000);
    const uniqueLink = uuidv4().slice(0, 8); // e.g. "a1b2c3d4"

    const newTest = new CodingTest({
      codingBank: codingBankId,
      uniqueLink,
      linkExpiresAt: expiresAt,
    });
    await newTest.save();
    res.status(201).json({ message: 'Test link generated', test: newTest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating test link' });
  }
});

// Delete Test
router.delete('/test/:id', protect, async (req, res) => {
  try {
    await CodingTest.findByIdAndDelete(req.params.id);
    await CodingAttempt.deleteMany({ codingTest: req.params.id }); 
    res.json({ message: 'Test and attempts deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting test' });
  }
});

module.exports = router;
