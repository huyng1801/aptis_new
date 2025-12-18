require('dotenv').config();
const {
  Exam,
  ExamSection,
  ExamSectionQuestion,
  Question,
  AptisType,
  SkillType,
  QuestionType,
  User,
} = require('../models');

/**
 * Seed APTIS exams theo cấu trúc thực tế (250 điểm tổng)
 * 
 * CẤU TRÚC ĐỀ THI:
 * - Grammar: 25 điểm (25 câu x 1 điểm)
 * - Vocabulary: 25 điểm (25 câu x 1 điểm)
 * - Reading: 50 điểm (25 câu, điểm khác nhau)
 * - Listening: 50 điểm (25 câu, điểm khác nhau)
 * - Writing: 50 điểm (4 tasks x 12.5 điểm, AI)
 * - Speaking: 50 điểm (4 tasks x 12.5 điểm, AI)
 * TỔNG: 250 điểm
 */
async function seedExams() {
  try {
    console.log('[Seed] Seeding APTIS exams...');

    const aptisType = await AptisType.findOne({ where: { code: 'APTIS_GENERAL' } });
    const teacher = await User.findOne({ where: { email: 'teacher1@aptis.local' } });

    if (!aptisType || !teacher) {
      throw new Error('APTIS type or teacher not found');
    }

    // Get skills
    const grammarSkill = await SkillType.findOne({ where: { code: 'GRAMMAR_VOCABULARY' } });
    const readingSkill = await SkillType.findOne({ where: { code: 'READING' } });
    const listeningSkill = await SkillType.findOne({ where: { code: 'LISTENING' } });
    const writingSkill = await SkillType.findOne({ where: { code: 'WRITING' } });
    const speakingSkill = await SkillType.findOne({ where: { code: 'SPEAKING' } });

    if (!grammarSkill || !readingSkill || !listeningSkill || !writingSkill || !speakingSkill) {
      throw new Error('Skills not found');
    }

    // Create Full APTIS Exam
    await createFullExam(aptisType, teacher, {
      grammarSkill,
      readingSkill,
      listeningSkill,
      writingSkill,
      speakingSkill,
    });

    console.log('[Seed] ✓ APTIS exams seeded successfully');
  } catch (error) {
    console.error('[Seed] Failed to seed exams:', error);
    throw error;
  }
}

/**
 * Create full APTIS exam (250 điểm)
 */
async function createFullExam(aptisType, teacher, skills) {
  console.log('[Seed] Creating Full APTIS General Exam...');

  const exam = await Exam.create({
    aptis_type_id: aptisType.id,
    title: 'APTIS General - Full Exam',
    description: 'Complete APTIS General exam testing all skills: Grammar, Vocabulary, Reading, Listening, Writing, Speaking',
    duration_minutes: 180, // 3 hours total
    total_score: 250,
    created_by: teacher.id,
    status: 'published',
    published_at: new Date(),
  });

  let sectionOrder = 1;

  // Section 1: Grammar (25 điểm)
  await createGrammarSection(exam.id, skills.grammarSkill, sectionOrder++);

  // Section 2: Vocabulary (25 điểm)
  await createVocabularySection(exam.id, skills.grammarSkill, sectionOrder++);

  // Section 3: Reading (50 điểm)
  await createReadingSection(exam.id, skills.readingSkill, sectionOrder++);

  // Section 4: Listening (50 điểm)
  await createListeningSection(exam.id, skills.listeningSkill, sectionOrder++);

  // Section 5: Writing (50 điểm)
  await createWritingSection(exam.id, skills.writingSkill, sectionOrder++);

  // Section 6: Speaking (50 điểm)
  await createSpeakingSection(exam.id, skills.speakingSkill, sectionOrder++);

  console.log(`[Seed] ✓ Full exam created with 6 sections (250 điểm tổng)`);
}

// ========================================
// GRAMMAR SECTION - 25 điểm (25 câu x 1 điểm)
// ========================================
async function createGrammarSection(examId, skillType, sectionOrder) {
  const section = await ExamSection.create({
    exam_id: examId,
    skill_type_id: skillType.id,
    section_order: sectionOrder,
    duration_minutes: 25,
    instruction: 'Choose the correct answer to complete each sentence. You have 25 minutes to complete 25 questions.',
  });

  const grammarType = await QuestionType.findOne({ where: { code: 'GV_MCQ' } });
  const questions = await Question.findAll({
    where: { question_type_id: grammarType.id },
    limit: 25,
  });

  for (let i = 0; i < questions.length; i++) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: questions[i].id,
      question_order: i + 1,
      max_score: 1.0, // Mỗi câu 1 điểm
    });
  }

  console.log(`[Seed]   - Grammar section: 25 questions x 1 điểm = 25 điểm`);
}

