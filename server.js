// server.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Import route files
const pageRoutes = require('./routes/pages');
const apiRoutes = require('./routes/api');

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.set('trust proxy', 1);

// --- Security & Performance Middleware ---
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for EJS inline scripts
}));
app.use(compression()); // Gzip all responses (~70% smaller)
app.use(morgan('short')); // HTTP request logging

// --- Parsing Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(async (req, res, next) => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  try {
    await connectDB();
    return next();
  } catch (err) {
    return next(err);
  }
});

// --- View Engine Setup (EJS) ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Static Folder Setup (with caching headers) ---
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  etag: true,
  lastModified: true,
}));

// Initialize DB connection immediately (Non-blocking for server startup)
// Mongoose buffers queries until the connection is established.
connectDB().catch(err => console.error('Initial DB connection error:', err.message));

// ===================================
// --- ROUTES ---
// ===================================
app.use('/', pageRoutes); 
app.use('/api', apiRoutes);

// --- Centralized Error Handler ---
app.use((err, req, res, next) => {
  console.error('--- ERROR LOG ---');
  console.error(err.stack);
  
  const statusCode = err.status || 500;
  const isApi = req.originalUrl.startsWith('/api');
  
  let message = err.message;
  if (process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }

  // Special handling for common DB errors
  if (err.name === 'MongooseServerSelectionError') {
    message = 'Database unreachable. Please check the network or Atlas IP allow-list.';
  } else if (err.message && err.message.includes('buffering timed out')) {
    message = 'Database operation timed out. The server is unable to complete your request right now.';
  }

  if (isApi) {
    return res.status(statusCode).json({
      message,
      error: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  }

  // For non-API routes, send a simple HTML response for now
  res.status(statusCode).send(`
    <div style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: auto; text-align: center;">
      <h1 style="color: #ef4444;">${statusCode} - Error</h1>
      <p style="color: #4b5563; font-size: 1.1rem;">${message}</p>
      <a href="/" style="display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 0.5rem;">Go back home</a>
    </div>
  `);
});

// --- Graceful Shutdown ---
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  const mongoose = require('mongoose');
  mongoose.connection.close(false).then(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// --- Start the Server only if not in Vercel environment ---
if (!process.env.VERCEL) {
  const startServer = async () => {
    try {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error.message);
      process.exit(1);
    }
  };

  startServer();
}

// Export the app for Vercel serverless functions
module.exports = app;
