const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

/**
 * Validation middleware factory
 * @param {object} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'params', 'query')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    // Guard against undefined schema
    if (!schema) {
      console.warn(`[Validation] Schema is undefined for ${req.path}`);
      return next();
    }

    const dataToValidate = req[source];

    console.log(`[Validation] ${req.path} - source: ${source}, data:`, dataToValidate);

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      console.log(`[Validation] Errors found:`, error.details);
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ValidationError('Validation failed', errors));
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
};

// Common validation schemas

const authSchemas = {
  register: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } }) // Allow any TLD including .local
      .required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(255).required(),
    phone: Joi.string()
      .pattern(/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,15}$/)
      .optional(),
    role: Joi.string().valid('student', 'teacher').optional().default('student'),
  }),

  login: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } }) // Allow any TLD including .local
      .required(),
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

const userSchemas = {
  createUser: Joi.object({
    email: Joi.string().email().required(),
    full_name: Joi.string().min(2).max(255).required(),
    role: Joi.string().valid('admin', 'teacher', 'student').required(),
    phone: Joi.string()
      .pattern(/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,15}$/)
      .optional(),
    status: Joi.string().valid('active', 'inactive').optional().default('active'),
  }),

  updateUser: Joi.object({
    full_name: Joi.string().min(2).max(255).optional(),
    phone: Joi.string()
      .pattern(/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,15}$/)
      .optional(),
    status: Joi.string().valid('active', 'inactive', 'banned').optional(),
  }),

  updateProfile: Joi.object({
    full_name: Joi.string().min(2).max(255).optional(),
    phone: Joi.string()
      .pattern(/^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,15}$/)
      .optional(),
  }),
};

const examSchemas = {
  createExam: Joi.object({
    aptis_type_id: Joi.number().integer().positive().required(),
    title: Joi.string().min(3).max(255).required(),
    description: Joi.string().optional(),
    duration_minutes: Joi.number().integer().positive().required(),
  }),

  updateExam: Joi.object({
    title: Joi.string().min(3).max(255).optional(),
    description: Joi.string().optional(),
    duration_minutes: Joi.number().integer().positive().optional(),
    status: Joi.string().valid('draft', 'published', 'archived').optional(),
  }),

  addSection: Joi.object({
    skill_type_id: Joi.number().integer().positive().required(),
    section_order: Joi.number().integer().positive().required(),
    duration_minutes: Joi.number().integer().positive().optional(),
    instruction: Joi.string().optional(),
  }),

  updateSection: Joi.object({
    skill_type_id: Joi.number().integer().positive().optional(),
    duration_minutes: Joi.number().integer().positive().optional(),
    instruction: Joi.string().optional(),
  }),

  addQuestion: Joi.object({
    question_id: Joi.number().integer().positive().required(),
    question_order: Joi.number().integer().positive().required(),
    max_score: Joi.number().positive().required(),
  }),
};

const questionSchemas = {
  createQuestion: Joi.object({
    question_type_id: Joi.number().integer().positive().required(),
    aptis_type_id: Joi.number().integer().positive().required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
    content: Joi.string().required(),
    media_url: Joi.string().allow('').allow(null).optional(),
    duration_seconds: Joi.number().integer().positive().allow(null).optional(),
    status: Joi.string().valid('draft', 'active').optional(),
  }),

  updateQuestion: Joi.object({
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
    content: Joi.string().optional(),
    media_url: Joi.string().allow('').allow(null).optional(),
    duration_seconds: Joi.number().integer().positive().allow(null).optional(),
    status: Joi.string().valid('draft', 'active', 'inactive').optional(),
  }),
};

const attemptSchemas = {
  startAttempt: Joi.object({
    exam_id: Joi.number().integer().positive().required(),
    attempt_type: Joi.string().valid('full_exam', 'single_skill').required(),
    selected_skill_id: Joi.number().integer().positive().allow(null).optional(),
  }),

  saveAnswer: Joi.object({
    question_id: Joi.number().integer().positive().required(),
    answer_type: Joi.string().valid('option', 'text', 'audio', 'json').required(),
    selected_option_id: Joi.number().integer().positive().optional(),
    answer_json: Joi.string().optional(),
    text_answer: Joi.string().optional(),
  }),

  submitAnswer: Joi.object({
    question_id: Joi.number().integer().positive().required(),
    answer_type: Joi.string().valid('option', 'text', 'audio', 'json').required(),
    selected_option_id: Joi.number().integer().positive().optional(),
    answer_json: Joi.string().optional(),
    text_answer: Joi.string().optional(),
  }),
};

const criteriaSchemas = {
  createCriteria: Joi.object({
    aptis_type_id: Joi.number().integer().positive().required(),
    question_type_id: Joi.number().integer().positive().required(),
    criteria_name: Joi.string().min(2).max(255).required(),
    weight: Joi.number().positive().max(100).optional().default(1.0),
    description: Joi.string().min(1).required(),
    rubric_prompt: Joi.string().required(),
    max_score: Joi.number().positive().required(),
  }),

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