// ========================================
// VOCABULARY SECTION - 25 điểm (25 câu x 1 điểm)
// ========================================
async function createVocabularySection(examId, skillType, sectionOrder) {
  const section = await ExamSection.create({
    exam_id: examId,
    skill_type_id: skillType.id,
    section_order: sectionOrder,
    duration_minutes: 25,
    instruction: 'Choose the best word or phrase to complete each sentence. You have 25 minutes for 25 questions.',
  });

  const vocabType = await QuestionType.findOne({ where: { code: 'GV_MCQ' } });
  const questions = await Question.findAll({
    where: { question_type_id: vocabType.id },
    limit: 25,
  });

  for (let i = 0; i < questions.length; i++) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: questions[i].id,
      question_order: i + 1,
      max_score: 1.0, // Mỗi câu 1 điểm
    });
  }

  console.log(`[Seed]   - Vocabulary section: 25 questions x 1 điểm = 25 điểm`);
}

// ========================================
// READING SECTION - 50 điểm (25 câu)
// Part 1: 7 MCQ x 2 = 14 điểm
// Part 2: 6 Matching x 2 = 12 điểm
// Part 3: 7 T/F x 2 = 14 điểm
// Part 4: 5 Short Answer x 2 = 10 điểm
// ========================================
async function createReadingSection(examId, skillType, sectionOrder) {
  const section = await ExamSection.create({
    exam_id: examId,
    skill_type_id: skillType.id,
    section_order: sectionOrder,
    duration_minutes: 35,
    instruction: 'Read the passages and answer the questions. You have 35 minutes to complete all 4 parts.',
  });

  let questionOrder = 1;

  // Part 1: MCQ (7 câu x 2 điểm)
  const readingMcqType = await QuestionType.findOne({ where: { code: 'READING_MCQ' } });
  const mcqQuestions = await Question.findAll({
    where: { question_type_id: readingMcqType.id },
    limit: 7,
  });

  for (const q of mcqQuestions) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: q.id,
      question_order: questionOrder++,
      max_score: 2.0,
    });
  }

  // Part 2: Matching (6 items x 2 điểm)
  const readingMatchingType = await QuestionType.findOne({ where: { code: 'READING_MATCHING' } });
  const matchingQuestions = await Question.findAll({
    where: { question_type_id: readingMatchingType.id },
    limit: 1,
  });

  if (matchingQuestions.length > 0) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: matchingQuestions[0].id,
      question_order: questionOrder++,
      max_score: 12.0, // 6 items x 2 điểm
    });
  }

  // Part 3: True/False (7 câu x 2 điểm)
  const readingTFType = await QuestionType.findOne({ where: { code: 'READING_TRUE_FALSE' } });
  const tfQuestions = await Question.findAll({
    where: { question_type_id: readingTFType.id },
    limit: 7,
  });

  for (const q of tfQuestions) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: q.id,
      question_order: questionOrder++,
      max_score: 2.0,
    });
  }

  // Part 4: Short Answer (5 câu x 2 điểm)
  const readingShortType = await QuestionType.findOne({ where: { code: 'READING_SHORT_ANSWER' } });
  const shortQuestions = await Question.findAll({
    where: { question_type_id: readingShortType.id },
    limit: 5,
  });

  for (const q of shortQuestions) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: q.id,
      question_order: questionOrder++,
      max_score: 2.0,
    });
  }

  console.log(`[Seed]   - Reading section: 25 questions (7+6+7+5) = 50 điểm`);
}

// ========================================
// LISTENING SECTION - 50 điểm (25 câu)
// Part 1: 7 MCQ x 2 = 14 điểm
// Part 2: 6 Matching x 2 = 12 điểm
// Part 3: 7 MCQ x 2 = 14 điểm
// Part 4: 5 Gap Filling x 2 = 10 điểm
// ========================================
async function createListeningSection(examId, skillType, sectionOrder) {
  const section = await ExamSection.create({
    exam_id: examId,
    skill_type_id: skillType.id,
    section_order: sectionOrder,
    duration_minutes: 40,
    instruction: 'Listen to the recordings and answer the questions. You have 40 minutes to complete all 4 parts.',
  });

  let questionOrder = 1;

  // Part 1: MCQ (7 câu x 2 điểm)
  const listeningMcqType = await QuestionType.findOne({ where: { code: 'LISTENING_MCQ' } });
  const mcqQuestions = await Question.findAll({
    where: { question_type_id: listeningMcqType.id },
    limit: 7,
  });

  for (const q of mcqQuestions) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: q.id,
      question_order: questionOrder++,
      max_score: 2.0,
    });
  }

  // Part 2: Matching (6 items x 2 điểm)
  const listeningMatchingType = await QuestionType.findOne({ where: { code: 'LISTENING_MATCHING' } });
  const matchingQuestions = await Question.findAll({
    where: { question_type_id: listeningMatchingType.id },
    limit: 1,
  });

  if (matchingQuestions.length > 0) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: matchingQuestions[0].id,
      question_order: questionOrder++,
      max_score: 12.0, // 6 items x 2 điểm
    });
  }

  // Part 3: MCQ (7 câu x 2 điểm) - lấy từ questions còn lại
  const mcqQuestions2 = await Question.findAll({
    where: { question_type_id: listeningMcqType.id },
    limit: 14, // Lấy 14 để skip 7 câu đầu
    offset: 7,
  });

  for (const q of mcqQuestions2) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: q.id,
      question_order: questionOrder++,
      max_score: 2.0,
    });
  }

  // Part 4: Gap Filling (5 gaps x 2 điểm)
  const listeningGapType = await QuestionType.findOne({ where: { code: 'LISTENING_GAP_FILL' } });
  const gapQuestions = await Question.findAll({
    where: { question_type_id: listeningGapType.id },
    limit: 1,
  });

  if (gapQuestions.length > 0) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: gapQuestions[0].id,
      question_order: questionOrder++,
      max_score: 10.0, // 5 gaps x 2 điểm
    });
  }

  console.log(`[Seed]   - Listening section: 25 questions (7+6+7+5) = 50 điểm`);
}

