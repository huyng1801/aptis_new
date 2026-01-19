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
const GTTSService = require('../src/services/GTTSService');
const fs = require('fs').promises;
const path = require('path');

/**
 * Speaking Scoring Test with AI + Audio Generation
 * Tests all 4 APTIS speaking tasks with generated audio files
 */

// Sample speaking responses for testing
const speakingTestCases = {
  // Task 1: Personal Introduction (A2) - 3 questions
  task1: {
    questionType: 'SPEAKING_INTRO',
    responses: [
      "Hello, my name is Alex. I'm an 18-year-old university student from Hanoi, Vietnam. I'm currently studying International Business at the National Economics University. I live with my parents and younger sister in a cozy apartment in the Cau Giay district, which is quite convenient for commuting to my university.",
      "In my free time, I'm really passionate about sports and entertainment. I play football twice a week with my university team, and I'm also learning to play the guitar. I love listening to various music genres, from classical to rock. Additionally, I enjoy reading, particularly science fiction novels by authors like Isaac Asimov and Philip K. Dick.",
      "I'm working hard to improve my English because I believe it's essential for my future career. I want to work for an international company or perhaps study for my master's degree abroad. To enhance my skills, I watch English movies without subtitles, participate in online language exchange programs, and read international business news daily. My ultimate goal is to become fluent enough to communicate confidently in any professional setting."
    ],
    expectedCefrRange: ['A2.1', 'A2.2', 'B1+'],
    expectedScoreRange: [8, 12.5],
    maxScore: 12.5,
    description: 'Personal introduction'
  },

  // Task 2: Description (B1) - Picture/topic description
  task2: {
    questionType: 'SPEAKING_DESCRIPTION',
    responses: [
      "This picture depicts a stunning urban park on what appears to be a bright, sunny afternoon. The park is beautifully landscaped with mature trees providing shade, colorful flowerbeds bursting with seasonal blooms, and well-maintained grass areas. Several people are leisurely strolling along the winding pathways, while groups of children are energetically playing games on the open lawn. The overall atmosphere is vibrant and welcoming.",
      "At the heart of the park stands an impressive ornamental fountain with water cascading elegantly. Surrounding it are numerous wooden benches where visitors are seated, some reading newspapers, others chatting with friends or simply enjoying the tranquil environment. Near a small pond, I can see people feeding ducks and swans. There's also a well-equipped playground featuring modern swings, colorful slides, and climbing frames where children are clearly having a wonderful time under their parents' watchful eyes.",
      "I believe this is an ideal location for families and individuals to unwind and reconnect with nature. The peaceful, serene atmosphere offers a perfect escape from the hectic urban lifestyle. People can engage in various activities - exercising, jogging, practicing yoga, or simply sitting quietly with a good book. What makes this park particularly special is how it brings the community together, creating a shared space where people of all ages can relax, socialize, and appreciate the natural beauty around them."
    ],
    expectedCefrRange: ['B1.1', 'B1.2', 'B2+'],
    expectedScoreRange: [8, 12.5],
    maxScore: 12.5,
    description: 'Picture description'
  },

  // Task 3: Comparison (B1)
  task3: {
    questionType: 'SPEAKING_COMPARISON',
    responses: [
      "While both pictures depict physical exercise, they present contrasting environments and approaches to fitness. The first image shows people working out in a modern, well-equipped gym with various machines and weights, while the second picture captures runners enjoying outdoor exercise in a scenic park surrounded by nature. The gym environment is controlled and structured, whereas the park setting offers a more natural and liberating atmosphere for physical activity.",
      "Personally, I strongly believe that exercising outdoors, particularly running in a park, offers superior benefits compared to gym workouts. When you run in a park, you're breathing fresh, unpolluted air and absorbing vitamin D from sunlight, which is excellent for both physical and mental health. The constantly changing scenery makes the exercise more enjoyable and less monotonous. Furthermore, outdoor exercise is completely free and accessible to everyone, whereas gym memberships can be quite expensive. The connection with nature also provides psychological benefits, reducing stress and improving mood.",
      "Nevertheless, I must acknowledge that gym facilities have their distinct advantages. They provide access to specialized equipment and professional trainers who can design personalized workout programs and correct your form. Gyms are also climate-controlled, allowing year-round exercise regardless of weather conditions like rain, extreme heat, or cold. Additionally, some people find the gym environment more motivating and appreciate the structured classes offered. Ultimately, both options have significant merits, and the best choice depends on individual preferences, fitness goals, budget, and lifestyle. The most important thing is staying physically active regardless of the setting chosen."
    ],
    expectedCefrRange: ['B1.1', 'B1.2', 'B2+'],
    expectedScoreRange: [8, 12.5],
    maxScore: 12.5,
    description: 'Comparison task'
  },

  // Task 4: Discussion (B2) - Extended response
  task4: {
    questionType: 'SPEAKING_DISCUSSION',
    responses: [
      "Technology has completely transformed modern education. First, let me discuss the advantages. Digital tools have made learning more accessible - students can now access online courses, educational videos, and research materials from anywhere. Technology also enables personalized learning through adaptive software that adjusts to individual student needs. Interactive platforms make lessons more engaging through gamification and multimedia content. However, there are also significant disadvantages. Online learning can reduce face-to-face interaction, which is crucial for developing social skills. Not all students have equal access to technology, creating a digital divide. Additionally, excessive screen time may affect students' health and concentration. Looking ahead, I believe technology will become even more integrated into education. We'll likely see more virtual reality classrooms, AI-powered tutors, and global collaborative projects. But we must ensure teachers receive proper training and that technology complements rather than replaces traditional teaching methods. The key is finding the right balance between technology and human interaction."
    ],
    expectedCefrRange: ['B2.1', 'B2.2', 'C1', 'C2'],
    expectedScoreRange: [8, 12.5],
    maxScore: 12.5,
    description: 'Topic discussion'
  }
};

