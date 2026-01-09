const {
  Question,
  Exam,
  User,
  AttemptAnswer,
  ExamAttempt,
  sequelize,
} = require('../../models');
const { Op } = require('sequelize');

/**
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get current date for monthly comparisons
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Questions stats
    const totalQuestions = await Question.count({
      where: { status: { [Op.ne]: 'deleted' } }
    });
    const questionsThisMonth = await Question.count({
      where: {
        created_at: { [Op.gte]: startOfMonth },
        status: { [Op.ne]: 'deleted' }
      }
    });
    const questionsLastMonth = await Question.count({
      where: {
        created_at: { [Op.between]: [startOfLastMonth, endOfLastMonth] },
        status: { [Op.ne]: 'deleted' }
      }
    });

    // Exams stats
    const totalExams = await Exam.count({
      where: { status: { [Op.ne]: 'deleted' } }
    });
    const examsThisMonth = await Exam.count({
      where: {
        created_at: { [Op.gte]: startOfMonth },
        status: { [Op.ne]: 'deleted' }
      }
    });
    const examsLastMonth = await Exam.count({
      where: {
        created_at: { [Op.between]: [startOfLastMonth, endOfLastMonth] },
        status: { [Op.ne]: 'deleted' }
      }
    });

    // Users stats (students + teachers)
    const totalUsers = await User.count({
      where: { status: 'active' }
    });
    const usersThisMonth = await User.count({
      where: {
        created_at: { [Op.gte]: startOfMonth },
        status: 'active'
      }
    });
    const usersLastMonth = await User.count({
      where: {
        created_at: { [Op.between]: [startOfLastMonth, endOfLastMonth] },
        status: 'active'
      }
    });

    // Submissions stats (writing + speaking only)
    const submissionStats = await AttemptAnswer.findAll({
      where: {
        answer_type: ['text', 'audio'], // Only writing and speaking
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN score IS NULL THEN 1 ELSE 0 END')), 'ungraded'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN ai_graded_at IS NOT NULL AND reviewed_at IS NULL THEN 1 ELSE 0 END')), 'ai_graded'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN reviewed_at IS NOT NULL THEN 1 ELSE 0 END')), 'manually_graded'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN needs_review = 1 THEN 1 ELSE 0 END')), 'needs_review'],
      ],
      raw: true,
    });

    const submissionsThisMonth = await AttemptAnswer.count({
      where: {
        answered_at: { [Op.gte]: startOfMonth },
        answer_type: ['text', 'audio']
      }
    });
    const submissionsLastMonth = await AttemptAnswer.count({
      where: {
        answered_at: { [Op.between]: [startOfLastMonth, endOfLastMonth] },
        answer_type: ['text', 'audio']
      }
    });

    // Calculate changes and trends
    const questionChange = questionsThisMonth - questionsLastMonth;
    const examChange = examsThisMonth - examsLastMonth;
    const userChange = usersThisMonth - usersLastMonth;
    const submissionChange = submissionsThisMonth - submissionsLastMonth;

    const stats = {
      questions: {
        total: totalQuestions,
        change: questionChange,
        trend: questionChange > 0 ? 'up' : questionChange < 0 ? 'down' : 'stable',
        thisMonth: questionsThisMonth,
        lastMonth: questionsLastMonth
      },
      exams: {
        total: totalExams,
        change: examChange,
        trend: examChange > 0 ? 'up' : examChange < 0 ? 'down' : 'stable',
        thisMonth: examsThisMonth,
        lastMonth: examsLastMonth
      },
      users: {
        total: totalUsers,
        change: userChange,
        trend: userChange > 0 ? 'up' : userChange < 0 ? 'down' : 'stable',
        thisMonth: usersThisMonth,
        lastMonth: usersLastMonth
      },
      submissions: {
        total: parseInt(submissionStats[0]?.total || 0),
        ungraded: parseInt(submissionStats[0]?.ungraded || 0),
        ai_graded: parseInt(submissionStats[0]?.ai_graded || 0),
        manually_graded: parseInt(submissionStats[0]?.manually_graded || 0),
        needs_review: parseInt(submissionStats[0]?.needs_review || 0),
        change: submissionChange,
        trend: submissionChange > 0 ? 'up' : submissionChange < 0 ? 'down' : 'stable',
        thisMonth: submissionsThisMonth,
        lastMonth: submissionsLastMonth
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activities summary
 */
