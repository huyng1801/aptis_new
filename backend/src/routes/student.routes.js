const express = require('express');
const router = express.Router();
const examController = require('../controllers/studentController/examController');
const attemptController = require('../controllers/studentController/attemptController');
const answerController = require('../controllers/studentController/answerController');
const resultController = require('../controllers/studentController/resultController');
const dashboardController = require('../controllers/studentController/dashboardController');
const practiceController = require('../controllers/studentController/practiceController');
const { authMiddleware } = require('../middleware/auth');
const { isStudent } = require('../middleware/roleCheck');
const { validate, examSchemas, attemptSchemas } = require('../middleware/validation');
const { apiLimiter, uploadLimiter, submissionLimiter } = require('../middleware/rateLimiter');
const upload = require('../config/storage');

// Dashboard routes
router.get('/dashboard/stats', authMiddleware, isStudent, apiLimiter, dashboardController.getStats);
router.get('/dashboard/recent-attempts', authMiddleware, isStudent, apiLimiter, dashboardController.getRecentAttempts);

// Exam routes
router.get('/exams', authMiddleware, isStudent, apiLimiter, examController.getExams);

router.get('/exams/:examId', authMiddleware, isStudent, examController.getExamDetails);

router.get('/exams/:examId/skills', authMiddleware, isStudent, examController.getExamSkills);

router.get('/attempts', authMiddleware, isStudent, apiLimiter, examController.getMyAttempts);

// Attempt routes
router.post(
  '/attempts',
  authMiddleware,
  isStudent,
  validate(attemptSchemas.startAttempt),
  attemptController.startAttempt,
);

router.get('/attempts/:attemptId', authMiddleware, isStudent, attemptController.getAttempt);

router.get('/attempts/:attemptId/questions', authMiddleware, isStudent, attemptController.getAttemptQuestions);

router.post(
  '/attempts/:attemptId/submit',
  authMiddleware,
  isStudent,
  submissionLimiter,
  attemptController.submitAttempt,
);

// Answer routes
router.post(
  '/attempts/:attemptId/answers',
  authMiddleware,
  isStudent,
  validate(attemptSchemas.saveAnswer),
  answerController.saveAnswer,
);

router.post(
  '/attempts/:attemptId/answers/audio',
  authMiddleware,
  isStudent,
  uploadLimiter,
  upload.single('audio'),
  answerController.uploadAudioAnswer,
);

// Result routes
router.get('/attempts/:attemptId/results', authMiddleware, isStudent, resultController.getResults);

router.get(
  '/attempts/:attemptId/answers/:answerId/feedback',
  authMiddleware,
  isStudent,
  resultController.getAnswerFeedback,
);

// Practice routes
router.get('/practice/questions', authMiddleware, isStudent, apiLimiter, practiceController.getPracticeQuestions);

router.post(
  '/practice/submit',
  authMiddleware,
  isStudent,
  practiceController.submitPracticeAnswer,
);

router.get('/practice/stats', authMiddleware, isStudent, apiLimiter, practiceController.getPracticeStats);

module.exports = router;
