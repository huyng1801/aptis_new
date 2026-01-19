
// Nạp biến môi trường và import models
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
 * Seed đề thi APTIS theo cấu trúc chính thức (tổng 200 điểm)
 *
 * CẤU TRÚC ĐỀ THI CHÍNH THỨC:
 * - Reading: 50 điểm (29 câu trong 5 phần)
 *   + Part 1: 5 câu = 10 điểm (2 điểm/câu)
 *   + Part 2: 5 câu = 5 điểm (1 điểm/câu)
 *   + Part 3: 5 câu = 5 điểm (1 điểm/câu)
 *   + Part 4: 7 câu = 16 điểm (~2.29 điểm/câu)
 *   + Part 5: 7 câu = 14 điểm (2 điểm/câu)
 * - Listening: 50 điểm (25 câu, mỗi câu đúng = 2 điểm)
 *   + Part 1: 13 câu = 26 điểm
 *   + Part 2: câu 14 gồm 4 câu nhỏ = 8 điểm
 *   + Part 3: câu 15 gồm 4 câu nhỏ = 8 điểm
 *   + Part 4: câu 16-17 gồm 4 câu nhỏ = 8 điểm
 * - Writing: 50 điểm (4 task, CEFR-based scoring)
 * - Speaking: 50 điểm (4 task, CEFR-based scoring)
 * Tổng: 200 điểm (4 kỹ năng)
 */

// Hàm chính để seed đề thi APTIS
async function seedExams() {
  try {
    console.log('[Seed] Seeding APTIS exams...');

    // Lấy thông tin loại đề và giáo viên tạo đề
    const aptisType = await AptisType.findOne({ where: { code: 'APTIS_GENERAL' } });
    const teacher = await User.findOne({ where: { email: 'teacher1@aptis.local' } });

    if (!aptisType || !teacher) {
      throw new Error('Không tìm thấy loại đề hoặc giáo viên');
    }

    // Lấy 4 kỹ năng chính
    const readingSkill = await SkillType.findOne({ where: { code: 'READING' } });
    const listeningSkill = await SkillType.findOne({ where: { code: 'LISTENING' } });
    const writingSkill = await SkillType.findOne({ where: { code: 'WRITING' } });
    const speakingSkill = await SkillType.findOne({ where: { code: 'SPEAKING' } });

    if (!readingSkill || !listeningSkill || !writingSkill || !speakingSkill) {
      throw new Error('Không tìm thấy đủ kỹ năng');
    }

    // Tạo đề thi đầy đủ
    await createFullExam(aptisType, teacher, {
      readingSkill,
      listeningSkill,
      writingSkill,
      speakingSkill,
    });

    console.log('[Seed] ✓ Đã tạo đề thi APTIS thành công');
  } catch (error) {
    console.error('[Seed] Lỗi khi tạo đề thi:', error);
    throw error;
  }
}


