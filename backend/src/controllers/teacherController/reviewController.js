const {
  AttemptAnswer,
  AnswerAiFeedback,
  ExamAttempt,
  Exam,
  ExamSection,
  Question,
  QuestionType,
  SkillType,
  User,
  sequelize,
} = require('../../models');
const { paginate, paginationResponse } = require('../../utils/helpers');
const { NotFoundError } = require('../../utils/errors');
const { Op } = require('sequelize');

exports.getPendingReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, exam_id, student_id } = req.query;
    const { offset, limit: validLimit } = paginate(page, limit);

    const where = { needs_review: true };

    if (exam_id) {
      const attempts = await ExamAttempt.findAll({
        where: { exam_id },
        attributes: ['id'],
      });
      where.attempt_id = attempts.map((a) => a.id);
    }

    if (student_id) {
      const attempts = await ExamAttempt.findAll({
        where: { student_id },
        attributes: ['id'],
      });
      where.attempt_id = attempts.map((a) => a.id);
    }

    const { count, rows } = await AttemptAnswer.findAndCountAll({
      where,
      include: [
        {
          model: ExamAttempt,
          as: 'attempt',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'full_name', 'email'],
            },
          ],
        },
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
      offset,
      limit: validLimit,
      order: [['answered_at', 'DESC']],
    });

    res.json({
      success: true,
      ...paginationResponse(rows, parseInt(page), validLimit, count),
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnswerForReview = async (req, res, next) => {
  try {
    const { answerId } = req.params;

    const answer = await AttemptAnswer.findByPk(answerId, {
      include: [
        {
          model: ExamAttempt,
          as: 'attempt',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'full_name', 'email'],
            },
          ],
        },
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

exports.submitReview = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const { final_score, manual_feedback, override_ai } = req.body;
    const teacherId = req.user.userId;

    const answer = await AttemptAnswer.findByPk(answerId);

    if (!answer) {
      throw new NotFoundError('Answer not found');
    }

    await answer.update({
      final_score: override_ai ? final_score : answer.score || final_score,
      manual_feedback,
      reviewed_by: teacherId,
      reviewed_at: new Date(),
      needs_review: false,
    });

    // Update attempt total score
    const attempt = await ExamAttempt.findByPk(answer.attempt_id);
    const allAnswers = await AttemptAnswer.findAll({
      where: { attempt_id: answer.attempt_id },
    });

    const totalScore = allAnswers.reduce((sum, a) => {
      const score = a.final_score !== null ? a.final_score : a.score || 0;
      return sum + parseFloat(score);
    }, 0);

    await attempt.update({ total_score: Math.round(totalScore * 100) / 100 });

    res.json({
      success: true,
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

exports.getReviewsByExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const { offset, limit: validLimit } = paginate(page, limit);

    const attempts = await ExamAttempt.findAll({
      where: { exam_id: examId },
      attributes: ['id'],
    });

    const attemptIds = attempts.map((a) => a.id);

    const { count, rows } = await AttemptAnswer.findAndCountAll({
      where: {
        attempt_id: attemptIds,
        needs_review: true,
      },
      include: [
        {
          model: ExamAttempt,
          as: 'attempt',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'full_name', 'email'],
            },
          ],
        },
        {
          model: Question,
          as: 'question',
        },
      ],
      offset,
      limit: validLimit,
      order: [['answered_at', 'DESC']],
    });

    res.json({
      success: true,
      ...paginationResponse(rows, parseInt(page), validLimit, count),
    });
  } catch (error) {
    next(error);
  }
};

exports.getSubmissions = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      answer_type, 
      needs_review, 
      exam_id,
      student_id,
      skill_type,
      grading_status,
      has_ai_feedback,
      score_range_min,
      score_range_max,
      date_from,
      date_to
    } = req.query;
    const { offset, limit: validLimit } = paginate(page, limit);

    const where = {};
    if (answer_type) {
      where.answer_type = answer_type;
    } else {
      where.answer_type = ['text', 'audio'];
    }
    if (needs_review !== undefined) {
      where.needs_review = needs_review === 'true';
    }

    if (grading_status) {
      switch (grading_status) {
        case 'ungraded':
          where.score = null;
          break;
        case 'ai_graded':
          where.ai_graded_at = { [Op.ne]: null };
          where.reviewed_at = null;
          break;
        case 'manually_graded':
          where.reviewed_at = { [Op.ne]: null };
          break;
        case 'needs_review':
          where.needs_review = true;
          break;
      }
    }

    if (has_ai_feedback !== undefined) {
      if (has_ai_feedback === 'true') {
        where.ai_feedback = { [Op.ne]: null };
      } else {
        where.ai_feedback = null;
      }
    }

    if (score_range_min !== undefined || score_range_max !== undefined) {
      where.final_score = {};
      if (score_range_min !== undefined) {
        where.final_score[Op.gte] = parseFloat(score_range_min);
      }
      if (score_range_max !== undefined) {
        where.final_score[Op.lte] = parseFloat(score_range_max);
      }
    }

    if (date_from || date_to) {
      where.answered_at = {};
      if (date_from) {
        where.answered_at[Op.gte] = new Date(date_from);
      }
      if (date_to) {
        where.answered_at[Op.lte] = new Date(date_to);
      }
    }

    const attemptWhere = {};
    if (exam_id) {
      attemptWhere.exam_id = parseInt(exam_id);
    }
    if (student_id) {
      attemptWhere.student_id = parseInt(student_id);
    }

    const { count, rows } = await AttemptAnswer.findAndCountAll({
      where,
      include: [
        {
          model: ExamAttempt,
          as: 'attempt',
          where: Object.keys(attemptWhere).length > 0 ? attemptWhere : undefined,
          attributes: ['id', 'student_id', 'exam_id', 'attempt_type', 'selected_skill_id', 'attempt_number', 'start_time', 'end_time', 'status', 'total_score'],
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'full_name', 'email', 'avatar_url'],
            },
            {
              model: Exam,
              as: 'exam',
              attributes: ['id', 'title'],
            },
            {
              model: SkillType,
              as: 'selectedSkill',
              attributes: ['id', 'code', 'skill_type_name'],
              required: true, // Luôn require skill để filter
              where: skill_type ? { code: skill_type } : {
                code: { [Op.in]: ['WRITING', 'SPEAKING'] } // Mặc định chỉ lấy Writing & Speaking
              },
            },
          ],
        },
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'content', 'difficulty'],
          include: [
            {
              model: QuestionType,
              as: 'questionType',
              attributes: ['id', 'code', 'question_type_name'],
            },
          ],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'full_name'],
          required: false,
        },
      ],
      offset,
      limit: validLimit,
      order: [['answered_at', 'DESC']],
      subQuery: false,
    });

    const transformedRows = rows.map(row => ({
      ...row.toJSON(),
      grading_status: getGradingStatus(row),
      can_regrade: canRegrade(row),
      has_ai_feedback: !!row.ai_feedback,
      review_priority: getReviewPriority(row),
    }));

    res.json({
      success: true,
      ...paginationResponse(transformedRows, parseInt(page), validLimit, count),
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
function getGradingStatus(answer) {
  if (!answer.score) return 'ungraded';
  if (answer.reviewed_at) return 'manually_graded';
  if (answer.ai_graded_at) return 'ai_graded';
  if (answer.auto_graded_at) return 'auto_graded';
  return 'unknown';
}

function canRegrade(answer) {
  // Can regrade if:
  // 1. Has AI feedback but not manually reviewed
  // 2. Needs review flag is set
  // 3. Has been auto-graded but teacher wants to override
  return !answer.reviewed_at && (
    answer.needs_review || 
    answer.ai_graded_at || 
    answer.auto_graded_at
  );
}

function getReviewPriority(answer) {
  if (answer.needs_review) return 'high';
  if (answer.ai_graded_at && !answer.reviewed_at) return 'medium';
  if (answer.auto_graded_at && !answer.reviewed_at) return 'low';
  return 'none';
}

/**
 * Get submission detail for review
 */
exports.getSubmissionDetail = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    const attempt = await ExamAttempt.findByPk(attemptId, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'full_name', 'email', 'avatar_url'],
        },
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'title', 'description'],
        },
      ],
    });

    if (!attempt) {
      throw new NotFoundError('Attempt not found');
    }

    // Get all answers for this attempt
    const answers = await AttemptAnswer.findAll({
      where: { attempt_id: attemptId },
      include: [
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'content', 'difficulty', 'question_type_id'],
          include: [
            {
              model: QuestionType,
              as: 'questionType',
              attributes: ['id', 'question_type_name'],
            },
          ],
        },
        {
          model: AnswerAiFeedback,
          as: 'aiFeedbacks',
        },
      ],
      order: [['id', 'ASC']],
    });

    // Determine skill type from answers
    let skill = 'writing';
    if (answers.length > 0) {
      skill = answers[0].answer_type === 'audio' ? 'speaking' : 'writing';
    }

    res.json({
      success: true,
      data: {
        id: attempt.id,
        student: attempt.student,
        exam: attempt.exam,
        skill,
        status: attempt.status,
        submitted_at: attempt.submitted_at,
        total_score: attempt.total_score,
        answers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit answer review (individual answer)
 */
exports.submitAnswerReview = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const { scores, feedback, final_score } = req.body;
    const teacherId = req.user.userId;

    const answer = await AttemptAnswer.findByPk(answerId);

    if (!answer) {
      throw new NotFoundError('Answer not found');
    }

    await answer.update({
      final_score: final_score !== undefined ? final_score : answer.score,
      manual_feedback: feedback,
      reviewed_by: teacherId,
      reviewed_at: new Date(),
      needs_review: false,
      // Store detailed scores as JSON
      criteria_scores: scores ? JSON.stringify(scores) : answer.criteria_scores,
    });

    res.json({
      success: true,
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit attempt review (complete attempt)
 */
exports.submitAttemptReview = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { reviewData } = req.body;
    const teacherId = req.user.userId;

    const attempt = await ExamAttempt.findByPk(attemptId);

    if (!attempt) {
      throw new NotFoundError('Attempt not found');
    }

    // Update all answers in this attempt
    const answers = await AttemptAnswer.findAll({
      where: { attempt_id: attemptId },
    });

    for (const answer of answers) {
      await answer.update({
        final_score: reviewData.final_score,
        manual_feedback: reviewData.feedback,
        reviewed_by: teacherId,
        reviewed_at: new Date(),
        needs_review: false,
        criteria_scores: reviewData.scores ? JSON.stringify(reviewData.scores) : answer.criteria_scores,
      });
    }

    // Update attempt total score
    const totalScore = answers.reduce((sum, a) => {
      return sum + (parseFloat(reviewData.final_score) || 0);
    }, 0);

    await attempt.update({ 
      total_score: Math.round(totalScore * 100) / 100,
      status: 'completed',
    });

    res.json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update answer score
 */
exports.updateAnswerScore = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const { score } = req.body;
    const teacherId = req.user.userId;

    const answer = await AttemptAnswer.findByPk(answerId);

    if (!answer) {
      throw new NotFoundError('Answer not found');
    }

    await answer.update({
      final_score: score,
      reviewed_by: teacherId,
      reviewed_at: new Date(),
    });

    res.json({
      success: true,
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Regrade submissions (trigger AI regrading)
 */
exports.regradeSubmissions = async (req, res, next) => {
  try {
    const { answerIds, regradeType = 'ai' } = req.body;
    const teacherId = req.user.userId;

    if (!answerIds || !Array.isArray(answerIds)) {
      return res.status(400).json({
        success: false,
        message: 'Answer IDs array is required',
      });
    }

    const answers = await AttemptAnswer.findAll({
      where: { 
        id: answerIds,
        // Only allow regrading if not manually reviewed or if specifically requested
        [Op.or]: [
          { reviewed_at: null },
          { needs_review: true }
        ]
      },
    });

    if (answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No eligible answers found for regrading',
      });
    }

    const updatePromises = answers.map(answer => {
      const updateData = {
        needs_review: true,
        reviewed_at: null, // Reset manual review
        reviewed_by: null,
      };

      if (regradeType === 'reset') {
        // Complete reset
        updateData.ai_graded_at = null;
        updateData.ai_feedback = null;
        updateData.score = null;
        updateData.final_score = null;
      }

      return answer.update(updateData);
    });

    await Promise.all(updatePromises);

    // TODO: Trigger AI regrading service here
    // await triggerAIRegrading(answerIds);

    res.json({
      success: true,
      message: `Successfully marked ${answers.length} submissions for regrading`,
      data: {
        regradedCount: answers.length,
        regradeType,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update submission status
 */
exports.bulkUpdateStatus = async (req, res, next) => {
  try {
    const { answerIds, status, needsReview } = req.body;
    const teacherId = req.user.userId;

    if (!answerIds || !Array.isArray(answerIds)) {
      return res.status(400).json({
        success: false,
        message: 'Answer IDs array is required',
      });
    }

    const updateData = {};
    
    if (needsReview !== undefined) {
      updateData.needs_review = needsReview;
    }

    if (status === 'reviewed') {
      updateData.reviewed_by = teacherId;
      updateData.reviewed_at = new Date();
      updateData.needs_review = false;
    } else if (status === 'pending') {
      updateData.reviewed_by = null;
      updateData.reviewed_at = null;
      updateData.needs_review = true;
    }

    const [updatedCount] = await AttemptAnswer.update(updateData, {
      where: { id: answerIds },
    });

    res.json({
      success: true,
      message: `Successfully updated ${updatedCount} submissions`,
      data: {
        updatedCount,
        status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get grading statistics
 */
exports.getGradingStats = async (req, res, next) => {
  try {
    const { exam_id, skill_type, date_from, date_to } = req.query;

    const where = {
      answer_type: ['text', 'audio'], // Only writing and speaking
    };

    const attemptWhere = {};
    if (exam_id) {
      attemptWhere.exam_id = parseInt(exam_id);
    }

    if (date_from || date_to) {
      where.answered_at = {};
      if (date_from) where.answered_at[Op.gte] = new Date(date_from);
      if (date_to) where.answered_at[Op.lte] = new Date(date_to);
    }

    const includeOptions = [
      {
        model: ExamAttempt,
        as: 'attempt',
        where: Object.keys(attemptWhere).length > 0 ? attemptWhere : undefined,
        attributes: [],
        include: [
          {
            model: SkillType,
            as: 'selectedSkill',
            where: skill_type ? { code: skill_type } : {
              code: { [Op.in]: ['WRITING', 'SPEAKING'] } // Mặc định chỉ thống kê Writing & Speaking
            },
            attributes: [],
          },
        ],
      },
    ];

    const stats = await AttemptAnswer.findAll({
      where,
      include: includeOptions,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('AttemptAnswer.id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN AttemptAnswer.score IS NULL THEN 1 ELSE 0 END')), 'ungraded'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN AttemptAnswer.ai_graded_at IS NOT NULL AND AttemptAnswer.reviewed_at IS NULL THEN 1 ELSE 0 END')), 'ai_graded'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN AttemptAnswer.reviewed_at IS NOT NULL THEN 1 ELSE 0 END')), 'manually_graded'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN AttemptAnswer.needs_review = 1 THEN 1 ELSE 0 END')), 'needs_review'],
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    next(error);
  }
};
