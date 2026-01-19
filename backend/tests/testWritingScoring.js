require('dotenv').config();
const {
  AttemptAnswer,
  Question,
  QuestionType,
  AptisType,
  AiScoringCriteria,
  User,
  sequelize
} = require('../src/models');
const AiScoringService = require('../src/services/AiScoringService');

/**
 * Comprehensive Writing Scoring Test
 * Tests all 4 APTIS writing tasks with real student responses
 * Validates both CEFR assessment and numerical scoring accuracy
 */

// Sample writing responses for testing
const writingTestCases = {
  // Task 1: Word-level writing (A1) - Testing with 10 points
  task1: {
    questionType: 'WRITING_SHORT',
    studentResponse: `Answer 1: My name is Alex.

Answer 2: I am 20 years old.

Answer 3: I live in Hanoi.

Answer 4: I am a student.

Answer 5: My email address is alex@gmail.com.`,
    expectedCefrRange: ['A1.1', 'A1.2', 'above A1'],
    expectedScoreRange: [3, 10], // Expecting high score for good response
    maxScore: 10
  },

  // Task 2: Short text writing (A2) - Testing with 10 points
  task2: {
    questionType: 'WRITING_FORM',
    studentResponse: `I really love playing football with my friends on weekends. Football is my favorite sport because it keeps me healthy and active.`,
    expectedCefrRange: ['A2.1', 'A2.2', 'B1+'],
    expectedScoreRange: [5, 10], // 0-10 scale
    maxScore: 10
  },

  // Task 3: Chat responses (B1) - Testing with 10 points
  task3: {
    questionType: 'WRITING_LONG', 
    studentResponse: `Reply 1:
Yes, I went out with my friends and watched a movie. We had dinner together and relaxed.

Reply 2:
My favorite thing to do on weekends is playing football and listening to music at home.

Reply 3:
No, I didn't go far. I stayed in my city and spent time with my family.`,
    expectedCefrRange: ['A2.1', 'B1.1', 'B1.2', 'B2+'],
    expectedScoreRange: [5, 10], // 0-10 scale
    maxScore: 10
  },

  // Task 4: Email writing (B2) - Testing with 20 points (double weight)
  task4: {
    questionType: 'WRITING_EMAIL',
    studentResponse: `Friend Email:
Hi,

Yes, I would love to join the school trip to the museum. I enjoy learning about history and science. I really want to see the ancient artifacts and the dinosaur exhibition. I think it will be interesting and fun for our class.

Best,
Alex

Manager Email:
Dear Sir/Madam,

I am writing to confirm that I would like to participate in the upcoming school trip to the museum. This activity will help students gain practical knowledge and increase our interest in history and culture. I am especially interested in visiting the historical exhibition area. I believe this trip will be educational and beneficial for all students. Thank you for organizing this meaningful activity.

Yours sincerely,
Alex

Formal Email:
Dear Teacher,

Thank you for informing us about the upcoming class trip to the museum. I would like to confirm my participation in this activity. Visiting the museum will help students understand historical events and scientific developments more clearly through real exhibits. I am particularly interested in seeing the history section and learning more about ancient civilizations. In addition, this trip will allow students to relax, interact, and learn outside the classroom environment. I strongly believe that such activities are very important for both education and personal development. I look forward to joining the trip and gaining valuable experiences.

Kind regards,
Alex`,
    expectedCefrRange: ['B1.1', 'B2.1', 'B2.2', 'C1', 'C2'],
    expectedScoreRange: [5, 20], // 0-20 scale (double weight for email task)
    maxScore: 20
  }
};

console.log('\n📊 SCORING DISTRIBUTION: 10 + 10 + 10 + 20 = 50 points total\n');

