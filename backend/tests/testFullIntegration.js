/**
 * Integration Test: Mock → AI Scoring → Database Storage
 * Tests the complete pipeline from mock data through AI scoring to database
 */

require('dotenv').config();
const aiServiceClient = require('../src/services/scoring/AiServiceClient');
const sequelize = require('../src/config/database');
const {
  AttemptAnswer,
  AnswerAiFeedback,
  ExamAttempt,
  Question,
  QuestionType,
} = require('../src/models');

// Mock test data
const mockAnswer = {
  answer_text: 'I enjoy playing tennis, swimming, and reading books. These hobbies help me stay active and relaxed.',
  answer_type: 'text',
};

const mockQuestion = {
  content: 'Write about your hobbies.',
  questionType: {
    code: 'WRITING_SHORT',
    question_type_name: 'Short Response',
    scoring_method: 'ai',
  },
  max_score: 4,
};

async function testFullIntegration() {
  console.log('\n========== FULL INTEGRATION TEST: MOCK → AI → DATABASE ==========\n');

  try {
    // Step 1: Check AI service
    console.log('[1] Checking AI service...');
    const aiStatus = aiServiceClient.getServiceStatus();
    if (!aiStatus?.available) {
      throw new Error('❌ Ollama is not available');
    }
    console.log(`   ✅ AI service ready\n`);

    // Step 2: Create test data in database
    console.log('[2] Creating test data in database...');
    
    // Find or create user
    const { User } = require('../src/models');
    let user = await User.findOne({ where: { email: 'integration_test@test.com' } });
    if (!user) {
      user = await User.create({
        email: 'integration_test@test.com',
        full_name: 'Integration Test User',
        password_hash: 'test_hash',
        role: 'student',
        status: 'active',
      });
      console.log(`   ✅ Created test user ID: ${user.id}`);
    } else {
      console.log(`   ✅ Found existing user ID: ${user.id}`);
    }

    // Find or create exam
    const { Exam, AptisType } = require('../src/models');
    const aptisType = await AptisType.findOne({ where: { code: 'APTIS_GENERAL' } });
    let exam = await Exam.findOne({
      where: { aptis_type_id: aptisType.id, title: 'Integration Test Exam' },
    });

    if (!exam) {
      exam = await Exam.create({
        aptis_type_id: aptisType.id,
        title: 'Integration Test Exam',
        description: 'For integration testing',
        duration_minutes: 120,
        created_by: user.id,
      });
      console.log(`   ✅ Created test exam ID: ${exam.id}`);
    } else {
      console.log(`   ✅ Found existing exam ID: ${exam.id}`);
    }

    // Create exam attempt
    const attempt = await ExamAttempt.create({
      exam_id: exam.id,
      student_id: user.id,
      attempt_type: 'full_exam',
      start_time: new Date(),
      status: 'in_progress',
    });
    console.log(`   ✅ Created exam attempt ID: ${attempt.id}`);

    // Find or create question
    const questionType = await QuestionType.findOne({
      where: { code: 'WRITING_SHORT' },
    });

    let question = await Question.findOne({
      where: {
        question_type_id: questionType.id,
        content: 'Write about your hobbies.',
      },
    });

    if (!question) {
      question = await Question.create({
        question_type_id: questionType.id,
        aptis_type_id: aptisType.id,
        difficulty: 'easy',
        content: 'Write about your hobbies.',
        status: 'active',
        created_by: user.id,
      });
      console.log(`   ✅ Created test question ID: ${question.id}`);
    } else {
      console.log(`   ✅ Found existing question ID: ${question.id}`);
    }

    // Create attempt answer
    const answer = await AttemptAnswer.create({
      attempt_id: attempt.id,
      question_id: question.id,
      answer_type: 'text',
      text_answer: mockAnswer.answer_text,
      max_score: mockQuestion.max_score,
    });
    console.log(`   ✅ Created attempt answer ID: ${answer.id}\n`);

    // Step 3: Call AI Service
    console.log('[3] Calling AI service for scoring...');
    const prompt = generateScoringPrompt(
      mockAnswer.answer_text,
      mockQuestion.content,
      mockQuestion.max_score
    );

    const aiResponse = await aiServiceClient.callAiWithRetry(prompt);
    console.log(`   ✅ AI response received\n`);

    // Step 4: Parse AI response
    console.log('[4] Parsing AI response...');
    let feedback = null;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
        console.log(`   ✅ JSON parsed successfully\n`);
      }
    } catch (parseError) {
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    if (!feedback) {
      throw new Error('No feedback received from AI');
    }

    // Step 5: Store feedback in database
    console.log('[5] Storing feedback in database...');
    const aiFeedback = await AnswerAiFeedback.create({
      answer_id: answer.id,
      score: feedback.score,
      cefr_level: feedback.cefr_level,
      comment: feedback.feedback_comment,
      comment: feedback.comment,
      suggestions: JSON.stringify(feedback.suggestions),
    });

    console.log(`   ✅ Created AnswerAiFeedback ID: ${aiFeedback.id}`);

    // Update answer with score
    await answer.update({
      score: feedback.score,
      ai_feedback: feedback.feedback_comment,
      ai_graded_at: new Date(),
    });

    console.log(`   ✅ Updated AttemptAnswer with score\n`);

    // Step 6: Verify data in database
    console.log('[6] Verifying data in database...');

    const savedFeedback = await AnswerAiFeedback.findByPk(aiFeedback.id);
    const updatedAnswer = await AttemptAnswer.findByPk(answer.id);

    if (!savedFeedback) {
      throw new Error('AnswerAiFeedback not found in database');
    }

    if (!updatedAnswer.score) {
      throw new Error('AttemptAnswer score not updated');
    }

    console.log(`   ✅ AnswerAiFeedback verified:`);
    console.log(`      - Score: ${savedFeedback.score}`);
    console.log(`      - CEFR: ${savedFeedback.cefr_level}`);
    const comment = savedFeedback.comment;
    console.log(`      - Comment: ${comment ? comment.substring(0, 60) + '...' : 'N/A'}`);

    console.log(`   ✅ AttemptAnswer verified:`);
    console.log(`      - Score: ${updatedAnswer.score}/${updatedAnswer.max_score}`);
    console.log(`      - AI Graded At: ${updatedAnswer.ai_graded_at}`);

    // Step 7: Retrieve and display complete record
    console.log('\n[7] Complete Record:\n');

    const completeRecord = await AttemptAnswer.findByPk(answer.id, {
      include: [
        {
          association: 'aiFeedbacks',
          attributes: ['id', 'score', 'cefr_level', 'comment'],
        },
      ],
    });

    console.log(`📝 Answer:`);
    console.log(`   - ID: ${completeRecord.id}`);
    console.log(`   - Text: "${completeRecord.text_answer.substring(0, 50)}..."`);
    console.log(`   - Score: ${completeRecord.score}/${completeRecord.max_score}`);
    console.log(`\n🤖 AI Feedback:`);
    if (completeRecord.aiFeedbacks && completeRecord.aiFeedbacks.length > 0) {
      const fb = completeRecord.aiFeedbacks[0];
      console.log(`   - Score: ${fb.score}`);
      console.log(`   - CEFR: ${fb.cefr_level}`);
      console.log(`   - Comment: ${fb.comment ? fb.comment.substring(0, 80) + '...' : 'N/A'}`);
    } else {
      console.log(`   - No feedback found`);
    }

    console.log('\n✅ INTEGRATION TEST PASSED!\n');
    console.log('Pipeline verified:');
    console.log('  ✅ Mock data → Database');
    console.log('  ✅ Database → AI Scoring');
    console.log('  ✅ AI Response → Parsing');
    console.log('  ✅ Parsed Data → Database');
    console.log('  ✅ Database Retrieval → Display\n');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
    } catch (e) {
      // Ignore close errors
    }
  }
}

/**
 * Generate scoring prompt
 */
function generateScoringPrompt(answerText, questionContent, maxScore) {
  return `You are an APTIS English test examiner. Score this writing answer.

Question: ${questionContent}

Answer: "${answerText}"

Score: 0-${maxScore} points

Respond with ONLY JSON:
{
  "score": <number 0-${maxScore}>,
  "cefr_level": "<A1|A2|B1|B2|C1|C2>",
  "feedback_comment": "<brief comment>",
  "comment": "<general assessment>",
  "suggestions": ["<suggestion1>", "<suggestion2>"]
}`;
}

// Run test
testFullIntegration();