exports.getRecentActivities = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get recent exams
    const recentExams = await Exam.findAll({
      limit: Math.ceil(limit / 2),
      order: [['created_at', 'DESC']],
      attributes: ['id', 'title', 'status', 'created_at'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['full_name']
        }
      ]
    });

    // Get recent submissions
    const recentSubmissions = await AttemptAnswer.findAll({
      limit: Math.ceil(limit / 2),
      order: [['answered_at', 'DESC']],
      where: {
        answer_type: ['text', 'audio']
      },
      include: [
        {
          model: ExamAttempt,
          as: 'attempt',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['full_name']
            },
            {
              model: Exam,
              as: 'exam',
              attributes: ['title']
            }
          ]
        }
      ]
    });

    // Format activities
    const activities = [];
    
    recentExams.forEach(exam => {
      activities.push({
        id: `exam-${exam.id}`,
        type: 'exam_created',
        title: `Tạo bài thi: ${exam.title}`,
        subtitle: `Trạng thái: ${exam.status}`,
        timestamp: exam.created_at,
        user: exam.creator?.full_name || 'Unknown',
        icon: 'assignment'
      });
    });

    recentSubmissions.forEach(submission => {
      activities.push({
        id: `submission-${submission.id}`,
        type: 'submission_received',
        title: `Bài làm mới: ${submission.attempt?.exam?.title}`,
        subtitle: `Học sinh: ${submission.attempt?.student?.full_name}`,
        timestamp: submission.answered_at,
        user: submission.attempt?.student?.full_name || 'Unknown',
        icon: 'assignment_turned_in'
      });
    });

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: activities.slice(0, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system overview for dashboard
 */
exports.getSystemOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get stats
    const [
      totalQuestions,
      questionsThisMonth,
      questionsLastMonth,
      totalExams,
      examsThisMonth,
      examsLastMonth,
      totalUsers,
      usersThisMonth,
      usersLastMonth,
      submissionStats,
      submissionsThisMonth,
      submissionsLastMonth,
    ] = await Promise.all([
      Question.count({ where: { status: { [Op.ne]: 'deleted' } } }),
      Question.count({
        where: {
          created_at: { [Op.gte]: startOfMonth },
          status: { [Op.ne]: 'deleted' }
        }
      }),
      Question.count({
        where: {
          created_at: { [Op.between]: [startOfLastMonth, endOfLastMonth] },
          status: { [Op.ne]: 'deleted' }
        }
      }),
      Exam.count({ where: { status: { [Op.ne]: 'deleted' } } }),
      Exam.count({
        where: {
          created_at: { [Op.gte]: startOfMonth },
          status: { [Op.ne]: 'deleted' }
        }
      }),
      Exam.count({
        where: {
          created_at: { [Op.between]: [startOfLastMonth, endOfLastMonth] },
          status: { [Op.ne]: 'deleted' }
        }
      }),
      User.count({ where: { status: 'active' } }),
      User.count({
        where: {
          created_at: { [Op.gte]: startOfMonth },
          status: 'active'
        }
      }),
      User.count({
        where: {
          created_at: { [Op.between]: [startOfLastMonth, endOfLastMonth] },
          status: 'active'
        }
      }),
      AttemptAnswer.findAll({
        where: { answer_type: ['text', 'audio'] },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN score IS NULL THEN 1 ELSE 0 END')), 'ungraded'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN ai_graded_at IS NOT NULL AND reviewed_at IS NULL THEN 1 ELSE 0 END')), 'ai_graded'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN reviewed_at IS NOT NULL THEN 1 ELSE 0 END')), 'manually_graded'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN needs_review = 1 THEN 1 ELSE 0 END')), 'needs_review'],
        ],
        raw: true,
      }),
      AttemptAnswer.count({
        where: {
          answered_at: { [Op.gte]: startOfMonth },
          answer_type: ['text', 'audio']
        }
      }),
      AttemptAnswer.count({
        where: {
          answered_at: { [Op.between]: [startOfLastMonth, endOfLastMonth] },
          answer_type: ['text', 'audio']
        }
      }),
    ]);

    // Get recent activities
    const [recentExams, recentSubmissions] = await Promise.all([
      Exam.findAll({
        limit: 3,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'title', 'status', 'created_at'],
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['full_name']
          }
        ]
      }),
      AttemptAnswer.findAll({
        limit: 3,
        order: [['answered_at', 'DESC']],
        where: { answer_type: ['text', 'audio'] },
        include: [
          {
            model: ExamAttempt,
            as: 'attempt',
            include: [
              {
                model: User,
                as: 'student',
                attributes: ['full_name']
              },
              {
                model: Exam,
                as: 'exam',
                attributes: ['title']
              }
            ]
          }
        ]
      })
    ]);

    // Format activities
    const activities = [];
    
    recentExams.forEach(exam => {
      activities.push({
        id: `exam-${exam.id}`,
        type: 'exam_created',
        title: `Tạo bài thi: ${exam.title}`,
        subtitle: `Trạng thái: ${exam.status}`,
        timestamp: exam.created_at,
        user: exam.creator?.full_name || 'Unknown',
        icon: 'assignment'
      });
    });

    recentSubmissions.forEach(submission => {
      activities.push({
        id: `submission-${submission.id}`,
        type: 'submission_received',
        title: `Bài làm mới: ${submission.attempt?.exam?.title}`,
        subtitle: `Học sinh: ${submission.attempt?.student?.full_name}`,
        timestamp: submission.answered_at,
        user: submission.attempt?.student?.full_name || 'Unknown',
        icon: 'assignment_turned_in'
      });
    });

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Build overview response
    const questionChange = questionsThisMonth - questionsLastMonth;
    const examChange = examsThisMonth - examsLastMonth;
    const userChange = usersThisMonth - usersLastMonth;
    const submissionChange = submissionsThisMonth - submissionsLastMonth;

    const overview = {
      stats: {
        questions: {
          total: totalQuestions,
          change: questionChange,
          trend: questionChange > 0 ? 'up' : questionChange < 0 ? 'down' : 'stable',
          thisMonth: questionsThisMonth,
          lastMonth: questionsLastMonth
        },
        exams: {
          total: totalExams,
          change: examChange,
          trend: examChange > 0 ? 'up' : examChange < 0 ? 'down' : 'stable',
          thisMonth: examsThisMonth,
          lastMonth: examsLastMonth
        },
        users: {
          total: totalUsers,
          change: userChange,
          trend: userChange > 0 ? 'up' : userChange < 0 ? 'down' : 'stable',
          thisMonth: usersThisMonth,
          lastMonth: usersLastMonth
        },
        submissions: {
          total: parseInt(submissionStats[0]?.total || 0),
          ungraded: parseInt(submissionStats[0]?.ungraded || 0),
          ai_graded: parseInt(submissionStats[0]?.ai_graded || 0),
          manually_graded: parseInt(submissionStats[0]?.manually_graded || 0),
          needs_review: parseInt(submissionStats[0]?.needs_review || 0),
          change: submissionChange,
          trend: submissionChange > 0 ? 'up' : submissionChange < 0 ? 'down' : 'stable',
          thisMonth: submissionsThisMonth,
          lastMonth: submissionsLastMonth
        },
        lastUpdated: new Date().toISOString()
      },
      recentActivities: activities,
      systemHealth: {
        status: 'healthy',
        uptime: process.uptime(),
        lastCheck: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};