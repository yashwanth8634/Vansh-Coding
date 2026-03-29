// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { caches } = require('../utils/cache');

const JWT_SECRET = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(401).json({ message: 'Not authorized, no token.' });
    }
    return res.redirect('/login'); 
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check user cache first, then DB
    const cacheKey = `user-${decoded.userId}`;
    let user = await caches.user.get(cacheKey);
    
    if (!user) {
      user = await User.findById(decoded.userId).select('-password');
      if (user) {
        await caches.user.set(cacheKey, user);
      }
    }
    
    req.user = user;
    
    if (!req.user) {
        res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
        if (req.originalUrl.startsWith('/api')) {
            return res.status(401).json({ message: 'Not authorized.' });
        }
        return res.redirect('/login');
    }
    
    next();
  } catch (error) {
    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
    return res.redirect('/login');
  }
};

module.exports = { protect };