async function testWritingScoring() {
  console.log('\n=== APTIS WRITING SCORING TEST ===\n');

  try {
    // Get references
    const aptisGeneral = await AptisType.findOne({ where: { code: 'APTIS_GENERAL' } });
    const adminUser = await User.findOne({ where: { role: 'admin' } });
    
    if (!aptisGeneral || !adminUser) {
      throw new Error('Missing required data. Please run seeds first.');
    }

    // Test each writing task
    for (const [taskName, testCase] of Object.entries(writingTestCases)) {
      console.log(`🧪 Testing ${taskName.toUpperCase()}`);
      console.log(`Question Type: ${testCase.questionType}`);
      console.log(`Max Score: ${testCase.maxScore}`);
      console.log(`Student Response Length: ${testCase.studentResponse.length} characters`);
      
      // Find question and criteria
      const questionType = await QuestionType.findOne({ 
        where: { code: testCase.questionType } 
      });
      
      const question = await Question.findOne({
        where: { question_type_id: questionType.id },
        include: [{ model: QuestionType, as: 'questionType' }]
      });
      
      if (!question) {
        console.log(`❌ No question found for ${testCase.questionType}`);
        continue;
      }

      const criteria = await AiScoringCriteria.findAll({
        where: { 
          aptis_type_id: aptisGeneral.id,
          question_type_id: questionType.id 
        }
      });

      if (!criteria || criteria.length === 0) {
        console.log(`❌ No criteria found for ${testCase.questionType}`);
        continue;
      }

      // Override question max_score with test case max_score
      question.max_score = testCase.maxScore;
      console.log(`\n📝 Scoring with ${criteria.length} criteria (max_score set to ${testCase.maxScore})...`);

      // Test the comprehensive scoring
      const result = await AiScoringService.scoreEntireAnswer(
        testCase.studentResponse,
        question,
        criteria,
        getTaskTypeFromQuestionType(testCase.questionType)
      );

      console.log('\n📊 SCORING RESULTS:');
      console.log(`Score: ${result.totalScore}/${result.totalMaxScore}`);
      console.log(`CEFR Level: ${result.cefrLevel || 'Not specified'}`);
      console.log(`Percentage: ${((result.totalScore / result.totalMaxScore) * 100).toFixed(1)}%`);

      // Validate results
      const isScoreValid = result.totalScore >= 0 && result.totalScore <= testCase.maxScore;
      const isWithinExpectedRange = result.totalScore >= testCase.expectedScoreRange[0] && 
                                    result.totalScore <= testCase.expectedScoreRange[1];

      console.log('\n✅ VALIDATION:');
      console.log(`Score Range Valid (0-${testCase.maxScore}): ${isScoreValid ? '✅' : '❌'}`);
      console.log(`Within Expected Range (${testCase.expectedScoreRange[0]}-${testCase.expectedScoreRange[1]}): ${isWithinExpectedRange ? '✅' : '❌'}`);
      
      if (result.cefrLevel) {
        const isCefrValid = testCase.expectedCefrRange.includes(result.cefrLevel);
        console.log(`CEFR Level Valid: ${isCefrValid ? '✅' : '❌'} (Got: ${result.cefrLevel}, Expected: ${testCase.expectedCefrRange.join(' or ')})`);
      }

      console.log('\n💬 FEEDBACK SAMPLE:');
      if (result.overallFeedback) {
        console.log(result.overallFeedback.substring(0, 200) + '...');
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }

    console.log('🎉 Writing scoring test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Helper function to get task type for prompts
function getTaskTypeFromQuestionType(questionType) {
  const mapping = {
    'WRITING_SHORT': 'writing_task_1',
    'WRITING_FORM': 'writing_task_2', 
    'WRITING_LONG': 'writing_task_3',
    'WRITING_EMAIL': 'writing_task_4'
  };
  return mapping[questionType] || 'general';
}

// No CEFR-to-score mapping needed - AI scores directly 0-max_score

// Test score validation
async function testScoreValidation() {
  console.log('\n🔍 Testing Flexible Scoring System (10 + 10 + 10 + 20 = 50)...\n');

  const testCases = [
    { task: 'Task 1', maxScore: 10, description: 'Word-level writing' },
    { task: 'Task 2', maxScore: 10, description: 'Short text writing' },
    { task: 'Task 3', maxScore: 10, description: 'Chat responses' },
    { task: 'Task 4', maxScore: 20, description: 'Email writing (double weight)' },
  ];

  let total = 0;
  for (const testCase of testCases) {
    total += testCase.maxScore;
    console.log(`✓ ${testCase.task}: max ${testCase.maxScore} points - ${testCase.description}`);
  }
  
  console.log(`\n✅ Total: ${total} points (flexible distribution)`);
  console.log(`💡 You can use ANY distribution: 12.5+12.5+12.5+12.5=50, 5+10+15+20=50, etc.\n`);
}

// Run tests
async function runAllTests() {
  await testScoreValidation();
  await testWritingScoring();
}

if (require.main === module) {
  runAllTests();
}

module.exports = { testWritingScoring, testScoreValidation };