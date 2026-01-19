/**
 * =================================================================
 * TEACHER ROUTES - ĐỊNH TUYẾN GIÁO VIÊN
 * =================================================================
 * 
 * File này quản lý các route dành cho giáo viên và admin:
 * - Dashboard và thống kê
 * - Quản lý câu hỏi (CRUD)
 * - Quản lý bài thi (CRUD, publish/unpublish)
 * - Quản lý tiêu chí chấm điểm AI
 * - Review và chấm điểm bài thi
 * - Báo cáo và thống kê
 * 
 * Tất cả routes yêu cầu:
 * - authMiddleware: Đã đăng nhập
 * - isTeacherOrAdmin: Có role teacher hoặc admin
 * =================================================================
 */

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

// =====================================
// DASHBOARD - BẢNG ĐIỀU KHIỂN
// =====================================

// GET /teacher/dashboard/stats - Thống kê dashboard cho giáo viên
router.get(
  '/dashboard/stats',
  authMiddleware,
  isTeacherOrAdmin,
  dashboardController.getDashboardStats,
);

// GET /teacher/dashboard/activities - Hoạt động gần đây
router.get(
  '/dashboard/activities',
  authMiddleware,
  isTeacherOrAdmin,
  dashboardController.getRecentActivities,
);

// GET /teacher/dashboard/overview - Tổng quan hệ thống
router.get(
  '/dashboard/overview',
  authMiddleware,
  isTeacherOrAdmin,
  dashboardController.getSystemOverview,
);

// =====================================
// QUESTION ROUTES - QUẢN LÝ CÂU HỎI
// =====================================

// POST /teacher/questions - Tạo câu hỏi mới
router.post(
  '/questions',
  authMiddleware,
  isTeacherOrAdmin,
  validate(questionSchemas.createQuestion),
  questionController.createQuestion,
);

// GET /teacher/questions - Lấy danh sách câu hỏi
router.get(
  '/questions',
  authMiddleware,
  isTeacherOrAdmin,
  apiLimiter,
  questionController.getQuestions,
);

// GET /teacher/questions/filter-options - Lấy các tùy chọn filter
router.get(
  '/questions/filter-options',
  authMiddleware,
  isTeacherOrAdmin,
  questionController.getFilterOptions,
);

// GET /teacher/questions/:questionId - Chi tiết câu hỏi
router.get(
  '/questions/:questionId',
  authMiddleware,
  isTeacherOrAdmin,
  questionController.getQuestionDetails,
);

// POST /teacher/questions/:questionId/upload-images - Upload ảnh cho câu hỏi
router.post(
  '/questions/:questionId/upload-images',
  authMiddleware,
  isTeacherOrAdmin,
  require('../config/storage').upload.array('images', 5),
  questionController.uploadQuestionImages,
);

// PUT /teacher/questions/:questionId - Cập nhật câu hỏi
router.put(
  '/questions/:questionId',
  authMiddleware,
  isTeacherOrAdmin,
  validate(questionSchemas.updateQuestion),
  questionController.updateQuestion,
);

// DELETE /teacher/questions/:questionId - Xóa câu hỏi
router.delete(
  '/questions/:questionId',
  authMiddleware,
  isTeacherOrAdmin,
  questionController.deleteQuestion,
);

// GET /teacher/questions/:questionId/usage - Xem câu hỏi được sử dụng ở đâu
router.get(
  '/questions/:questionId/usage',
  authMiddleware,
  isTeacherOrAdmin,
  questionController.getQuestionUsage,
);

// =====================================
// EXAM ROUTES - QUẢN LÝ BÀI THI
// =====================================

// POST /teacher/exams - Tạo bài thi mới
router.post(
  '/exams',
  authMiddleware,
  isTeacherOrAdmin,
  validate(examSchemas.createExam),
  examController.createExam,
);

// PUT /teacher/exams/:examId - Cập nhật bài thi
router.put(
  '/exams/:examId',
  authMiddleware,
  isTeacherOrAdmin,
  validate(examSchemas.updateExam),
  examController.updateExam,
);

// DELETE /teacher/exams/:examId - Xóa bài thi
router.delete(
  '/exams/:examId',
  authMiddleware,
  isTeacherOrAdmin,
  examController.deleteExam,
);

// POST /teacher/exams/:examId/sections - Thêm section vào bài thi
router.post(
  '/exams/:examId/sections',
  authMiddleware,
  isTeacherOrAdmin,
  validate(examSchemas.addSection),
  examController.addSection,
);

