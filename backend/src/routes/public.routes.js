/**
 * =================================================================
 * PUBLIC ROUTES - ĐỊNH TUYẾN CÔNG KHAI
 * =================================================================
 * 
 * File này quản lý các route công khai không yêu cầu xác thực:
 * - Lấy thông tin constants (APTIS types, Skill types, Question types)
 * - AI Testing endpoints (cho development/testing)
 * - Các endpoint khác có thể truy cập mà không cần đăng nhập
 * 
 * Tất cả routes đều có apiLimiter để tránh spam
 * =================================================================
 */

const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const aiTestController = require('../controllers/aiTestController');
const practiceController = require('../controllers/studentController/practiceController');
const { apiLimiter } = require('../middleware/rateLimiter');

// =====================================
// CONSTANTS - THÔNG TIN CƠ BẢN
// =====================================

// GET /public/aptis-types - Lấy tất cả loại APTIS (chỉ constants)
router.get('/aptis-types', apiLimiter, publicController.getAptisTypes);

// GET /public/skill-types - Lấy tất cả loại kỹ năng (chỉ constants)
router.get('/skill-types', apiLimiter, publicController.getSkillTypes);

// GET /public/question-types - Lấy tất cả loại câu hỏi (chỉ constants)
router.get('/question-types', apiLimiter, publicController.getQuestionTypes);

// =====================================
// AI TESTING ENDPOINTS - KIỂM THỬ AI
// =====================================
// Các endpoint này dùng cho development và testing AI

// GET /public/ai/status - Kiểm tra trạng thái các dịch vụ AI
// Kiểm tra sức khỏe của Database, Gemini API, AI Criteria
// Response: status của từng service và số lượng criteria
router.get('/ai/status', aiTestController.getAiStatus);

// POST /public/ai/test - Test chấm điểm AI với text mẫu
// Gửi text sample để kiểm tra API chấm điểm AI có hoạt động không
// Body: { text_answer: "sample text..." } (optional)
// Response: kết quả test với score và feedback
router.post('/ai/test', aiTestController.testAiScoring);

// GET /public/ai/queue - Lấy trạng thái hàng đợi chấm điểm AI
// Kiểm tra số lượng jobs pending, completed, failed
// Response: thống kê trạng thái queue
router.get('/ai/queue', aiTestController.getQueueStatus);

// GET /public/ai/criteria - Lấy danh sách tiêu chí chấm điểm AI
// Query params: aptis_type_id (required), question_type_id (optional)
// Response: AI criteria grouped by question type
router.get('/ai/criteria', aiTestController.getAiCriteria);

// POST /public/ai/requeue - Đưa lại các câu trả lời pending vào queue chấm điểm AI
// Tìm tất cả pending answers và requeue để AI chấm lại
// Rate limiting: 1 request/second để tôn trọng quota free tier
// Query params: limit (max answers to requeue, default: 100)
// Response: summary với total_found, requeued, failed, estimated_time
router.post('/ai/requeue', aiTestController.requeuPendingAnswers);

// GET /public/questions/writing - Lấy tất cả câu hỏi Writing để test dynamic content
// Dùng cho testing và development
router.get('/questions/writing', apiLimiter, publicController.getWritingQuestions);

// =====================================
// PRACTICE ROUTES - LUYỆN TẬP (PUBLIC)
// =====================================
// Practice endpoints accessible without authentication
// Students can view available skills and exams for practice

// GET /public/practice/skills - Lấy danh sách skills cho practice
router.get('/practice/skills', apiLimiter, practiceController.getSkillsForPractice);

// GET /public/practice/skills/:skillId/exams - Lấy exams có skill này
router.get('/practice/skills/:skillId/exams', apiLimiter, practiceController.getExamsForSkill);

// GET /public/practice/exams/:examId/skills/:skillId/questions - Lấy questions của exam theo skill
router.get('/practice/exams/:examId/skills/:skillId/questions', apiLimiter, practiceController.getExamQuestionsForSkill);

module.exports = router;
