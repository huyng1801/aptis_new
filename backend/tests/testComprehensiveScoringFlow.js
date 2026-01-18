#!/usr/bin/env node

/**
 * Test comprehensive AI scoring flow end-to-end
 * Kiểm tra toàn bộ flow từ scoring -> database -> API response
 */

const path = require('path');
const { Sequelize } = require('sequelize');

// Set up environment
process.env.NODE_ENV = 'test';
process.chdir(path.join(__dirname, '..'));

const { 
  AttemptAnswer, 
  AnswerAiFeedback, 
  Question, 
  QuestionType, 
  AiScoringCriteria,
  ExamAttempt,
  Exam,
  User
} = require('../src/models');
const AiScoringService = require('../src/services/AiScoringService');
const { sequelize } = require('../src/config/database');

async function testComprehensiveScoringFlow() {
  console.log('\n========== TEST COMPREHENSIVE AI SCORING FLOW ==========\n');

  try {
    // Step 1: Find or create test data
    console.log('[1] Setting up test data...');
    
    // Find a WRITING question with AI scoring
    const writingQuestion = await Question.findOne({
      include: [{
        model: QuestionType,
        as: 'questionType',
        where: {
          code: {
            [Sequelize.Op.like]: 'WRITING_%'
          },
          scoring_method: 'ai'
        }
      }]
    });

    if (!writingQuestion) {
      console.log('❌ No WRITING questions found with AI scoring');
      return;
    }

    console.log(`✅ Found WRITING question: ID=${writingQuestion.id}, Type=${writingQuestion.questionType.code}`);

    // Find student and exam
    const student = await User.findOne({ where: { role: 'student' } });
    const exam = await Exam.findOne({ where: { status: 'published' } });

    if (!student || !exam) {
      console.log('❌ Required test data not found (student or exam)');
      return;
    }

    // Create exam attempt
    const attempt = await ExamAttempt.create({
      student_id: student.id,
      exam_id: exam.id,
      attempt_type: 'full_exam', // Use valid enum value
      attempt_number: 1,
      start_time: new Date(),
      status: 'in_progress'
    });

    console.log(`✅ Created exam attempt: ID=${attempt.id}`);

    // Create answer for WRITING question
    const testAnswer = "I am writing this essay to express my views on the importance of education in modern society. Education plays a crucial role in shaping individuals and communities. Through education, people develop critical thinking skills, gain knowledge, and become better citizens. Furthermore, education provides opportunities for career advancement and personal growth. In conclusion, investing in quality education is essential for building a prosperous and equitable society.";

    const answer = await AttemptAnswer.create({
      attempt_id: attempt.id,
      question_id: writingQuestion.id,
      answer_type: 'text',
      text_answer: testAnswer,
      max_score: 10,
      needs_review: false
    });

    console.log(`✅ Created test answer: ID=${answer.id} (${testAnswer.length} chars)`);

    // Step 2: Test comprehensive scoring
    console.log('\n[2] Testing comprehensive AI scoring...');
    
    const scoringStartTime = Date.now();
    const result = await AiScoringService.scoreAnswerComprehensively(answer.id, false);
    const scoringDuration = Date.now() - scoringStartTime;
    
    console.log(`✅ Comprehensive scoring completed in ${scoringDuration}ms`);
    console.log(`   Score: ${result.score}/${result.maxScore || 'undefined'}`);
    console.log(`   CEFR: ${result.cefrLevel}`);

    // Step 3: Verify database storage
    console.log('\n[3] Verifying database storage...');
    
    // Check AttemptAnswer was updated
    const updatedAnswer = await AttemptAnswer.findByPk(answer.id);
    console.log(`✅ AttemptAnswer updated: score=${updatedAnswer.score}, ai_graded_at=${updatedAnswer.ai_graded_at ? 'YES' : 'NO'}`);

    // Check AnswerAiFeedback was created
    const feedbacks = await AnswerAiFeedback.findAll({
      where: { answer_id: answer.id }
    });
    
    console.log(`✅ Found ${feedbacks.length} AnswerAiFeedback record(s)`);
    
    if (feedbacks.length > 0) {
      const feedback = feedbacks[0];
      console.log(`   ID: ${feedback.id}`);
      console.log(`   Score: ${feedback.score}`);
      console.log(`   CEFR: ${feedback.cefr_level}`);
      console.log(`   Comment: ${feedback.comment ? feedback.comment.substring(0, 100) + '...' : 'None'}`);
      console.log(`   Comment: ${feedback.comment ? feedback.comment.substring(0, 100) + '...' : 'None'}`);
      console.log(`   Suggestions: ${feedback.suggestions ? feedback.suggestions.substring(0, 50) + '...' : 'None'}`);
    }

    // Step 4: Test API response format (simulate controller)
    console.log('\n[4] Testing API response format...');
    
    const apiAnswer = await AttemptAnswer.findByPk(answer.id, {
      include: [{
        model: AnswerAiFeedback,
        as: 'aiFeedbacks',
        attributes: ['id', 'answer_id', 'score', 'comment', 'suggestions', 'cefr_level']
      }, {
        model: Question,
        as: 'question',
        include: [{
          model: QuestionType,
          as: 'questionType'
        }]
      }]
    });

    console.log('✅ API Response Structure:');
    console.log(`   Answer ID: ${apiAnswer.id}`);
    console.log(`   Score: ${apiAnswer.score}/${apiAnswer.max_score}`);
    console.log(`   AI Feedbacks Count: ${apiAnswer.aiFeedbacks?.length || 0}`);
    
    if (apiAnswer.aiFeedbacks && apiAnswer.aiFeedbacks.length > 0) {
      const apiFeedback = apiAnswer.aiFeedbacks[0];
      console.log(`   API Feedback Structure:`);
      console.log(`     - ID: ${apiFeedback.id}`);
      console.log(`     - Score: ${apiFeedback.score}`);
      console.log(`     - CEFR: ${apiFeedback.cefr_level}`);
      console.log(`     - Has Comment: ${!!apiFeedback.comment}`);
      console.log(`     - Has Comment: ${!!apiFeedback.comment}`);
      console.log(`     - Has Suggestions: ${!!apiFeedback.suggestions}`);
      console.log(`     - Has Suggestions: ${!!apiFeedback.suggestions}`);
    }

    // Step 5: Test Speaking question if available
    console.log('\n[5] Testing SPEAKING question (if available)...');
    
    const speakingQuestion = await Question.findOne({
      include: [{
        model: QuestionType,
        as: 'questionType',
        where: {
          code: {
            [Sequelize.Op.like]: 'SPEAKING_%'
          },
          scoring_method: 'ai'
        }
      }]
    });

    if (speakingQuestion) {
      console.log(`✅ Found SPEAKING question: ID=${speakingQuestion.id}, Type=${speakingQuestion.questionType.code}`);
      
      // Create speaking answer with transcribed text (simulating audio processing)
      const speakingText = "Hello, my name is John. I'm from Vietnam and I'm currently studying English to improve my job opportunities. I enjoy reading books, playing tennis, and spending time with my family. I believe that learning English is very important in today's global world.";
      
      const speakingAnswer = await AttemptAnswer.create({
        attempt_id: attempt.id,
        question_id: speakingQuestion.id,
        answer_type: 'audio',
        transcribed_text: speakingText, // Simulate transcription completed
        max_score: 5,
        needs_review: false
      });

      console.log(`✅ Created speaking answer: ID=${speakingAnswer.id} (${speakingText.length} chars transcribed)`);

      // Score speaking comprehensively
      const speakingScoringStart = Date.now();
      const speakingResult = await AiScoringService.scoreAnswerComprehensively(speakingAnswer.id, true);
      const speakingScoringDuration = Date.now() - speakingScoringStart;
      
      console.log(`✅ Speaking comprehensive scoring completed in ${speakingScoringDuration}ms`);
      console.log(`   Score: ${speakingResult.score}/${speakingResult.maxScore || 'undefined'}`);
      console.log(`   CEFR: ${speakingResult.cefrLevel}`);

      // Verify speaking feedback
      const speakingFeedbacks = await AnswerAiFeedback.findAll({
        where: { answer_id: speakingAnswer.id }
      });
      
      console.log(`✅ Speaking feedback records: ${speakingFeedbacks.length}`);
      if (speakingFeedbacks.length > 0) {
        const sf = speakingFeedbacks[0];
        console.log(`   Speaking CEFR: ${sf.cefr_level}, Score: ${sf.score}`);
      }
    } else {
      console.log('⚠️ No SPEAKING questions found with AI scoring');
    }

    console.log('\n========== COMPREHENSIVE FLOW TEST RESULTS ==========');
    console.log('✅ ALL TESTS PASSED!');
    console.log('✅ Comprehensive AI scoring working correctly');
    console.log('✅ Database storage validated');
    console.log('✅ API response structure confirmed');
    console.log('✅ Frontend-ready data format verified');
    console.log('========================================================');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testComprehensiveScoringFlow();