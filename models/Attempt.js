// models/Attempt.js
const mongoose = require('mongoose');

const DEPARTMENTS = [
  'CSE',
  'CSE(AI&ML)',
  'CSE(DS)',
  'IT',
  'ECE',
  'EEE',
  'CIVIL',
  'MECH',
  'EIE',
  'AI&DS',
  'AI&ML',
];

const YEARS = ['1', '2', '3', '4'];

const attemptSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  studentRollNo: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  studentDepartment: {
    type: String,
    required: true,
    trim: true,
    enum: DEPARTMENTS,
  },
  studentYear: {
    type: String,
    required: true,
    trim: true,
    enum: YEARS,
  },
  studentSection: {
    type: String,
    trim: true,
    default: '',
  },
  studentCollege: {
    type: String,
    trim: true,
    default: 'Vignan',
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