// Tạo đề thi đầy đủ (4 kỹ năng, 200 điểm)
async function createFullExam(aptisType, teacher, skills) {
  console.log('[Seed] Đang tạo đề thi APTIS General đầy đủ...');

  // Tạo bản ghi Exam
  const exam = await Exam.create({
    aptis_type_id: aptisType.id,
    title: 'Đề 1',
    description: 'Đề thi APTIS General đủ 4 kỹ năng: Đọc, Nghe, Viết, Nói',
    duration_minutes: 180, // 3 tiếng
    total_score: 200,
    created_by: teacher.id,
    status: 'published',
    published_at: new Date(),
  });

  let sectionOrder = 1;

  // Section 1-4: Đọc hiểu (4 phần, chỉ phần 2 có 2 câu, các phần khác mỗi phần 1 câu)
  // Phần 1: Gap Filling - 10 điểm (1 câu x 10 điểm)
  await createReadingPartSection(exam.id, skills.readingSkill, sectionOrder++, 1, 'READING_GAP_FILL', 'Part 1: Gap Filling', 5, 1, 10);
  // Phần 2: Ordering - 20 điểm (2 câu x 10 điểm)
  await createReadingPartSection(exam.id, skills.readingSkill, sectionOrder++, 2, 'READING_ORDERING', 'Part 2: Ordering', 10, 2, 10);
  // Phần 3: Matching - 10 điểm (1 câu x 10 điểm)0
  await createReadingPartSection(exam.id, skills.readingSkill, sectionOrder++, 3, 'READING_MATCHING', 'Part 3: Matching', 10, 1, 10);
  // Phần 4: Matching Headings - 10 điểm (1 câu x 10 điểm)
  await createReadingPartSection(exam.id, skills.readingSkill, sectionOrder++, 4, 'READING_MATCHING_HEADINGS', 'Part 4: Matching Headings', 10, 1, 10);

  // Section 6-9: Nghe hiểu (4 phần riêng biệt)
  await createListeningPartSection(exam.id, skills.listeningSkill, sectionOrder++, 1, 'LISTENING_MCQ', 'Part 1: Multiple Choice', 10, 13, 2.0);
  await createListeningPartSection(exam.id, skills.listeningSkill, sectionOrder++, 2, 'LISTENING_MATCHING', 'Part 2: Speaker Matching', 10, 1, 8.0);
  await createListeningPartSection(exam.id, skills.listeningSkill, sectionOrder++, 3, 'LISTENING_STATEMENT_MATCHING', 'Part 3: Statement Matching', 10, 1, 8.0);
  await createListeningPartSection(exam.id, skills.listeningSkill, sectionOrder++, 4, 'LISTENING_MCQ', 'Part 4: Extended MCQ', 10, 2, 4.0);

  // Section 10-13: Viết (4 task, tổng 50 điểm)
  // APTIS Writing: 4 tasks × 12.5 điểm = 50 điểm tổng
  // AI chấm dùng CEFR scale (0-3, 0-5, 0-5, 0-6) rồi convert sang 0-12.5
  await createWritingSection(exam.id, skills.writingSkill, sectionOrder++, 'WRITING_SHORT', 'Part 1: Form Filling (A1)', 10, 12.5, 1); // scale 0-3 → 0-12.5
  await createWritingSection(exam.id, skills.writingSkill, sectionOrder++, 'WRITING_FORM', 'Part 2: Short Response (A2)', 10, 12.5, 1); // scale 0-5 → 0-12.5
  await createWritingSection(exam.id, skills.writingSkill, sectionOrder++, 'WRITING_LONG', 'Part 3: Chat Responses (B1)', 10, 12.5, 1); // scale 0-5 → 0-12.5
  await createWritingSection(exam.id, skills.writingSkill, sectionOrder++, 'WRITING_EMAIL', 'Part 4: Email Writing (B2)', 20, 12.5, 1); // scale 0-6 → 0-12.5

  // Section 14-17: Nói (4 section, tổng 50 điểm)
  // Section 1: 3 questions x 4 điểm = 12 điểm
  await createSpeakingPartSection(exam.id, skills.speakingSkill, sectionOrder++, 1, 'SPEAKING_INTRO', 'Part 1: Personal Introduction', 2, 3, 4);
  // Section 2: 3 questions x 4 điểm = 12 điểm
  await createSpeakingPartSection(exam.id, skills.speakingSkill, sectionOrder++, 2, 'SPEAKING_DESCRIPTION', 'Part 2: Picture Description', 2, 3, 4);
  // Section 3: 3 questions x 4 điểm = 12 điểm
  await createSpeakingPartSection(exam.id, skills.speakingSkill, sectionOrder++, 3, 'SPEAKING_COMPARISON', 'Part 3: Comparison', 2, 3, 4);
  // Section 4: 1 question x 14 điểm = 14 điểm (nhiều thời gian và điểm hơn)
  await createSpeakingPartSection(exam.id, skills.speakingSkill, sectionOrder++, 4, 'SPEAKING_DISCUSSION', 'Part 4: Topic Discussion', 6, 1, 14);

  console.log(`[Seed] ✓ Đã tạo đủ 16 section theo chuẩn APTIS (4 Đọc + 4 Nghe + 4 Viết + 4 Nói)`);
}

// Tạo section riêng cho từng phần Đọc hiểu
async function createReadingPartSection(examId, skillType, sectionOrder, partNumber, questionTypeCode, sectionTitle, durationMinutes, questionLimit, maxScore) {
  const section = await ExamSection.create({
    exam_id: examId,
    skill_type_id: skillType.id,
    section_order: sectionOrder,
    duration_minutes: durationMinutes,
    instruction: `${sectionTitle}: Read carefully and answer all questions.`,
  });

  let questionOrder = 1;
  const questionType = await QuestionType.findOne({ where: { code: questionTypeCode } });
  let questions = await Question.findAll({
    where: { question_type_id: questionType.id },
    limit: questionLimit,
  });

  // Gán điểm đúng cho từng phần
  let scores = [];
  if (partNumber === 1) {
    // Part 1: 1 câu x 10 điểm
    scores = [10];
  } else if (partNumber === 2) {
    // Part 2: 2 câu x 10 điểm
    scores = [10, 10];
  } else if (partNumber === 3) {
    // Part 3: 1 câu x 10 điểm
    scores = [10];
  } else if (partNumber === 4) {
    // Part 4: 1 câu x 10 điểm
    scores = [10];
  }

  for (let i = 0; i < questions.length; i++) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: questions[i].id,
      question_order: questionOrder++,
      max_score: scores[i] || maxScore,
    });
  }

  const totalScore = scores.reduce((a, b) => a + b, 0);
  console.log(`[Seed]   - Đọc hiểu ${sectionTitle}: ${questionLimit} câu, tổng ${totalScore} điểm`);
}

