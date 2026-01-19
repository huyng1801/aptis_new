require('dotenv').config();
const {
  Question,
  QuestionItem,
  QuestionOption,
  QuestionType,
  AptisType,
  User,
} = require('../models');
const GTTSService = require('../services/GTTSService');

/**
 * Seed APTIS questions theo cấu trúc chính thức (200 điểm tổng)
 * 
 * CẤU TRÚC ĐỀ THI APTIS CHÍNH THỨC:
 * - Listening: 25 câu, 50 điểm (Part 1: 13 câu, Part 2-4: 4 câu nhỏ mỗi part)
 * - Reading: 29 câu, 50 điểm (Part 1: 5 câu-10đ, Part 2: 5 câu-5đ, Part 3: 5 câu-5đ, Part 4: 7 câu-16đ, Part 5: 7 câu-14đ)
 * - Writing: 50 điểm (4 tasks, CEFR-based scoring)
 * - Speaking: 50 điểm (4 tasks, CEFR-based scoring)
 * TỔNG: 200 điểm
 */
async function seedQuestions() {
  try {
    console.log('[Seed] Seeding APTIS questions...');

    const aptisType = await AptisType.findOne({ where: { code: 'APTIS_GENERAL' } });
    const teacher = await User.findOne({ where: { email: 'teacher1@aptis.local' } });

    if (!aptisType || !teacher) {
      throw new Error('APTIS type or teacher not found');
    }

    // Seed questions for each skill
    await seedReadingQuestions(aptisType, teacher);
    await seedListeningQuestions(aptisType, teacher);
    await seedWritingQuestions(aptisType, teacher);
    await seedSpeakingQuestions(aptisType, teacher);

    console.log('[Seed] All questions seeded successfully');
  } catch (error) {
    console.error('[Seed] Failed to seed questions:', error);
    throw error;
  }
}

// ========================================
// GRAMMAR (REMOVED - Only 4 skills: Reading, Listening, Writing, Speaking)
// ========================================
async function seedGrammarQuestions(aptisType, teacher) {
  // Deprecated: Grammar & Vocabulary removed from APTIS structure
  console.log('[Seed] Skipping Grammar questions (removed from APTIS)');
}