console.log('📊 SCORING DISTRIBUTION: 12.5 + 12.5 + 12.5 + 12.5 = 50 points total\n');
console.log('🔍 Testing Speaking Scoring with Audio Generation (12.5 × 4 = 50)...\n');
console.log('✓ Task 1: max 12.5 points - Personal introduction');
console.log('✓ Task 2: max 12.5 points - Picture description');
console.log('✓ Task 3: max 12.5 points - Comparison');
console.log('✓ Task 4: max 12.5 points - Topic discussion');
console.log('✅ Total: 50 points (equal distribution)\n');
console.log('=== APTIS SPEAKING SCORING TEST ===\n');

async function testSpeakingScoring() {
  try {
    // Get APTIS type and admin user
    const aptisType = await AptisType.findOne({ where: { code: 'APTIS_GENERAL' } });
    const adminUser = await User.findOne({ where: { role: 'admin' } });

    if (!aptisType || !adminUser) {
      throw new Error('APTIS type or admin user not found');
    }

    // Test each speaking task
    for (const [taskKey, testCase] of Object.entries(speakingTestCases)) {
      console.log(`\n🧪 Testing ${taskKey.toUpperCase()}`);
      console.log(`Question Type: ${testCase.questionType}`);
      console.log(`Max Score: ${testCase.maxScore}`);
      console.log(`Responses: ${testCase.responses.length}`);

      // Get question type and question
      const questionType = await QuestionType.findOne({ where: { code: testCase.questionType } });
      const question = await Question.findOne({
        where: { question_type_id: questionType.id },
        include: [{ model: QuestionType, as: 'questionType' }]
      });

      if (!question) {
        console.log(`❌ No question found for ${testCase.questionType}`);
        continue;
      }

      // Override max_score for testing
      question.max_score = testCase.maxScore;

      // Get scoring criteria
      const criteria = await AiScoringCriteria.findAll({
        where: {
          aptis_type_id: aptisType.id,
          question_type_id: questionType.id
        }
      });

      console.log(`\n📝 Generating audio files for ${testCase.responses.length} responses...`);
      
      // Generate audio for each response
      const audioFiles = [];
      for (let i = 0; i < testCase.responses.length; i++) {
        const response = testCase.responses[i];
        console.log(`  [${i + 1}/${testCase.responses.length}] Generating audio...`);
        
        try {
          const audioInfo = await GTTSService.generateAudioFile(
            response,
            'en',
            `test_${taskKey}_response_${i + 1}_${Date.now()}.mp3`
          );
          
          audioFiles.push(audioInfo);
          console.log(`  ✅ Audio saved: ${audioInfo.filename}`);
        } catch (error) {
          console.error(`  ❌ Failed to generate audio: ${error.message}`);
          audioFiles.push(null);
        }
      }

      // Combine all responses into transcription
      const fullTranscription = testCase.responses.join('\n\n');

      // Create a mock answer with audio (using first audio file as primary)
      const primaryAudio = audioFiles.find(a => a !== null);
      if (!primaryAudio) {
        console.log(`❌ No audio files generated, skipping test`);
        continue;
      }

      // Create temporary answer for testing
      const answer = {
        id: Date.now(),
        question_id: question.id,
        question,
        audio_url: primaryAudio.url,
        transcribed_text: fullTranscription,
        answer_type: 'audio',
        max_score: testCase.maxScore
      };

      console.log(`\n🎯 Scoring with ${criteria.length} criteria (max_score set to ${testCase.maxScore})...`);

      // Score the answer
      const result = await AiScoringService.scoreEntireAnswer(
        fullTranscription,
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

      console.log('\n🎤 AUDIO FILES GENERATED:');
      audioFiles.filter(a => a).forEach((audio, idx) => {
        console.log(`  ${idx + 1}. ${audio.filename}`);
      });

      console.log('\n' + '='.repeat(80) + '\n');
    }

    console.log('🎉 Speaking scoring test completed!');

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
    'SPEAKING_INTRO': 'speaking_task_1',
    'SPEAKING_DESCRIPTION': 'speaking_task_2',
    'SPEAKING_COMPARISON': 'speaking_task_3',
    'SPEAKING_DISCUSSION': 'speaking_task_4'
  };
  return mapping[questionType] || 'general';
}

// Run the test
testSpeakingScoring();
