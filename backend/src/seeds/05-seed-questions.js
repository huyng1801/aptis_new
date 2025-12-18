require('dotenv').config();
const {
  Question,
  QuestionItem,
  QuestionOption,
  QuestionSampleAnswer,
  QuestionType,
  AptisType,
  User,
} = require('../models');

/**
 * Seed APTIS questions theo cấu trúc thực tế (250 điểm tổng)
 * 
 * CẤUTRÚC ĐỀ THI APTIS:
 * - Grammar & Vocabulary: 50 điểm (25 Grammar + 25 Vocabulary)
 * - Reading: 50 điểm (25 câu trong 4 parts)
 * - Listening: 50 điểm (25 câu trong 4 parts)
 * - Writing: 50 điểm (4 tasks, AI scoring)
 * - Speaking: 50 điểm (4 tasks, AI scoring)
 */
async function seedQuestions() {
  try {
    console.log('[Seed] Seeding APTIS questions (250 điểm tổng)...');

    const aptisType = await AptisType.findOne({ where: { code: 'APTIS_GENERAL' } });
    const teacher = await User.findOne({ where: { email: 'teacher1@aptis.local' } });

    if (!aptisType || !teacher) {
      throw new Error('APTIS type or teacher not found');
    }

    // Seed questions for each skill
    await seedGrammarQuestions(aptisType, teacher);
    await seedVocabularyQuestions(aptisType, teacher);
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
// GRAMMAR - 25 câu MCQ (25 điểm, mỗi câu 1 điểm)
// ========================================
async function seedGrammarQuestions(aptisType, teacher) {
  console.log('[Seed] Seeding 25 Grammar questions...');
  
  const grammarType = await QuestionType.findOne({ where: { code: 'GV_MCQ' } });

  const questions = [
    { content: 'She _____ to work by bus every day.', options: ['go', 'goes', 'going', 'gone'], correct: 1, difficulty: 'easy' },
    { content: 'I _____ my homework when the phone rang.', options: ['do', 'did', 'was doing', 'have done'], correct: 2, difficulty: 'medium' },
    { content: 'If I _____ rich, I would buy a yacht.', options: ['am', 'was', 'were', 'be'], correct: 2, difficulty: 'medium' },
    { content: 'The book _____ by many students.', options: ['reads', 'is read', 'read', 'reading'], correct: 1, difficulty: 'easy' },
    { content: 'She is _____ than her sister.', options: ['tall', 'taller', 'tallest', 'more tall'], correct: 1, difficulty: 'easy' },
    { content: 'By next year, I _____ here for 10 years.', options: ['work', 'will work', 'will have worked', 'worked'], correct: 2, difficulty: 'hard' },
    { content: 'The meeting _____ at 3 PM tomorrow.', options: ['start', 'starts', 'is starting', 'will start'], correct: 3, difficulty: 'medium' },
    { content: 'She _____ English for 5 years.', options: ['learns', 'is learning', 'has been learning', 'learned'], correct: 2, difficulty: 'medium' },
    { content: 'The report _____ yesterday.', options: ['completed', 'was completed', 'completes', 'completing'], correct: 1, difficulty: 'easy' },
    { content: 'Neither John nor his friends _____ coming.', options: ['is', 'are', 'was', 'were'], correct: 1, difficulty: 'hard' },
    { content: 'I would rather you _____ smoke here.', options: ["don't", "didn't", "not", "doesn't"], correct: 1, difficulty: 'hard' },
    { content: 'She asked me where _____.', options: ['do I live', 'I live', 'I lived', 'did I live'], correct: 2, difficulty: 'medium' },
    { content: 'He _____ be at home. His car is there.', options: ['must', 'can', 'may', 'should'], correct: 0, difficulty: 'medium' },
    { content: 'The window _____ by the kids.', options: ['broke', 'was broken', 'has broken', 'breaking'], correct: 1, difficulty: 'easy' },
    { content: 'I _____ to Paris three times.', options: ['went', 'have been', 'go', 'going'], correct: 1, difficulty: 'easy' },
    { content: 'She _____ dinner when I called.', options: ['cooks', 'was cooking', 'cooked', 'cooking'], correct: 1, difficulty: 'medium' },
    { content: 'The faster you run, _____ you finish.', options: ['the sooner', 'sooner', 'soonest', 'soon'], correct: 0, difficulty: 'hard' },
    { content: '_____ it rains, we will cancel.', options: ['If', 'When', 'Unless', 'Although'], correct: 0, difficulty: 'medium' },
    { content: 'I look forward _____ you.', options: ['to see', 'to seeing', 'see', 'seeing'], correct: 1, difficulty: 'medium' },
    { content: 'He denied _____ the money.', options: ['to steal', 'stealing', 'steal', 'stole'], correct: 1, difficulty: 'hard' },
    { content: 'She _____ have left. Her bag is gone.', options: ['must', 'can', 'should', 'may'], correct: 0, difficulty: 'medium' },
    { content: 'The house _____ we lived was old.', options: ['which', 'where', 'what', 'who'], correct: 0, difficulty: 'medium' },
    { content: '_____ you help me?', options: ['Can', 'May', 'Must', 'Should'], correct: 0, difficulty: 'easy' },
    { content: 'He is _____ person I know.', options: ['the kindest', 'kinder', 'kind', 'more kind'], correct: 0, difficulty: 'easy' },
    { content: 'She would have passed if she _____ harder.', options: ['studied', 'had studied', 'studies', 'studying'], correct: 1, difficulty: 'hard' },
  ];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const question = await Question.create({
      question_type_id: grammarType.id,
      aptis_type_id: aptisType.id,
      difficulty: q.difficulty,
      content: q.content,
      created_by: teacher.id,
      status: 'active',
    });

    for (let j = 0; j < q.options.length; j++) {
      await QuestionOption.create({
        question_id: question.id,
        item_id: null,
        option_text: q.options[j],
        option_order: j + 1,
        is_correct: j === q.correct,
      });
    }
  }

  console.log(`[Seed] ✓ 25 Grammar questions created (25 điểm)`);
}

// ========================================
// VOCABULARY - 25 câu MCQ (25 điểm, mỗi câu 1 điểm)
// ========================================
async function seedVocabularyQuestions(aptisType, teacher) {
  console.log('[Seed] Seeding 25 Vocabulary questions...');
  
  const vocabType = await QuestionType.findOne({ where: { code: 'GV_MCQ' } });

  const questions = [
    { content: 'Choose the word closest to "abundant":', options: ['scarce', 'plentiful', 'expensive', 'rare'], correct: 1, difficulty: 'medium' },
    { content: 'Synonym of "immediately":', options: ['slowly', 'later', 'instantly', 'eventually'], correct: 2, difficulty: 'easy' },
    { content: 'Opposite of "transparent":', options: ['clear', 'opaque', 'visible', 'obvious'], correct: 1, difficulty: 'medium' },
    { content: 'What does "meticulous" mean?', options: ['careless', 'very careful', 'quick', 'simple'], correct: 1, difficulty: 'hard' },
    { content: 'She has a _____ for languages.', options: ['hatred', 'talent', 'difficulty', 'problem'], correct: 1, difficulty: 'medium' },
    { content: 'Synonym of "ancient":', options: ['modern', 'new', 'old', 'recent'], correct: 2, difficulty: 'easy' },
    { content: 'Opposite of "expand":', options: ['grow', 'enlarge', 'contract', 'extend'], correct: 2, difficulty: 'medium' },
    { content: 'What does "ambiguous" mean?', options: ['clear', 'uncertain', 'definite', 'obvious'], correct: 1, difficulty: 'hard' },
    { content: 'Synonym of "diligent":', options: ['lazy', 'hardworking', 'careless', 'slow'], correct: 1, difficulty: 'medium' },
    { content: 'Synonym of "eloquent":', options: ['silent', 'articulate', 'quiet', 'confused'], correct: 1, difficulty: 'hard' },
    { content: 'Opposite of "artificial":', options: ['fake', 'natural', 'synthetic', 'manufactured'], correct: 1, difficulty: 'easy' },
    { content: 'Meaning of "innovative":', options: ['traditional', 'creative', 'old', 'boring'], correct: 1, difficulty: 'medium' },
    { content: 'Synonym of "crucial":', options: ['unimportant', 'optional', 'essential', 'minor'], correct: 2, difficulty: 'medium' },
    { content: 'What does "concise" mean?', options: ['lengthy', 'brief', 'detailed', 'complex'], correct: 1, difficulty: 'medium' },
    { content: 'Opposite of "genuine":', options: ['real', 'authentic', 'fake', 'true'], correct: 2, difficulty: 'easy' },
    { content: 'Word meaning "to make worse":', options: ['improve', 'exacerbate', 'fix', 'solve'], correct: 1, difficulty: 'hard' },
    { content: 'Synonym of "adequate":', options: ['insufficient', 'enough', 'excessive', 'lacking'], correct: 1, difficulty: 'medium' },
    { content: 'Meaning of "tedious":', options: ['exciting', 'boring', 'interesting', 'fun'], correct: 1, difficulty: 'medium' },
    { content: 'Opposite of "obsolete":', options: ['outdated', 'old', 'modern', 'ancient'], correct: 2, difficulty: 'hard' },
    { content: 'What does "candid" mean?', options: ['dishonest', 'frank', 'secretive', 'shy'], correct: 1, difficulty: 'medium' },
    { content: 'Synonym of "benevolent":', options: ['cruel', 'kind', 'mean', 'selfish'], correct: 1, difficulty: 'hard' },
    { content: 'Word meaning "to spread throughout":', options: ['contain', 'permeate', 'block', 'stop'], correct: 1, difficulty: 'hard' },
    { content: 'Opposite of "voluntary":', options: ['willing', 'compulsory', 'optional', 'free'], correct: 1, difficulty: 'medium' },
    { content: 'Meaning of "frugal":', options: ['wasteful', 'economical', 'generous', 'expensive'], correct: 1, difficulty: 'hard' },
    { content: 'Synonym of "contemporary":', options: ['ancient', 'modern', 'historical', 'past'], correct: 1, difficulty: 'medium' },
  ];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const question = await Question.create({
      question_type_id: vocabType.id,
      aptis_type_id: aptisType.id,
      difficulty: q.difficulty,
      content: q.content,
      created_by: teacher.id,
      status: 'active',
    });

    for (let j = 0; j < q.options.length; j++) {
      await QuestionOption.create({
        question_id: question.id,
        item_id: null,
        option_text: q.options[j],
        option_order: j + 1,
        is_correct: j === q.correct,
      });
    }
  }

  console.log(`[Seed] ✓ 25 Vocabulary questions created (25 điểm)`);
}

