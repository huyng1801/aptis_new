require('dotenv').config();
const { AptisType, SkillType, QuestionType } = require('../models');

/**
 * Seed APTIS types - Tạo loại đề thi APTIS
 */
async function seedAptisTypes() {
  const types = [
    {
      code: 'APTIS_GENERAL',
      aptis_type_name: 'APTIS General',
      description: 'General English test for all purposes',
      is_active: true,
    }
  ];

  for (const type of types) {
    await AptisType.findOrCreate({
      where: { code: type.code },
      defaults: type,
    });
  }

  console.log(`[Seed] ${types.length} APTIS types seeded`);
}

/**
 * Seed skill types - Tạo các kỹ năng (Nghe, Đọc, Nói, Viết)
 */
async function seedSkillTypes() {
  const skills = [
    {
      code: 'LISTENING',
      skill_type_name: 'Listening',
      description: 'Test listening comprehension skills',
      display_order: 1,
    },
    {
      code: 'READING',
      skill_type_name: 'Reading',
      description: 'Test reading comprehension skills',
      display_order: 2,
    },
    {
      code: 'SPEAKING',
      skill_type_name: 'Speaking',
      description: 'Test spoken communication skills',
      display_order: 3,
    },
    {
      code: 'WRITING',
      skill_type_name: 'Writing',
      description: 'Test written communication skills',
      display_order: 4,
    },
  ];

  for (const skill of skills) {
    await SkillType.findOrCreate({
      where: { code: skill.code },
      defaults: skill,
    });
  }

  console.log(`[Seed] ${skills.length} skill types seeded`);
}

/**
 * Seed question types - Tạo các loại câu hỏi cho từng kỹ năng
 */
async function seedQuestionTypes() {
  // Lấy ID của từng kỹ năng
  const listening = await SkillType.findOne({ where: { code: 'LISTENING' } });
  const reading = await SkillType.findOne({ where: { code: 'READING' } });
  const speaking = await SkillType.findOne({ where: { code: 'SPEAKING' } });
  const writing = await SkillType.findOne({ where: { code: 'WRITING' } });

  const types = [
    // ===== LISTENING (Nghe) =====
    {
      skill_type_id: listening.id,
      code: 'LISTENING_MCQ',
      question_type_name: 'Multiple Choice',
      instruction_template: 'Listen and choose the best answer.',
      scoring_method: 'auto',
    },
    {
      skill_type_id: listening.id,
      code: 'LISTENING_MATCHING',
      question_type_name: 'Speaker Matching',
      instruction_template: 'Listen to each speaker and match them with the correct option.',
      scoring_method: 'auto',
    },
    {
      skill_type_id: listening.id,
      code: 'LISTENING_STATEMENT_MATCHING',
      question_type_name: 'Statement Matching',
      instruction_template: 'Listen to the conversation and match each statement with the correct person.',
      scoring_method: 'auto',
    },

    // ===== READING (Đọc) =====
    {
      skill_type_id: reading.id,
      code: 'READING_GAP_FILL',
      question_type_name: 'Gap Filling',
      instruction_template: 'Choose one word from the list for each gap.',
      scoring_method: 'auto',
    },
    {
      skill_type_id: reading.id,
      code: 'READING_ORDERING',
      question_type_name: 'Ordering',
      instruction_template: 'Put the sentences in the right order.',
      scoring_method: 'auto',
    },
    {
      skill_type_id: reading.id,
      code: 'READING_MATCHING',
      question_type_name: 'Matching',
      instruction_template: 'Match each item in the left column with the correct item in the right column.',
      scoring_method: 'auto',
    },
    {
      skill_type_id: reading.id,
      code: 'READING_MATCHING_HEADINGS',
      question_type_name: 'Matching Headings',
      instruction_template: 'Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.',
      scoring_method: 'auto',
    },


    // ===== SPEAKING (Nói) - Dựa trên APTIS Technical Report =====
    {
      skill_type_id: speaking.id,
      code: 'SPEAKING_INTRO',
      question_type_name: 'Personal Introduction',
      scoring_method: 'ai',
      description: 'Task 1: Personal introduction, A2 level, 0-5 scale'
    },
    {
      skill_type_id: speaking.id,
      code: 'SPEAKING_DESCRIPTION',
      question_type_name: 'Picture Description',
      scoring_method: 'ai',
      description: 'Task 2: Picture/topic description, B1 level, 0-5 scale'
    },
    {
      skill_type_id: speaking.id,
      code: 'SPEAKING_COMPARISON',
      question_type_name: 'Comparison',
      scoring_method: 'ai',
      description: 'Task 3: Compare and contrast, B1 level, 0-5 scale'
    },
    {
      skill_type_id: speaking.id,
      code: 'SPEAKING_DISCUSSION',
      question_type_name: 'Topic Discussion',
      scoring_method: 'ai',
      description: 'Task 4: Extended discussion, B2 level, 0-6 scale with C1/C2 extension'
    },

    // ===== WRITING (Viết) - Dựa trên APTIS Technical Report =====
    {
      skill_type_id: writing.id,
      code: 'WRITING_SHORT',
      question_type_name: 'Short Response',
      scoring_method: 'ai',
      description: 'Task 1: Basic form filling, A1 level, 0-4 scale'
    },
    {
      skill_type_id: writing.id,
      code: 'WRITING_FORM',
      question_type_name: 'Form Filling',
      scoring_method: 'ai',
      description: 'Task 2: Short constructed response to specific question, A2 level, 0-5 scale'
    },
    {
      skill_type_id: writing.id,
      code: 'WRITING_LONG',
      question_type_name: 'Chat Responses', 
      scoring_method: 'ai',
      description: 'Task 3: Chat room with 3 questions, B1 level, 0-5 scale'
    },
    {
      skill_type_id: writing.id,
      code: 'WRITING_EMAIL',
      question_type_name: 'Email Writing',
      scoring_method: 'ai',
      description: 'Task 4: Two emails (friend + authority), B2 level, 0-6 scale with C1/C2 extension'
    },
  ];

  for (const type of types) {
    await QuestionType.findOrCreate({
      where: { code: type.code },
      defaults: type,
    });
  }

  console.log(`[Seed] ${types.length} question types seeded`);
}

/**
 * Run all type seeds - Chạy tất cả các hàm seed types
 */
async function seedTypes() {
  try {
    // Bắt đầu seed các type
    console.log('[Seed] Đang seed các loại...');

    // Seed APTIS type
    await seedAptisTypes();
    // Seed các kỹ năng
    await seedSkillTypes();
    // Seed các loại câu hỏi
    await seedQuestionTypes();

    // Hoàn tất seed
    console.log('[Seed] Đã seed các loại thành công');
    process.exit(0);
  } catch (error) {
    // Lỗi khi seed
    console.error('[Seed] Lỗi khi seed các loại:', error);
    process.exit(1);
  }
}

// Chạy nếu file được gọi trực tiếp
if (require.main === module) {
  seedTypes();
}

module.exports = seedTypes;
