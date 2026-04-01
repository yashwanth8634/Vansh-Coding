// seed_vansh_questions.js - Seeds MCQ and Coding question banks
require('dotenv').config();
const mongoose = require('mongoose');
const QuestionBank = require('./models/QuestionBank');
const Question = require('./models/Question');
const CodingBank = require('./models/CodingBank');
const CodingChallenge = require('./models/CodingChallenge');

const MONGO_URI = process.env.MONGO_URI;

// MCQ Questions from the PDF
const mcqQuestions = [
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    char *p = "Hello";
    p[0] = 'h';
    printf("%s", p);
    return 0;
}`,
    options: ['hello', 'Hello', 'Compiler Error', 'Runtime Error'],
    correctAnswer: 'Runtime Error'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    int x = 4, y = 3;
    printf("%d", x >> 1 + y);
    return 0;
}`,
    options: ['1', '0', '2', 'Undefined'],
    correctAnswer: '0'
  },
  {
    questionText: 'Which is TRUE about pointers?',
    options: ['Stores value', 'Stores address', 'Cannot be NULL', 'Cannot point to pointer'],
    correctAnswer: 'Stores address'
  },
  {
    questionText: 'Which is NOT a storage class?',
    options: ['auto', 'static', 'extern', 'dynamic'],
    correctAnswer: 'dynamic'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    int arr[] = {1,2,3,4};
    printf("%d", *(arr + 3));
    return 0;
}`,
    options: ['3', '4', '1', 'Error'],
    correctAnswer: '4'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    int x = 10;
    printf("%d", sizeof(x++));
    return 0;
}`,
    options: ['4 and x becomes 11', '4 and x remains 10', 'Error', 'Undefined'],
    correctAnswer: '4 and x remains 10'
  },
  {
    questionText: 'Which structure is used in recursion?',
    options: ['Queue', 'Stack', 'Array', 'Linked List'],
    correctAnswer: 'Stack'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    int x = 3;
    printf("%d", x << 2);
    return 0;
}`,
    options: ['6', '12', '8', '3'],
    correctAnswer: '12'
  },
  {
    questionText: 'What is best case of Bubble Sort?',
    options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'],
    correctAnswer: 'O(n)'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    int x = 5;
    int y = x++ + ++x;
    printf("%d", y);
    return 0;
}`,
    options: ['11', '12', 'Undefined Behavior', '10'],
    correctAnswer: 'Undefined Behavior'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    int arr[5];
    printf("%lu", sizeof(arr)/sizeof(arr[0]));
    return 0;
}`,
    options: ['5', '20', '4', 'Error'],
    correctAnswer: '5'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int fun() {
    static int x = 0;
    return ++x;
}
int main() {
    printf("%d %d %d", fun(), fun(), fun());
}`,
    options: ['3 2 1', '3 3 3', '1 1 1', 'Undefined'],
    correctAnswer: '3 2 1'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    int arr[] = {10,20,30};
    int *p = arr;
    printf("%d", *(p+1) + *(p+2));
}`,
    options: ['50', '40', '30', 'Error'],
    correctAnswer: '50'
  },
  {
    questionText: 'Array name is:',
    options: ['Variable pointer', 'Constant pointer', 'Value holder', 'Dynamic'],
    correctAnswer: 'Constant pointer'
  },
  {
    questionText: `What will be the output?
