// config/db.js
const mongoose = require('mongoose');

// In a real app, this should be an environment variable
const MONGO_URI = process.env.MONGO_URI

const connectDB = async () => {
  try {
    // Mongoose connection options
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    // Exit process with failure
    process.exit(1); 
  }
};

module.exports = connectDB;