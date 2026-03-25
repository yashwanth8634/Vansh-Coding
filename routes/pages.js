// routes/pages.js
// Thin aggregator — mounts all page-rendering sub-routers
const express = require('express');
const router = express.Router();

const adminPages = require('./adminPages');
const testPages = require('./testPages');

// GET / - Homepage Marketing Landing
router.get('/', (req, res) => {
  res.render('index');
});

// GET /login - Show the admin login page
router.get('/login', (req, res) => {
  if (req.cookies.token) {
    return res.redirect('/admin');
  }
  res.render('login');
});

// Mount sub-routers
router.use('/admin', adminPages);  // /admin, /admin/bank/:bankId
router.use('/', testPages);        // /admin/test/:testId/results, /test/:link

module.exports = router;