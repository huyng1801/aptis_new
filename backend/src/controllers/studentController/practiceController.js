const { 
  Question, 
  QuestionType, 
  SkillType, 
  QuestionItem, 
  QuestionOption, 
  Exam,
  User,
  sequelize 
} = require('../../models');
const { Op } = require('sequelize');

class PracticeController {
  /**
   * Get available skills for practice
   */
  async getSkillsForPractice(req, res) {
    try {
      const skills = await SkillType.findAll({
        attributes: ['id', 'type_name', 'description'],
        where: {
          type_name: ['READING', 'LISTENING', 'WRITING', 'SPEAKING']
        }
      });

      res.json({
        success: true,
        data: skills
      });
    } catch (error) {
      console.error('Error getting skills for practice:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get exams for a specific skill
   */
  async getExamsForSkill(req, res) {
    try {
      const { skillId } = req.params;

      const skill = await SkillType.findByPk(skillId);
      if (!skill) {
        return res.status(404).json({
          success: false,
          message: 'Skill not found'
        });
      }

      // Get unique exams that have questions with this skill
      const exams = await sequelize.query(`
        SELECT DISTINCT e.id, e.title, e.description
        FROM exams e
        INNER JOIN exam_sections es ON e.id = es.exam_id
        INNER JOIN exam_section_questions esq ON es.id = esq.exam_section_id
        INNER JOIN questions q ON esq.question_id = q.id
        WHERE q.skill_type_id = :skillId
      `, {
        replacements: { skillId },
        type: sequelize.QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: exams
      });
    } catch (error) {
      console.error('Error getting exams for skill:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get exam questions for a specific skill
   */
  async getExamQuestionsForSkill(req, res) {
    try {
      const { examId, skillId } = req.params;

      const questions = await Question.findAll({
        where: {
          skill_type_id: skillId
        },
        include: [{
          model: Exam,
          as: 'exams',
          where: { id: examId },
          through: { attributes: [] }
        }, {
          model: QuestionType,
          attributes: ['type_name']
        }, {
          model: QuestionItem,
          as: 'items'
        }, {
          model: QuestionOption,
          as: 'options'
        }]
      });

      const formattedQuestions = questions.map(question => ({
        id: question.id,
        title: question.title,
        type: question.QuestionType?.type_name,
        difficulty: question.difficulty,
        content: question.content,
        media_url: question.media_url,
        items: question.items || [],
        options: question.options || []
      }));

      res.json({
        success: true,
        data: formattedQuestions
      });
    } catch (error) {
      console.error('Error getting exam questions for skill:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get practice questions based on skill type, difficulty, and question type
   */
  async getPracticeQuestions(req, res) {
    try {
      const { 
        skill_type, 
        difficulty_level, 
        question_type, 
        limit = 10 
      } = req.query;

      // Validate required parameters
      if (!skill_type) {
        return res.status(400).json({
          success: false,
          message: 'skill_type is required'
        });
      }

      // Build where conditions
      const whereConditions = {
        [Op.and]: [
          { '$questionType.skillType.type_name$': skill_type }
        ]
      };

      // Add optional filters
      if (difficulty_level) {
        whereConditions[Op.and].push({ difficulty: difficulty_level });
      }

      if (question_type) {
        whereConditions[Op.and].push({ '$questionType.type_name$': question_type });
      }

      // Get practice questions
      const questions = await Question.findAll({
        where: whereConditions,
        include: [
          {
            model: QuestionType,
            as: 'questionType',
            attributes: ['type_name', 'description'],
            include: [
              {
                model: SkillType,
                as: 'skillType',
                attributes: ['type_name', 'description']
              }
            ]
          },
          {
            model: QuestionItem,
            as: 'items',
            required: false
          },
          {
            model: QuestionOption,
            as: 'options',
            required: false
          }
        ],
        order: sequelize.random(),
        limit: parseInt(limit),
        attributes: [
          'id',
          'content',
          'difficulty',
          'media_url',
          'duration_seconds',
          'created_at'
        ]
      });

      // Format questions for frontend
      const formattedQuestions = questions.map((question, index) => ({
        question_id: question.id,
        question_number: index + 1,
        skill_type: question.questionType.skillType.type_name,
        question_type: question.questionType.type_name,
        difficulty_level: question.difficulty,
        content: question.content,
        media_url: question.media_url,
        duration_seconds: question.duration_seconds,
        items: question.items || [],
        options: question.options || []
      }));

      res.json({
        success: true,
        data: {
          questions: formattedQuestions,
          total_questions: formattedQuestions.length,
          skill_type,
          difficulty_level,
          question_type
        }
      });

    } catch (error) {
      console.error('Error getting practice questions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Submit practice answer for immediate feedback
   */
  async submitPracticeAnswer(req, res) {
    try {
      const userId = req.user.user_id;
      const {
        question_id,
        answer_data,
        skill_type,
        question_type
      } = req.body;

      // Validate input
      if (!question_id || !answer_data || !skill_type) {
        return res.status(400).json({
          success: false,
          message: 'question_id, answer_data, and skill_type are required'
        });
      }

      // Get question details
      const question = await Question.findByPk(question_id, {
        include: [
          {
            model: SkillType,
            attributes: ['type_name']
          },
          {
            model: QuestionType,
            attributes: ['type_name']
          },
          {
            model: QuestionOption,
            as: 'options'
          }
        ]
      });

      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      // Calculate score based on question type
      let score = 0;
      let feedback = '';
      let isCorrect = false;

      // Simple scoring logic for practice (can be enhanced with AI)
      switch (question.QuestionType.type_name) {
        case 'READING_MCQ':
        case 'LISTENING_MCQ':
          // Check against sample answers or options
          const correctOptions = question.sampleAnswers
            .filter(sa => sa.is_correct)
            .map(sa => sa.content);
          
          if (correctOptions.includes(answer_data.selected_option)) {
            score = question.max_score;
            isCorrect = true;
            feedback = 'Correct! Well done.';
          } else {
            score = 0;
            feedback = `Incorrect. The correct answer is: ${correctOptions.join(', ')}`;
          }
          break;

        case 'READING_GAP_FILL':
        case 'LISTENING_GAP_FILL':
          // Simple keyword matching for gap fill
          const correctAnswers = question.sampleAnswers.map(sa => sa.content.toLowerCase());
          const userAnswers = Object.values(answer_data).map(ans => ans.toLowerCase().trim());
          
          let correctCount = 0;
          userAnswers.forEach((userAns, index) => {
            if (correctAnswers[index] && correctAnswers[index].includes(userAns)) {
              correctCount++;
            }
          });
          
          score = Math.round((correctCount / userAnswers.length) * question.max_score);
          isCorrect = score >= (question.max_score * 0.7); // 70% threshold
          feedback = `You got ${correctCount} out of ${userAnswers.length} gaps correct.`;
          break;

        // case 'WRITING_ESSAY': - removed per APTIS Technical Report
        case 'WRITING_LETTER':
        case 'WRITING_REPORT':
        case 'WRITING_REVIEW':
          // Basic word count and structure check for writing
          const wordCount = answer_data.text ? answer_data.text.trim().split(/\s+/).length : 0;
          const minWords = 100; // Default min words for writing tasks
          
          if (wordCount >= minWords) {
            score = Math.min(question.max_score, Math.round((wordCount / minWords) * question.max_score * 0.8));
            isCorrect = true;
            feedback = `Good work! Your response has ${wordCount} words. Consider working on grammar and coherence for higher scores.`;
          } else {
            score = Math.round((wordCount / minWords) * question.max_score * 0.5);
            feedback = `Your response needs more development. You have ${wordCount} words, but need at least ${minWords}.`;
          }
          break;

        case 'SPEAKING_MONOLOGUE':
        case 'SPEAKING_DIALOGUE':
        case 'SPEAKING_PRESENTATION':
        case 'SPEAKING_DISCUSSION':
          // Basic duration check for speaking
          const duration = answer_data.duration || 0;
          const minDuration = 30; // 30 seconds minimum
          
          if (duration >= minDuration) {
            score = Math.round(question.max_score * 0.7); // Base score for meeting duration
            isCorrect = true;
            feedback = `Good speaking practice! Duration: ${duration} seconds. Focus on clarity and fluency.`;
          } else {
            score = Math.round(question.max_score * 0.4);
            feedback = `Your response was too short (${duration}s). Try to speak for at least ${minDuration} seconds.`;
          }
          break;

        default:
          score = Math.round(question.max_score * 0.5); // Default partial credit
          feedback = 'Answer submitted for practice review.';
      }

      // Save practice session to user stats (could be separate table in production)
      // For now, just return immediate feedback
      
      res.json({
        success: true,
        data: {
          score,
          max_score: question.max_score,
          percentage: Math.round((score / question.max_score) * 100),
          is_correct: isCorrect,
          feedback,
          question: {
            skill_type: question.SkillType.type_name,
            question_type: question.QuestionType.type_name,
            difficulty_level: question.difficulty_level
          }
        }
      });

    } catch (error) {
      console.error('Error submitting practice answer:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get practice statistics for user
   */
  async getPracticeStats(req, res) {
    try {
      const userId = req.user.user_id;

      // Mock statistics for now - in production this would query a practice_sessions table
      const mockStats = {
        total_sessions: 15,
        total_questions: 89,
        skills_progress: {
          LISTENING: {
            questions_completed: 25,
            average_score: 78,
            last_practice: '2024-01-15',
            difficulty_breakdown: {
              BEGINNER: { completed: 10, avg_score: 85 },
              INTERMEDIATE: { completed: 12, avg_score: 75 },
              ADVANCED: { completed: 3, avg_score: 65 }
            }
          },
          READING: {
            questions_completed: 22,
            average_score: 82,
            last_practice: '2024-01-14',
            difficulty_breakdown: {
              BEGINNER: { completed: 8, avg_score: 90 },
              INTERMEDIATE: { completed: 10, avg_score: 80 },
              ADVANCED: { completed: 4, avg_score: 70 }
            }
          },
          WRITING: {
            questions_completed: 18,
            average_score: 71,
            last_practice: '2024-01-13',
            difficulty_breakdown: {
              BEGINNER: { completed: 7, avg_score: 80 },
              INTERMEDIATE: { completed: 8, avg_score: 68 },
              ADVANCED: { completed: 3, avg_score: 60 }
            }
          },
          SPEAKING: {
            questions_completed: 24,
            average_score: 68,
            last_practice: '2024-01-12',
            difficulty_breakdown: {
              BEGINNER: { completed: 9, avg_score: 75 },
              INTERMEDIATE: { completed: 11, avg_score: 65 },
              ADVANCED: { completed: 4, avg_score: 58 }
            }
          }
        },
        recent_activity: [
          {
            date: '2024-01-15',
            skill: 'LISTENING',
            question_type: 'LISTENING_MCQ',
            score: 8,
            max_score: 10
          },
          {
            date: '2024-01-14',
            skill: 'READING',
            question_type: 'READING_GAP_FILL',
            score: 7,
            max_score: 10
          },
          {
            date: '2024-01-13',
            skill: 'WRITING',
            question_type: 'WRITING_FORM', // Updated per APTIS Technical Report
            score: 6,
            max_score: 10
          }
        ]
      };

      res.json({
        success: true,
        data: mockStats
      });

    } catch (error) {
      console.error('Error getting practice stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get practice stats for a specific skill
   */
  async getSkillStats(req, res) {
    try {
      const { skillId } = req.params;
      const userId = req.user.userId;

      const skill = await SkillType.findByPk(skillId);
      if (!skill) {
        return res.status(404).json({
          success: false,
          message: 'Skill not found'
        });
      }

      // Get total exams count for this skill
      const totalExamsQuery = `
        SELECT COUNT(DISTINCT e.id) as total_exams
        FROM exams e
        INNER JOIN exam_sections es ON e.id = es.exam_id
        INNER JOIN exam_section_questions esq ON es.id = esq.exam_section_id
        INNER JOIN questions q ON esq.question_id = q.id
        WHERE q.skill_type_id = :skillId
          AND e.status = 'published'
      `;

      const [totalExamsResult] = await sequelize.query(totalExamsQuery, {
        replacements: { skillId },
        type: sequelize.QueryTypes.SELECT
      });

      // Get user's completed attempts for this skill
      const completedAttemptsQuery = `
        SELECT COUNT(*) as completed_attempts,
               AVG(aa.score / NULLIF(aa.max_score, 0) * 5) as avg_score
        FROM exam_attempts ea
        INNER JOIN attempt_answers aa ON ea.id = aa.attempt_id
        INNER JOIN questions q ON aa.question_id = q.id
        WHERE ea.user_id = :userId
          AND ea.status = 'submitted'
          AND q.skill_type_id = :skillId
          AND aa.score IS NOT NULL
      `;

      const [attemptsResult] = await sequelize.query(completedAttemptsQuery, {
        replacements: { userId, skillId },
        type: sequelize.QueryTypes.SELECT
      });

      const stats = {
        totalExams: parseInt(totalExamsResult?.total_exams || 0),
        completedAttempts: parseInt(attemptsResult?.completed_attempts || 0),
        averageScore: parseFloat(attemptsResult?.avg_score || 0)
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error getting skill stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new PracticeController();