// Tạo section riêng cho từng phần Nghe hiểu
async function createListeningPartSection(examId, skillType, sectionOrder, partNumber, questionTypeCode, sectionTitle, durationMinutes, questionLimit, maxScore) {
  const section = await ExamSection.create({
    exam_id: examId,
    skill_type_id: skillType.id,
    section_order: sectionOrder,
    duration_minutes: durationMinutes,
    instruction: `${sectionTitle}: Listen carefully and answer all questions.`,
  });

  let questionOrder = 1;
  const questionType = await QuestionType.findOne({ where: { code: questionTypeCode } });
  
  let questions;
  if (partNumber === 4) {
    // Part 4 cần offset để lấy 2 câu MCQ cuối
    questions = await Question.findAll({
      where: { question_type_id: questionType.id },
      limit: questionLimit,
      offset: 13,
    });
  } else {
    questions = await Question.findAll({
      where: { question_type_id: questionType.id },
      limit: questionLimit,
    });
  }

  for (const q of questions) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: q.id,
      question_order: questionOrder++,
      max_score: maxScore,
    });
  }

  const totalScore = questionLimit * maxScore;
  console.log(`[Seed]   - Nghe hiểu ${sectionTitle}: ${questionLimit} câu x ${maxScore} = ${totalScore} điểm`);
}

// Tạo section riêng cho từng phần Nói
async function createSpeakingPartSection(examId, skillType, sectionOrder, partNumber, questionTypeCode, sectionTitle, durationMinutes, questionLimit, maxScore) {
  const section = await ExamSection.create({
    exam_id: examId,
    skill_type_id: skillType.id,
    section_order: sectionOrder,
    duration_minutes: durationMinutes,
    instruction: `${sectionTitle}: Record your response clearly within the time limit.`,
  });

  let questionOrder = 1;
  const questionType = await QuestionType.findOne({ where: { code: questionTypeCode } });
  
  let questions;
  // Get all questions of this type first
  const allQuestions = await Question.findAll({
    where: { question_type_id: questionType.id },
  });
  
  // Take only the required number of questions (0-3 for sections 1-3, or just 1 for section 4)
  questions = allQuestions.slice(0, questionLimit);
  
  // If not enough questions, log a warning
  if (questions.length < questionLimit) {
    console.warn(`[Seed] Warning: Expected ${questionLimit} questions for ${questionTypeCode}, but only found ${questions.length}`);
  }

  for (const q of questions) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: q.id,
      question_order: questionOrder++,
      max_score: maxScore,
    });
  }

  const totalScore = questionLimit * maxScore;
  console.log(`[Seed]   - Nói ${sectionTitle}: ${questions.length} câu x ${maxScore} = ${questions.length * maxScore} điểm`);
}


// ========================================
// PHẦN 1: ĐỌC HIỂU - 50 điểm (29 câu trong 5 phần)
// Part 1: Gap Fill (5 câu x 2 điểm) = 10 điểm
// Part 2: Ordering (5 câu x 1 điểm) = 5 điểm
// Part 3: Matching (5 câu x 1 điểm) = 5 điểm
// Part 4: Matching Headings (7 câu x ~2.29 điểm) = 16 điểm
// Part 5: Short Text Matching (7 câu x 2 điểm) = 14 điểm
// ========================================
// ========================================
// PHẦN 2: NGHE HIỂU - 50 điểm (25 câu, mỗi câu đúng = 2 điểm)
// Part 1: 13 câu MCQ = 26 điểm
// Part 2: câu 14 gồm 4 câu nhỏ = 8 điểm
// Part 3: câu 15 gồm 4 câu nhỏ = 8 điểm
// Part 4: câu 16-17 gồm 4 câu nhỏ = 8 điểm
// ========================================
// ========================================
// PHẦN 3-6: VIẾT - 50 điểm (4 task x 12.5 điểm)
// CEFR-based scoring: Vocabulary, Grammar, Task completion
// ========================================
// Tạo section Viết (mỗi task là 1 section - CEFR-based scoring converted to 0-12.5)
async function createWritingSection(examId, skillType, sectionOrder, writingTypeCode, sectionTitle, durationMinutes, pointsPerTask = 12.5, questionCount = 1) {
  const section = await ExamSection.create({
    exam_id: examId,
    skill_type_id: skillType.id,
    section_order: sectionOrder,
    duration_minutes: durationMinutes,
    instruction: `${sectionTitle}: Follow the instructions carefully and complete within the time limit.`,
  });

  // Lấy đúng loại câu hỏi cho từng task viết
  const questionType = await QuestionType.findOne({ where: { code: writingTypeCode } });
  const questions = await Question.findAll({
    where: { question_type_id: questionType.id },
    limit: questionCount, // Lấy số lượng câu theo yêu cầu
  });

  // For Writing tasks: Store max_score as actual points (0-12.5)
  // AI will score using CEFR scale (0-3, 0-5, 0-5, 0-6) then convert to this scale
  let questionOrder = 1;
  for (const question of questions) {
    await ExamSectionQuestion.create({
      exam_section_id: section.id,
      question_id: question.id,
      question_order: questionOrder++,
      max_score: pointsPerTask, // Store as actual points (12.5 for each writing task = 50 total)
    });
  }

  console.log(`[Seed]   - Viết: ${sectionTitle} (${pointsPerTask} điểm, ${durationMinutes} phút, 1 task, AI uses CEFR scale)`);
}

// ========================================
// PHẦN 7-10: NÓI - 50 điểm (4 task x 12.5 điểm)
// ========================================

// Run if called directly
if (require.main === module) {
  seedExams();
}

module.exports = seedExams;