// ========================================
// READING - 29 câu trong 5 parts, 50 điểm
// Part 1: Gap Filling - 5 câu = 10 điểm (2 điểm/câu)
// Part 2: Ordering - 5 câu = 5 điểm (1 điểm/câu)
// Part 3: Matching - 5 câu = 5 điểm (1 điểm/câu)
// Part 4: Matching Headings - 7 câu = 16 điểm (~2.29 điểm/câu)
// Part 5: Short Text Matching - 7 câu = 14 điểm (2 điểm/câu)
// ========================================
async function seedReadingQuestions(aptisType, teacher) {
  console.log('[Seed] Seeding 25 Reading questions in 5 parts...');

  // Part 1: Gap Filling (5 câu) - Chọn từ từ danh sách để điền vào chỗ trống
  const readingGapFillType = await QuestionType.findOne({ where: { code: 'READING_GAP_FILL' } });
  
  const gapFillingQuestions = [
    {
      passage: 'Dear Sam,\n\nI hope you\'re doing [GAP1]! I wanted to tell you about my recent trip to the park. It was [GAP2] a lovely day to be outside. I thought it was [GAP3] hot to walk around for long. I met friends [GAP4] my birthday party, and we had a great time. We decided to grab [GAP5] snacks for our picnic. After you come, we will have [GAP6].',
      options: ['well', 'only', 'under', 'much', 'really', 'food'],
      correctAnswers: ['well', 'only', 'really', 'under', 'much', 'food'],
      prompt: 'Choose one word from the list for each gap. The first one is done for you.'
    },
    {
      passage: 'The museum is [GAP1] from 10 AM to 6 PM. Entrance [GAP2] is 15 dollars for adults. Children [GAP3] twelve get in for [GAP4]. [GAP5] you need directions, staff can help.',
      options: ['free', 'fee', 'under', 'If', 'open'],
      correctAnswers: ['open', 'fee', 'under', 'free', 'If'],
      prompt: 'Complete the text with appropriate words from the list.'
    },
    {
      passage: 'Learning English [GAP1] important for international communication. Many students [GAP2] difficulty with pronunciation. [GAP3] practice every day helps improve fluency. Online [GAP4] are very useful nowadays. Teachers recommend [GAP5] at least one hour daily.',
      options: ['resources', 'studying', 'Regular', 'is', 'have'],
      correctAnswers: ['is', 'have', 'Regular', 'resources', 'studying'],
      prompt: 'Fill in the gaps with words from the provided list.'
    },
    {
      passage: 'Technology has [GAP1] our lives significantly. Smart devices are [GAP2] in every household. The [GAP3] of artificial intelligence grows every year. However, we must [GAP4] about privacy and security. Education systems must [GAP5] students for the digital world.',
      options: ['concern', 'prepare', 'growth', 'common', 'changed'],
      correctAnswers: ['changed', 'common', 'growth', 'concern', 'prepare'],
      prompt: 'Select appropriate words to complete the sentences.'
    },
    {
      passage: 'Environmental [GAP1] is one of our biggest challenges. Climate [GAP2] affects weather patterns worldwide. Governments must [GAP3] action to reduce carbon emissions. Individuals can also [GAP4] by using renewable energy. Together, we can [GAP5] our planet for future generations.',
      options: ['protect', 'change', 'take', 'pollution', 'contribute'],
      correctAnswers: ['pollution', 'change', 'take', 'contribute', 'protect'],
      prompt: 'Complete the passage with words from the list.'
    }
  ];

  for (let i = 0; i < 5; i++) {
    const question = await Question.create({
      question_type_id: readingGapFillType.id,
      aptis_type_id: aptisType.id,
      difficulty: i < 2 ? 'easy' : i < 4 ? 'medium' : 'hard',
      content: `${gapFillingQuestions[i].prompt}\n\n${gapFillingQuestions[i].passage}`,
      created_by: teacher.id,
      status: 'active',
    });

    // Create option choices
    for (let j = 0; j < gapFillingQuestions[i].options.length; j++) {
      await QuestionOption.create({
        question_id: question.id,
        item_id: null,
        option_text: gapFillingQuestions[i].options[j],
        option_order: j + 1,
        is_correct: false,
      });
    }

    // Create gap items with correct answers (item_number for gap numbering)
    for (let j = 0; j < gapFillingQuestions[i].correctAnswers.length; j++) {
      await QuestionItem.create({
        question_id: question.id,
        item_text: `[GAP${j + 1}]`,
        item_number: j + 1,
        item_order: j + 1,
        answer_text: gapFillingQuestions[i].correctAnswers[j],
      });
    }
  }

  console.log(`[Seed]   - Part 1: 5 Gap Filling questions`);

  // Part 2: Ordering (5 câu) - Sắp xếp các câu theo thứ tự đúng
  const readingOrderingType = await QuestionType.findOne({ where: { code: 'READING_ORDERING' } });
  
  const orderingQuestions = [
    {
      title: 'Tom Harper (Biography Ordering)',
      passage: 'This is the short summary of Tom Harper life.',
      sentences: [
        'When he was young, he began writing short stories for a magazine.',
        'He soon wrote regularly for that magazine, sharing his creative ideas with many readers.',
        'At one point, he almost left his job, but then he decided to create unusual characters.',
        'The characters he imagined became some of the most famous in literature.',
        'This popularity made him rich and successful.'
      ],
      correctOrder: [1, 2, 3, 4, 5]
    },
    {
      title: 'Key Card Information (Instructions Ordering)',
      passage: 'The following is the instruction of how to use the key card.',
      sentences: [
        'To access the building and use the lift, you need to use the key card.',
        'He or she will ask your name and flat number and will write these down.',
        'You will also need to show him or her your identification card.',
        'He or she will take a copy of it and give you a new card.',
        'If you lose this, please see the staff member at the front desk.'
      ],
      correctOrder: [1, 2, 3, 4, 5]
    },
    {
      title: 'Recipe Steps (Process Ordering)',
      passage: 'Steps for making a simple pasta dish.',
      sentences: [
        'Boil water in a large pot and add salt.',
        'Add pasta to the boiling water and cook until tender.',
        'Drain the pasta and add it to a bowl.',
        'Pour your favorite sauce over the pasta.',
        'Mix well and serve hot with grated cheese.'
      ],
      correctOrder: [1, 2, 3, 4, 5]
    },
    {
      title: 'Historical Event (Chronological Ordering)',
      passage: 'Key events in the development of the internet.',
      sentences: [
        'The World Wide Web was invented in 1989 by Tim Berners-Lee.',
        'Early computer networks like ARPANET were created in the 1960s.',
        'Commercial internet service became available to the public in the 1990s.',
        'Personal computers became affordable for most households in the 1980s.',
        'Today, the internet is essential infrastructure in modern society.'
      ],
      correctOrder: [2, 4, 1, 3, 5]
    },
    {
      title: 'Problem Solving (Logical Ordering)',
      passage: 'Steps to solve a common technical problem.',
      sentences: [
        'First, check if your device is properly connected to power.',
        'If the problem persists, restart your device completely.',
        'Verify that all cables are securely connected.',
        'If it still doesn\'t work, consult the user manual or support.',
        'Turn it off and wait for 30 seconds before turning it back on.'
      ],
      correctOrder: [1, 3, 2, 5, 4]
    }
  ];

  for (let i = 0; i < 5; i++) {
    const question = await Question.create({
      question_type_id: readingOrderingType.id,
      aptis_type_id: aptisType.id,
      difficulty: i < 2 ? 'easy' : i < 4 ? 'medium' : 'hard',
      content: `${orderingQuestions[i].title}\n\n0. ${orderingQuestions[i].passage}\n\n${orderingQuestions[i].sentences.map((s, idx) => `${idx + 1}. ${s}`).join('\n\n')}\n\nPut the sentences in the right order.`,
      created_by: teacher.id,
      status: 'active',
    });

    // Shuffle sentences để item_order không trùng với answer
    const shuffled = [...orderingQuestions[i].sentences]
      .map((s, idx) => ({ text: s, originalIdx: idx + 1 }))
      .sort(() => Math.random() - 0.5);

    // Create items with random display order, but correct answer order
    for (let j = 0; j < orderingQuestions[i].sentences.length; j++) {
      const correctPosition = orderingQuestions[i].correctOrder[shuffled[j].originalIdx - 1];
      
      await QuestionItem.create({
        question_id: question.id,
        item_text: `${shuffled[j].originalIdx}. ${shuffled[j].text}`,
        item_order: j + 1,  // Display order (random)
        answer_text: `${correctPosition}`,  // Correct position
      });
    }
  }

  console.log(`[Seed]   - Part 2: 5 Ordering questions`);

  // Part 3: Matching (5 câu) - Ghép người/câu hỏi với câu trả lời
  const readingMatchingType = await QuestionType.findOne({ where: { code: 'READING_MATCHING' } });
  
  const question3 = await Question.create({
    question_type_id: readingMatchingType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: `Four people share their feelings about reading books. Read their answers and answer the questions below.

Person A: I have to read a lot for my job, and I find that reading factual books is often boring. The material tends to be dry and lacks excitement. After a long day at work, I usually feel too exhausted to read much, which means I have limited time for reading anything enjoyable.

Person B: My wife is always complaining that she can't read many books. I don't have that problem because I plan the reading schedule carefully. I set aside specific times each week for reading, which helps me stay on track. This way, I can enjoy my books while she finds it challenging to keep up.

Person C: When I was a child, I struggled to finish one book at a time. It felt overwhelming to stay focused on a single story. However, now that I'm older, I enjoy exploring many genres and even read multiple books at once. I have a long list of books I want to read in the future, which keeps me excited.

Person D: I keep a novel on the bedside table because I want to read before sleeping. However, I often find myself getting sleepy as soon as I start reading, which makes it difficult to concentrate. As a result, it has taken me several months to finish this book, and I still haven't completed it.

Match the following questions with the correct person:
- Who thinks reading factual books is boring? → Person _____
- Who reads more than another family member? → Person _____
- Who has limited time for reading? → Person _____
- Who has difficulty in finishing a book? → Person _____
- Who reads many books at once? → Person _____`,
    created_by: teacher.id,
    status: 'active',
  });

  const questions = [
    { text: 'Who thinks reading factual books is boring?', correct: 'Person A' },
    { text: 'Who reads more than another family member?', correct: 'Person B' },
    { text: 'Who has limited time for reading?', correct: 'Person A' },
    { text: 'Who has difficulty in finishing a book?', correct: 'Person D' },
    { text: 'Who reads many books at once?', correct: 'Person C' }
  ];

  // Create options once (question-level)
  const optionMap = {};
  const personOptions = ['Person A', 'Person B', 'Person C', 'Person D'];
  for (let k = 0; k < personOptions.length; k++) {
    const option = await QuestionOption.create({
      question_id: question3.id,
      item_id: null,
      option_text: personOptions[k],
      option_order: k + 1,
      is_correct: false,
    });
    optionMap[personOptions[k]] = option.id;
  }

  // Create items linked to correct options
  for (let j = 0; j < 5; j++) {
    const item = await QuestionItem.create({
      question_id: question3.id,
      item_text: questions[j].text,
      item_order: j + 1,
      answer_text: questions[j].correct,
    });

    // Update item with correct option reference
    const correctOptionText = `Person ${questions[j].correct}`;
    await item.update({ correct_option_id: optionMap[correctOptionText] });
  }

  console.log(`[Seed]   - Part 3: 5 Matching questions (Person-based)`);

  // Part 4: Matching Headings (5 câu) - Ghép tiêu đề với đoạn văn
  const readingHeadingsType = await QuestionType.findOne({ where: { code: 'READING_MATCHING_HEADINGS' } });
  
  const question4 = await Question.create({
    question_type_id: readingHeadingsType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: `Read the passage quickly. Choose a heading for each numbered paragraph (1-5) from the drop-down box.

Vegetarian Food

Available Headings:
- Understanding the possible global food crisis and its causes
- Recipes for popular vegetarian dishes
- Diverse types of vegetarian meals
- The ethical and environmental implications of factory farming
- Numerous health benefits of plant-based diets
- Shared global responsibility towards sustainable eating
- Respect for life: embracing compassion for all living beings
- Various explanations behind dietary choices and preferences

PARAGRAPH 1:
No longer seeing food as simply protein from animals, there are innumerable options for those opting not to eat meat. From vibrant salads loaded with fresh vegetables to hearty plant-based entrees and numerous delicious desserts, the possibilities are endless. Creative approaches to vegetarian cooking, providing a satisfying array of nutritious dishes, showcase how one can enjoy plant-based meals.

PARAGRAPH 2:
Understanding the different reasons individuals are making them. Many people opt for a vegetarian diet for health considerations. Some may be motivated by cultural traditions or personal beliefs, while others seek new culinary experiences. Understanding these motivations fosters respectful discussions about food choices and their implications, promoting a more inclusive dialogue around dietary preferences.

PARAGRAPH 3:
As the global population continues to grow, concerns about food security and sustainability intensify. The increasing demand for resources puts immense pressure on agricultural systems, leading to potential shortages and rising prices. Without significant changes in our consumption patterns and food production methods, widespread shortages could threaten global food availability, necessitating immediate action including vegetarian options, which can alleviate some of the pressure on our food systems.

PARAGRAPH 4:
The industrial approach to livestock production raises numerous ethical and environmental questions. Large-scale operations often prioritize efficiency over animal welfare, resulting in cramped living conditions and the overuse of antibiotics. This practice not only impacts the lives of animals but contributes to pollution and greenhouse gas emissions. As awareness of these issues grows, many advocates push for more humane and sustainable farming practices, which align better with the ethical motivations of those choosing plant-based diets.

PARAGRAPH 5:
Plant-based diets have been extensively researched and shown to offer numerous health benefits. Studies demonstrate that vegetarian diets can lower the risk of chronic diseases including heart disease and type 2 diabetes. Plant-based nutrition provides essential nutrients and is low in unhealthy fats. Embracing a vegetarian diet supports not only personal health but also aligns with global environmental sustainability efforts.

PARAGRAPH 6:
In an interconnected world, our food consumption choices carry significant weight. Each individual's decisions can influence broader societal impacts, affecting everything from environmental sustainability to animal welfare. Embracing a sense of stewardship encourages us to consider how our eating habits impact not just our health, but also the health of the planet. By making conscious choices, such as incorporating more plant-based meals, we can collectively work towards a more equitable and sustainable future for all.

PARAGRAPH 7:
Of course, one cannot discuss the benefits of vegetarianism without understanding the broader implications for overall well-being. Research on plant-based dietary approaches demonstrates that these eating patterns can lower the risk of chronic diseases. Embracing plant-based nutrition provides essential nutrients and low in unhealthy fats. Enjoying plant-based foods in moderation, ensuring a compassionate world. This approach inspires actions that contribute to a more peaceful and sustainable planet, ultimately benefiting both individuals and society as a whole.`,
    created_by: teacher.id,
    status: 'active',
  });

  const paragraphs = [
    { num: 1, heading: 'Diverse types of vegetarian meals', correct: 3 },
    { num: 2, heading: 'Various explanations behind dietary choices and preferences', correct: 8 },
    { num: 3, heading: 'Understanding the possible global food crisis and its causes', correct: 1 },
    { num: 4, heading: 'The ethical and environmental implications of factory farming', correct: 4 },
    { num: 5, heading: 'Numerous health benefits of plant-based diets', correct: 5 },
    { num: 6, heading: 'Shared global responsibility towards sustainable eating', correct: 6 },
    { num: 7, heading: 'Respect for life: embracing compassion for all living beings', correct: 7 }
  ];

  const headingOptions = [
    'Understanding the possible global food crisis and its causes',
    'Recipes for popular vegetarian dishes',
    'Diverse types of vegetarian meals',
    'The ethical and environmental implications of factory farming',
    'Numerous health benefits of plant-based diets',
    'Shared global responsibility towards sustainable eating',
    'Respect for life: embracing compassion for all living beings',
    'Various explanations behind dietary choices and preferences'
  ];

  // Create 8 heading options once (question-level, NOT per item)
  const headingOptionMap = {};
  for (let k = 0; k < headingOptions.length; k++) {
    const option = await QuestionOption.create({
      question_id: question4.id,
      item_id: null,
      option_text: headingOptions[k],
      option_order: k + 1,
      is_correct: false,
    });
    headingOptionMap[headingOptions[k]] = option.id;
  }

  // Create 7 items linked to correct heading options
  for (let j = 0; j < 7; j++) {
    const item = await QuestionItem.create({
      question_id: question4.id,
      item_text: `Paragraph ${paragraphs[j].num}`,
      item_order: j + 1,
      answer_text: paragraphs[j].heading,
    });

    // Update item with correct option reference
    await item.update({ correct_option_id: headingOptionMap[paragraphs[j].heading] });
  }

  console.log(`[Seed]   - Part 4: 7 Matching Headings questions (16 điểm - ~2.29 điểm/câu)`);

  // Part 5: Short Text Matching (7 câu) - Ghép văn bản ngắn với mô tả  
  await createShortTextMatchingQuestions(aptisType, teacher);
  
  console.log(`[Seed]   - Part 5: 7 Short Text Matching questions (14 điểm - 2 điểm/câu)`);
  console.log(`[Seed] ✓ 29 Reading questions created (5+5+5+7+7 = 29 câu = 50 điểm)`);
}

