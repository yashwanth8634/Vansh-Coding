// routes/api.js
// Thin aggregator — mounts all API sub-routers
const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin');
const testRoutes = require('./test');
const questionRoutes = require('./questions');
const codingAdminRoutes = require('./codingAdmin');
const codingStudentRoutes = require('./codingStudent');

// Mount sub-routers at their respective prefixes
router.use('/admin', adminRoutes);       // /api/admin/*
router.use('/', testRoutes);             // /api/banks/*, /api/tests/*, /api/test/*
router.use('/questions', questionRoutes); // /api/questions/*
router.use('/coding/admin', codingAdminRoutes); // /api/coding/admin/*
router.use('/coding/student', codingStudentRoutes); // /api/coding/student/*

module.exports = router;