int* fun() {
    int x = 10;
    return &x;
}`,
    options: ['10', 'Garbage', 'Error', 'Undefined Behavior'],
    correctAnswer: 'Undefined Behavior'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    int x = 6, y = 3;
    printf("%d", x ^ y);
}`,
    options: ['5', '3', '6', '1'],
    correctAnswer: '5'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    int i;
    for(i=0;i<3;i++);
    printf("%d", i);
}`,
    options: ['2', '3', '0', 'Error'],
    correctAnswer: '3'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    char str[] = "Hello";
    printf("%c", *(str+4));
}`,
    options: ['H', 'o', 'l', 'Error'],
    correctAnswer: 'o'
  },
  {
    questionText: 'Local variables are stored in:',
    options: ['Heap', 'Stack', 'Data', 'Code'],
    correctAnswer: 'Stack'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    int a=5;
    int *p=&a;
    int **q=&p;
    printf("%d", **q);
}`,
    options: ['5', 'Address', 'Error', 'Garbage'],
    correctAnswer: '5'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    int x = 1, y = 2;
    printf("%d", x + y * x++ + ++y);
}`,
    options: ['5', '6', '7', 'Undefined Behavior'],
    correctAnswer: 'Undefined Behavior'
  },
  {
    questionText: `What will be the output?
int a = 5, b = 3;
printf("%d", a & b | a ^ b);`,
    options: ['1', '5', '7', '3'],
    correctAnswer: '7'
  },
  {
    questionText: `What will be the output?
int arr[] = {1,2,3,4,5};
int *p = arr;
printf("%d", *(p+2) + *(arr+4));`,
    options: ['7', '8', '9', '10'],
    correctAnswer: '8'
  },
  {
    questionText: `What will be the output?
printf("%d", printf("Hi") + printf("Bye"));`,
    options: ['HiBye', '5', 'HiBye5', '8'],
    correctAnswer: 'HiBye5'
  },
  {
    questionText: 'Which memory is allocated when using malloc for an int array of 5 elements?',
    options: ['Stack', 'Heap', 'Register', 'Data segment'],
    correctAnswer: 'Heap'
  },
  {
    questionText: 'Which of the following statements about const in C is TRUE?',
    options: ['A const variable cannot be initialized', 'A pointer to const data cannot modify the data', 'A const pointer can point to different locations', 'const variables are always stored in stack'],
    correctAnswer: 'A pointer to const data cannot modify the data'
  },
  {
    questionText: 'Which of the following is TRUE regarding memory segments in C?',
    options: ['Local variables are stored in heap', 'Global variables are stored in stack', 'Static variables are stored in data segment', 'Dynamic memory is stored in stack'],
    correctAnswer: 'Static variables are stored in data segment'
  },
  {
    questionText: 'Which of the following scenarios leads to a memory leak in C?',
    options: ['Allocating memory using malloc() and freeing it properly', 'Allocating memory and losing reference without freeing', 'Using stack variables inside function', 'Using static variables'],
    correctAnswer: 'Allocating memory and losing reference without freeing'
  },
  {
    questionText: 'Which of the following is TRUE about function pointers in C?',
    options: ['Function pointers store values returned by function', 'Function pointers can be used to call functions dynamically', 'Function pointers cannot be passed as arguments', 'Function pointers cannot return values'],
    correctAnswer: 'Function pointers can be used to call functions dynamically'
  },
  {
    questionText: 'Which of the following is TRUE about volatile keyword in C?',
    options: ['It prevents variable from being modified', 'It tells compiler variable may change unexpectedly', 'It makes variable constant', 'It allocates variable in heap'],
    correctAnswer: 'It tells compiler variable may change unexpectedly'
  },
  {
    questionText: `What will be the output? (Python)
a = [1, 2, 3]
b = a
a += [4]
print(b)`,
    options: ['[1,2,3]', '[1,2,3,4]', 'Error', 'None'],
    correctAnswer: '[1,2,3,4]'
  },
  {
    questionText: `What will be the output? (Python)
a = [1, 2, 3]
b = a
a = a + [4]
print(b)`,
    options: ['[1,2,3]', '[1,2,3,4]', 'Error', 'None'],
    correctAnswer: '[1,2,3]'
  },
  {
    questionText: `What will be the output? (Python)
print([i for i in range(5)][::-2])`,
    options: ['[4,2,0]', '[0,2,4]', '[5,3,1]', 'Error'],
    correctAnswer: '[4,2,0]'
  },
  {
    questionText: `What will be the output? (Python)
x = (1, 2, [3, 4])
x[2].append(5)
print(x)`,
    options: ['Error', '(1,2,[3,4,5])', '(1,2,[3,4])', 'None'],
    correctAnswer: '(1,2,[3,4,5])'
  },
  {
    questionText: `What will be the output? (Python)
x = [0,1,2]
y = x
x = x[:]
x.append(3)
print(y)`,
    options: ['[0,1,2]', '[0,1,2,3]', 'Error', 'None'],
    correctAnswer: '[0,1,2]'
  },
  {
    questionText: `What will be the output? (Python)
print("".join(sorted("bca")))`,
    options: ['abc', 'cba', 'bca', 'Error'],
    correctAnswer: 'abc'
  },
  {
    questionText: `What will be the output? (Python)
a = [[]] * 3
a[0].append(1)
print(a)`,
    options: ['[[1], [], []]', '[[1], [1], [1]]', '[[1], [], [1]]', 'Error'],
    correctAnswer: '[[1], [1], [1]]'
  },
  {
    questionText: `What will be the output? (Python)
print(list(map(lambda x: x*x, [1,2,3])))`,
    options: ['[1,4,9]', '[1,2,3]', 'Error', 'None'],
    correctAnswer: '[1,4,9]'
  },
  {
    questionText: `What will be the output? (Python)
x = [1,2,3]
print(x is x[:])`,
    options: ['True', 'False'],
    correctAnswer: 'False'
  },
  {
    questionText: `What will be the output? (Python)
print({1,2,3} ^ {2,3,4})`,
    options: ['{1,4}', '{2,3}', '{1,2,3,4}', 'Error'],
    correctAnswer: '{1,4}'
  },
  {
    questionText: `What will be the output? (Python)
def func(a, L=[]):
    L.append(a)
    return L

print(func(1))
print(func(2))`,
    options: ['[1] [2]', '[1] [1,2]', '[1,2] [1,2]', 'Error'],
    correctAnswer: '[1] [1,2]'
  },
  {
    questionText: `What will be the output? (Python)
x = 0.1 + 0.2
print(x == 0.3)`,
    options: ['True', 'False'],
    correctAnswer: 'False'
  },
  {
    questionText: `What will be the output? (Python)
print(len({1,2,2,3}))`,
    options: ['4', '3', '2', 'Error'],
    correctAnswer: '3'
  },
  {
    questionText: `What will be the output? (Python)
a = {1,2,3}
b = a
a = a.union({4})
print(b)`,
    options: ['{1,2,3,4}', '{1,2,3}', 'Error', 'None'],
    correctAnswer: '{1,2,3}'
  },
  {
    questionText: `What will be the output? (Python)
print([i*j for i in range(3) for j in range(2)])`,
    options: ['[0,0,1,1,2,2]', '[0,1,2,0,1,2]', '[0,0,0,1,0,2]', '[1,2,3,4,5,6]'],
    correctAnswer: '[0,0,0,1,0,2]'
  },
  {
    questionText: 'Python variables store:',
    options: ['Values', 'References to objects', 'Addresses only', 'None'],
    correctAnswer: 'References to objects'
  },
  {
    questionText: 'Which is immutable?',
    options: ['List', 'Set', 'Tuple', 'Dict'],
    correctAnswer: 'Tuple'
  },
  {
    questionText: 'Which is mutable?',
    options: ['Tuple', 'String', 'List', 'Integer'],
    correctAnswer: 'List'
  },
  {
    questionText: 'is operator checks:',
    options: ['Equality', 'Identity', 'Value', 'Type'],
    correctAnswer: 'Identity'
  },
  {
    questionText: '{} represents:',
    options: ['Set', 'Dict', 'List', 'Tuple'],
    correctAnswer: 'Dict'
  },
  {
    questionText: 'Exception handling keyword:',
    options: ['catch', 'try-except', 'error', 'handle'],
    correctAnswer: 'try-except'
  },
  {
    questionText: 'Convert string to int:',
    options: ['str()', 'int()', 'float()', 'eval()'],
    correctAnswer: 'int()'
  },
  {
    questionText: `What will be the output? (Python)
x = [1,2,3]
y = x
y += [4]
print(x)`,
    options: ['[1,2,3]', '[1,2,3,4]', 'Error', 'None'],
    correctAnswer: '[1,2,3,4]'
  },
  {
    questionText: 'len() returns:',
    options: ['Type', 'Size', 'Index', 'Value'],
    correctAnswer: 'Size'
  },
  {
    questionText: 'Set property:',
    options: ['Ordered', 'Allows duplicates', 'Unordered', 'Indexed'],
    correctAnswer: 'Unordered'
  },
  {
    questionText: 'Lambda function is:',
    options: ['Named', 'Anonymous', 'Loop', 'Class'],
    correctAnswer: 'Anonymous'
  },
  {
    questionText: 'Function keyword:',
    options: ['func', 'def', 'define', 'function'],
    correctAnswer: 'def'
  },
  {
    questionText: 'Python is:',
    options: ['Compiled', 'Interpreted', 'Machine', 'Assembly'],
    correctAnswer: 'Interpreted'
  },
  {
    questionText: 'Supports multiple data types:',
    options: ['List', 'Tuple', 'Both', 'None'],
    correctAnswer: 'Both'
  },
  {
    questionText: `What will be the output? (Python)
print(None is False)`,
    options: ['True', 'False'],
    correctAnswer: 'False'
  },
  {
    questionText: 'Which of the following ensures that a transaction is completed entirely or not executed at all?',
    options: ['Consistency', 'Isolation', 'Atomicity', 'Durability'],
    correctAnswer: 'Atomicity'
  },
  {
    questionText: 'Which normal form removes partial dependency?',
    options: ['1NF', '2NF', '3NF', 'BCNF'],
    correctAnswer: '2NF'
  },
  {
    questionText: `What will be the output of the SQL query?
SELECT COUNT(*) FROM student WHERE marks > 50;`,
    options: ['Total rows', 'Rows with marks > 50', 'Rows with marks < 50', 'Error'],
    correctAnswer: 'Rows with marks > 50'
  },
  {
    questionText: 'Which join returns only matching rows from both tables?',
    options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'],
    correctAnswer: 'INNER JOIN'
  },
  {
    questionText: 'Which anomaly is removed by normalization?',
    options: ['Insertion anomaly', 'Deletion anomaly', 'Update anomaly', 'All of the above'],
    correctAnswer: 'All of the above'
  },
  {
    questionText: 'Which of the following is TRUE about primary key?',
    options: ['Can contain NULL', 'Must be unique', 'Can have duplicates', 'Optional'],
    correctAnswer: 'Must be unique'
  },
  {
    questionText: `What will be the output?
SELECT AVG(salary) FROM employee;`,
    options: ['Sum of salaries', 'Average salary', 'Count of salaries', 'Maximum salary'],
    correctAnswer: 'Average salary'
  },
  {
    questionText: 'Which isolation level prevents dirty reads?',
    options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'],
    correctAnswer: 'Read Committed'
  },
  {
    questionText: 'Which of the following is used to remove duplicate rows?',
    options: ['UNIQUE', 'DISTINCT', 'GROUP BY', 'HAVING'],
    correctAnswer: 'DISTINCT'
  },
  {
    questionText: 'Which indexing method is best for range queries?',
    options: ['Hash Index', 'B-Tree Index', 'Bitmap Index', 'Linear Index'],
    correctAnswer: 'B-Tree Index'
  },
  {
    questionText: 'A train 120 m long is running at 60 km/h. How much time will it take to cross a pole?',
    options: ['5 sec', '6 sec', '7.2 sec', '8 sec'],
    correctAnswer: '7.2 sec'
  },
  {
    questionText: "If the ratio of ages of A and B is 3:5 and after 10 years it becomes 5:7, what is A's present age?",
    options: ['15', '18', '20', '25'],
    correctAnswer: '15'
  },
  {
    questionText: 'Find the missing number: 2, 6, 7, 21, 22, ?',
    options: ['44', '66', '23', '46'],
    correctAnswer: '66'
  },
  {
    questionText: 'A man walks 10 m south, then 10 m east, then 10 m north. How far is he from the starting point?',
    options: ['0 m', '10 m', '20 m', '30 m'],
    correctAnswer: '10 m'
  },
  {
    questionText: 'If in a code, CAT is written as DBU, how is DOG written?',
    options: ['EPH', 'EOG', 'FQI', 'DPH'],
    correctAnswer: 'EPH'
  },
  {
    questionText: 'A sum becomes double in 5 years at simple interest. In how many years will it become triple?',
    options: ['10', '12.5', '15', '20'],
    correctAnswer: '10'
  },
  {
    questionText: 'Find the odd one out:',
    options: ['8', '27', '64', '125'],
    correctAnswer: '8'
  },
  {
    questionText: 'If ALL = 36, BAT = 45, then CAT = ?',
    options: ['48', '49', '50', '51'],
    correctAnswer: '48'
  },
  {
    questionText: 'Two numbers are in ratio 4:5 and their LCM is 180. Find the smaller number.',
    options: ['20', '36', '40', '45'],
    correctAnswer: '36'
  },
  {
    questionText: 'In a class of 60 students, 40 like Maths and 30 like Science. How many like both?',
    options: ['10', '20', '30', '40'],
    correctAnswer: '10'
  },
  {
    questionText: 'Which data structure is best suited for implementing recursion?',
    options: ['Queue', 'Stack', 'Linked List', 'Tree'],
    correctAnswer: 'Stack'
  },
  {
    questionText: 'What is the time complexity of searching an element in a balanced binary search tree (BST)?',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correctAnswer: 'O(log n)'
  },
  {
    questionText: 'Which of the following traversals of a binary search tree gives sorted output?',
    options: ['Preorder', 'Postorder', 'Inorder', 'Level order'],
    correctAnswer: 'Inorder'
  },
  {
    questionText: 'What is the worst-case time complexity of Quick Sort?',
    options: ['O(n log n)', 'O(n²)', 'O(log n)', 'O(n)'],
    correctAnswer: 'O(n²)'
  },
  {
    questionText: 'Which data structure is used for BFS (Breadth First Search)?',
    options: ['Stack', 'Queue', 'Heap', 'Tree'],
    correctAnswer: 'Queue'
  },
  {
    questionText: 'What is the space complexity of Merge Sort?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 'O(n)'
  },
  {
    questionText: 'Which of the following data structures allows insertion and deletion from both ends?',
    options: ['Stack', 'Queue', 'Deque', 'Array'],
    correctAnswer: 'Deque'
  },
  {
    questionText: 'What is the time complexity of inserting an element at the beginning of a singly linked list?',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
    correctAnswer: 'O(1)'
  },
  {
    questionText: 'Which of the following is NOT a linear data structure?',
    options: ['Array', 'Linked List', 'Tree', 'Stack'],
    correctAnswer: 'Tree'
  },
  {
    questionText: "Which data structure is used in Dijkstra's algorithm for efficient extraction of minimum element?",
    options: ['Stack', 'Queue', 'Priority Queue (Min Heap)', 'Linked List'],
    correctAnswer: 'Priority Queue (Min Heap)'
  },
  {
    questionText: `What will be the output?
#include <stdio.h>
int main() {
    int a = 5, b = 3;
    printf("%d", a & b);
    return 0;
}`,
    options: ['0', '1', '3', '5'],
    correctAnswer: '1'
  },
  {
    questionText: 'Which of the following is TRUE about calloc() in C?',
    options: ['Allocates uninitialized memory', 'Allocates and initializes memory to zero', 'Cannot allocate multiple blocks', 'Faster than malloc always'],
    correctAnswer: 'Allocates and initializes memory to zero'
  },
  {
    questionText: `What will be the output? (Python)
print((lambda x: x**2)(3))`,
    options: ['6', '9', 'Error', 'None'],
    correctAnswer: '9'
  },
  {
    questionText: `What will be the output? (Python)
a = {1,2,3}
print(a.add(4))`,
    options: ['{1,2,3,4}', 'None', 'Error', '4'],
    correctAnswer: 'None'
  },
  {
    questionText: 'Which SQL function returns the number of non-NULL values?',
    options: ['COUNT(*)', 'COUNT(column)', 'SUM()', 'TOTAL()'],
    correctAnswer: 'COUNT(column)'
  },
  {
    questionText: 'Which of the following property ensures that transactions are isolated from each other?',
    options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
    correctAnswer: 'Isolation'
  },
  {
    questionText: 'A train 150 m long crosses a platform 350 m long in 25 seconds. What is the speed?',
    options: ['60 km/h', '72 km/h', '54 km/h', '90 km/h'],
    correctAnswer: '72 km/h'
  },
  {
    questionText: 'Find the missing number: 4, 6, 9, 13, 18, ?',
    options: ['23', '24', '25', '26'],
    correctAnswer: '24'
  },
  {
    questionText: 'What is the time complexity of Heap Sort in worst case?',
    options: ['O(n²)', 'O(n log n)', 'O(log n)', 'O(n)'],
    correctAnswer: 'O(n log n)'
  },
  {
    questionText: 'Which traversal uses a queue internally?',
    options: ['Depth First Search', 'Breadth First Search', 'Inorder', 'Postorder'],
    correctAnswer: 'Breadth First Search'
  }
];