// ========================================
// WRITING SECTION - 50 điểm (4 tasks x 12.5)
// ========================================
async function createWritingSection(examId, skillType, sectionOrder) {
  const section = await ExamSection.create({
    exam_id: examId,
    skill_type_id: skillType.id,
    section_order: sectionOrder,
    duration_minutes: 50,
    instruction: 'Complete all 4 writing tasks. Your responses will be scored by AI based on content, organization, language, and accuracy.',
  });

  let questionOrder = 1;

  // Task 1: Short message
  const shortType = await QuestionType.findOne({ where: { code: 'WRITING_SHORT' } });
  const shortQuestions = await Question.findAll({
    where: { question_type_id: shortType.id },
    limit: 1,
  });

  if (shortQuestions.length > 0) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: shortQuestions[0].id,
      question_order: questionOrder++,
      max_score: 12.5,
    });
  }

  // Task 2: Email
  const emailType = await QuestionType.findOne({ where: { code: 'WRITING_EMAIL' } });
  const emailQuestions = await Question.findAll({
    where: { question_type_id: emailType.id },
    limit: 1,
  });

  if (emailQuestions.length > 0) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: emailQuestions[0].id,
      question_order: questionOrder++,
      max_score: 12.5,
    });
  }

  // Task 3: Long response
  const longType = await QuestionType.findOne({ where: { code: 'WRITING_LONG' } });
  const longQuestions = await Question.findAll({
    where: { question_type_id: longType.id },
    limit: 1,
  });

  if (longQuestions.length > 0) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: longQuestions[0].id,
      question_order: questionOrder++,
      max_score: 12.5,
    });
  }

  // Task 4: Essay
  const essayType = await QuestionType.findOne({ where: { code: 'WRITING_ESSAY' } });
  const essayQuestions = await Question.findAll({
    where: { question_type_id: essayType.id },
    limit: 1,
  });

  if (essayQuestions.length > 0) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: essayQuestions[0].id,
      question_order: questionOrder++,
      max_score: 12.5,
    });
  }

  console.log(`[Seed]   - Writing section: 4 tasks x 12.5 = 50 điểm (AI scoring)`);
}

// ========================================
// SPEAKING SECTION - 50 điểm (4 tasks x 12.5)
// ========================================
async function createSpeakingSection(examId, skillType, sectionOrder) {
  const section = await ExamSection.create({
    exam_id: examId,
    skill_type_id: skillType.id,
    section_order: sectionOrder,
    duration_minutes: 12,
    instruction: 'Complete all 4 speaking tasks. Record your responses. Your speaking will be scored by AI based on fluency, pronunciation, vocabulary, and grammar.',
  });

  let questionOrder = 1;

  // Task 1: Personal
  const personalType = await QuestionType.findOne({ where: { code: 'SPEAKING_INTRO' } });
  const personalQuestions = await Question.findAll({
    where: { question_type_id: personalType.id },
    limit: 1,
  });

  if (personalQuestions.length > 0) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: personalQuestions[0].id,
      question_order: questionOrder++,
      max_score: 12.5,
    });
  }

  // Task 2: Compare
  const compareType = await QuestionType.findOne({ where: { code: 'SPEAKING_COMPARISON' } });
  const compareQuestions = await Question.findAll({
    where: { question_type_id: compareType.id },
    limit: 1,
  });

  if (compareQuestions.length > 0) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: compareQuestions[0].id,
      question_order: questionOrder++,
      max_score: 12.5,
    });
  }

  // Task 3: Picture description
  const pictureType = await QuestionType.findOne({ where: { code: 'SPEAKING_DESCRIPTION' } });
  const pictureQuestions = await Question.findAll({
    where: { question_type_id: pictureType.id },
    limit: 1,
  });

  if (pictureQuestions.length > 0) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: pictureQuestions[0].id,
      question_order: questionOrder++,
      max_score: 12.5,
    });
  }

  // Task 4: Discussion
  const discussionType = await QuestionType.findOne({ where: { code: 'SPEAKING_DISCUSSION' } });
  const discussionQuestions = await Question.findAll({
    where: { question_type_id: discussionType.id },
    limit: 1,
  });

  if (discussionQuestions.length > 0) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: discussionQuestions[0].id,
      question_order: questionOrder++,
      max_score: 12.5,
    });
  }

  console.log(`[Seed]   - Speaking section: 4 tasks x 12.5 = 50 điểm (AI scoring)`);
}

// Run if called directly
if (require.main === module) {
  seedExams();
}

module.exports = seedExams;
