// models/CodingBank.js
const mongoose = require('mongoose');

const codingBankSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: false,
  },
  challenges: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingChallenge',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for sorting and lookup
codingBankSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CodingBank', codingBankSchema);