// ========================================
// READING - 25 câu trong 4 parts (50 điểm tổng)
// Part 1: MCQ - 7 câu x 2 điểm = 14 điểm
// Part 2: Matching - 6 câu x 2 điểm = 12 điểm
// Part 3: True/False - 7 câu x 2 điểm = 14 điểm
// Part 4: Short Answer - 5 câu x 2 điểm = 10 điểm
// ========================================
async function seedReadingQuestions(aptisType, teacher) {
  console.log('[Seed] Seeding 25 Reading questions in 4 parts...');

  // Part 1: MCQ (7 câu)
  const readingMcqType = await QuestionType.findOne({ where: { code: 'READING_MCQ' } });
  
  const passage1 = `Climate change is one of the most pressing issues facing our planet today. Rising global temperatures are causing ice caps to melt, sea levels to rise, and weather patterns to become increasingly unpredictable. Scientists around the world are working to understand the full impact of climate change and develop strategies to mitigate its effects.`;

  const mcqQuestions = [
    'What is the main topic of the passage?',
    'According to the passage, what is happening to ice caps?',
    'What are scientists trying to do?',
    'What is mentioned about weather patterns?',
    'What does "mitigate" mean in this context?',
    'What is causing sea levels to rise?',
    'What is described as "pressing" in the passage?',
  ];

  for (let i = 0; i < 7; i++) {
    const question = await Question.create({
      question_type_id: readingMcqType.id,
      aptis_type_id: aptisType.id,
      difficulty: i < 3 ? 'easy' : i < 5 ? 'medium' : 'hard',
      content: `${passage1}\n\n${mcqQuestions[i]}`,
      created_by: teacher.id,
      status: 'active',
    });

    const options = ['Climate change', 'They are melting', 'Understand and develop strategies', 'Becoming unpredictable'];
    for (let j = 0; j < 4; j++) {
      await QuestionOption.create({
        question_id: question.id,
        item_id: null,
        option_text: j < options.length ? options[j] : `Option ${j + 1}`,
        option_order: j + 1,
        is_correct: j === 0,
      });
    }
  }

  // Part 2: Matching (6 câu)
  const readingMatchingType = await QuestionType.findOne({ where: { code: 'READING_MATCHING' } });
  
  const question2 = await Question.create({
    question_type_id: readingMatchingType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Match each person with their hobby:\n\nJohn loves outdoor activities.\nMary enjoys creative arts.\nPeter likes technology.\nSarah prefers physical exercise.\nTom enjoys nature.\nLisa likes culinary arts.',
    created_by: teacher.id,
    status: 'active',
  });

  const people = ['John', 'Mary', 'Peter', 'Sarah', 'Tom', 'Lisa'];
  const hobbies = ['Hiking', 'Painting', 'Coding', 'Yoga', 'Gardening', 'Cooking'];

  for (let i = 0; i < 6; i++) {
    const item = await QuestionItem.create({
      question_id: question2.id,
      item_text: people[i],
      item_order: i + 1,
    });

    const option = await QuestionOption.create({
      question_id: question2.id,
      item_id: null,
      option_text: hobbies[i],
      option_order: i + 1,
      is_correct: false,
    });

    await item.update({ correct_option_id: option.id });
  }

  // Part 3: True/False (7 câu)
  const readingTrueFalseType = await QuestionType.findOne({ where: { code: 'READING_TRUE_FALSE' } });
  
  const passage3 = `The Internet has revolutionized communication, making it possible for people worldwide to connect instantly. However, it has also raised concerns about privacy and security. Social media platforms have become integral to modern life, but they also pose risks related to data protection and misinformation.`;

  const statements = [
    'The Internet has made global communication easier.',
    'Privacy concerns have been raised about the Internet.',
    'Social media is mentioned in the passage.',
    'The passage discusses data protection.',
    'Misinformation is not mentioned.',
    'The Internet has no negative effects.',
    'Social media is part of modern life.',
  ];

  const correctAnswers = [true, true, true, true, false, false, true];

  for (let i = 0; i < 7; i++) {
    const question = await Question.create({
      question_type_id: readingTrueFalseType.id,
      aptis_type_id: aptisType.id,
      difficulty: i < 3 ? 'easy' : i < 5 ? 'medium' : 'hard',
      content: `${passage3}\n\n${statements[i]}`,
      created_by: teacher.id,
      status: 'active',
    });

    await QuestionOption.create({
      question_id: question.id,
      item_id: null,
      option_text: 'True',
      option_order: 1,
      is_correct: correctAnswers[i],
    });

    await QuestionOption.create({
      question_id: question.id,
      item_id: null,
      option_text: 'False',
      option_order: 2,
      is_correct: !correctAnswers[i],
    });
  }

  // Part 4: Short Answer (5 câu)
  const readingShortAnswerType = await QuestionType.findOne({ where: { code: 'READING_SHORT_ANSWER' } });
  
  const passage4 = `William Shakespeare was born in Stratford-upon-Avon in 1564. He is widely regarded as the greatest writer in the English language. He wrote approximately 38 plays and 154 sonnets during his lifetime. His works have been translated into every major language and are performed more often than those of any other playwright.`;

  const shortQuestions = [
    'Where was Shakespeare born?',
    'In what year was he born?',
    'How many plays did he write approximately?',
    'How many sonnets did he write?',
    'What language is mentioned?',
  ];

  for (let i = 0; i < 5; i++) {
    await Question.create({
      question_type_id: readingShortAnswerType.id,
      aptis_type_id: aptisType.id,
      difficulty: i < 2 ? 'easy' : i < 3 ? 'medium' : 'hard',
      content: `${passage4}\n\n${shortQuestions[i]}`,
      created_by: teacher.id,
      status: 'active',
    });
  }

  console.log(`[Seed] ✓ 25 Reading questions created (7 MCQ + 6 Matching + 7 T/F + 5 Short = 50 điểm)`);
}