/**
 * Create Short Text Matching questions (Part 5) - 7 câu
 */
async function createShortTextMatchingQuestions(aptisType, teacher) {
  const readingMatchingType = await QuestionType.findOne({ where: { code: 'READING_MATCHING' } });
  
  const question5 = await Question.create({
    question_type_id: readingMatchingType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: `Match each short text (1-7) with the correct description (A-J). There are three descriptions you do not need.

Short Texts:
1. "No parking between 8 AM - 6 PM Monday to Friday. Violators will be towed."
2. "Students must wear safety goggles at all times in the laboratory."
3. "Please keep noise to a minimum after 10 PM. Thank you for your consideration."
4. "All items must be returned by the due date to avoid late fees."
5. "This elevator is out of service. Please use the stairs or the elevator at the other end."
6. "Smoking is prohibited in all areas of this building including balconies."
7. "Please turn off all electronic devices during the performance."

Descriptions:
A. A warning about vehicle removal
B. A request for quiet behavior  
C. Safety instructions for students
D. Information about equipment failure
E. Rules about borrowed items
F. A ban on smoking
G. Instructions for audience members
H. Directions to another location
I. Information about opening hours
J. A notice about cleaning`,
    created_by: teacher.id,
    status: 'active',
  });

}

// ========================================
// LISTENING - 25 câu, 50 điểm (mỗi câu đúng = 2 điểm)
// Part 1: MCQ - 13 câu = 26 điểm (2 điểm/câu)
// Part 2: câu 14 gồm 4 câu nhỏ = 8 điểm (2 điểm/câu)
// Part 3: câu 15 gồm 4 câu nhỏ = 8 điểm (2 điểm/câu) 
// Part 4: câu 16-17 gồm 4 câu nhỏ = 8 điểm (2 điểm/câu)
// TỔNG: 25 câu = 50 điểm
// ========================================
async function seedListeningQuestions(aptisType, teacher) {
  console.log('[Seed] Seeding 25 Listening questions in 4 parts...');

  // Part 1: MCQ (13 câu = 26 điểm)
  const listeningMcqType = await QuestionType.findOne({ where: { code: 'LISTENING_MCQ' } });
  
  const part1Scripts = [
    'A man is calling his mother. How long will he be late?',
    'A woman is going to the cinema with her husband. What time does the movie begin?',
    'A teacher is talking to her students. Where are the students now?',
    'A man is sharing a new guidebook. Choose the correct answers.',
    'A reviewer discussing a book about the life of a scientist. Choose the correct answers.',
    'A woman is booking a hotel room. How many nights will she stay?',
    'A student is talking to his teacher about homework. When is the deadline?',
    'A customer is ordering food at a restaurant. What drink does she choose?',
    'A man is asking for directions to the library. Which street should he take?',
    'A woman is discussing her vacation plans. Where will she go first?',
    'A student is calling about exam results. What grade did he get?',
    'A person is buying tickets for a concert. How much do they cost?',
    'A man is talking about his new job. When does he start working?'
  ];

  const mcqOptions = [
    ['10 minutes', '15 minutes', '20 minutes'],
    ['6:40', '7:00', '9:20'],
    ['At school', 'In a townhouse', 'In a museum'],
    ['It focuses solely on historical landmarks', 'It creates an adventure', 'It is difficult to navigate'],
    ['It is focused on technical details', 'It is exciting to read', 'It is more of a textbook than a biography'],
    ['2 nights', '3 nights', '4 nights'],
    ['Monday', 'Wednesday', 'Friday'],
    ['Water', 'Juice', 'Coffee'],
    ['Main Street', 'Park Avenue', 'Oak Road'],
    ['Paris', 'London', 'Rome'],
    ['A', 'B', 'C'],
    ['$25', '$30', '$35'],
    ['Next Monday', 'Next Wednesday', 'Next Friday']
  ];

  for (let i = 0; i < 13; i++) {
    // Generate audio file with GTTS
    console.log(`[Seed]     Generating audio for Listening Part 1 Question ${i + 1}...`);
    const audioInfo = await GTTSService.generateAudioFile(part1Scripts[i], 'en', `listening_part1_q${i + 1}.mp3`);
    
    const question = await Question.create({
      question_type_id: listeningMcqType.id,
      aptis_type_id: aptisType.id,
      difficulty: i <= 1 ? 'easy' : i <= 2 ? 'medium' : 'hard',
      content: part1Scripts[i],
      media_url: audioInfo.url,
      created_by: teacher.id,
      status: 'active',
    });

    for (let j = 0; j < 3; j++) {
      await QuestionOption.create({
        question_id: question.id,
        item_id: null,
        option_text: mcqOptions[i][j],
        option_order: j + 1,
        is_correct: j === (i === 0 ? 1 : i === 1 ? 0 : 0),
      });
    }
  }

  console.log(`[Seed]   - Part 1: 13 MCQ questions with audio (26 điểm)`);

  // Part 2: Speaker Matching (6 speakers = 12 điểm)
  const listeningMatchingType = await QuestionType.findOne({ where: { code: 'LISTENING_MATCHING' } });
  
  // Generate main instruction audio
  console.log(`[Seed]     Generating audio for Listening Part 2 main instruction...`);
  const mainAudioInfo = await GTTSService.generateAudioFile('Listen to opinions of 6 people A B C D E F about when they like listening to music', 'en', 'listening_part2_instruction.mp3');
  
  const question2 = await Question.create({
    question_type_id: listeningMatchingType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Listen to opinions of 6 people A B C D E F about when they like listening to music',
    media_url: mainAudioInfo.url,
    created_by: teacher.id,
    status: 'active',
  });

  const speakers = ['Speaker A', 'Speaker B', 'Speaker C', 'Speaker D', 'Speaker E', 'Speaker F'];
  const speakerTexts = [
    'I usually listen to music after waking up in the morning. It helps me start my day with positive energy.',
    'I love listening to music while studying. It helps me concentrate better and makes the work more enjoyable.',
    'I listen to music to relax after a long day at work. It helps me unwind and forget my stress.',
    'I enjoy music while reading books. The background music creates a peaceful atmosphere for my reading time.',
    'I listen to music while exercising at the gym. The rhythm keeps me motivated and energized.',
    'I prefer listening to music before going to sleep. It helps me calm down and prepare for rest.'
  ];
  const musicOptions = ['After waking up', 'While studying', 'To relax', 'While reading', 'While exercising', 'Before sleeping'];

  // Create options first
  const options = [];
  for (let i = 0; i < musicOptions.length; i++) {
    const option = await QuestionOption.create({
      question_id: question2.id,
      item_id: null,
      option_text: musicOptions[i],
      option_order: i + 1,
      is_correct: false,
    });
    options.push(option);
  }

  // Create items with correct option mapping
  for (let i = 0; i < 6; i++) {
    // Generate individual speaker audio
    console.log(`[Seed]     Generating audio for ${speakers[i]}...`);
    const speakerAudioInfo = await GTTSService.generateAudioFile(speakerTexts[i], 'en', `listening_part2_speaker_${String.fromCharCode(65 + i)}.mp3`);
    
    const item = await QuestionItem.create({
      question_id: question2.id,
      item_text: speakers[i],
      item_order: i + 1,
      media_url: speakerAudioInfo.url,
      correct_option_id: options[i].id, // Speaker A -> After waking up, Speaker B -> While studying, etc.
    });
  }

  console.log(`[Seed]   - Part 2: 6 Speaker Matching with individual audio files (12 điểm)`);

  // Part 3: Statement Matching (4 statements = 8 điểm)
  const statementMatchingType = await QuestionType.findOne({ where: { code: 'LISTENING_STATEMENT_MATCHING' } });
  
  // Generate discussion audio
  console.log(`[Seed]     Generating audio for Listening Part 3 discussion...`);
  const discussionText = 'Man: I think singers can be good models for young people. Music is definitely a universal language that connects everyone. Woman: Well, I believe taste in music is a highly personal thing. Music can also be used to manipulate people\'s feelings quite easily.';
  const discussionAudioInfo = await GTTSService.generateAudioFile(discussionText, 'en', 'listening_part3_discussion.mp3');
  
  const question3 = await Question.create({
    question_type_id: statementMatchingType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Listen to two people discussing singers and music. Read the opinions below and decide whose opinion matches the statements, the man, the woman, or both the man and the woman.',
    media_url: discussionAudioInfo.url,
    created_by: teacher.id,
    status: 'active',
  });

  const statements = [
    'Singer can be good models for the young.',
    'Taste in music is a highly personal thing.',
    'Music is a universal language.',
    'Music can be used to manipulate people\'s feelings.'
  ];

  // Create options first
  const statementOptions = ['Man', 'Woman', 'Both'];
  const statementOptionsData = [];
  for (let i = 0; i < 3; i++) {
    const option = await QuestionOption.create({
      question_id: question3.id,
      item_id: null,
      option_text: statementOptions[i],
      option_order: i + 1,
      is_correct: false,
    });
    statementOptionsData.push(option);
  }

  // Create items with correct mappings based on the discussion
  const correctAnswers = [0, 1, 0, 1]; // Man, Woman, Man, Woman based on the discussion content
  for (let i = 0; i < 4; i++) {
    await QuestionItem.create({
      question_id: question3.id,
      item_text: statements[i],
      item_order: i + 1,
      correct_option_id: statementOptionsData[correctAnswers[i]].id,
    });
  }

  console.log(`[Seed]   - Part 3: 4 Statement Matching items (8 điểm)`);

  // Part 4: MCQ Multi-question (2 shared audio files, mỗi audio 1 câu = 2 câu MCQ = 4 điểm)
  const multiQuestionScripts = [
    {
      content: 'A man is sharing a new guidebook. Choose the correct answers.',
      text: 'This guidebook creates an exciting adventure for travelers by focusing on unique experiences rather than just historical landmarks. In my opinion, it is particularly suitable for younger generations who are looking for something different.',
      questions: [
        'What does this guidebook offer to its audience?',
        'What is the speaker\'s opinion about this guidebook?'
      ],
      options: [
        ['It focuses solely on historical landmarks', 'It creates an adventure', 'It is difficult to navigate'],
        ['It caters only to seasoned travelers', 'It is outdated and irrelevant', 'It is suitable for particular generations']
      ]
    },
    {
      content: 'A reviewer discussing a book about the life of a scientist. Choose the correct answers.',
      text: 'The book about this scientist is exciting to read, not just technical details. The author has written it for a general audience, making complex scientific concepts accessible to everyone.',
      questions: [
        'What does the speaker say about the way of writing?',
        'What does the speaker say about the overall content of the book?'
      ],
      options: [
        ['It is focused on technical details', 'It is exciting to read', 'It is more of a textbook than a biography'],
        ['It has been written for a general audience', 'It is only suitable for experts in the field', 'It lacks engaging storytelling']
      ]
    }
  ];

  for (let i = 0; i < 2; i++) {
    // Generate audio for each multi-question script
    console.log(`[Seed]     Generating audio for Listening Part 4 Script ${i + 1}...`);
    const audioInfo = await GTTSService.generateAudioFile(multiQuestionScripts[i].text, 'en', `listening_part4_script_${i + 1}.mp3`);
    
    const question = await Question.create({
      question_type_id: listeningMcqType.id,
      aptis_type_id: aptisType.id,
      difficulty: 'hard',
      content: multiQuestionScripts[i].content,
      media_url: audioInfo.url,
      additional_media: JSON.stringify([
        { type: 'audio', description: 'Question 1', url: audioInfo.url },
        { type: 'audio', description: 'Question 2', url: audioInfo.url }
      ]),
      created_by: teacher.id,
      status: 'active',
    });

    // Create 2 question items for each audio
    for (let j = 0; j < 2; j++) {
      await QuestionItem.create({
        question_id: question.id,
        item_text: multiQuestionScripts[i].questions[j],
        item_order: j + 1,
      });

      // Create options for each sub-question  
      for (let k = 0; k < 3; k++) {
        await QuestionOption.create({
          question_id: question.id,
          item_id: null,
          option_text: multiQuestionScripts[i].options[j][k],
          option_order: (j * 3) + k + 1,
          is_correct: k === (j === 0 ? 1 : j === 1 ? 0 : 1), // Set correct answers
        });
      }
    }
  }

  console.log(`[Seed]   - Part 4: 2 Multi-question MCQ (4 total sub-questions = 4 điểm)`);
  console.log(`[Seed] ✓ 25 Listening questions created (13+6+4+2 = 25 câu, 50 điểm)`);
}

