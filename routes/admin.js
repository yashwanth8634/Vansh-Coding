// routes/admin.js
// Admin authentication routes (register, login, logout)
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

// Rate limiting for auth routes (10 attempts per 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/admin/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured.');
      return res.status(500).json({ message: 'Authentication is not configured.' });
    }

    const existingUser = await User.findOne();
    if (existingUser) {
        return res.status(403).json({ 
            message: 'Registration is disabled. An admin account already exists.' 
        });
    }

    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }
    
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'Admin registered successfully. Registration is now closed.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to register admin.' });
  }
});

// POST /api/admin/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured.');
      return res.status(500).json({ message: 'Authentication is not configured.' });
    }

    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

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
      sameSite: 'strict',
      maxAge: 3600 * 1000,
    });

    res.json({ message: 'Logged in successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to log in right now.' });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
  });

  if (req.accepts('json') && !req.accepts('html')) {
    return res.json({ message: 'Logged out successfully.', redirectTo: '/' });
  }

  return res.redirect('/');
});

module.exports = router;
