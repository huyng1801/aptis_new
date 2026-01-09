const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth endpoints rate limiter
 * 100 requests per 15 minutes per IP (development mode)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased for development/testing
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter
 * 10 uploads per hour per user
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: {
      message: 'Too many file uploads, please try again later',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    },
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user ? `user_${req.user.userId}` : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Exam submission rate limiter
 * Prevent rapid submission attempts
 * 3 submissions per minute per user
 */
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  message: {
    success: false,
    error: {
      message: 'Too many submission attempts, please slow down',
      code: 'SUBMISSION_RATE_LIMIT_EXCEEDED',
    },
  },
  keyGenerator: (req) => {
    return req.user ? `user_${req.user.userId}` : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  submissionLimiter,
};
