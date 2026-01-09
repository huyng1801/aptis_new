const express = require('express');
const router = express.Router();
const questionController = require('../controllers/teacherController/questionController');
const examController = require('../controllers/teacherController/examController');
const criteriaController = require('../controllers/teacherController/criteriaController');
const reviewController = require('../controllers/teacherController/reviewController');
const reportController = require('../controllers/teacherController/reportController');
const dashboardController = require('../controllers/teacherController/dashboardController');
const { authMiddleware } = require('../middleware/auth');
const { isTeacherOrAdmin } = require('../middleware/roleCheck');
const {
  validate,
  questionSchemas,
  examSchemas,
  criteriaSchemas,
} = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimiter');

// Dashboard routes
router.get(
  '/dashboard/stats',
  authMiddleware,
  isTeacherOrAdmin,
  dashboardController.getDashboardStats,
);

router.get(
  '/dashboard/activities',
  authMiddleware,
  isTeacherOrAdmin,
  dashboardController.getRecentActivities,
);

router.get(
  '/dashboard/overview',
  authMiddleware,
  isTeacherOrAdmin,
  dashboardController.getSystemOverview,
);

// Question routes
router.post(
  '/questions',
  authMiddleware,
  isTeacherOrAdmin,
  validate(questionSchemas.createQuestion),
  questionController.createQuestion,
);

router.get(
  '/questions',
  authMiddleware,
  isTeacherOrAdmin,
  apiLimiter,
  questionController.getQuestions,
);

router.get(
  '/questions/filter-options',
  authMiddleware,
  isTeacherOrAdmin,
  questionController.getFilterOptions,
);

router.get(
  '/questions/:questionId',
  authMiddleware,
  isTeacherOrAdmin,
  questionController.getQuestionDetails,
);

router.put(
  '/questions/:questionId',
  authMiddleware,
  isTeacherOrAdmin,
  validate(questionSchemas.updateQuestion),
  questionController.updateQuestion,
);

router.delete(
  '/questions/:questionId',
  authMiddleware,
  isTeacherOrAdmin,
  questionController.deleteQuestion,
);

router.get(
  '/questions/:questionId/usage',
  authMiddleware,
  isTeacherOrAdmin,
  questionController.getQuestionUsage,
);

// Exam routes
router.post(
  '/exams',
  authMiddleware,
  isTeacherOrAdmin,
  validate(examSchemas.createExam),
  examController.createExam,
);

router.put(
  '/exams/:examId',
  authMiddleware,
  isTeacherOrAdmin,
  validate(examSchemas.updateExam),
  examController.updateExam,
);

router.delete(
  '/exams/:examId',
  authMiddleware,
  isTeacherOrAdmin,
  examController.deleteExam,
);

router.post(
  '/exams/:examId/sections',
  authMiddleware,
  isTeacherOrAdmin,
  validate(examSchemas.addSection),
  examController.addSection,
);

router.put(
  '/exams/:examId/sections/:sectionId',
  authMiddleware,
  isTeacherOrAdmin,
  validate(examSchemas.updateSection),
  examController.updateSection,
);

router.post(
  '/exams/:examId/sections/:sectionId/questions',
  authMiddleware,
  isTeacherOrAdmin,
  validate(examSchemas.addQuestion),
  examController.addQuestionToSection,
);

router.delete(
  '/exams/:examId/sections/:sectionId/questions/:questionId',
  authMiddleware,
  isTeacherOrAdmin,
  examController.removeQuestionFromSection,
);

router.put(
  '/exams/:examId/sections/:sectionId/questions/:questionId',
  authMiddleware,
  isTeacherOrAdmin,
  validate(examSchemas.updateQuestionOrder),
  examController.updateQuestionInSection,
);

router.post('/exams/:examId/publish', authMiddleware, isTeacherOrAdmin, examController.publishExam);

router.post('/exams/:examId/unpublish', authMiddleware, isTeacherOrAdmin, examController.unpublishExam);

router.get('/exams/:examId', authMiddleware, isTeacherOrAdmin, examController.getExamById);

router.delete(
  '/exams/:examId/sections/:sectionId',
  authMiddleware,
  isTeacherOrAdmin,
  examController.removeSection,
);

router.get('/exams', authMiddleware, isTeacherOrAdmin, apiLimiter, examController.getMyExams);

// AI Criteria routes
router.post(
  '/criteria',
  authMiddleware,
  isTeacherOrAdmin,
  validate(criteriaSchemas.createCriteria),
  criteriaController.createCriteria,
);

router.get(
  '/criteria',
  authMiddleware,
  isTeacherOrAdmin,
  apiLimiter,
  criteriaController.getCriteriaList,
);

router.get(
  '/criteria/question-types',
  authMiddleware,
  isTeacherOrAdmin,
  criteriaController.getQuestionTypesForCriteria,
);

// Individual criteria route (must come AFTER specific routes like /question-types)
router.get(
  '/criteria/:criteriaId',
  authMiddleware,
  isTeacherOrAdmin,
  criteriaController.getCriteriaById,
);

// Public endpoint for testing (remove in production)
router.get(
  '/criteria/question-types/public',
  criteriaController.getQuestionTypesForCriteria,
);

router.put(
  '/criteria/:criteriaId',
  authMiddleware,
  isTeacherOrAdmin,
  validate(criteriaSchemas.updateCriteria),
  criteriaController.updateCriteria,
);

router.delete(
  '/criteria/:criteriaId',
  authMiddleware,
  isTeacherOrAdmin,
  criteriaController.deleteCriteria,
);

router.get(
  '/criteria/:criteriaId/preview',
  authMiddleware,
  isTeacherOrAdmin,
  criteriaController.previewCriteria,
);

// Review routes
router.get(
  '/review/pending',
  authMiddleware,
  isTeacherOrAdmin,
  apiLimiter,
  reviewController.getPendingReviews,
);

router.get(
  '/review/answers/:answerId',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.getAnswerForReview,
);

router.put(
  '/review/answers/:answerId',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.submitReview,
);

router.get(
  '/review/exam/:examId',
  authMiddleware,
  isTeacherOrAdmin,
  apiLimiter,
  reviewController.getReviewsByExam,
);

// Submission review routes
router.get(
  '/submissions',
  authMiddleware,
  isTeacherOrAdmin,
  apiLimiter,
  reviewController.getSubmissions,
);

router.get(
  '/submissions/:attemptId',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.getSubmissionDetail,
);

router.put(
  '/answers/:answerId/review',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.submitAnswerReview,
);

router.put(
  '/answers/:answerId/score',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.updateAnswerScore,
);

router.post(
  '/attempts/:attemptId/review',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.submitAttemptReview,
);

// New submission management routes
router.post(
  '/submissions/regrade',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.regradeSubmissions,
);

router.post(
  '/submissions/bulk-update',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.bulkUpdateStatus,
);

router.get(
  '/submissions/stats',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.getGradingStats,
);

// Report routes
router.get(
  '/reports/exam-statistics/:examId',
  authMiddleware,
  isTeacherOrAdmin,
  reportController.getExamStatistics,
);

router.get(
  '/reports/student-statistics',
  authMiddleware,
  isTeacherOrAdmin,
  apiLimiter,
  reportController.getStudentStatistics,
);

router.get(
  '/reports/student/:studentId',
  authMiddleware,
  isTeacherOrAdmin,
  reportController.getStudentReport,
);

router.get('/reports/export', authMiddleware, isTeacherOrAdmin, reportController.exportStatistics);

module.exports = router;
