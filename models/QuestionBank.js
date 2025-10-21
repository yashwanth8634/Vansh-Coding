// models/QuestionBank.js
const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  // This stores an array of Question IDs
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question', // This tells Mongoose to link to the 'Question' model
    },
  ],
});

module.exports = mongoose.model('QuestionBank', questionBankSchema);