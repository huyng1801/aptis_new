const {
  ExamAttempt,
  AttemptAnswer,
  AnswerAiFeedback,
  AttemptSection,
  ExamSection,
  ExamSectionQuestion,
  Question,
  QuestionType,
  QuestionItem,
  SkillType,
  Exam,
} = require('../../models');
const { NotFoundError } = require('../../utils/errors');

/**
 * Get attempt results
 */
exports.getResults = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.user.userId;

    const attempt = await ExamAttempt.findOne({
      where: { id: attemptId, student_id: studentId },
      include: [
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'title', 'total_score', 'duration_minutes'],
        },
        {
          model: AttemptSection,
          as: 'sections',
          include: [
            {
              model: ExamSection,
              as: 'examSection',
              include: [
                {
                  model: SkillType,
                  as: 'skillType',
                  attributes: ['id', 'code', 'skill_type_name'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!attempt) {
      throw new NotFoundError('Attempt not found');
    }

    // Calculate section scores and max scores
    const answers = await AttemptAnswer.findAll({
      where: { attempt_id: attemptId },
      include: [
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'content'],
          include: [
            {
              model: QuestionType,
              as: 'questionType',
              attributes: ['id', 'code', 'question_type_name', 'scoring_method'],
            },
          ],
        },
      ],
    });

    // Get section questions with max scores
    const sectionScores = {};
    for (const section of attempt.sections) {
      // Get all questions for this section
      const sectionQuestions = await ExamSectionQuestion.findAll({
        where: { exam_section_id: section.exam_section_id },
        attributes: ['question_id', 'max_score'],
      });

      // Calculate section max score
      const sectionMaxScore = sectionQuestions.reduce((sum, sq) => {
        return sum + parseFloat(sq.max_score || 0);
      }, 0);

      // Get answers for this section's questions
      const questionIds = sectionQuestions.map(sq => sq.question_id);
      const sectionAnswers = answers.filter(a => questionIds.includes(a.question_id));

      // Calculate section score
      const sectionScore = sectionAnswers.reduce((sum, a) => {
        const score = a.final_score !== null ? a.final_score : a.score || 0;
        return sum + parseFloat(score);
      }, 0);

      sectionScores[section.exam_section_id] = {
        section: {
          ...section.examSection.toJSON(),
          section_max_score: Math.round(sectionMaxScore * 100) / 100,
        },
        score: Math.round(sectionScore * 100) / 100,
      };
    }

    // Get all answers with AI feedbacks for detailed results
    const answersWithFeedback = await AttemptAnswer.findAll({
      where: { attempt_id: attemptId },
      attributes: ['id', 'question_id', 'answer_type', 'selected_option_id', 'answer_json', 'text_answer', 'audio_url', 'transcribed_text', 'score', 'max_score', 'ai_feedback', 'ai_graded_at', 'final_score', 'manual_feedback', 'needs_review', 'answered_at'],
      include: [
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'content', 'media_url'],
          include: [
            {
              model: QuestionType,
              as: 'questionType',
              attributes: ['id', 'code', 'question_type_name', 'scoring_method'],
              include: [
                {
                  model: SkillType,
                  as: 'skillType',
                  attributes: ['id', 'code', 'skill_type_name'],
                },
              ],
            },
          ],
        },
        {
          model: AnswerAiFeedback,
          as: 'aiFeedbacks',
          attributes: ['id', 'answer_id', 'score', 'comment', 'strengths', 'weaknesses', 'suggestions', 'cefr_level']
        },
      ],
    });

    console.log('[Results API] Got answers:', answersWithFeedback.length);

    // Count answers by type for accurate question counting
    let totalQuestionsCount = 0;
    let answeredQuestionsCount = 0;

    for (const answer of answers) {
      const questionType = answer.question?.questionType?.code;
      
      // For matching questions, count individual items, not the question itself
      if (questionType === 'READING_MATCHING' || questionType === 'LISTENING_MATCHING') {
        // Get the number of items for this matching question
        const matchingItems = await QuestionItem.count({
          where: { question_id: answer.question_id }
        });
        
        totalQuestionsCount += matchingItems;
        
        // Check if answer exists (for matching, check if answer_json is not empty)
        if (answer.answer_json) {
          try {
            const answerData = typeof answer.answer_json === 'string' 
              ? JSON.parse(answer.answer_json) 
              : answer.answer_json;
            
            const matches = answerData.matches || answerData || {};
            const answeredItems = Object.keys(matches).filter(key => matches[key]).length;
            answeredQuestionsCount += answeredItems;
          } catch (e) {
            // If parsing fails, assume no answers
            console.warn('Failed to parse matching answer JSON:', e);
          }
        }
      } else {
        // For regular questions, count normally
        totalQuestionsCount += 1;
        
        if (answer.selected_option_id || answer.text_answer || answer.audio_url) {
          answeredQuestionsCount += 1;
        }
      }
    }

    res.json({
      success: true,
      data: {
        attempt,
        sectionScores,
        answers: answersWithFeedback,
        totalScore: attempt.total_score,
        status: attempt.status,
        questions_count: totalQuestionsCount,
        answered_questions: answeredQuestionsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get answer feedback details
 */
exports.getAnswerFeedback = async (req, res, next) => {
  try {
    const { attemptId, answerId } = req.params;
    const studentId = req.user.userId;

    // Verify attempt belongs to student
    const attempt = await ExamAttempt.findOne({
      where: { id: attemptId, student_id: studentId },
    });

    if (!attempt) {
      throw new NotFoundError('Attempt not found');
    }

    const answer = await AttemptAnswer.findOne({
      where: { id: answerId, attempt_id: attemptId },
      include: [
        {
          model: Question,
          as: 'question',
          include: [
            {
              model: QuestionType,
              as: 'questionType',
            },
          ],
        },
        {
          model: AnswerAiFeedback,
          as: 'aiFeedbacks',
        },
      ],
    });

    if (!answer) {
      throw new NotFoundError('Answer not found');
    }

    res.json({
      success: true,
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};
