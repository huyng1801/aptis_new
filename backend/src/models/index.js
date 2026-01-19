const { sequelize, Sequelize } = require('../config/database');

/**
 * Tệp index.js - Tổ chức tất cả các model và define các mối quan hệ
 * Các bước:
 * 1. Import tất cả các model
 * 2. Define các association (hasMany, belongsTo, hasOne...)
 * 3. Export sequelize và tất cả model để sử dụng ở các nơi khác
 */

// Bước 1: Import tất cả các model từ các file riêng
const User = require('./User');
const AptisType = require('./AptisType');
const SkillType = require('./SkillType');
const QuestionType = require('./QuestionType');
const Question = require('./Question');
const QuestionItem = require('./QuestionItem');
const QuestionOption = require('./QuestionOption');
const AiScoringCriteria = require('./AiScoringCriteria');
const Exam = require('./Exam');
const ExamSection = require('./ExamSection');
const ExamSectionQuestion = require('./ExamSectionQuestion');
const ExamAttempt = require('./ExamAttempt');
const AttemptSection = require('./AttemptSection');
const AttemptAnswer = require('./AttemptAnswer');
const AnswerAiFeedback = require('./AnswerAiFeedback');

/**
 * Bước 2: Define các association (mối quan hệ giữa các model)
 */

// QuestionType thuộc SkillType (mỗi loại câu hỏi thuộc một kỹ năng)
QuestionType.belongsTo(SkillType, {
  foreignKey: 'skill_type_id',
  as: 'skillType',
});
SkillType.hasMany(QuestionType, {
  foreignKey: 'skill_type_id',
  as: 'questionTypes',
});

// Question thuộc QuestionType, AptisType, và User
Question.belongsTo(QuestionType, {
  foreignKey: 'question_type_id',
  as: 'questionType',
});
Question.belongsTo(AptisType, {
  foreignKey: 'aptis_type_id',
  as: 'aptisType',
});
Question.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

QuestionType.hasMany(Question, {
  foreignKey: 'question_type_id',
  as: 'questions',
});
AptisType.hasMany(Question, {
  foreignKey: 'aptis_type_id',
  as: 'questions',
});
User.hasMany(Question, {
  foreignKey: 'created_by',
  as: 'createdQuestions',
});

// QuestionItem thuộc Question (mục câu hỏi)
QuestionItem.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question',
});
Question.hasMany(QuestionItem, {
  foreignKey: 'question_id',
  as: 'items',
});

// QuestionOption thuộc Question và QuestionItem (lựa chọn cho câu hỏi hoặc mục)
QuestionOption.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question',
});
QuestionOption.belongsTo(QuestionItem, {
  foreignKey: 'item_id',
  as: 'item',
});
Question.hasMany(QuestionOption, {
  foreignKey: 'question_id',
  as: 'options',
});
QuestionItem.hasMany(QuestionOption, {
  foreignKey: 'item_id',
  as: 'options',
});



// AiScoringCriteria thuộc AptisType, QuestionType, và User
// (tiêu chí chấm điểm cho kết hợp APTIS type + loại câu hỏi)
AiScoringCriteria.belongsTo(AptisType, {
  foreignKey: 'aptis_type_id',
  as: 'aptisType',
});
AiScoringCriteria.belongsTo(QuestionType, {
  foreignKey: 'question_type_id',
  as: 'questionType',
});
AiScoringCriteria.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

AptisType.hasMany(AiScoringCriteria, {
  foreignKey: 'aptis_type_id',
  as: 'scoringCriteria',
});
QuestionType.hasMany(AiScoringCriteria, {
  foreignKey: 'question_type_id',
  as: 'scoringCriteria',
});
User.hasMany(AiScoringCriteria, {
  foreignKey: 'created_by',
  as: 'createdCriteria',
});

// Exam thuộc AptisType và User
Exam.belongsTo(AptisType, {
  foreignKey: 'aptis_type_id',
  as: 'aptisType',
});
Exam.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

AptisType.hasMany(Exam, {
  foreignKey: 'aptis_type_id',
  as: 'exams',
});
User.hasMany(Exam, {
  foreignKey: 'created_by',
  as: 'createdExams',
});

// ExamSection thuộc Exam và SkillType (mỗi phần thi thuộc một kỳ thi và một kỹ năng)
ExamSection.belongsTo(Exam, {
  foreignKey: 'exam_id',
  as: 'exam',
});
ExamSection.belongsTo(SkillType, {
  foreignKey: 'skill_type_id',
  as: 'skillType',
});

