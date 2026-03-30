// routes/api.js
// Thin aggregator — mounts all API sub-routers
const express = require('express');
const router = express.Router();
const connectDB = require('../config/db');
const { caches } = require('../utils/cache');

const adminRoutes = require('./admin');
const testRoutes = require('./test');
const questionRoutes = require('./questions');
const codingAdminRoutes = require('./codingAdmin');
const codingStudentRoutes = require('./codingStudent');
const healthRoutes = require('./health');

// Mount sub-routers at their respective prefixes
router.use('/admin', adminRoutes);       // /api/admin/*
router.use('/', testRoutes);             // /api/banks/*, /api/tests/*, /api/test/*
router.use('/questions', questionRoutes); // /api/questions/*
router.use('/coding/admin', codingAdminRoutes); // /api/coding/admin/*
router.use('/coding/student', codingStudentRoutes); // /api/coding/student/*
router.use('/', healthRoutes);           // /api/health

router.get('/warmup', async (req, res) => {
  try {
    await connectDB();
    res.json({
      message: 'Warmup complete.',
      cacheKeys: {
        test: (await caches.test.keys()).length,
        codingTest: (await caches.codingTest.keys()).length,
        pages: (await caches.pages.keys()).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Warmup failed:', error);
    res.status(500).json({ message: 'Warmup failed.' });
  }
});

module.exports = router;
