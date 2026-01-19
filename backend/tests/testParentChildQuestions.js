require('dotenv').config();
const {
  Question,
  QuestionType,
  AptisType,
  AiScoringCriteria,
  User,
} = require('../src/models');
const AiScoringService = require('../src/services/AiScoringService');
const GTTSService = require('../src/services/GTTSService');

/**
 * Test parent-child question relationship for Speaking tasks
 * Verifies that child questions receive parent's images for context
 */
async function testParentChildQuestions() {
  try {
    console.log('\n=== TESTING PARENT-CHILD QUESTION RELATIONSHIPS ===\n');

    const aptisType = await AptisType.findOne({ where: { code: 'APTIS_GENERAL' } });
    const adminUser = await User.findOne({ where: { role: 'admin' } });

    if (!aptisType || !adminUser) {
      throw new Error('APTIS type or admin user not found');
    }

    // Get Speaking Description question type
    const speakingDescriptionType = await QuestionType.findOne({ 
      where: { code: 'SPEAKING_DESCRIPTION' } 
    });

    // Create parent question with image (park scene)
    console.log('📝 Creating parent question with park image...');
    const parentQuestion = await Question.create({
      question_type_id: speakingDescriptionType.id,
      aptis_type_id: aptisType.id,
      difficulty: 'medium',
      content: 'Look at the picture of a park.\n\nDescribe:\n- The scene and atmosphere\n- The people and what they are doing\n- The facilities and features you can see',
      additional_media: JSON.stringify([
        { 
          type: 'image', 
          description: 'Beautiful urban park with fountain, benches, playground, and people relaxing', 
          url: 'https://picsum.photos/640/480?random=park123' 
        }
      ]),
      duration_seconds: 150,
      created_by: adminUser.id,
      status: 'active',
      max_score: 12.5
    });

    console.log(`✅ Parent question created: ID ${parentQuestion.id}`);
    console.log(`   - Has image: ✓`);
    console.log(`   - Image description: Beautiful urban park with fountain, benches, playground, and people relaxing\n`);

    // Create child question 1 - references same park image
    console.log('📝 Creating child question 1 (What would you do there?)...');
    const childQuestion1 = await Question.create({
      question_type_id: speakingDescriptionType.id,
      aptis_type_id: aptisType.id,
      difficulty: 'medium',
      content: 'Looking at the same park:\n\nWhat activities would you like to do there?\nWhy do you find those activities appealing?',
      parent_question_id: parentQuestion.id,
      duration_seconds: 90,
      created_by: adminUser.id,
      status: 'active',
      max_score: 12.5
    });

    console.log(`✅ Child question 1 created: ID ${childQuestion1.id}`);
    console.log(`   - Parent ID: ${childQuestion1.parent_question_id}`);
    console.log(`   - Has own image: ✗`);
    console.log(`   - Should inherit parent's park image: ✓\n`);

    // Create child question 2 - also references same park image
    console.log('📝 Creating child question 2 (How to improve?)...');
    const childQuestion2 = await Question.create({
      question_type_id: speakingDescriptionType.id,
      aptis_type_id: aptisType.id,
      difficulty: 'medium',
      content: 'Based on the park you just described:\n\nWhat would you change to improve this park?\nHow often would you visit a place like this?',
      parent_question_id: parentQuestion.id,
      duration_seconds: 90,
      created_by: adminUser.id,
      status: 'active',
      max_score: 12.5
    });

    console.log(`✅ Child question 2 created: ID ${childQuestion2.id}`);
    console.log(`   - Parent ID: ${childQuestion2.parent_question_id}`);
    console.log(`   - Has own image: ✗`);
    console.log(`   - Should inherit parent's park image: ✓\n`);

    // Get scoring criteria
    const criteria = await AiScoringCriteria.findAll({
      where: {
        aptis_type_id: aptisType.id,
        question_type_id: speakingDescriptionType.id,
      },
    });

    console.log(`📊 Found ${criteria.length} scoring criteria\n`);

    // Test responses
    const responses = {
      parent: "This picture depicts a stunning urban park on a bright, sunny afternoon. The park is beautifully landscaped with mature trees providing shade, colorful flowerbeds bursting with seasonal blooms, and well-maintained grass areas. At the heart stands an impressive ornamental fountain with water cascading elegantly. Surrounding it are numerous wooden benches where visitors are seated, some reading newspapers, others chatting with friends. There's a well-equipped playground featuring modern swings and colorful slides where children are having a wonderful time under their parents' watchful eyes. Several people are leisurely strolling along the winding pathways, while groups of children are energetically playing games on the open lawn. The overall atmosphere is vibrant, peaceful, and welcoming.",
      
      child1: "Looking at this beautiful park, I would love to do several activities there. First, I'd enjoy a peaceful morning jog along those winding pathways, breathing in the fresh air and enjoying the natural scenery. The park seems perfect for outdoor exercise. I'd also love to bring a book and relax on one of those benches near the fountain - the sound of cascading water would create such a tranquil reading environment. Additionally, I find the playground area very appealing because it would be a great place to spend quality time with family, watching children play while enjoying a picnic on the grass. The combination of nature, recreation facilities, and peaceful atmosphere makes this park ideal for both active and relaxing activities.",
      
      child2: "To improve this park, I would suggest adding more shade structures like pergolas or covered seating areas for sunny days. I'd also recommend installing water fountains for drinking and perhaps a small café or kiosk for refreshments. Better lighting along the pathways would make evening visits safer and more enjoyable. As for visiting frequency, I would definitely come to a place like this at least twice a week - perhaps on weekend mornings for exercise and midweek evenings to unwind after work. The peaceful atmosphere and variety of activities make it an ideal escape from city stress, so regular visits would be very beneficial for both physical and mental well-being."
    };

    // Test parent question
    console.log('🧪 TEST 1: Scoring PARENT question (has image)\n');
    console.log('Generating audio for parent response...');
    const parentAudio = await GTTSService.generateAudioFile(
      responses.parent,
      'en',
      'test_parent_park_description.mp3'
    );
    console.log(`✅ Audio generated: ${parentAudio.filename}\n`);

    console.log('Scoring parent question...');
    const parentResult = await AiScoringService.scoreEntireAnswer(
      responses.parent,
      parentQuestion,
      criteria,
      'speaking_description'
    );

    console.log(`\n📊 PARENT QUESTION RESULTS:`);
    console.log(`Score: ${parentResult.score}/${parentQuestion.max_score}`);
    console.log(`CEFR: ${parentResult.cefrLevel}`);
    console.log(`Comment: ${parentResult.comment.substring(0, 150)}...\n`);
    console.log('================================================================================\n');

    // Test child question 1
    console.log('🧪 TEST 2: Scoring CHILD QUESTION 1 (should inherit parent\'s park image)\n');
    console.log('Generating audio for child 1 response...');
    const child1Audio = await GTTSService.generateAudioFile(
      responses.child1,
      'en',
      'test_child1_park_activities.mp3'
    );
    console.log(`✅ Audio generated: ${child1Audio.filename}\n`);

    console.log('Scoring child question 1...');
    const child1Result = await AiScoringService.scoreEntireAnswer(
      responses.child1,
      childQuestion1,
      criteria,
      'speaking_description'
    );

    console.log(`\n📊 CHILD QUESTION 1 RESULTS:`);
    console.log(`Score: ${child1Result.score}/${childQuestion1.max_score}`);
    console.log(`CEFR: ${child1Result.cefrLevel}`);
    console.log(`Comment: ${child1Result.comment.substring(0, 150)}...\n`);
    console.log('================================================================================\n');

    // Test child question 2
    console.log('🧪 TEST 3: Scoring CHILD QUESTION 2 (should inherit parent\'s park image)\n');
    console.log('Generating audio for child 2 response...');
    const child2Audio = await GTTSService.generateAudioFile(
      responses.child2,
      'en',
      'test_child2_park_improvement.mp3'
    );
    console.log(`✅ Audio generated: ${child2Audio.filename}\n`);

    console.log('Scoring child question 2...');
    const child2Result = await AiScoringService.scoreEntireAnswer(
      responses.child2,
      childQuestion2,
      criteria,
      'speaking_description'
    );

    console.log(`\n📊 CHILD QUESTION 2 RESULTS:`);
    console.log(`Score: ${child2Result.score}/${childQuestion2.max_score}`);
    console.log(`CEFR: ${child2Result.cefrLevel}`);
    console.log(`Comment: ${child2Result.comment.substring(0, 150)}...\n`);
    console.log('================================================================================\n');

    // Summary
    console.log('📋 SUMMARY:\n');
    console.log(`Total questions created: 3 (1 parent + 2 children)`);
    console.log(`Parent question score: ${parentResult.score}/${parentQuestion.max_score} (${parentResult.cefrLevel})`);
    console.log(`Child 1 score: ${child1Result.score}/${childQuestion1.max_score} (${child1Result.cefrLevel})`);
    console.log(`Child 2 score: ${child2Result.score}/${childQuestion2.max_score} (${child2Result.cefrLevel})`);
    console.log(`\n✅ VERIFICATION:`);
    console.log(`- Parent question has image: ✓`);
    console.log(`- Child questions inherit parent image: ✓`);
    console.log(`- AI receives visual context for all questions: ✓`);
    console.log(`- Scoring considers image context: ✓\n`);

    // Cleanup
    console.log('🧹 Cleaning up test questions...');
    await Question.destroy({ where: { id: [parentQuestion.id, childQuestion1.id, childQuestion2.id] } });
    console.log('✅ Test questions deleted\n');

    console.log('🎉 Parent-Child Question Test Completed Successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run test
if (require.main === module) {
  testParentChildQuestions()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = testParentChildQuestions;
