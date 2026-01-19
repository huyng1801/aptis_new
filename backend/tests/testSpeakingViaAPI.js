require('dotenv').config();
const axios = require('axios');
const GTTSService = require('../src/services/GTTSService');

/**
 * Speaking Scoring Test via API
 * Tests all 4 APTIS speaking tasks using REST API endpoints
 * Validates end-to-end flow: create attempt → submit answers → get feedback
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_STUDENT_EMAIL = 'student1@aptis.local';
const TEST_STUDENT_PASSWORD = 'password123';

// Sample speaking responses for testing
const speakingTestCases = {
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

console.log('\n=== APTIS SPEAKING SCORING TEST VIA API ===\n');
console.log('📊 Testing Speaking with API endpoints');
console.log(`📍 API Base URL: ${API_BASE_URL}`);
console.log(`🔐 Student Email: ${TEST_STUDENT_EMAIL}\n`);

let authToken = null;

// API helper functions
async function apiRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ API Error [${method} ${endpoint}]:`, error.response?.data || error.message);
    throw error;
  }
}

// Test workflow
async function testSpeakingViaAPI() {
  try {
    // Step 1: Login to get auth token
    console.log('🔐 STEP 1: Authenticating student...');
    const loginResponse = await apiRequest('POST', '/auth/login', {
      email: TEST_STUDENT_EMAIL,
      password: TEST_STUDENT_PASSWORD
    });
    
    authToken = loginResponse.token;
    console.log(`✅ Login successful - Token received\n`);

    // Step 2: Get available exams
    console.log('📋 STEP 2: Fetching available exams...');
    const examsResponse = await apiRequest('GET', '/exams');
    const exams = examsResponse.data || examsResponse;
    
    if (!exams || exams.length === 0) {
      throw new Error('No exams found. Please run seeding first.');
    }

    const exam = exams[0];
    console.log(`✅ Found exam: ${exam.title}`);
    console.log(`   - Total score: ${exam.total_score}`);
    console.log(`   - Sections: ${exam.ExamSections?.length || 'N/A'}\n`);

    // Step 3: Create exam attempt
    console.log('📝 STEP 3: Creating exam attempt...');
    const attemptResponse = await apiRequest('POST', `/exams/${exam.id}/attempts`, {
      exam_id: exam.id
    });
    
    const attempt = attemptResponse.data || attemptResponse;
    const attemptId = attempt.id;
    console.log(`✅ Exam attempt created: ID ${attemptId}`);
    console.log(`   - Status: ${attempt.status}\n`);

    // Step 4: Get exam sections (find speaking sections)
    console.log('🎤 STEP 4: Fetching speaking sections...');
    const sectionsResponse = await apiRequest('GET', `/exams/${exam.id}/sections`);
    const allSections = sectionsResponse.data || sectionsResponse;
    const speakingSections = allSections.filter(s => s.skill_type_id === 4); // Speaking = skill 4
    
    console.log(`✅ Found ${speakingSections.length} speaking sections\n`);

    let totalScore = 0;
    let totalMaxScore = 0;

    // Step 5: Test each speaking section
    for (let sectionIndex = 0; sectionIndex < speakingSections.length && sectionIndex < 4; sectionIndex++) {
      const section = speakingSections[sectionIndex];
      const taskKey = `task${sectionIndex + 1}`;
      const testCase = speakingTestCases[taskKey];

      console.log(`\n${'='.repeat(80)}`);
      console.log(`🧪 TESTING TASK ${sectionIndex + 1}: ${testCase.description.toUpperCase()}`);
      console.log(`${'='.repeat(80)}`);

      // Get questions in this section
      console.log(`\n📄 Getting questions from section...`);
      const questionsResponse = await apiRequest('GET', `/exams/${exam.id}/sections/${section.id}/questions`);
      const questions = questionsResponse.data || questionsResponse;
      
      if (!questions || questions.length === 0) {
        console.log(`⚠️  No questions found in section, skipping...`);
        continue;
      }

      console.log(`✅ Found ${questions.length} questions in this section\n`);

      // Submit answers for each response in this task
      for (let respIndex = 0; respIndex < testCase.responses.length; respIndex++) {
        const response = testCase.responses[respIndex];
        const questionIndex = respIndex % questions.length;
        const question = questions[questionIndex];

        console.log(`📝 Submitting response ${respIndex + 1}/${testCase.responses.length}...`);
        console.log(`   Question: ${question.content?.substring(0, 50)}...`);
        
        // Generate audio for this response
        console.log(`   🎵 Generating audio...`);
        const audioInfo = await GTTSService.generateAudioFile(
          response,
          'en',
          `test_api_task${sectionIndex + 1}_response_${respIndex + 1}_${Date.now()}.mp3`
        );
        console.log(`   ✅ Audio saved: ${audioInfo.filename}`);

        // Submit answer via API
        const answerPayload = {
          question_id: question.id,
          attempt_id: attemptId,
          answer_type: 'audio',
          transcribed_text: response,
          audio_url: audioInfo.url,
          max_score: testCase.maxScore
        };

        try {
          const submitResponse = await apiRequest('POST', '/answers/submit', answerPayload);
          const answer = submitResponse.data || submitResponse;
          
          console.log(`   ✅ Answer submitted: ID ${answer.id}`);
          console.log(`   📊 Score: ${answer.score}/${answer.max_score} (${answer.cefrLevel})`);
          console.log(`   💬 Feedback: ${answer.ai_feedback?.substring(0, 80)}...\n`);
          
          totalScore += (answer.score || 0);
          totalMaxScore += (answer.max_score || testCase.maxScore);

        } catch (error) {
          console.log(`   ⚠️  Error submitting answer:`, error.message);
        }
      }
    }

    // Step 6: Get attempt results
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 FINAL RESULTS`);
    console.log(`${'='.repeat(80)}\n`);

    const resultsResponse = await apiRequest('GET', `/exams/${exam.id}/attempts/${attemptId}`);
    const finalAttempt = resultsResponse.data || resultsResponse;

    console.log(`Total Score: ${totalScore}/${totalMaxScore}`);
    console.log(`Percentage: ${((totalScore / totalMaxScore) * 100).toFixed(1)}%`);
    console.log(`Attempt Status: ${finalAttempt.status}`);
    console.log(`Completed At: ${finalAttempt.completed_at || 'In progress'}\n`);

    console.log('✅ API test completed successfully!\n');

    return {
      success: true,
      totalScore,
      totalMaxScore,
      attemptId
    };

  } catch (error) {
    console.error('\n❌ API Test Failed:', error.message);
    console.error(error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run test
if (require.main === module) {
  testSpeakingViaAPI()
    .then(result => {
      if (result.success) {
        console.log('🎉 Speaking API Test Completed Successfully!');
        process.exit(0);
      } else {
        console.log('❌ Speaking API Test Failed');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Fatal Error:', err);
      process.exit(1);
    });
}

module.exports = testSpeakingViaAPI;
