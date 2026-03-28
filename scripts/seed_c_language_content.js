require('dotenv').config();

const mongoose = require('mongoose');

const connectDB = require('../config/db');
const Question = require('../models/Question');
const QuestionBank = require('../models/QuestionBank');
const CodingChallenge = require('../models/CodingChallenge');
const CodingBank = require('../models/CodingBank');

const quizBankTitle = 'C Language Fundamentals 50 Questions';
const codingBankTitle = 'Easy Coding Practice Set';

const cQuestions = [
  {
    questionText: 'Who developed the C programming language?',
    options: ['Dennis Ritchie', 'Bjarne Stroustrup', 'James Gosling', 'Guido van Rossum'],
    correctAnswer: 'Dennis Ritchie',
  },
  {
    questionText: 'C language was primarily developed at which organization?',
    options: ['Bell Labs', 'Microsoft', 'IBM', 'Sun Microsystems'],
    correctAnswer: 'Bell Labs',
  },
  {
    questionText: 'Which header file is required for printf() and scanf()?',
    options: ['stdio.h', 'conio.h', 'stdlib.h', 'string.h'],
    correctAnswer: 'stdio.h',
  },
  {
    questionText: 'Which of the following is the correct syntax to declare an integer variable in C?',
    options: ['int a;', 'integer a;', 'a int;', 'num a;'],
    correctAnswer: 'int a;',
  },
  {
    questionText: 'Which symbol is used to end a statement in C?',
    options: [';', ':', '.', ','],
    correctAnswer: ';',
  },
  {
    questionText: 'What is the default return type of main() in standard C?',
    options: ['int', 'void', 'char', 'float'],
    correctAnswer: 'int',
  },
  {
    questionText: 'Which format specifier is used to print an integer?',
    options: ['%d', '%f', '%c', '%s'],
    correctAnswer: '%d',
  },
  {
    questionText: 'Which format specifier is used for a float value?',
    options: ['%f', '%d', '%s', '%lf'],
    correctAnswer: '%f',
  },
  {
    questionText: 'Which data type stores a single character in C?',
    options: ['char', 'string', 'character', 'byte'],
    correctAnswer: 'char',
  },
  {
    questionText: 'Which keyword is used to define a constant value in C?',
    options: ['const', 'static', 'fixed', 'define'],
    correctAnswer: 'const',
  },
  {
    questionText: 'Which preprocessor directive is used to include a header file?',
    options: ['#include', '#define', '#ifdef', '#pragma'],
    correctAnswer: '#include',
  },
  {
    questionText: 'Which operator is used to get the address of a variable?',
    options: ['&', '*', '%', '@'],
    correctAnswer: '&',
  },
  {
    questionText: 'Which operator is used to access the value stored at an address?',
    options: ['*', '&', '->', '.'],
    correctAnswer: '*',
  },
  {
    questionText: 'How many times will the body of while(0) execute?',
    options: ['0', '1', 'Infinite', 'Compiler error'],
    correctAnswer: '0',
  },
  {
    questionText: 'Which loop is guaranteed to execute at least once?',
    options: ['do...while', 'while', 'for', 'None of these'],
    correctAnswer: 'do...while',
  },
  {
    questionText: 'Which keyword is used to skip the current iteration of a loop?',
    options: ['continue', 'break', 'skip', 'pass'],
    correctAnswer: 'continue',
  },
  {
    questionText: 'Which keyword is used to terminate a loop immediately?',
    options: ['break', 'continue', 'exit', 'stop'],
    correctAnswer: 'break',
  },
  {
    questionText: 'Which decision-making statement is used to choose one block among many in C?',
    options: ['switch', 'for', 'goto', 'typedef'],
    correctAnswer: 'switch',
  },
  {
    questionText: 'Which case label is used when no switch case matches?',
    options: ['default', 'else', 'otherwise', 'none'],
    correctAnswer: 'default',
  },
  {
    questionText: 'What is the index of the first element in a C array?',
    options: ['0', '1', '-1', 'Depends on the compiler'],
    correctAnswer: '0',
  },
  {
    questionText: 'Which library function is used to find the length of a string?',
    options: ['strlen()', 'length()', 'strcount()', 'size()'],
    correctAnswer: 'strlen()',
  },
  {
    questionText: 'Which header file is needed for strlen()?',
    options: ['string.h', 'stdlib.h', 'math.h', 'ctype.h'],
    correctAnswer: 'string.h',
  },
  {
    questionText: 'What does strlen("C") return?',
    options: ['1', '2', '0', 'Depends on system'],
    correctAnswer: '1',
  },
  {
    questionText: 'Which function copies one string into another?',
    options: ['strcpy()', 'strcat()', 'strcmp()', 'strlen()'],
    correctAnswer: 'strcpy()',
  },
  {
    questionText: 'Which function compares two strings?',
    options: ['strcmp()', 'strcpy()', 'strncmp()', 'strcat()'],
    correctAnswer: 'strcmp()',
  },
  {
    questionText: 'Which function appends one string to another?',
    options: ['strcat()', 'strcpy()', 'strcmp()', 'strlen()'],
    correctAnswer: 'strcat()',
  },
  {
    questionText: 'Which storage class keeps a local variable value between function calls?',
    options: ['static', 'auto', 'register', 'extern'],
    correctAnswer: 'static',
  },
  {
    questionText: 'Which storage class is used to refer to a global variable defined in another file?',
    options: ['extern', 'static', 'auto', 'register'],
    correctAnswer: 'extern',
  },
  {
    questionText: 'Which function is used to allocate memory dynamically in C?',
    options: ['malloc()', 'alloc()', 'new()', 'create()'],
    correctAnswer: 'malloc()',
  },
  {
    questionText: 'Which header file is required for malloc()?',
    options: ['stdlib.h', 'stdio.h', 'malloc.h', 'memory.h'],
    correctAnswer: 'stdlib.h',
  },
  {
    questionText: 'Which function is used to free dynamically allocated memory?',
    options: ['free()', 'delete()', 'remove()', 'clear()'],
    correctAnswer: 'free()',
  },
  {
    questionText: 'What is a pointer in C?',
    options: ['A variable that stores an address', 'A keyword', 'A loop', 'A compiler directive'],
    correctAnswer: 'A variable that stores an address',
  },
  {
    questionText: 'What is the correct declaration of a pointer to int?',
    options: ['int *p;', 'pointer int p;', 'int p*;', '*int p;'],
    correctAnswer: 'int *p;',
  },
  {
    questionText: 'Which operator is used to access structure members through a structure variable?',
    options: ['.', '->', '*', '&'],
    correctAnswer: '.',
  },
  {
    questionText: 'Which operator is used to access structure members through a pointer?',
    options: ['->', '.', '&', '*'],
    correctAnswer: '->',
  },
  {
    questionText: 'Which keyword is used to define a structure in C?',
    options: ['struct', 'union', 'record', 'class'],
    correctAnswer: 'struct',
  },
  {
    questionText: 'What is the purpose of typedef in C?',
    options: ['To create an alias name for a type', 'To define a function', 'To declare a macro', 'To allocate memory'],
    correctAnswer: 'To create an alias name for a type',
  },
  {
    questionText: 'Which file mode is used to open a file for reading?',
    options: ['r', 'w', 'a', 'rw'],
    correctAnswer: 'r',
  },
  {
    questionText: 'Which function opens a file in C?',
    options: ['fopen()', 'open()', 'fileopen()', 'fcreate()'],
    correctAnswer: 'fopen()',
  },
  {
    questionText: 'Which function closes a file pointer?',
    options: ['fclose()', 'close()', 'endfile()', 'fend()'],
    correctAnswer: 'fclose()',
  },
  {
    questionText: 'Which function reads formatted input from a file?',
    options: ['fscanf()', 'fprintf()', 'fgets()', 'fread()'],
    correctAnswer: 'fscanf()',
  },
  {
    questionText: 'Which function writes formatted output to a file?',
    options: ['fprintf()', 'fscanf()', 'fputs()', 'fwrite()'],
    correctAnswer: 'fprintf()',
  },
  {
    questionText: 'What is the size of char in C?',
    options: ['1 byte', '2 bytes', '4 bytes', 'Depends on compiler only'],
    correctAnswer: '1 byte',
  },
  {
    questionText: 'Which unary operator increases a variable value by 1?',
    options: ['++', '--', '+=', '=+'],
    correctAnswer: '++',
  },
  {
    questionText: 'Which operator has higher precedence?',
    options: ['*', '+', '==', '&&'],
    correctAnswer: '*',
  },
  {
    questionText: 'Which logical operator represents AND in C?',
    options: ['&&', '||', '&', '!'],
    correctAnswer: '&&',
  },
  {
    questionText: 'Which logical operator represents OR in C?',
    options: ['||', '&&', '|', '!'],
    correctAnswer: '||',
  },
  {
    questionText: 'Which keyword transfers control unconditionally to another statement?',
    options: ['goto', 'break', 'continue', 'return'],
    correctAnswer: 'goto',
  },
  {
    questionText: 'Which statement is used to return a value from a function?',
    options: ['return', 'break', 'yield', 'exit'],
    correctAnswer: 'return',
  },
  {
    questionText: 'Which of these is not a valid C identifier?',
    options: ['2value', 'value2', '_value', 'total_sum'],
    correctAnswer: '2value',
  },
];