// ========================================
// LISTENING - 25 câu trong 4 parts (50 điểm tổng)
// Part 1: MCQ - 7 câu x 2 điểm = 14 điểm
// Part 2: Matching - 6 câu x 2 điểm = 12 điểm
// Part 3: MCQ - 7 câu x 2 điểm = 14 điểm
// Part 4: Gap Filling - 5 gaps x 2 điểm = 10 điểm
// ========================================
async function seedListeningQuestions(aptisType, teacher) {
  console.log('[Seed] Seeding 25 Listening questions in 4 parts...');

  // Part 1: MCQ (7 câu)
  const listeningMcqType = await QuestionType.findOne({ where: { code: 'LISTENING_MCQ' } });
  
  for (let i = 1; i <= 7; i++) {
    const question = await Question.create({
      question_type_id: listeningMcqType.id,
      aptis_type_id: aptisType.id,
      difficulty: i <= 3 ? 'easy' : i <= 5 ? 'medium' : 'hard',
      content: `Listen to the conversation and answer: What is the main topic discussed?`,
      media_url: `/audio/listening_part1_q${i}.mp3`,
      created_by: teacher.id,
      status: 'active',
    });

    const options = ['Travel plans', 'Work schedule', 'Weather', 'Shopping'];
    for (let j = 0; j < 4; j++) {
      await QuestionOption.create({
        question_id: question.id,
        item_id: null,
        option_text: options[j],
        option_order: j + 1,
        is_correct: j === 0,
      });
    }
  }

  // Part 2: Matching (6 câu)
  const listeningMatchingType = await QuestionType.findOne({ where: { code: 'LISTENING_MATCHING' } });
  
  const question2 = await Question.create({
    question_type_id: listeningMatchingType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Listen and match each speaker with their opinion:',
    media_url: '/audio/listening_part2.mp3',
    created_by: teacher.id,
    status: 'active',
  });

  const speakers = ['Speaker 1', 'Speaker 2', 'Speaker 3', 'Speaker 4', 'Speaker 5', 'Speaker 6'];
  const opinions = ['Agrees strongly', 'Disagrees', 'Neutral', 'Partially agrees', 'Strongly disagrees', 'Uncertain'];

  for (let i = 0; i < 6; i++) {
    const item = await QuestionItem.create({
      question_id: question2.id,
      item_text: speakers[i],
      item_order: i + 1,
    });

    const option = await QuestionOption.create({
      question_id: question2.id,
      item_id: null,
      option_text: opinions[i],
      option_order: i + 1,
      is_correct: false,
    });

    await item.update({ correct_option_id: option.id });
  }

  // Part 3: MCQ (7 câu)
  for (let i = 1; i <= 7; i++) {
    const question = await Question.create({
      question_type_id: listeningMcqType.id,
      aptis_type_id: aptisType.id,
      difficulty: i <= 3 ? 'easy' : i <= 5 ? 'medium' : 'hard',
      content: `Listen to the lecture and answer: What does the speaker emphasize?`,
      media_url: `/audio/listening_part3_q${i}.mp3`,
      created_by: teacher.id,
      status: 'active',
    });

    const options = ['Practice is important', 'Research is needed', 'Experience matters', 'Technology helps'];
    for (let j = 0; j < 4; j++) {
      await QuestionOption.create({
        question_id: question.id,
        item_id: null,
        option_text: options[j],
        option_order: j + 1,
        is_correct: j === 0,
      });
    }
  }

  // Part 4: Gap Filling (5 gaps)
  const listeningGapType = await QuestionType.findOne({ where: { code: 'LISTENING_GAP_FILL' } });
  
  const question4 = await Question.create({
    question_type_id: listeningGapType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Listen and fill in the missing words:\n\nThe conference will take place in _____ on _____ at _____ o\'clock in the _____ building on _____ street.',
    media_url: '/audio/listening_part4.mp3',
    created_by: teacher.id,
    status: 'active',
  });

  const answers = ['London', 'Friday', 'three', 'main', 'Oxford'];
  for (let i = 0; i < 5; i++) {
    await QuestionItem.create({
      question_id: question4.id,
      item_text: `Gap ${i + 1}`,
      item_order: i + 1,
      answer_text: answers[i],
    });
  }

  console.log(`[Seed] ✓ 25 Listening questions created (7+7 MCQ + 6 Matching + 5 Gap = 50 điểm)`);
}

