// models/CodingAttempt.js
const mongoose = require('mongoose');

const codingAnswerSchema = new mongoose.Schema({
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingChallenge',
    required: true,
  },
  code: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  status: {
    type: String,
    enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Compilation Error', 'Runtime Error', 'Pending', 'Unattempted'],
    default: 'Unattempted',
  },
  passedCases: { type: Number, default: 0 },
  totalCases: { type: Number, default: 0 },
});

const codingAttemptSchema = new mongoose.Schema({
  studentRollNo: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  codingTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingTest',
    required: true,
  },
  answers: [codingAnswerSchema], // array of submissions for each challenge in the test
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for fast lookups
codingAttemptSchema.index({ studentRollNo: 1, codingTest: 1 }, { unique: true });

module.exports = mongoose.model('CodingAttempt', codingAttemptSchema);