// ========================================
// WRITING - 4 tasks (Based on APTIS Technical Report)
// Task 1: A1 Form Filling (basic information) - 0-4 scale
// Task 2: A2 Short Response (20-30 words) - 0-5 scale
// Task 3: B1 Chat Responses (30-40 words each) - 0-5 scale  
// Task 4: B2 Email Writing (friend + authority) - 0-6 scale with C1/C2 extension
// ========================================
async function seedWritingQuestions(aptisType, teacher) {
  console.log('[Seed] Seeding Writing tasks with multiple questions...');

  const writingShortType = await QuestionType.findOne({ where: { code: 'WRITING_SHORT' } });
  const writingFormType = await QuestionType.findOne({ where: { code: 'WRITING_FORM' } });
  const writingLongType = await QuestionType.findOne({ where: { code: 'WRITING_LONG' } });
  const writingEmailType = await QuestionType.findOne({ where: { code: 'WRITING_EMAIL' } });

  // Task 1 (A1): Form Filling - 1 câu hỏi chứa 5 fields
  const task1Content = [
    "What is your name?",
    "How old are you?", 
    "What city do you live in?",
    "What is your job?",
    "What is your email address?"
  ].join('\n');

  await Question.create({
    question_type_id: writingShortType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'easy',
    content: task1Content,
    created_by: teacher.id,
    status: 'active',
  });

  // Task 2 (A2): Short Constructed Response - 2 câu hỏi
  const task2Questions = [
    "What is your hobby?\n\nWrite about your hobby (20-30 words):\nWhat do you like to do in your free time?\n\nWrite your answer here:",
  ];

  for (let i = 0; i < 1; i++) {
    await Question.create({
      question_type_id: writingFormType.id,
      aptis_type_id: aptisType.id,
      difficulty: 'easy',
      content: task2Questions[i],
      created_by: teacher.id,
      status: 'active',
    });
  }

  // Task 3 (B1): Chat Responses - 1 câu hỏi (3 chat exchanges)
  const task3Questions = [
    "Chat about your weekend\n\nReply to chat messages (30-40 words each):\n\nAlex: Hi! Did you do anything fun last weekend?\nYour reply: _______\n\nSam: What's your favorite thing to do on weekends?\nYour reply: _______\n\nJordan: Did you go anywhere during the weekend?\nYour reply: _______",
  ];

  for (let i = 0; i < 1; i++) {
    await Question.create({
      question_type_id: writingLongType.id,
      aptis_type_id: aptisType.id,
      difficulty: 'easy',
      content: task3Questions[i],
      created_by: teacher.id,
      status: 'active',
    });
  }
  
  // Task 4 (B2): Email Writing - 1 câu hỏi (3 email replies)
  const task4Questions = [
    "Email discussion about a class trip\n\nRead the email from your teacher:\n\nFrom: Teacher <teacher@school.com>\nSubject: School trip to the museum\n\nDear student,\n\nWe are planning a class trip to the museum. Do you want to go? What do you want to see there?\n\nPlease write back with your answer.\n\nTeacher\n\n---\n\n1. Email to a friend (50 words)\n\n2. Email to school manager (80-100 words)\n\n3. Formal discussion email (120-150 words)",
  ];

  for (let i = 0; i < 1; i++) {
    await Question.create({
      question_type_id: writingEmailType.id,
      aptis_type_id: aptisType.id,
      difficulty: 'hard',
      content: task4Questions[i],
      created_by: teacher.id,
      status: 'active',
    });
  }

  console.log('[Seed] ✓ Writing tasks created: Task 1 (1 câu với 5 fields) + Task 2 (2 câu) + Task 3 (2 câu) + Task 4 (2 câu) = 7 câu tổng');
}