const codingChallenges = [
  {
    title: 'Sum of Two Numbers',
    description: `## Problem
Given two integers, print their sum.

## Input
Two space-separated integers.

## Output
Print the sum of the two integers.

## Example
Input: \`4 5\`

Output: \`9\``,
    difficulty: 'Easy',
    testCases: [
      { input: '4 5', expectedOutput: '9', isHidden: false },
      { input: '10 15', expectedOutput: '25', isHidden: false },
      { input: '100 250', expectedOutput: '350', isHidden: true },
      { input: '-3 7', expectedOutput: '4', isHidden: true },
    ],
  },
  {
    title: 'Even or Odd',
    description: `## Problem
Given an integer \`N\`, print \`Even\` if the number is even, otherwise print \`Odd\`.

## Input
A single integer.

## Output
Print \`Even\` or \`Odd\`.

## Example
Input: \`7\`

Output: \`Odd\``,
    difficulty: 'Easy',
    testCases: [
      { input: '8', expectedOutput: 'Even', isHidden: false },
      { input: '7', expectedOutput: 'Odd', isHidden: false },
      { input: '0', expectedOutput: 'Even', isHidden: true },
      { input: '101', expectedOutput: 'Odd', isHidden: true },
    ],
  },
];

async function upsertQuizBank() {
  let bank = await QuestionBank.findOne({ title: quizBankTitle });

  if (!bank) {
    bank = await QuestionBank.create({ title: quizBankTitle, questions: [] });
  }

  if (bank.questions && bank.questions.length) {
    await Question.deleteMany({ _id: { $in: bank.questions } });
  }

  const createdQuestions = await Question.insertMany(cQuestions);
  bank.questions = createdQuestions.map((question) => question._id);
  await bank.save();

  return {
    bank,
    questionCount: createdQuestions.length,
  };
}

async function upsertCodingBank() {
  const challengeIds = [];

  for (const challengeData of codingChallenges) {
    const challenge = await CodingChallenge.findOneAndUpdate(
      { title: challengeData.title },
      {
        $set: {
          description: challengeData.description,
          difficulty: challengeData.difficulty,
          testCases: challengeData.testCases,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    challengeIds.push(challenge._id);
  }

  let bank = await CodingBank.findOne({ title: codingBankTitle });
  if (!bank) {
    bank = await CodingBank.create({
      title: codingBankTitle,
      description: 'Two easy coding problems with test cases.',
      challenges: challengeIds,
    });
  } else {
    bank.description = 'Two easy coding problems with test cases.';
    bank.challenges = challengeIds;
    await bank.save();
  }

  return {
    bank,
    challengeCount: challengeIds.length,
  };
}

async function run() {
  await connectDB();

  const quizResult = await upsertQuizBank();
  const codingResult = await upsertCodingBank();

  console.log(`Quiz bank ready: ${quizResult.bank.title}`);
  console.log(`Questions added: ${quizResult.questionCount}`);
  console.log(`Coding bank ready: ${codingResult.bank.title}`);
  console.log(`Challenges linked: ${codingResult.challengeCount}`);

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error('Seeding failed:', error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
