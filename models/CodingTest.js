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
    index: true,
  },
  durationMinutes: {
    type: Number,
    default: 30,
    min: 1,
  },
}, { timestamps: true });

codingTestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CodingTest', codingTestSchema);
