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
  console.error(err.stack);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
  });
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
