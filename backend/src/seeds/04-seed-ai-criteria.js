require('dotenv').config();
const { AiScoringCriteria, AptisType, QuestionType, User } = require('../models');

/**
 * Seed AI scoring criteria - Tạo tiêu chí chấm điểm AI cho các bài thi
 * Based on APTIS Technical Report with CEFR-aligned assessment scales
 */

// ========================================
// Helper function - Load references
// ========================================
async function loadReferences() {
  const adminUser = await User.findOne({ where: { email: 'admin@aptis.local' } });
  if (!adminUser) {
    throw new Error('Không tìm thấy tài khoản admin. Vui lòng chạy seed:users trước.');
  }

  const aptisGeneral = await AptisType.findOne({ where: { code: 'APTIS_GENERAL' } });
  
  const questionTypes = {};
  const codes = [
    'WRITING_SHORT', 'WRITING_FORM', 'WRITING_LONG', 'WRITING_EMAIL',
    'SPEAKING_INTRO', 'SPEAKING_DESCRIPTION', 'SPEAKING_COMPARISON', 'SPEAKING_DISCUSSION'
  ];
  
  for (const code of codes) {
    questionTypes[code] = await QuestionType.findOne({ where: { code } });
  }

  return { adminUser, aptisGeneral, questionTypes };
}

// ========================================
// Writing Criteria Builders
// ========================================
function buildWritingCriteria(adminId, aptisId, questionTypes) {
  return [
    // Task 1 - Word-level Writing (0-3 scale)
    {
      aptis_type_id: aptisId,
      question_type_id: questionTypes.WRITING_SHORT.id,
      criteria_name: 'Task Fulfilment and Communicative Competence',
      created_by: adminId,
      rubric_prompt: `APTIS Writing Part 1 - Word-level writing (0-3 scale):

3 (above A1): Fully intelligible responses for all five questions. Test-taker completely achieves the task.

2 (A1.2): Three or four of the responses are intelligible. Errors impede understanding in one or two responses.

1 (A1.1): One or two of the responses are intelligible. Errors impede understanding in two or three responses.

0 (A0): No intelligible responses.

Assessment focus: Simple word/phrase completion with appropriate vocabulary for basic information gaps.`,
    },

    // Task 2 - Short Text Writing (0-5 scale, 20-30 words)
    {
      aptis_type_id: aptisId,
      question_type_id: questionTypes.WRITING_FORM.id,
      criteria_name: 'Task Fulfilment and Topic Relevance',
      created_by: adminId,
      rubric_prompt: `APTIS Writing Part 2 - Short text writing (0-5 scale):

5 (B1 or above): Likely to be above A2 level.

4 (A2.2): On topic. Uses simple grammatical structures to produce writing at sentence level. Errors with basic structures common but do not impede understanding. Mostly accurate punctuation and spelling. Vocabulary sufficient. Some attempts at simple connectors and cohesive devices.

3 (A2.1): On topic. Uses simple grammatical structures at sentence level. Errors with basic structures common and impede understanding in parts. Punctuation and spelling mistakes noticeable. Vocabulary mostly sufficient but inappropriate lexical choices noticeable. Response is list of sentences with no connectors.

2 (A1.2): Not fully on topic. Grammatical structure limited to words and phrases. Errors impede understanding. Little accurate punctuation. Vocabulary limited to basic personal information and insufficient. No cohesion.

1 (A1.1): Response limited to few words/phrases. Grammar and vocabulary errors so serious meaning is unintelligible.

0 (A0): No meaningful language or completely off-topic.

Areas assessed: Task fulfilment/topic relevance, grammatical range and accuracy, punctuation, vocabulary range and accuracy, cohesion.`,
    },

    // Task 3 - Three Written Responses (0-5 scale, 30-40 words each)
    {
      aptis_type_id: aptisId,
      question_type_id: questionTypes.WRITING_LONG.id,
      criteria_name: 'Task Fulfilment and Language Control',
      created_by: adminId,
      rubric_prompt: `APTIS Writing Part 3 - Three written responses (0-5 scale):

5 (B2 or above): Likely to be above B1 level.

4 (B1.2): Responses to all three questions on topic. Control of simple grammatical structures. Errors when attempting complex structures. Punctuation and spelling mostly accurate, errors don't impede understanding. Vocabulary sufficient. Uses simple cohesive devices to organise as linear sequence.

3 (B1.1): Responses to two questions on topic with same language features as B1.2.

2 (A2.2): Responses to at least two questions on topic. Uses simple grammatical structures at sentence level. Errors common and sometimes impede understanding. Punctuation/spelling mistakes noticeable. Vocabulary insufficient, inappropriate choices impede understanding. Responses are lists, not cohesive texts.

1 (A2.1): Response to one question on topic with same language features as A2.2.

0: Performance below A2, no meaningful language, or completely off-topic.

Areas assessed: Task fulfilment/topic relevance, punctuation, grammatical range and accuracy, vocabulary range and accuracy, cohesion.`,
    },

    // Task 4 - Formal and Informal Writing (0-6 scale)
    {
      aptis_type_id: aptisId,
      question_type_id: questionTypes.WRITING_EMAIL.id,
      criteria_name: 'Task Achievement and Register Control',
      created_by: adminId,
      rubric_prompt: `APTIS Writing Part 4 - Formal and informal writing (0-6 scale):

6 (C2): Likely to be above C1 level.

5 (C1): Features as B2.2 but higher proficiency level.

4 (B2.2): Response on topic, task fulfilled with appropriate register. Two clearly different registers. Range of complex grammar used accurately, minor errors don't impede understanding. Range of vocabulary, some awkward usage. Range of cohesive devices clearly indicate links.

3 (B2.1): Response partially on topic, task partially fulfilled: appropriate register used consistently in ONE response. Some complex grammar used accurately, errors don't lead to misunderstanding. Minor punctuation/spelling errors don't impede understanding. Sufficient vocabulary range. Limited cohesive devices.

2 (B1.2): Response partially on topic, task NOT fulfilled: appropriate register not used consistently in either response. Control of simple grammatical structures, errors when attempting complex. Punctuation/spelling mostly accurate. Vocabulary limitations make task difficult, errors impede understanding in parts. Only simple cohesive devices.

1 (B1.1): Response not on topic, task not fulfilled. No evidence of register awareness. Same language features as B1.2 but errors impede understanding in most of text.

0 (A1/A2): Performance below B1, no meaningful language, or completely off-topic.

Key focus: Register control between informal (friend) and formal (unknown person) writing. Word counts: 40-50 words informal, 120-150 words formal.`,
    },
  ];
}

