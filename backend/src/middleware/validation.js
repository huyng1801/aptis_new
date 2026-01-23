
// ============================================================
// Middleware kiểm tra dữ liệu đầu vào (validate) sử dụng Joi
// ============================================================
const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

/**
 * Middleware kiểm tra dữ liệu đầu vào (validate) sử dụng Joi
 * @param {object} schema - Định nghĩa schema Joi
 * @param {string} source - Nguồn dữ liệu cần kiểm tra ('body', 'params', 'query')
 * Khi hợp lệ sẽ thay thế req[source] bằng dữ liệu đã validate & làm sạch
 * Cách sử dụng: app.post('/user', validate(userSchemas.createUser, 'body'), controller)
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    // Nếu không có schema thì bỏ qua middleware
    if (!schema) {
      return next();
    }

    const dataToValidate = req[source];

    // Validate dữ liệu theo schema
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Trả về tất cả lỗi, không dừng ở lỗi đầu tiên
      stripUnknown: true, // Loại bỏ các trường không khai báo trong schema
    });

    if (error) {
      // Nếu có lỗi, trả về ValidationError với danh sách lỗi chi tiết
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(new ValidationError('Dữ liệu gửi lên không hợp lệ', errors));
    }

    // Thay thế dữ liệu request bằng dữ liệu đã được kiểm tra và làm sạch
    req[source] = value;
    next();
  };
};

/**
 * ============================================================
 * Các schema Joi kiểm tra dữ liệu cho các chức năng phổ biến
 * ============================================================
 */

// Schema cho xác thực (đăng ký, đăng nhập, đổi mật khẩu...)
const authSchemas = {
  // Đăng ký tài khoản mới
  register: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(255).required(),
    phone: Joi.string()
      .pattern(/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,15}$/)
      .optional(),
    role: Joi.string().valid('student', 'teacher').optional().default('student'),
  }),

  // Đăng nhập
  login: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    password: Joi.string().required(),
  }),

  // Quên mật khẩu
  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  // Reset mật khẩu với token
  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  }),

  // Đổi mật khẩu (khi đã đăng nhập)
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  }),

  // Refresh token
  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

// Schema cho quản lý người dùng
const userSchemas = {
  // Tạo tài khoản (admin)
  createUser: Joi.object({
    email: Joi.string().email().required(),
    full_name: Joi.string().min(2).max(255).required(),
    role: Joi.string().valid('admin', 'teacher', 'student').required(),
    phone: Joi.string()
      .pattern(/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,15}$/)
      .optional(),
    status: Joi.string().valid('active', 'inactive').optional().default('active'),
  }),

  // Cập nhật tài khoản (admin)
  updateUser: Joi.object({
    full_name: Joi.string().min(2).max(255).optional(),
    phone: Joi.string()
      .pattern(/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,15}$/)
      .optional(),
    status: Joi.string().valid('active', 'inactive', 'banned').optional(),
  }),

  // Cập nhật profile (user cập nhật chính mình)
  updateProfile: Joi.object({
    full_name: Joi.string().min(2).max(255).optional(),
    phone: Joi.string()
      .pattern(/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,15}$/)
      .optional(),
  }),
};

// Schema cho quản lý đề thi
const examSchemas = {
  // Tạo đề thi
  createExam: Joi.object({
    aptis_type_id: Joi.number().integer().positive().required(),
    title: Joi.string().min(3).max(255).required(),
    description: Joi.string().optional(),
  }),

  // Cập nhật đề thi
  updateExam: Joi.object({
    title: Joi.string().min(3).max(255).optional(),
    description: Joi.string().optional(),
    duration_minutes: Joi.number().integer().positive().optional(),
    status: Joi.string().valid('draft', 'published', 'archived').optional(),
  }),

  // Thêm phần thi vào đề thi
  addSection: Joi.object({
    skill_type_id: Joi.number().integer().positive().required(),
    section_order: Joi.number().integer().positive().required(),
    duration_minutes: Joi.number().integer().positive().optional(),
    instruction: Joi.string().optional(),
  }),

  // Cập nhật phần thi
  updateSection: Joi.object({
    skill_type_id: Joi.number().integer().positive().optional(),
    duration_minutes: Joi.number().integer().positive().optional(),
    instruction: Joi.string().optional(),
  }),

  // Thêm câu hỏi vào phần thi
  addQuestion: Joi.object({
    question_id: Joi.number().integer().positive().required(),
    question_order: Joi.number().integer().positive().required(),
    max_score: Joi.number().positive().required(),
  }),
};

// Schema cho quản lý câu hỏi
const questionSchemas = {
  // Tạo câu hỏi
  createQuestion: Joi.object({
    question_type_id: Joi.number().integer().positive().required(),
    aptis_type_id: Joi.number().integer().positive().required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
    content: Joi.string().required(),
    media_url: Joi.string().allow('').allow(null).optional(),
    duration_seconds: Joi.number().integer().positive().allow(null).optional(),
    status: Joi.string().valid('draft', 'active').optional(),
  }),

  // Cập nhật câu hỏi
  updateQuestion: Joi.object({
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
    content: Joi.string().optional(),
    media_url: Joi.string().allow('').allow(null).optional(),
    duration_seconds: Joi.number().integer().positive().allow(null).optional(),
    status: Joi.string().valid('draft', 'active', 'inactive').optional(),
  }),
};

// Schema cho quản lý lượt làm bài
const attemptSchemas = {
  // Bắt đầu làm bài thi
  startAttempt: Joi.object({
    exam_id: Joi.number().integer().positive().required(),
    attempt_type: Joi.string().valid('full_exam', 'single_skill').required(),
    selected_skill_id: Joi.number().integer().positive().allow(null).optional(),
  }),

  // Lưu câu trả lời (nháp)
  saveAnswer: Joi.object({
    question_id: Joi.number().integer().positive().required(),
    answer_type: Joi.string().valid('option', 'text', 'audio', 'json').required(),
    selected_option_id: Joi.number().integer().positive().optional(),
    answer_json: Joi.string().optional(),
    text_answer: Joi.string().optional(),
  }),

  // Nộp câu trả lời
  submitAnswer: Joi.object({
    question_id: Joi.number().integer().positive().required(),
    answer_type: Joi.string().valid('option', 'text', 'audio', 'json').required(),
    selected_option_id: Joi.number().integer().positive().optional(),
    answer_json: Joi.string().optional(),
    text_answer: Joi.string().optional(),
  }),
};

// Schema cho tiêu chí chấm điểm AI
const criteriaSchemas = {
  // Tạo tiêu chí chấm điểm
  createCriteria: Joi.object({
    aptis_type_id: Joi.number().integer().positive().required(),
    question_type_id: Joi.number().integer().positive().required(),
    criteria_name: Joi.string().min(2).max(255).required(),
    weight: Joi.number().positive().max(100).optional().default(1.0),
    description: Joi.string().min(1).required(),
    rubric_prompt: Joi.string().required(),
    max_score: Joi.number().positive().required(),
  }),

  // Cập nhật tiêu chí chấm điểm
  updateCriteria: Joi.object({
    criteria_name: Joi.string().min(2).max(255).optional(),
    weight: Joi.number().positive().max(100).optional(),
    description: Joi.string().min(1).required(),
    rubric_prompt: Joi.string().optional(),
    max_score: Joi.number().positive().optional(),
  }),
};

module.exports = {
  validate,
  authSchemas,
  userSchemas,
  examSchemas,
  questionSchemas,
  attemptSchemas,
  criteriaSchemas,
};
