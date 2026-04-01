// models/CodingChallenge.js
const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
});

const codingChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy',
  },
  testCases: [testCaseSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for sorting
codingChallengeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CodingChallenge', codingChallengeSchema);
