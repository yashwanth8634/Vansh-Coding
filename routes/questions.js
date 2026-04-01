// routes/questions.js
// Question CRUD routes (update, delete)
const express = require('express');
const router = express.Router();

const Question = require('../models/Question');
const QuestionBank = require('../models/QuestionBank');

const { protect } = require('../middleware/auth');
const { invalidateQuestionData } = require('../utils/cache');

// PUT /api/questions/:questionId
router.put('/:questionId', protect, async (req, res) => {
    try {
        const { questionId } = req.params;
        const questionText = (req.body.questionText || '').trim();
        const imageUrl = (req.body.imageUrl || '').trim();
        const options = Array.isArray(req.body.options)
          ? req.body.options.map((option) => String(option || '').trim())
          : [];
        const correctAnswer = String(req.body.correctAnswer || '').trim();

        if (!questionText) {
            return res.status(400).json({ message: 'Question text is required.' });
        }

        if (options.length !== 4 || options.some((option) => !option)) {
            return res.status(400).json({ message: 'Exactly four non-empty options are required.' });
        }

        if (!options || !options.includes(correctAnswer)) {
            return res.status(400).json({ message: 'The correct answer must be one of the provided options.' });
        }

        const updatedQuestion = await Question.findByIdAndUpdate(
            questionId,
            { questionText, options, correctAnswer, imageUrl: imageUrl || null },
            { new: true } 
        );

        if (!updatedQuestion) {
            return res.status(404).json({ message: 'Question not found.' });
        }
        
        await invalidateQuestionData();
        
        res.json(updatedQuestion);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while updating question.' });
    }
});

// DELETE /api/questions/:questionId
router.delete('/:questionId', protect, async (req, res) => {
    try {
        const { questionId } = req.params;

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question not found.' });
        }

        const bank = await QuestionBank.findOne({ questions: questionId });
        if (bank) {
            bank.questions.pull(questionId);
            await bank.save();
        }

        await Question.findByIdAndDelete(questionId);

        await invalidateQuestionData();

        res.json({ message: 'Question deleted successfully.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while deleting question.' });
    }
});

module.exports = router;
