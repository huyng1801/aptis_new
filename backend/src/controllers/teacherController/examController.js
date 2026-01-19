const {
  Exam,
  ExamSection,
  ExamSectionQuestion,
  AptisType,
  SkillType,
  Question,
  User,
  ExamAttempt,
} = require('../../models');
const { Op } = require('sequelize');
const { paginate, paginationResponse } = require('../../utils/helpers');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const EmailService = require('../../services/EmailService');

exports.createExam = async (req, res, next) => {
  try {
    const { aptis_type_id, title, description, duration_minutes, total_score } = req.body;
    const teacherId = req.user.userId;

    const exam = await Exam.create({
      aptis_type_id,
      title,
      description: description || null,
      duration_minutes,
      status: 'draft',
      created_by: teacherId,
      total_score: total_score || 0,
    });

    // Get skill types for mapping
    const skillTypes = await SkillType.findAll();
    const skillMap = {};
    skillTypes.forEach(skill => {
      skillMap[skill.skill_type_name] = skill.id;
    });

    // Auto-create default sections for APTIS exam structure
    const defaultSections = [
      // Reading sections
      { skill: 'Reading', part: 1, name: 'Gap Filling', questions: 1, duration: 5, instructions: 'Part 1: Gap Filling: Read carefully and answer all questions.' },
      { skill: 'Reading', part: 2, name: 'Ordering', questions: 2, duration: 10, instructions: 'Part 2: Ordering: Read carefully and answer all questions.' },
      { skill: 'Reading', part: 3, name: 'Matching', questions: 1, duration: 10, instructions: 'Part 3: Matching: Read carefully and answer all questions.' },
      { skill: 'Reading', part: 4, name: 'Matching Headings', questions: 1, duration: 10, instructions: 'Part 4: Matching Headings: Read carefully and answer all questions.' },
      
      // Listening sections
      { skill: 'Listening', part: 1, name: 'Multiple Choice', questions: 13, duration: 10, instructions: 'Part 1: Multiple Choice: Listen carefully and answer all questions.' },
      { skill: 'Listening', part: 2, name: 'Speaker Matching', questions: 1, duration: 10, instructions: 'Part 2: Speaker Matching: Listen carefully and answer all questions.' },
      { skill: 'Listening', part: 3, name: 'Statement Matching', questions: 1, duration: 10, instructions: 'Part 3: Statement Matching: Listen carefully and answer all questions.' },
      { skill: 'Listening', part: 4, name: 'Extended MCQ', questions: 2, duration: 10, instructions: 'Part 4: Extended MCQ: Listen carefully and answer all questions.' },
      
      // Writing sections
      { skill: 'Writing', part: 1, name: 'Form Filling (A1)', questions: 1, duration: 10, instructions: 'Part 1: Form Filling (A1): Follow the instructions carefully and complete within the time limit.' },
      { skill: 'Writing', part: 2, name: 'Short Response (A2)', questions: 1, duration: 10, instructions: 'Part 2: Short Response (A2): Follow the instructions carefully and complete within the time limit.' },
      { skill: 'Writing', part: 3, name: 'Chat Responses (B1)', questions: 1, duration: 10, instructions: 'Part 3: Chat Responses (B1): Follow the instructions carefully and complete within the time limit.' },
      { skill: 'Writing', part: 4, name: 'Email Writing (B2)', questions: 1, duration: 20, instructions: 'Part 4: Email Writing (B2): Follow the instructions carefully and complete within the time limit.' },
      
      // Speaking sections
      { skill: 'Speaking', part: 1, name: 'Personal Introduction', questions: 3, duration: 2, instructions: 'Part 1: Personal Introduction: Record your response clearly within the time limit.' },
      { skill: 'Speaking', part: 2, name: 'Picture Description', questions: 3, duration: 2, instructions: 'Part 2: Picture Description: Record your response clearly within the time limit.' },
      { skill: 'Speaking', part: 3, name: 'Comparison', questions: 3, duration: 2, instructions: 'Part 3: Comparison: Record your response clearly within the time limit.' },
      { skill: 'Speaking', part: 4, name: 'Topic Discussion', questions: 1, duration: 6, instructions: 'Part 4: Topic Discussion: Record your response clearly within the time limit.' }
    ];

    // Create exam sections automatically
    for (let i = 0; i < defaultSections.length; i++) {
      const section = defaultSections[i];
      const skillTypeId = skillMap[section.skill];
      
      if (skillTypeId) {
        await ExamSection.create({
          exam_id: exam.id,
          skill_type_id: skillTypeId,
          section_order: i + 1,
          duration_minutes: section.duration,
          instruction: section.instructions
        });
      }
    }

    const examWithRelations = await Exam.findByPk(exam.id, {
      include: [
        {
          model: AptisType,
          as: 'aptisType',
          attributes: ['id', 'code', 'aptis_type_name', 'description'],
        },
        {
          model: ExamSection,
          as: 'sections',
          include: [
            {
              model: SkillType,
              as: 'skillType',
              attributes: ['id', 'code', 'skill_type_name']
            }
          ]
        }
      ],
    });

    res.status(201).json({
      success: true,
      data: examWithRelations,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const updateData = req.body;

    const exam = await Exam.findByPk(examId);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    if (exam.status === 'published') {
      throw new BadRequestError('Cannot update published exam');
    }

    await exam.update(updateData);

    const updatedExam = await Exam.findByPk(examId, {
      include: [
        {
          model: AptisType,
          as: 'aptisType',
          attributes: ['id', 'code', 'aptis_type_name', 'description'],
        },
      ],
    });

    res.json({
      success: true,
      data: updatedExam,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const teacherId = req.user.userId;

    const exam = await Exam.findByPk(examId);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    if (exam.created_by !== teacherId) {
      throw new BadRequestError('You do not have permission to delete this exam');
    }

    const attemptCount = await ExamAttempt.count({
      where: { exam_id: examId }
    });

    if (attemptCount > 0) {
      throw new BadRequestError(`Cannot delete exam because ${attemptCount} student(s) have already taken this exam`);
    }

    const sections = await ExamSection.findAll({
      where: { exam_id: examId },
      attributes: ['id']
    });

    const sectionIds = sections.map(s => s.id);

    if (sectionIds.length > 0) {
      await ExamSectionQuestion.destroy({
        where: { exam_section_id: { [Op.in]: sectionIds } }
      });
    }

    await ExamSection.destroy({
      where: { exam_id: examId }
    });

    await exam.destroy();

    res.json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.addSection = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { skill_type_id, section_order, duration_minutes, instruction } = req.body;

    const exam = await Exam.findByPk(examId);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    if (exam.status !== 'draft') {
      throw new BadRequestError('Cannot modify published exam');
    }

    const section = await ExamSection.create({
      exam_id: examId,
      skill_type_id,
      section_order,
      duration_minutes: duration_minutes || null,
      instruction: instruction || null,
    });

    res.status(201).json({
      success: true,
      data: section,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSection = async (req, res, next) => {
  try {
    const { examId, sectionId } = req.params;
    const { skill_type_id, duration_minutes, instruction } = req.body;

    const exam = await Exam.findByPk(examId);
    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    if (exam.status !== 'draft') {
      throw new BadRequestError('Cannot modify published exam');
    }

    const section = await ExamSection.findOne({
      where: { id: sectionId, exam_id: examId },
    });

    if (!section) {
      throw new NotFoundError('Section not found');
    }

    await section.update({
      skill_type_id: skill_type_id || section.skill_type_id,
      duration_minutes: duration_minutes || section.duration_minutes,
      instruction: instruction !== undefined ? instruction : section.instruction,
    });

    const updatedSection = await ExamSection.findByPk(sectionId, {
      include: [
        {
          model: SkillType,
          as: 'skillType',
          attributes: ['id', 'code', 'skill_type_name'],
        },
      ],
    });

    res.json({
      success: true,
      data: updatedSection,
    });
  } catch (error) {
    next(error);
  }
};

exports.addQuestionToSection = async (req, res, next) => {
  try {
    const { examId, sectionId } = req.params;
    const { question_id, question_order, max_score } = req.body;

    const section = await ExamSection.findOne({
      where: { id: sectionId, exam_id: examId },
    });

    if (!section) {
      throw new NotFoundError('Section not found');
    }

    const question = await Question.findByPk(question_id);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    const esq = await ExamSectionQuestion.create({
      exam_section_id: sectionId,
      question_id,
      question_order,
      max_score,
    });

    const exam = await Exam.findByPk(examId, {
      include: [
        {
          model: ExamSection,
          as: 'sections',
          include: [
            {
              model: ExamSectionQuestion,
              as: 'questions',
            },
          ],
        },
      ],
    });

    const totalScore = exam.sections.reduce(
      (sum, sec) => sum + sec.questions.reduce((s, q) => s + parseFloat(q.max_score), 0),
      0,
    );

    await exam.update({ total_score: totalScore });

    res.status(201).json({
      success: true,
      data: esq,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeQuestionFromSection = async (req, res, next) => {
  try {
    const { examId, sectionId, questionId } = req.params;

    console.log('[removeQuestionFromSection] Params:', { examId, sectionId, questionId });

    const exam = await Exam.findByPk(examId);
    if (!exam || exam.status !== 'draft') {
      throw new BadRequestError('Cannot modify published exam');
    }

    // Verify that the section belongs to this exam
    const section = await ExamSection.findOne({
      where: {
        id: sectionId,
        exam_id: examId,
      },
    });

    if (!section) {
      console.log('[removeQuestionFromSection] Section not found for exam:', { sectionId, examId });
      throw new NotFoundError('Section not found in this exam');
    }

    const esq = await ExamSectionQuestion.findOne({
      where: {
        exam_section_id: sectionId,
        question_id: questionId,
      },
    });

    if (!esq) {
      console.log('[removeQuestionFromSection] Question not found in section:', { sectionId, questionId });
      throw new NotFoundError('Question not found in section');
    }

    await esq.destroy();

    res.json({
      success: true,
      message: 'Question removed from section',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateQuestionInSection = async (req, res, next) => {
  try {
    const { examId, sectionId, questionId } = req.params;
    const { order_index, points } = req.body;

    const exam = await Exam.findByPk(examId);
    if (!exam || exam.status !== 'draft') {
      throw new BadRequestError('Cannot modify published exam');
    }

    const esq = await ExamSectionQuestion.findOne({
      where: {
        exam_section_id: sectionId,
        question_id: questionId,
      },
    });

    if (!esq) {
      throw new NotFoundError('Question not found in section');
    }

    if (order_index !== undefined) {
      esq.order_index = order_index;
    }
    if (points !== undefined) {
      esq.points = points;
    }

    await esq.save();

    res.json({
      success: true,
      message: 'Question updated in section',
      data: esq,
    });
  } catch (error) {
    next(error);
  }
};

exports.publishExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { notify_students = false } = req.body;

    const exam = await Exam.findByPk(examId, {
      include: [
        {
          model: ExamSection,
          as: 'sections',
          include: [
            {
              model: ExamSectionQuestion,
              as: 'questions',
            },
          ],
        },
      ],
    });

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    if (exam.status === 'published') {
      throw new BadRequestError('Exam already published');
    }

    if (!exam.sections || exam.sections.length === 0) {
      throw new BadRequestError('Exam must have at least one section');
    }

    for (const section of exam.sections) {
      if (!section.questions || section.questions.length === 0) {
        throw new BadRequestError('All sections must have at least one question');
      }
    }

    await exam.update({
      status: 'published',
      published_at: new Date(),
    });

    if (notify_students) {
      const students = await User.findAll({
        where: { role: 'student', status: 'active' },
      });

      const emailPromises = students.map((student) =>
        EmailService.sendExamPublishedEmail(student.email, student.full_name, exam),
      );

      await Promise.allSettled(emailPromises);
    }

    res.json({
      success: true,
      data: exam,
      message: 'Exam published successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyExams = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      aptis_type,
      skill,
      search 
    } = req.query;
    const { offset, limit: validLimit } = paginate(page, limit);
    const teacherId = req.user.userId;


    const where = { created_by: teacherId };
    if (status && status !== 'undefined') {
      where.status = status;
    }
    if (aptis_type && aptis_type !== 'undefined' && aptis_type !== '') {
      where.aptis_type_id = parseInt(aptis_type);
    }
    if (search && search !== 'undefined' && search !== '') {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const include = [
      {
        model: AptisType,
        as: 'aptisType',
        attributes: ['id', 'code', 'aptis_type_name'],
      },
      {
        model: ExamSection,
        as: 'sections',
        attributes: ['id', 'skill_type_id'],
        include: [
          {
            model: SkillType,
            as: 'skillType',
            attributes: ['id', 'skill_type_name', 'code']
          }
        ]
      },
    ];

    if (skill && skill !== 'undefined' && skill !== '') {
      include[1].where = { skill_type_id: parseInt(skill) };
      include[1].required = true; // INNER JOIN
    }


    const { count, rows } = await Exam.findAndCountAll({
      where,
      include,
      offset,
      limit: validLimit,
      order: [['created_at', 'DESC']],
      distinct: true, // Important for counting with joins
    });

    const examIds = rows.map(exam => exam.id);
    const attemptCounts = await ExamAttempt.findAll({
      attributes: [
        'exam_id',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { exam_id: { [Op.in]: examIds } },
      group: ['exam_id'],
      raw: true
    });

    const attemptCountMap = {};
    attemptCounts.forEach(item => {
      attemptCountMap[item.exam_id] = parseInt(item.count);
    });

    const transformedRows = rows.map(exam => ({
      id: exam.id,
      title: exam.title,
      description: exam.description || '',
      aptis_type: exam.aptisType?.aptis_type_name || 'Unknown',
      aptis_type_id: exam.aptis_type_id,
      aptisType: exam.aptisType, // Return the full object for DeleteExamDialog
      duration_minutes: exam.duration_minutes || 0,
      total_score: exam.total_score || 0,
      status: exam.status,
      is_published: exam.status === 'published',
      attempt_count: attemptCountMap[exam.id] || 0, // Number of students who took this exam
      total_sections: exam.sections?.length || 0,
      total_questions: 0, // Calculate this from sections if needed
      created_at: exam.created_at,
      updated_at: exam.updated_at,
      published_at: exam.published_at,
    }));

    res.json({
      success: true,
      ...paginationResponse(transformedRows, parseInt(page), validLimit, count),
    });
  } catch (error) {
    next(error);
  }
};

exports.unpublishExam = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findByPk(examId);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    if (exam.status !== 'published') {
      throw new BadRequestError('Exam is not published');
    }

    await exam.update({
      status: 'draft',
      published_at: null,
    });

    res.json({
      success: true,
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeSection = async (req, res, next) => {
  try {
    const { examId, sectionId } = req.params;

    const exam = await Exam.findByPk(examId);
    if (!exam || exam.status !== 'draft') {
      throw new BadRequestError('Cannot modify published exam');
    }

    const section = await ExamSection.findOne({
      where: { id: sectionId, exam_id: examId },
    });

    if (!section) {
      throw new NotFoundError('Section not found');
    }

    await ExamSectionQuestion.destroy({
      where: { exam_section_id: sectionId },
    });

    await section.destroy();

    res.json({
      success: true,
      message: 'Section removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getExamById = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findByPk(examId, {
      include: [
        {
          model: AptisType,
          as: 'aptisType',
          attributes: ['id', 'code', 'aptis_type_name'],
        },
        {
          model: ExamSection,
          as: 'sections',
          include: [
            {
              model: SkillType,
              as: 'skillType',
              attributes: ['id', 'code', 'skill_type_name'],
            },
            {
              model: ExamSectionQuestion,
              as: 'questions',
              include: [
                {
                  model: Question,
                  as: 'question',
                  attributes: ['id', 'content', 'question_type_id', 'difficulty'],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'full_name'],
        },
      ],
    });

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    res.json({
      success: true,
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};