// ========================================
// SPEAKING - 4 tasks (Based on APTIS Technical Report with task-specific scales)
// Task 1: A2 Personal Introduction - 0-5 scale
// Task 2: B1 Picture/Topic Description - 0-5 scale  
// Task 3: B1 Comparison - 0-5 scale
// Task 4: B2 Topic Discussion - 0-6 scale with C1/C2 extension
// Focus: Sustainability - ability to sustain CEFR level throughout response
// ========================================
async function seedSpeakingQuestions(aptisType, teacher) {
  console.log('[Seed] Seeding 10 Speaking questions across 4 sections...');

  const speakingPersonalType = await QuestionType.findOne({ where: { code: 'SPEAKING_INTRO' } });
  const speakingDescriptionType = await QuestionType.findOne({ where: { code: 'SPEAKING_DESCRIPTION' } });
  const speakingComparisonType = await QuestionType.findOne({ where: { code: 'SPEAKING_COMPARISON' } });
  const speakingDiscussionType = await QuestionType.findOne({ where: { code: 'SPEAKING_DISCUSSION' } });

  // ===== SECTION 1: Personal Introduction (3 questions) =====
  // Q1: Tell about yourself
  await Question.create({
    question_type_id: speakingPersonalType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'easy',
    content: 'Tell me about yourself:\n- Name and where you\'re from\n- What you do (work or studies)\n- Your hobbies and interests\n\n30 seconds to prepare, 1 minute to speak.',
    duration_seconds: 90,
    created_by: teacher.id,
    status: 'active',
  });

  // Q2: Describe your daily routine
  await Question.create({
    question_type_id: speakingPersonalType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'easy',
    content: 'Describe your typical day:\n- When you wake up and go to sleep\n- Your main activities\n- What you enjoy most\n\n30 seconds to prepare, 1 minute to speak.',
    duration_seconds: 90,
    created_by: teacher.id,
    status: 'active',
  });

  // Q3: Talk about your family
  await Question.create({
    question_type_id: speakingPersonalType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'easy',
    content: 'Tell me about your family:\n- Who your family members are\n- What they do\n- Something special about your family\n\n30 seconds to prepare, 1 minute to speak.',
    duration_seconds: 90,
    created_by: teacher.id,
    status: 'active',
  });

  // ===== SECTION 2: Picture Description (3 questions - all relate to same image) =====
  // Q4: Primary question - Describe a park scene (shows image)
  const q4 = await Question.create({
    question_type_id: speakingDescriptionType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Look at the picture of a park.\n\nDescribe:\n- The people and what they are doing',
    additional_media: JSON.stringify([
      { type: 'image', description: 'Park scene', url: 'https://picsum.photos/640/480?random=1' }
    ]),
    duration_seconds: 150,
    created_by: teacher.id,
    status: 'active',
  });

  // Q5: Follow-up question - Still refer to same park image from Q4
  await Question.create({
    question_type_id: speakingDescriptionType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'What would you like to do there?',
    parent_question_id: q4.id,
    duration_seconds: 90,
    created_by: teacher.id,
    status: 'active',
  });

  // Q6: Follow-up question - Still refer to same park image from Q4
  await Question.create({
    question_type_id: speakingDescriptionType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Looking back at the park:\n\nNow tell me:\n- What activities could families do there?\n- How often would you visit this place?\n- What would you change to improve it?\n\n10 seconds to prepare, 30 seconds to speak.',
    parent_question_id: q4.id,
    duration_seconds: 40,
    created_by: teacher.id,
    status: 'active',
  });

  // ===== SECTION 3: Comparison (3 questions - Q7 shows 2 images, Q8-Q9 refer to those same images) =====
  // Q7: Primary question - Compare two transportation methods (shows 2 images)
  const q7 = await Question.create({
    question_type_id: speakingComparisonType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Look at the two pictures showing different ways to travel.\n\nCompare them:\n- What are the similarities and differences?\n- Which method is faster and why?\n- Which would you prefer and why?\n\n1 minute to prepare, 1.5 minutes to speak.',
    additional_media: JSON.stringify([
      { type: 'image', description: 'Transportation method A', url: 'https://picsum.photos/640/480?random=4' },
      { type: 'image', description: 'Transportation method B', url: 'https://picsum.photos/640/480?random=41' }
    ]),
    duration_seconds: 150,
    created_by: teacher.id,
    status: 'active',
  });

  // Q8: Follow-up question - Still refer to same 2 transportation images from Q7
  await Question.create({
    question_type_id: speakingComparisonType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Thinking about the two transportation methods you just compared:\n\nDiscuss:\n- Which method is better for the environment and why?\n- What are the costs associated with each method?\n- Which do you use more often and why?\n\n30 seconds to prepare, 1 minute to speak.',
    parent_question_id: q7.id,
    duration_seconds: 90,
    created_by: teacher.id,
    status: 'active',
  });

  // Q9: Follow-up question - Still refer to same 2 transportation images from Q7
  await Question.create({
    question_type_id: speakingComparisonType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Based on the two transportation methods shown:\n\nDescribe:\n- How would cities improve public transportation in the future?\n- What are the advantages for travelers in the long term?\n- If you could improve one method, what would you change?\n\n30 seconds to prepare, 1 minute to speak.',
    parent_question_id: q7.id,
    duration_seconds: 90,
    created_by: teacher.id,
    status: 'active',
  });

  // ===== SECTION 4: Topic Discussion (1 question) =====
  // Q10: Discuss technology in education
  await Question.create({
    question_type_id: speakingDiscussionType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'hard',
    content: 'Topic: Technology in Education\n\nDiscuss:\n- How has technology changed the way people learn?\n- What are the advantages and disadvantages of online learning?\n- What will be the future of education?\n\n1 minute to prepare, 2 minutes to speak.',
    additional_media: JSON.stringify([
      { type: 'image', description: 'Technology in classroom', url: 'https://picsum.photos/640/480?random=7' }
    ]),
    duration_seconds: 180,
    created_by: teacher.id,
    status: 'active',
  });

  console.log(`[Seed] ✓ 10 Speaking questions created (3+3+3+1 sections = 50 điểm tổng)`);
}

// Run if called directly
if (require.main === module) {
  seedQuestions();
}

module.exports = seedQuestions;
