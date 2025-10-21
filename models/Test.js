// models/Test.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const testSchema = new mongoose.Schema({
  questionBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionBank',
    required: true,
  },
  numQuestions: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  uniqueLink: {
    type: String,
    default: () => uuidv4(),
    unique: true, // <-- This line creates the index. It's all you need.
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  linkExpiresAt: {
    type: Date,
    required: true,
  },
});

// --- REMOVE THIS LINE ---
// testSchema.index({ uniqueLink: 1 }); // This was the duplicate
// --- END OF CHANGE ---

module.exports = mongoose.model('Test', testSchema);