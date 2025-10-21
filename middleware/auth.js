// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In a real app, this should be in a .env file
const JWT_SECRET = process.env.JWT_SECRET // Must be the same secret

const protect = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    // If it's an API request, send JSON
    if (req.originalUrl.startsWith('/api')) {
      return res.status(401).json({ message: 'Not authorized, no token.' });
    }
    // If it's a page request, redirect to a login page
    return res.redirect('/login'); 
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from the token and attach to request
    req.user = await User.findById(decoded.userId).select('-password');
    
    if (!req.user) {
        // User not found in DB
        // Clear the bad cookie
        res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
        if (req.originalUrl.startsWith('/api')) {
            return res.status(401).json({ message: 'Not authorized.' });
        }
        return res.redirect('/login');
    }
    
    next(); // Proceed to the protected route
  } catch (error) {
    // Token is invalid
    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
    return res.redirect('/login');
  }
};

module.exports = { protect };