// Coding Challenges from the DOCX
const codingChallenges = [
  {
    title: 'Binary Range Collapse',
    description: `Given two non-negative integers a and b where a <= b, compute the bitwise AND of all numbers in the inclusive range [a, b].

Input Format:
- First line contains an integer t (number of test cases)
- Next t lines each contain two space-separated integers a and b

Output Format:
- For each test case, print a single integer

Constraints:
- 1 <= t <= 10^5
- 0 <= a <= b <= 10^18

Sample Input:
3
12 15
2 3
8 13

Sample Output:
12
2
8`,
    difficulty: 'Medium',
    testCases: [
      { input: '3\n12 15\n2 3\n8 13', expectedOutput: '12\n2\n8', isHidden: false },
      { input: '2\n17 23\n11 15', expectedOutput: '16\n8', isHidden: false },
      { input: '1\n5 5', expectedOutput: '5', isHidden: true },
      { input: '1\n5 6', expectedOutput: '4', isHidden: true },
      { input: '1\n7 8', expectedOutput: '0', isHidden: true },
      { input: '1\n8 11', expectedOutput: '8', isHidden: true },
      { input: '1\n10 15', expectedOutput: '8', isHidden: true },
      { input: '1\n100 120', expectedOutput: '96', isHidden: true },
      { input: '1\n3 7', expectedOutput: '0', isHidden: true },
    ],
  },
  {
    title: 'Minimum Difference Window',
    description: `You are given a list of integers and an integer k. Select exactly k elements such that the difference between the maximum and minimum elements is minimized.

Input Format:
- First line contains n
- Second line contains k
- Next n lines contain one integer each

Output Format:
- Print the minimum possible difference

Constraints:
- 1 <= n <= 10^5
- 1 <= k <= n
- 0 <= arr[i] <= 10^9

Sample Input:
7
3
10
100
300
200
1000
20
30

Sample Output:
20`,
    difficulty: 'Medium',
    testCases: [
      { input: '7\n3\n10\n100\n300\n200\n1000\n20\n30', expectedOutput: '20', isHidden: false },
      { input: '10\n4\n1\n2\n3\n4\n10\n20\n30\n40\n100\n200', expectedOutput: '3', isHidden: false },
      { input: '5\n3\n5\n5\n5\n5\n5', expectedOutput: '0', isHidden: true },
      { input: '4\n1\n8\n6\n7\n5', expectedOutput: '0', isHidden: true },
      { input: '6\n3\n1\n2\n3\n4\n5\n6', expectedOutput: '2', isHidden: true },
      { input: '6\n2\n10\n9\n8\n7\n6\n5', expectedOutput: '1', isHidden: true },
      { input: '5\n3\n1\n100\n50\n60\n55', expectedOutput: '10', isHidden: true },
      { input: '5\n2\n1\n1000\n2000\n3000\n4000', expectedOutput: '999', isHidden: true },
    ],
  },
  {
    title: 'Next Greater Word',
    description: `Given a lowercase string, rearrange its characters to form the next lexicographically greater string.
If no such arrangement exists, print "no answer".

Input Format:
- First line contains t
- Next t lines each contain a string s

Output Format:
- For each test case, print the answer for that string

Constraints:
- 1 <= t <= 100
- 1 <= |s| <= 10^5

Sample Input:
5
ab
bb
hefg
dhck
dkhc

Sample Output:
ba
no answer
hegf
dhkc
hcdk`,
    difficulty: 'Medium',
    testCases: [
      { input: '5\nab\nbb\nhefg\ndhck\ndkhc', expectedOutput: 'ba\nno answer\nhegf\ndhkc\nhcdk', isHidden: false },
      { input: '3\nabcd\ndcba\nabdc', expectedOutput: 'abdc\nno answer\nacbd', isHidden: false },
      { input: '1\na', expectedOutput: 'no answer', isHidden: true },
      { input: '1\naaa', expectedOutput: 'no answer', isHidden: true },
      { input: '1\nzyx', expectedOutput: 'no answer', isHidden: true },
      { input: '1\nabdc', expectedOutput: 'acbd', isHidden: true },
      { input: '1\ndkhc', expectedOutput: 'hcdk', isHidden: true },
      { input: '1\nfedcbabcd', expectedOutput: 'fedcbabdc', isHidden: true },
    ],
  },
  {
    title: 'Minimum Loss Trade',
    description: `You are given distinct property prices over years. You must buy before selling, and selling price must be lower than buying price.
Find the minimum possible loss.

Input Format:
- First line contains n
- Second line contains n space-separated prices

Output Format:
- Print the minimum loss

Constraints:
- 2 <= n <= 2 * 10^5
- 1 <= price[i] <= 10^16
- All prices are distinct

Sample Input:
5
20 7 8 2 5

Sample Output:
2`,
    difficulty: 'Hard',
    testCases: [
      { input: '3\n5 10 3', expectedOutput: '2', isHidden: false },
      { input: '5\n20 7 8 2 5', expectedOutput: '2', isHidden: false },
      { input: '5\n10 9 8 7 6', expectedOutput: '1', isHidden: true },
      { input: '5\n1 2 3 4 5', expectedOutput: '1', isHidden: true },
      { input: '4\n1000 200 800 100', expectedOutput: '100', isHidden: true },
      { input: '2\n9 3', expectedOutput: '6', isHidden: true },
      { input: '6\n15 3 20 7 8 10', expectedOutput: '2', isHidden: true },
      { input: '5\n100 1 99 2 98', expectedOutput: '1', isHidden: true },
    ],
  },
  {
    title: 'Mirror Difference Check',
    description: `A string is "Funny" if the absolute differences of adjacent ASCII values are the same for the string and its reverse.
For each string, print "Funny" or "Not Funny".

Input Format:
- First line contains q
- Next q lines each contain a string

Output Format:
- For each string, print Funny or Not Funny

Constraints:
- 1 <= q <= 10^3
- 1 <= length of string <= 10^5

Sample Input:
2
acxz
bcxz

Sample Output:
Funny
Not Funny`,
    difficulty: 'Easy',
    testCases: [
      { input: '2\nacxz\nbcxz', expectedOutput: 'Funny\nNot Funny', isHidden: false },
      { input: '1\na', expectedOutput: 'Funny', isHidden: true },
      { input: '1\nab', expectedOutput: 'Funny', isHidden: true },
      { input: '1\nmadam', expectedOutput: 'Funny', isHidden: true },
      { input: '1\nabcd', expectedOutput: 'Not Funny', isHidden: true },
      { input: '1\nazby', expectedOutput: 'Funny', isHidden: true },
      { input: '1\nabcdefg', expectedOutput: 'Not Funny', isHidden: true },
    ],
  },
  {
    title: 'Penalty Rules Engine',
    description: `A library charges a fine for late return based on delay:
- Returned on or before due date: 0
- Late in same month and year: 15 x days late
- Late in same year but different month: 500 x months late
- Returned in later calendar year: 10000

Input Format:
- First line: d1 m1 y1 (actual return date)
- Second line: d2 m2 y2 (due date)

Output Format:
- Print the fine amount

Constraints:
- 1 <= d <= 31
- 1 <= m <= 12
- 1 <= y <= 3000

Sample Input:
9 6 2015
6 6 2015

Sample Output:
45`,
    difficulty: 'Easy',
    testCases: [
      { input: '9 6 2015\n6 6 2015', expectedOutput: '45', isHidden: false },
      { input: '1 1 2020\n1 1 2020', expectedOutput: '0', isHidden: true },
      { input: '10 5 2020\n5 5 2020', expectedOutput: '75', isHidden: true },
      { input: '10 7 2020\n5 5 2020', expectedOutput: '1000', isHidden: true },
      { input: '1 1 2021\n31 12 2020', expectedOutput: '10000', isHidden: true },
      { input: '5 5 2020\n10 5 2020', expectedOutput: '0', isHidden: true },
      { input: '5 3 2020\n10 5 2020', expectedOutput: '0', isHidden: true },
    ],
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Create MCQ Question Bank
    console.log('\n--- Creating MCQ Question Bank ---');
    let mcqBank = await QuestionBank.findOne({ title: 'Vansh2k26 MCQ Bank' });
    
    if (mcqBank) {
      console.log('MCQ Bank already exists, updating questions...');
      // Delete existing questions
      await Question.deleteMany({ questionBank: mcqBank._id });
    } else {
      mcqBank = await QuestionBank.create({
        title: 'Vansh2k26 MCQ Bank',
        description: 'C, Python, DBMS, DSA, and Aptitude MCQs for Mr & Ms Coder event'
      });
      console.log('Created MCQ Bank:', mcqBank.title);
    }

    // Add MCQ questions
    const mcqDocs = mcqQuestions.map(q => ({
      ...q,
      questionBank: mcqBank._id
    }));
    
    await Question.insertMany(mcqDocs);
    console.log(`Added ${mcqQuestions.length} MCQ questions`);

    // Create Coding Challenge Bank
    console.log('\n--- Creating Coding Challenge Bank ---');
    let codingBank = await CodingBank.findOne({ title: 'Vansh2k26 Coding Challenges' });
    
    if (!codingBank) {
      codingBank = await CodingBank.create({
        title: 'Vansh2k26 Coding Challenges',
        description: 'Coding problems for Mr & Ms Coder event'
      });
      console.log('Created Coding Bank:', codingBank.title);
    } else {
      console.log('Coding Bank already exists:', codingBank.title);
    }

    // Add or update coding challenges using upsert
    const challengeIds = [];
    for (const c of codingChallenges) {
      const challenge = await CodingChallenge.findOneAndUpdate(
        { title: c.title },
        {
          $set: {
            description: c.description,
            difficulty: c.difficulty,
            testCases: c.testCases,
          }
        },
        { upsert: true, new: true }
      );
      challengeIds.push(challenge._id);
      console.log(`  - ${c.difficulty.padEnd(6)} | ${c.title}`);
    }

    // Update the bank with challenge references
    codingBank.challenges = challengeIds;
    await codingBank.save();
    console.log(`Added/Updated ${codingChallenges.length} coding challenges to bank`);

    console.log('\n✅ Database seeded successfully!');
    console.log(`MCQ Bank ID: ${mcqBank._id}`);
    console.log(`Coding Bank ID: ${codingBank._id}`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase();
