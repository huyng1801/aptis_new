require('dotenv').config();
const SpeakingScoringPromptBuilder = require('../src/services/scoring/SpeakingScoringPromptBuilder');
const AiServiceClient = require('../src/services/scoring/AiServiceClient');

/**
 * Test APTIS Speaking Part 1 Rubric Accuracy
 * Verifies that Part 1 scoring follows A0-B1+ scale (0-5 points)
 */

const testCases = [
  {
    name: "Test 1: Good A2 level response",
    transcription: "Sure. Here's a short self introduction. My name is Alex and I'm from Vietnam. I'm currently studying and working in the field of information technology with a strong focus on web development and software projects. In my free time, I enjoy learning new tech.",
    question: {
      content: "Tell me about yourself: Name and where you're from, What you do (work or studies), Your hobbies and interests. 30 seconds to prepare, 1 minute to speak.",
      questionType: { code: 'SPEAKING_INTRO' }
    },
    expectedScore: { min: 3, max: 5 },
    expectedCEFR: ['A2.1', 'A2.2', 'B1+'],
    description: "Answered all 3 questions, simple grammar, basic vocabulary, clear pronunciation"
  },
  {
    name: "Test 2: Weak A1 level response",
    transcription: "My name Alex. I from Vietnam. I student.",
    question: {
      content: "Tell me about yourself: Name and where you're from, What you do (work or studies), Your hobbies and interests.",
      questionType: { code: 'SPEAKING_INTRO' }
    },
    expectedScore: { min: 1, max: 2 },
    expectedCEFR: ['A1.1', 'A1.2'],
    description: "Only 2 questions answered, very basic grammar errors, limited vocabulary"
  },
  {
    name: "Test 3: Strong B1 level response",
    transcription: "Hello, my name is Sarah and I'm from Hanoi, Vietnam. Currently, I'm studying Computer Science at Vietnam National University while also working part-time as a web developer at a local startup. I really enjoy my studies because they challenge me to think critically and solve complex problems. In my free time, I'm passionate about several hobbies - I play badminton twice a week with friends, I love reading science fiction novels, and I've recently started learning to play the piano. I also enjoy traveling and exploring new places whenever I have the opportunity.",
    question: {
      content: "Tell me about yourself: Name and where you're from, What you do (work or studies), Your hobbies and interests.",
      questionType: { code: 'SPEAKING_INTRO' }
    },
    expectedScore: { min: 4, max: 5 },
    expectedCEFR: ['A2.2', 'B1+'],
    description: "All 3 questions answered well, good grammar control, sufficient vocabulary, fluent"
  },
  {
    name: "Test 4: No meaningful response",
    transcription: "Um... uh... hello... my... uh...",
    question: {
      content: "Tell me about yourself: Name and where you're from, What you do (work or studies), Your hobbies and interests.",
      questionType: { code: 'SPEAKING_INTRO' }
    },
    expectedScore: { min: 0, max: 0 },
    expectedCEFR: ['A0'],
    description: "No meaningful language, cannot complete task"
  }
];

async function runTests() {
  console.log('='.repeat(80));
  console.log('APTIS SPEAKING PART 1 RUBRIC TEST');
  console.log('Testing A0-B1+ scale (0-5 points)');
  console.log('='.repeat(80));
  console.log('');

  const results = [];
  let passCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    console.log('─'.repeat(80));
    console.log(`📝 ${testCase.name}`);
    console.log(`Description: ${testCase.description}`);
    console.log(`Transcription: "${testCase.transcription}"`);
    console.log('');

    try {
      // Build Part 1 prompt
      const maxScore = 5;
      const criteria = [{ criteria_name: 'Overall Speaking Performance' }];
      
      const prompt = SpeakingScoringPromptBuilder.buildPart1Prompt(
        testCase.transcription,
        testCase.question,
        criteria,
        maxScore
      );

      console.log('📤 Sending to AI...');
      
      // Call AI
      const aiResponse = await AiServiceClient.callAiWithRetry(prompt, 2);
      const parsed = AiServiceClient.parseAiResponse(aiResponse, maxScore);

      console.log('');
      console.log('📥 AI Response:');
      console.log(`   Score: ${parsed.score}/${maxScore} (${((parsed.score/maxScore)*100).toFixed(1)}%)`);
      console.log(`   CEFR: ${parsed.cefrLevel}`);
      console.log(`   Comment: ${parsed.comment}`);
      console.log('');

      // Validate score range
      const scoreInRange = parsed.score >= testCase.expectedScore.min && 
                          parsed.score <= testCase.expectedScore.max;
      
      // Validate CEFR level
      const cefrMatch = testCase.expectedCEFR.some(expectedCefr => 
        parsed.cefrLevel.toUpperCase().replace(/[.\s]/g, '').includes(expectedCefr.toUpperCase().replace(/[.\s]/g, ''))
      );

      // Overall pass/fail
      const passed = scoreInRange && cefrMatch;

      console.log('✅ Expected Score Range:', `${testCase.expectedScore.min}-${testCase.expectedScore.max}/5`);
      console.log('✅ Expected CEFR:', testCase.expectedCEFR.join(' or '));
      console.log('');
      
      if (passed) {
        console.log('✅ PASS');
        passCount++;
      } else {
        console.log('❌ FAIL');
        if (!scoreInRange) {
          console.log(`   ❌ Score out of range: ${parsed.score} not in [${testCase.expectedScore.min}-${testCase.expectedScore.max}]`);
        }
        if (!cefrMatch) {
          console.log(`   ❌ CEFR mismatch: ${parsed.cefrLevel} not in [${testCase.expectedCEFR.join(', ')}]`);
        }
        failCount++;
      }

      results.push({
        test: testCase.name,
        passed,
        score: parsed.score,
        cefr: parsed.cefrLevel,
        expected: testCase.expectedCEFR
      });

    } catch (error) {
      console.log('❌ ERROR:', error.message);
      failCount++;
      results.push({
        test: testCase.name,
        passed: false,
        error: error.message
      });
    }

    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('');
  
  // Detailed results table
  console.log('DETAILED RESULTS:');
  console.log('─'.repeat(80));
  results.forEach(r => {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    const scoreInfo = r.score !== undefined ? `${r.score}/5 (${r.cefr})` : 'ERROR';
    console.log(`${status} - ${r.test}`);
    console.log(`   Result: ${scoreInfo}`);
    if (r.expected) {
      console.log(`   Expected: ${r.expected.join(' or ')}`);
    }
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
    console.log('');
  });

  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
