// models/Question.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  // --- NEW FIELD ---
  imageUrl: {
    type: String, // We will store a URL
    default: null,
  },
  // --- END NEW FIELD ---
  options: [
    {
      type: String,
      required: true,
    },
  ],
  correctAnswer: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Question', questionSchema);