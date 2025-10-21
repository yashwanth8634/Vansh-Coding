// server.js
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db'); // Import DB connection
const ipAddress = '192.168.4.123';

// Import route files
const pageRoutes = require('./routes/pages');
const apiRoutes = require('./routes/api');

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Connect to Database ---
connectDB();

// --- Middleware ---
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: false })); // To parse URL-encoded forms
app.use(cookieParser()); // To parse cookies

// --- View Engine Setup (EJS) ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Static Folder Setup (public) ---
app.use(express.static(path.join(__dirname, 'public')));

// ===================================
// --- ROUTES ---
// ===================================

// Use the imported route files
// All EJS page-rendering routes will be handled by 'pageRoutes'
app.use('/', pageRoutes); 

// All API routes will be prefixed with '/api'
app.use('/api', apiRoutes);

// ===================================

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});