// ========================================
// WRITING - 4 tasks (50 điểm tổng, AI scoring)
// Task 1: Short (12.5 điểm)
// Task 2: Email (12.5 điểm)
// Task 3: Long (12.5 điểm)
// Task 4: Essay (12.5 điểm)
// ========================================
async function seedWritingQuestions(aptisType, teacher) {
  console.log('[Seed] Seeding 4 Writing tasks...');

  const writingShortType = await QuestionType.findOne({ where: { code: 'WRITING_SHORT' } });
  const writingEmailType = await QuestionType.findOne({ where: { code: 'WRITING_EMAIL' } });
  const writingLongType = await QuestionType.findOne({ where: { code: 'WRITING_LONG' } });
  const writingEssayType = await QuestionType.findOne({ where: { code: 'WRITING_ESSAY' } });

  // Task 1: Short message (30-50 words)
  const task1 = await Question.create({
    question_type_id: writingShortType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'easy',
    content: 'You are organizing a team meeting. Write a short message to your colleague:\n- Date and time\n- Location\n- What to prepare\n\nWrite 30-50 words.',
    created_by: teacher.id,
    status: 'active',
  });

  await QuestionSampleAnswer.create({
    question_id: task1.id,
    answer_text: 'Hi Sarah, Team meeting next Monday 2PM in Conference Room B. Please prepare your project update and bring latest sales figures. Thanks!',
    score: 12.5,
    comment: 'Clear, concise, covers all points.',
  });

  // Task 2: Email (50-100 words)
  const task2 = await Question.create({
    question_type_id: writingEmailType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'You bought a product online but received wrong item. Write email to customer service:\n- What you ordered\n- The problem\n- What you want\n\nWrite 50-100 words.',
    created_by: teacher.id,
    status: 'active',
  });

  await QuestionSampleAnswer.create({
    question_id: task2.id,
    answer_text: 'Dear Customer Service,\n\nI ordered a blue laptop bag (Order #12345) but received a red one. I would like the correct item sent or a full refund processed.\n\nThank you.\nJohn Smith',
    score: 12.5,
    comment: 'Professional tone, clear explanation.',
  });

  // Task 3: Long response (120-150 words)
  const task3 = await Question.create({
    question_type_id: writingLongType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Write an article: "The importance of learning English"\n\nInclude:\n- Why English is important\n- How it has helped you\n- Advice for learners\n\nWrite 120-150 words.',
    created_by: teacher.id,
    status: 'active',
  });

  await QuestionSampleAnswer.create({
    question_id: task3.id,
    answer_text: 'English has become the global language, essential for business, education, and cultural exchange. It opens countless opportunities.\n\nLearning English transformed my life, allowing me to access information, connect globally, and pursue education abroad. I can read academic papers and participate in international discussions.\n\nMy advice: practice consistently, immerse yourself, watch English movies, read books, and don\'t fear mistakes. Join conversation groups and use apps. Remember, every expert was once a beginner.',
    score: 12.5,
    comment: 'Well-organized with examples and advice.',
  });

  // Task 4: Essay (200-250 words)
  const task4 = await Question.create({
    question_type_id: writingEssayType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'hard',
    content: 'Some people believe social media has positive impact, others think it has negative effects.\n\nDiscuss both views and give your opinion.\n\nWrite 200-250 words.',
    created_by: teacher.id,
    status: 'active',
  });

  await QuestionSampleAnswer.create({
    question_id: task4.id,
    answer_text: 'Social media has become integral to modern life, sparking debate about its impact.\n\nAdvocates highlight its ability to connect people globally, facilitate communication, and democratize information. Platforms like Facebook enable social movements, help businesses reach customers, and maintain relationships across distances. Social media also provides educational resources and networking opportunities.\n\nHowever, critics argue it contributes to mental health issues, spreads misinformation, and reduces face-to-face interaction. Studies link excessive use to anxiety and depression. Fake news and echo chambers can polarize society and undermine democracy.\n\nIn my opinion, social media is a tool whose impact depends on usage. While it offers tremendous benefits for connection and information sharing, users must develop digital literacy and practice moderation. Society should focus on educating about responsible use rather than demonizing technology. The key is finding balance and using platforms consciously and purposefully.',
    score: 12.5,
    comment: 'Balanced essay with clear structure and opinion.',
  });

  console.log(`[Seed] ✓ 4 Writing tasks created (4 x 12.5 = 50 điểm)`);
}