Exam.hasMany(ExamSection, {
  foreignKey: 'exam_id',
  as: 'sections',
});
SkillType.hasMany(ExamSection, {
  foreignKey: 'skill_type_id',
  as: 'examSections',
});

// ExamSectionQuestion thuộc ExamSection và Question
// (mối quan hệ many-to-many giữa phần thi và câu hỏi)
ExamSectionQuestion.belongsTo(ExamSection, {
  foreignKey: 'exam_section_id',
  as: 'examSection',
});
ExamSectionQuestion.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question',
});

ExamSection.hasMany(ExamSectionQuestion, {
  foreignKey: 'exam_section_id',
  as: 'questions',
});
Question.hasMany(ExamSectionQuestion, {
  foreignKey: 'question_id',
  as: 'examSectionQuestions',
});

// ExamAttempt thuộc User, Exam, và SkillType
// (lượt thi của học sinh cho một kỳ thi hoặc một kỹ năng)
ExamAttempt.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student',
});
ExamAttempt.belongsTo(Exam, {
  foreignKey: 'exam_id',
  as: 'exam',
});
ExamAttempt.belongsTo(SkillType, {
  foreignKey: 'selected_skill_id',
  as: 'selectedSkill',
});

User.hasMany(ExamAttempt, {
  foreignKey: 'student_id',
  as: 'examAttempts',
});
Exam.hasMany(ExamAttempt, {
  foreignKey: 'exam_id',
  as: 'attempts',
});
SkillType.hasMany(ExamAttempt, {
  foreignKey: 'selected_skill_id',
  as: 'singleSkillAttempts',
});

// AttemptSection thuộc ExamAttempt và ExamSection
// (từng phần thi mà học sinh tham gia)
AttemptSection.belongsTo(ExamAttempt, {
  foreignKey: 'attempt_id',
  as: 'attempt',
});
AttemptSection.belongsTo(ExamSection, {
  foreignKey: 'exam_section_id',
  as: 'examSection',
});

ExamAttempt.hasMany(AttemptSection, {
  foreignKey: 'attempt_id',
  as: 'sections',
});
ExamSection.hasMany(AttemptSection, {
  foreignKey: 'exam_section_id',
  as: 'attemptSections',
});

// AttemptAnswer thuộc ExamAttempt, Question, QuestionOption, và User
// (câu trả lời của học sinh cho từng câu hỏi)
AttemptAnswer.belongsTo(ExamAttempt, {
  foreignKey: 'attempt_id',
  as: 'attempt',
});
AttemptAnswer.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question',
});
AttemptAnswer.belongsTo(QuestionOption, {
  foreignKey: 'selected_option_id',
  as: 'selectedOption',
});
AttemptAnswer.belongsTo(User, {
  foreignKey: 'graded_by',
  as: 'grader',
});
AttemptAnswer.belongsTo(User, {
  foreignKey: 'reviewed_by',
  as: 'reviewer',
});

ExamAttempt.hasMany(AttemptAnswer, {
  foreignKey: 'attempt_id',
  as: 'answers',
});
Question.hasMany(AttemptAnswer, {
  foreignKey: 'question_id',
  as: 'attemptAnswers',
});
User.hasMany(AttemptAnswer, {
  foreignKey: 'graded_by',
  as: 'gradedAnswers',
});
User.hasMany(AttemptAnswer, {
  foreignKey: 'reviewed_by',
  as: 'reviewedAnswers',
});

// AnswerAiFeedback thuộc AttemptAnswer
// (phản hồi AI cho một câu trả lời)
AttemptAnswer.hasMany(AnswerAiFeedback, {
  foreignKey: 'answer_id',
  as: 'aiFeedbacks',
});

// Sync database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(
      `✅ Database synced successfully ${force ? '(FORCE MODE - All data dropped)' : ''}`,
    );
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  Sequelize,
  syncDatabase,
  // Models
  User,
  AptisType,
  SkillType,
  QuestionType,
  Question,
  QuestionItem,
  QuestionOption,
  AiScoringCriteria,
  Exam,
  ExamSection,
  ExamSectionQuestion,
  ExamAttempt,
  AttemptSection,
  AttemptAnswer,
  AnswerAiFeedback,
};
