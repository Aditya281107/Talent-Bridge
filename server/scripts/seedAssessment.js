const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Assessment = require('../models/Assessment');

dotenv.config({ path: '../.env' });

const seedAssessments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/talentbridge');
    
    // Clear old
    await Assessment.deleteMany({});

    // Sample Assessment: Two Sum
    const twoSum = new Assessment({
      title: 'Two Sum',
      description: 'Given an array of integers and a target sum, output the two numbers that add up to the target. For simplicity, your function should output them separated by a comma (e.g., "3,4").\n\nInput format: The first line is the target, the second line is the array JSON string.',
      initialCode: {
        javascript: 'function solution(input) {\n  // Parse the input string into numbers\n  // e.g. input is "9\\n[2, 7, 11, 15]"\n  \n  return "";\n}',
        cpp: '#include <iostream>\n#include <string>\n\nusing namespace std;\n\nint main() {\n  // Read from std::cin\n  \n  return 0;\n}',
        python: 'import sys\n\ndef solution():\n  # Read from sys.stdin.read()\n  pass\n\nif __name__ == "__main__":\n  solution()'
      },
      testCases: [
        {
          input: '9\n[2, 7, 11, 15]',
          expectedOutput: '2,7',
          isHidden: false
        },
        {
          input: '6\n[3, 2, 4]',
          expectedOutput: '2,4',
          isHidden: true
        },
        {
          input: '6\n[3, 3]',
          expectedOutput: '3,3',
          isHidden: true
        }
      ]
    });

    await twoSum.save();
    console.log('✅ Created Assessment template: Two Sum');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding assessments:', error);
    process.exit(1);
  }
};

seedAssessments();