// ========================================
// SPEAKING - 4 tasks (50 điểm tổng, AI scoring)
// Task 1: Personal (12.5 điểm)
// Task 2: Compare (12.5 điểm)
// Task 3: Picture (12.5 điểm)
// Task 4: Discussion (12.5 điểm)
// ========================================
async function seedSpeakingQuestions(aptisType, teacher) {
  console.log('[Seed] Seeding 4 Speaking tasks...');

  const speakingPersonalType = await QuestionType.findOne({ where: { code: 'SPEAKING_INTRO' } });
  const speakingCompareType = await QuestionType.findOne({ where: { code: 'SPEAKING_COMPARISON' } });
  const speakingPictureType = await QuestionType.findOne({ where: { code: 'SPEAKING_DESCRIPTION' } });
  const speakingDiscussionType = await QuestionType.findOne({ where: { code: 'SPEAKING_DISCUSSION' } });

  // Task 1: Personal information (30s prep + 1 min speak)
  await Question.create({
    question_type_id: speakingPersonalType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'easy',
    content: 'Tell me about yourself:\n- Name and where you\'re from\n- Work or studies\n- Hobbies and interests\n\n30 seconds to prepare, 1 minute to speak.',
    duration_seconds: 90,
    created_by: teacher.id,
    status: 'active',
  });

  // Task 2: Describe and compare (1 min prep + 1.5 min speak)
  await Question.create({
    question_type_id: speakingCompareType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Look at two pictures (traveling by car vs train).\n\nCompare them:\n- Differences\n- Which you prefer and why\n\n1 minute to prepare, 1.5 minutes to speak.',
    media_url: '/images/speaking_task2.jpg',
    duration_seconds: 150,
    created_by: teacher.id,
    status: 'active',
  });

  // Task 3: Describe picture (1 min prep + 2 min speak)
  await Question.create({
    question_type_id: speakingPictureType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'medium',
    content: 'Look at a busy city street picture.\n\nDescribe:\n- People and their activities\n- Buildings and environment\n- Overall atmosphere\n\n1 minute to prepare, 2 minutes to speak.',
    media_url: '/images/speaking_task3.jpg',
    duration_seconds: 180,
    created_by: teacher.id,
    status: 'active',
  });

  // Task 4: Discussion (1 min prep + 2 min speak)
  await Question.create({
    question_type_id: speakingDiscussionType.id,
    aptis_type_id: aptisType.id,
    difficulty: 'hard',
    content: 'Topic: Technology in education\n\nDiscuss:\n- How has technology changed learning?\n- Advantages and disadvantages of online learning\n- Future of education\n\n1 minute to prepare, 2 minutes to speak.',
    duration_seconds: 180,
    created_by: teacher.id,
    status: 'active',
  });

  console.log(`[Seed] ✓ 4 Speaking tasks created (4 x 12.5 = 50 điểm)`);
}

// Run if called directly
if (require.main === module) {
  seedQuestions();
}

module.exports = seedQuestions;