// ========================================
// Speaking Criteria Builders
// ========================================
function buildSpeakingCriteria(adminId, aptisId, questionTypes) {
  return [
    // Task 1 - Personal Information (0-5 scale)
    {
      aptis_type_id: aptisId,
      question_type_id: questionTypes.SPEAKING_INTRO.id,
      criteria_name: 'Personal Information Speaking Assessment',
      created_by: adminId,
      rubric_prompt: `APTIS Speaking Part 1 - Personal information (0-5 scale):

5 (B1 or above): Likely to be above A2 level.

4 (A2.2): Responses to all three questions on topic. Some simple grammatical structures used correctly but basic mistakes systematically occur. Vocabulary sufficient although inappropriate lexical choices noticeable. Mispronunciations noticeable and frequently strain listener. Frequent pausing, false starts and reformulations but meaning still clear.

3 (A2.1): Responses to two questions on topic with same language features as A2.2.

2 (A1.2): Responses to at least two questions on topic. Grammatical structure limited to words and phrases. Errors in basic patterns impede understanding. Vocabulary limited to very basic words related to personal information. Pronunciation mostly unintelligible except isolated words. Frequent pausing impedes understanding.

1 (A1.1): Response to one question on topic with same language features as A1.2.

0 (A0): No meaningful language or all responses completely off-topic.

Areas assessed: Task fulfilment/topic relevance, grammatical range and accuracy, vocabulary range and accuracy, pronunciation, fluency.
Time limit: 30 seconds per question (3 questions total).`,
    },

    // Task 2 - Describe, Express Opinion (0-5 scale, same scale as Task 3)
    {
      aptis_type_id: aptisId,
      question_type_id: questionTypes.SPEAKING_DESCRIPTION.id,
      criteria_name: 'APTIS Speaking Scale for Parts 2&3',
      created_by: adminId,
      rubric_prompt: `APTIS Speaking Parts 2&3 - Describe/Compare (0-5 scale):

5 (B2 or above): Likely to be above B1 level.

4 (B1.2): Responses to all three questions on topic. Control of simple grammatical structures, errors when attempting complex structures. Sufficient range and control of vocabulary for task, errors when expressing complex thoughts. Pronunciation intelligible but inappropriate mispronunciations occasionally strain listener. Some pausing, false starts and reformulations. Uses only simple cohesive devices, links not always clearly indicated.

3 (B1.1): Responses to two questions on topic with same language features as B1.2.

2 (A2.2): Responses to at least two questions on topic. Uses some simple grammatical structures correctly but systematically makes basic mistakes. Vocabulary limited to concrete topics and descriptions, inappropriate lexical choices noticeable. Mispronunciations noticeable and strain listener. Noticeable pausing, false starts and reformulations. Cohesion limited, responses tend to be list of points.

1 (A2.1): Response to one question on topic with same language features as A2.2.

0: Performance below A2, no meaningful language, or completely off-topic.

Areas assessed: Task fulfilment/topic relevance, grammatical range and accuracy, vocabulary range and accuracy, pronunciation, fluency and cohesion.
Time limit: 45 seconds per question (3 questions total).`,
    },

    // Task 3 - Compare and Provide Reasons (0-5 scale, SAME as Task 2)
    {
      aptis_type_id: aptisId,
      question_type_id: questionTypes.SPEAKING_COMPARISON.id,
      criteria_name: 'APTIS Speaking Scale for Parts 2&3',
      created_by: adminId,
      rubric_prompt: `APTIS Speaking Parts 2&3 - Describe/Compare (0-5 scale):

5 (B2 or above): Likely to be above B1 level.

4 (B1.2): Responses to all three questions on topic. Control of simple grammatical structures, errors when attempting complex structures. Sufficient range and control of vocabulary for task, errors when expressing complex thoughts. Pronunciation intelligible but inappropriate mispronunciations occasionally strain listener. Some pausing, false starts and reformulations. Uses only simple cohesive devices, links not always clearly indicated.

3 (B1.1): Responses to two questions on topic with same language features as B1.2.

2 (A2.2): Responses to at least two questions on topic. Uses some simple grammatical structures correctly but systematically makes basic mistakes. Vocabulary limited to concrete topics and descriptions, inappropriate lexical choices noticeable. Mispronunciations noticeable and strain listener. Noticeable pausing, false starts and reformulations. Cohesion limited, responses tend to be list of points.

1 (A2.1): Response to one question on topic with same language features as A2.2.

0: Performance below A2, no meaningful language, or completely off-topic.

Areas assessed: Task fulfilment/topic relevance, grammatical range and accuracy, vocabulary range and accuracy, pronunciation, fluency and cohesion.
Time limit: 45 seconds per question (3 questions total).`,
    },

    // Task 4 - Abstract Topic Discussion (0-6 scale)
    {
      aptis_type_id: aptisId,
      question_type_id: questionTypes.SPEAKING_DISCUSSION.id,
      criteria_name: 'Abstract Topic Discussion Assessment',
      created_by: adminId,
      rubric_prompt: `APTIS Speaking Part 4 - Abstract topic discussion (0-6 scale):

6 (C2): Likely to be above C1 level.

5 (C1): Features as B2.2 but at higher proficiency level.

4 (B2.2): Response addresses all three questions and is well-structured. Uses range of complex grammar constructions accurately, minor errors don't impede understanding. Uses range of vocabulary to discuss topics, some awkward usage. Pronunciation clearly intelligible. Backtracking and reformulations don't fully interrupt flow. Range of cohesive devices clearly indicate links.

3 (B2.1): Responses to two questions on topic. Some complex grammar constructions used accurately, errors don't lead to misunderstanding. Sufficient vocabulary range, inappropriate choices don't lead to misunderstanding. Pronunciation intelligible, mispronunciations don't strain listener. Some pausing while searching for vocabulary doesn't strain listener. Limited cohesive devices indicate links.

2 (B1.2): Responses to at least two questions on topic. Control of simple grammatical structures, errors when attempting complex. Vocabulary limitations make task difficult. Pronunciation intelligible but occasional mispronunciations strain listener. Noticeable pausing, false starts, reformulations and repetition. Uses only simple cohesive devices, links not always clearly indicated.

1 (B1.1): Response to one question on topic with same language features as B1.2.

0 (A1/A2): Performance below B1, no meaningful language, or completely off-topic.

Format: 1 minute preparation + 2 minutes response time for all three questions together.
Areas assessed: Task fulfilment/topic relevance, grammatical range and accuracy, vocabulary range and accuracy, pronunciation, fluency and cohesion.`,
    },
  ];
}

// ========================================
// Main seed function
// ========================================
async function seedAiCriteria() {
  try {
    console.log('[Seed] Seeding AI scoring criteria...');

    const { adminUser, aptisGeneral, questionTypes } = await loadReferences();

    // Build all criteria
    const writingCriteria = buildWritingCriteria(adminUser.id, aptisGeneral.id, questionTypes);
    const speakingCriteria = buildSpeakingCriteria(adminUser.id, aptisGeneral.id, questionTypes);
    const allCriteria = [...writingCriteria, ...speakingCriteria];

    // Seed to database
    for (const criterion of allCriteria) {
      await AiScoringCriteria.findOrCreate({
        where: {
          aptis_type_id: criterion.aptis_type_id,
          question_type_id: criterion.question_type_id,
          criteria_name: criterion.criteria_name,
        },
        defaults: criterion,
      });
    }

    console.log(`[Seed] ✓ Created ${allCriteria.length} AI scoring criteria`);
    console.log('[Seed] ✓ AI scoring criteria seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] ✗ Error seeding AI criteria:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedAiCriteria();
}

module.exports = seedAiCriteria;
