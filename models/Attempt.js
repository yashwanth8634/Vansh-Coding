// models/Attempt.js
const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
  },
  studentRollNo: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  score: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  submittedAt: {
    type: Date,
  },
  
  answers: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      questionText: String,
      // --- NEW FIELD ---
      imageUrl: String,
      // --- END NEW FIELD ---
      options: [String],
      selectedOption: String,
      correctAnswer: String,
      isCorrect: Boolean,
    },
  ],
});

// Indexes
attemptSchema.index({ test: 1, studentRollNo: 1 }, { unique: true });
attemptSchema.index({ test: 1, score: -1 });
attemptSchema.index({ test: 1, submittedAt: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);