// PUT /teacher/exams/:examId/sections/:sectionId - Cập nhật section
router.put(
  '/exams/:examId/sections/:sectionId',
  authMiddleware,
  isTeacherOrAdmin,
  validate(examSchemas.updateSection),
  examController.updateSection,
);

// POST /teacher/exams/:examId/sections/:sectionId/questions - Thêm câu hỏi vào section
router.post(
  '/exams/:examId/sections/:sectionId/questions',
  authMiddleware,
  isTeacherOrAdmin,
  validate(examSchemas.addQuestion),
  examController.addQuestionToSection,
);

// DELETE /teacher/exams/:examId/sections/:sectionId/questions/:questionId - Xóa câu hỏi khỏi section
router.delete(
  '/exams/:examId/sections/:sectionId/questions/:questionId',
  authMiddleware,
  isTeacherOrAdmin,
  examController.removeQuestionFromSection,
);

// PUT /teacher/exams/:examId/sections/:sectionId/questions/:questionId - Cập nhật thứ tự câu hỏi
router.put(
  '/exams/:examId/sections/:sectionId/questions/:questionId',
  authMiddleware,
  isTeacherOrAdmin,
  validate(examSchemas.updateQuestionOrder),
  examController.updateQuestionInSection,
);

// POST /teacher/exams/:examId/publish - Publish bài thi (đưa vào sử dụng)
router.post('/exams/:examId/publish', authMiddleware, isTeacherOrAdmin, examController.publishExam);

// POST /teacher/exams/:examId/unpublish - Unpublish bài thi (ngừng sử dụng)
router.post('/exams/:examId/unpublish', authMiddleware, isTeacherOrAdmin, examController.unpublishExam);

// GET /teacher/exams/:examId - Chi tiết bài thi
router.get('/exams/:examId', authMiddleware, isTeacherOrAdmin, examController.getExamById);

// DELETE /teacher/exams/:examId/sections/:sectionId - Xóa section
router.delete(
  '/exams/:examId/sections/:sectionId',
  authMiddleware,
  isTeacherOrAdmin,
  examController.removeSection,
);

// GET /teacher/exams - Lấy danh sách bài thi của giáo viên
router.get('/exams', authMiddleware, isTeacherOrAdmin, apiLimiter, examController.getMyExams);

// =====================================
// AI CRITERIA ROUTES - QUẢN LÝ TIÊU CHÍ AI
// =====================================

// POST /teacher/criteria - Tạo tiêu chí chấm điểm AI mới
router.post(
  '/criteria',
  authMiddleware,
  isTeacherOrAdmin,
  validate(criteriaSchemas.createCriteria),
  criteriaController.createCriteria,
);

// GET /teacher/criteria - Lấy danh sách các tiêu chí
router.get(
  '/criteria',
  authMiddleware,
  isTeacherOrAdmin,
  apiLimiter,
  criteriaController.getCriteriaList,
);

// GET /teacher/criteria/question-types - Lấy question types để gán criteria
router.get(
  '/criteria/question-types',
  authMiddleware,
  isTeacherOrAdmin,
  criteriaController.getQuestionTypesForCriteria,
);

// GET /teacher/criteria/:criteriaId - Chi tiết tiêu chí
// Route này phải đặt SAU các specific routes như /question-types
router.get(
  '/criteria/:criteriaId',
  authMiddleware,
  isTeacherOrAdmin,
  criteriaController.getCriteriaById,
);

// GET /teacher/criteria/question-types/public - Public endpoint cho testing (xóa trong production)
router.get(
  '/criteria/question-types/public',
  criteriaController.getQuestionTypesForCriteria,
);

// PUT /teacher/criteria/:criteriaId - Cập nhật tiêu chí
router.put(
  '/criteria/:criteriaId',
  authMiddleware,
  isTeacherOrAdmin,
  validate(criteriaSchemas.updateCriteria),
  criteriaController.updateCriteria,
);

// DELETE /teacher/criteria/:criteriaId - Xóa tiêu chí
router.delete(
  '/criteria/:criteriaId',
  authMiddleware,
  isTeacherOrAdmin,
  criteriaController.deleteCriteria,
);

// GET /teacher/criteria/:criteriaId/preview - Xem trước tiêu chí
router.get(
  '/criteria/:criteriaId/preview',
  authMiddleware,
  isTeacherOrAdmin,
  criteriaController.previewCriteria,
);

