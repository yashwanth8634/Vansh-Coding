const mongoose = require('mongoose');
const CodingChallenge = require('./models/CodingChallenge');
require('dotenv').config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Clear old tests
    await CodingChallenge.deleteMany({ title: 'Two Sum' });

    const challenge = new CodingChallenge({
      title: 'Two Sum',
      difficulty: 'Easy',
      description: '### Two Sum\n\nGiven an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nInput format: The first line contains the array numbers separated by spaces. The second line contains the target.\nOutput format: Print the two indices separated by a space.',
      testCases: [
        {
          input: '2 7 11 15\n9',
          expectedOutput: '0 1',
          isHidden: false
        },
        {
          input: '3 2 4\n6',
          expectedOutput: '1 2',
          isHidden: true
        },
        {
          input: '3 3\n6',
          expectedOutput: '0 1',
          isHidden: true
        }
      ]
    });

    await challenge.save();
    console.log(`CHALLENGE_ID=${challenge._id}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
