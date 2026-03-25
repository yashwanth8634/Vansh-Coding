// models/CodingTest.js
const mongoose = require('mongoose');

const codingTestSchema = new mongoose.Schema({
  codingBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingBank',
    required: true,
  },
  uniqueLink: {
    type: String,
    required: true,
    unique: true,
  },
  linkExpiresAt: {
    type: Date,
    required: true,
  },
  durationMinutes: {
    type: Number,
    default: 30,
    min: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CodingTest', codingTestSchema);
