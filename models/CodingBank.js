// models/CodingBank.js
const mongoose = require('mongoose');

const codingBankSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
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

module.exports = mongoose.model('CodingBank', codingBankSchema);
