const {
  Question,
  QuestionType,
  SkillType,
  AptisType,
  QuestionItem,
  QuestionOption,
  ExamSectionQuestion,
} = require('../../models');
const { paginate, paginationResponse } = require('../../utils/helpers');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const { DIFFICULTY_LEVELS, QUESTION_STATUS } = require('../../utils/constants');
const { Op } = require('sequelize');
const StorageService = require('../../services/StorageService');

exports.createQuestion = async (req, res, next) => {
  try {
    const {
      question_type_id,
      aptis_type_id,
      difficulty,
      content,
      media_url,
      duration_seconds,
      items,
      options,
      sample_answer,
    } = req.body;

    const teacherId = req.user.userId;

    const question = await Question.create({
      question_type_id,
      aptis_type_id,
      difficulty,
      content,
      media_url: media_url || null,
      duration_seconds: duration_seconds || null,
      created_by: teacherId,
      status: 'draft',
    });

    if (items && items.length > 0) {
      for (const item of items) {
        await QuestionItem.create({
          question_id: question.id,
          item_text: item.item_text,
          item_order: item.item_order,
        });
      }
    }

    if (options && options.length > 0) {
      for (const option of options) {
        await QuestionOption.create({
          question_id: question.id,
          item_id: option.item_id || null,
          option_text: option.option_text,
          option_order: option.option_order || null,
          is_correct: option.is_correct || false,
        });
      }
    }

    const fullQuestion = await Question.findByPk(question.id, {
      include: [
        { model: QuestionType, as: 'questionType' },
        { model: AptisType, as: 'aptisType' },
        { model: QuestionItem, as: 'items' },
        { model: QuestionOption, as: 'options' },
      ],
    });

    res.status(201).json({
      success: true,
      data: fullQuestion,
    });
  } catch (error) {
    next(error);
  }
};

exports.getQuestions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      question_type,
      aptis_type,
      skill,
      difficulty,
      status,
      search,
    } = req.query;
    const { offset, limit: validLimit } = paginate(page, limit);


    const where = {};

    if (question_type) {
      where.question_type_id = question_type;
    }
    if (aptis_type) {
      where.aptis_type_id = aptis_type;
    }
    if (difficulty) {
      where.difficulty = difficulty;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.content = { [Op.like]: `%${search}%` };
    }

    const include = [
      { 
        model: QuestionType, 
        as: 'questionType', 
        attributes: ['id', 'question_type_name', 'code'],
        include: [
          {
            model: SkillType,
            as: 'skillType',
            attributes: ['id', 'skill_type_name', 'code']
          }
        ]
      },
      { model: AptisType, as: 'aptisType', attributes: ['id', 'aptis_type_name', 'code'] },
    ];

    let finalWhere = where;
    if (skill) {
      include[0].where = { skill_type_id: skill };
      include[0].required = true; // INNER JOIN to enforce the filter
    }


    const { count, rows } = await Question.findAndCountAll({
      where: finalWhere,
      include,
      offset,
      limit: validLimit,
      order: [['created_at', 'DESC']],
      raw: false,
      distinct: true, // Important for counting with joins
    });

    const transformedRows = await Promise.all(rows.map(async (question) => {
      // Get count of exams this question is used in
      const usageCount = await ExamSectionQuestion.count({
        where: { question_id: question.id }
      });

      return {
        id: question.id,
        title: question.content?.substring(0, 100) || 'Untitled Question',
        description: question.content?.substring(0, 200) || '',
        content: question.content,
        question_type: question.questionType?.question_type_name || 'Unknown',
        question_type_id: question.question_type_id,
        skill: question.questionType?.skillType?.skill_type_name || 'General',
        skill_id: question.questionType?.skillType?.id,
        difficulty: question.difficulty,
        aptis_type: question.aptisType?.aptis_type_name || 'Unknown',
        aptis_type_id: question.aptis_type_id,
        media_url: question.media_url,
        duration_seconds: question.duration_seconds,
        status: question.status,
        usage_count: usageCount,
        is_used_in_exam: usageCount > 0,
        created_at: question.created_at,
        updated_at: question.updated_at,
      };
    }));

    res.json({
      success: true,
      data: transformedRows,
      page: parseInt(page),
      limit: validLimit,
      total: count,
      totalPages: Math.ceil(count / validLimit),
    });
  } catch (error) {
    next(error);
  }
};

exports.getQuestionDetails = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findByPk(questionId, {
      include: [
        { model: QuestionType, as: 'questionType' },
        { model: AptisType, as: 'aptisType' },
        { model: QuestionItem, as: 'items' },
        { model: QuestionOption, as: 'options' },
      ],
    });

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const updateData = req.body;

    const question = await Question.findByPk(questionId);

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    const usage = await ExamSectionQuestion.count({
      where: { question_id: questionId },
    });

    if (usage > 0 && question.status === 'active') {
      throw new BadRequestError('Cannot update question that is used in active exams');
    }

    await question.update(updateData);

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findByPk(questionId);

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    const usage = await ExamSectionQuestion.count({
      where: { question_id: questionId },
    });

    if (usage > 0) {
      throw new BadRequestError('Cannot delete question that is used in exams');
    }

    if (question.media_url) {
      await StorageService.deleteFile(question.media_url);
    }

    await question.destroy();

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getQuestionUsage = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const { ExamSection, Exam } = require('../../models');
    const usage = await ExamSectionQuestion.findAll({
      where: { question_id: questionId },
      include: [
        {
          model: ExamSection,
          as: 'examSection',
          include: [
            {
              model: Exam,
              as: 'exam',
              attributes: ['id', 'title', 'status'],
            },
          ],
        },
      ],
    });

    res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFilterOptions = async (req, res, next) => {
  try {
    const questionTypes = await QuestionType.findAll({
      attributes: ['id', 'question_type_name', 'code'],
      order: [['question_type_name', 'ASC']],
    });

    const aptisTypes = await AptisType.findAll({
      attributes: ['id', 'aptis_type_name', 'code'],
      order: [['aptis_type_name', 'ASC']],
    });

    const skillTypes = await SkillType.findAll({
      attributes: ['id', 'skill_type_name', 'code'],
      order: [['display_order', 'ASC']],
    });

    const difficulties = [
      { value: DIFFICULTY_LEVELS.EASY, label: 'Dễ' },
      { value: DIFFICULTY_LEVELS.MEDIUM, label: 'Trung bình' },
      { value: DIFFICULTY_LEVELS.HARD, label: 'Khó' }
    ];

    const statuses = [
      { value: QUESTION_STATUS.DRAFT, label: 'Bản nháp' },
      { value: QUESTION_STATUS.ACTIVE, label: 'Hoạt động' },
      { value: QUESTION_STATUS.INACTIVE, label: 'Không hoạt động' }
    ];

    const filterOptions = {
      aptisTypes: aptisTypes.map(type => ({
        value: type.id,
        label: type.aptis_type_name
      })),
      questionTypes: questionTypes.map(type => ({
        value: type.id,
        label: type.question_type_name
      })),
      skills: skillTypes.map(skill => ({
        value: skill.id,
        label: skill.skill_type_name
      })),
      difficulties,
      statuses
    };

    res.json({
      success: true,
      data: filterOptions,
    });
  } catch (error) {
    next(error);
  }
};
