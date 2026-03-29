// models/CodingAttempt.js
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