// =====================================
// REVIEW ROUTES - ĐÁNH GIÁ VÀ CHẤM ĐIỂM
// =====================================

// GET /teacher/review/pending - Lấy danh sách bài cần review
router.get(
  '/review/pending',
  authMiddleware,
  isTeacherOrAdmin,
  apiLimiter,
  reviewController.getPendingReviews,
);

// GET /teacher/review/answers/:answerId - Lấy chi tiết câu trả lời để review
router.get(
  '/review/answers/:answerId',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.getAnswerForReview,
);

// PUT /teacher/review/answers/:answerId - Nộp kết quả review
router.put(
  '/review/answers/:answerId',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.submitReview,
);

// GET /teacher/review/exam/:examId - Lấy reviews theo bài thi
router.get(
  '/review/exam/:examId',
  authMiddleware,
  isTeacherOrAdmin,
  apiLimiter,
  reviewController.getReviewsByExam,
);

// =====================================
// SUBMISSION REVIEW ROUTES - ĐÁNH GIÁ BÀI NỘP
// =====================================

// GET /teacher/submissions - Lấy danh sách submissions cần chấm
router.get(
  '/submissions',
  authMiddleware,
  isTeacherOrAdmin,
  apiLimiter,
  reviewController.getSubmissions,
);

// GET /teacher/submissions/:attemptId - Chi tiết submission
router.get(
  '/submissions/:attemptId',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.getSubmissionDetail,
);

// PUT /teacher/answers/:answerId/review - Review câu trả lời cụ thể
router.put(
  '/answers/:answerId/review',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.submitAnswerReview,
);

// PUT /teacher/answers/:answerId/score - Cập nhật điểm câu trả lời
router.put(
  '/answers/:answerId/score',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.updateAnswerScore,
);

// POST /teacher/attempts/:attemptId/review - Review toàn bộ lượt thi
router.post(
  '/attempts/:attemptId/review',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.submitAttemptReview,
);

// =====================================
// QUẢN LÝ SUBMISSION NÂNG CAO
// =====================================

// POST /teacher/submissions/regrade - Chấm lại submissions
router.post(
  '/submissions/regrade',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.regradeSubmissions,
);

// POST /teacher/submissions/bulk-update - Cập nhật hàng loạt trạng thái
router.post(
  '/submissions/bulk-update',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.bulkUpdateStatus,
);

// GET /teacher/submissions/stats - Thống kê chấm điểm
router.get(
  '/submissions/stats',
  authMiddleware,
  isTeacherOrAdmin,
  reviewController.getGradingStats,
);

// =====================================
// REPORT ROUTES - BÁO CÁO VÀ THỐNG KÊ
// =====================================

// GET /teacher/reports/exam-statistics/:examId - Thống kê chi tiết bài thi
router.get(
  '/reports/exam-statistics/:examId',
  authMiddleware,
  isTeacherOrAdmin,
  reportController.getExamStatistics,
);

// GET /teacher/reports/student-statistics - Thống kê học sinh
router.get(
  '/reports/student-statistics',
  authMiddleware,
  isTeacherOrAdmin,
  apiLimiter,
  reportController.getStudentStatistics,
);

// GET /teacher/reports/student/:studentId - Báo cáo chi tiết học sinh
router.get(
  '/reports/student/:studentId',
  authMiddleware,
  isTeacherOrAdmin,
  reportController.getStudentReport,
);

// GET /teacher/reports/export - Xuất báo cáo thống kê
router.get('/reports/export', authMiddleware, isTeacherOrAdmin, reportController.exportStatistics);

// =====================================
// SPEECH GENERATION - TẠO AUDIO
// =====================================

// POST /teacher/speech/generate - Generate audio from text for listening questions
router.post('/speech/generate', authMiddleware, isTeacherOrAdmin, async (req, res) => {
  try {
    const { text, language = 'en', filename } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Text is required for audio generation'
      });
    }
    
    // Import GTTSService
    const GTTSService = require('../services/GTTSService');
    
    // Generate audio file
    const audioInfo = await GTTSService.generateAudioFile(text.trim(), language, filename);
    
    res.json({
      success: true,
      message: 'Audio generated successfully',
      audioUrl: audioInfo.url,
      filename: audioInfo.filename,
      path: audioInfo.path
    });
    
  } catch (error) {
    console.error('Audio generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate audio',
      error: error.message
    });
  }
});

module.exports = router;
