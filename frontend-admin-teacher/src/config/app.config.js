// Application configuration
export const APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || 'APTIS Admin & Teacher',
  VERSION: '1.0.0',
  DESCRIPTION: 'Admin and Teacher Interface for APTIS Exam System',
  AUTHOR: 'APTIS Team',
};

// Routes configuration
export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  
  // Teacher routes (actual structure)
  TEACHER: {
    QUESTIONS: {
      LIST: '/teacher/questions',
      CREATE: '/teacher/questions/new',
      EDIT: (qId) => `/teacher/questions/${qId}`,
    },
    EXAMS: {
      LIST: '/teacher/exams',
      CREATE: '/teacher/exams/new',
      EDIT: (examId) => `/teacher/exams/${examId}`,
    },
    SUBMISSIONS: {
      LIST: '/teacher/submissions',
      DETAIL: (attemptId) => `/teacher/submissions/${attemptId}`,
    },
    REPORTS: {
      LIST: '/teacher/reports',
      DETAIL: (reportId) => `/teacher/reports/${reportId}`,
    },
    CRITERIA: {
      LIST: '/teacher/criteria',
    },
  },
  
  // Admin routes (actual structure)
  ADMIN: {
    USERS: {
      LIST: '/admin/users',
      EDIT: (userId) => `/admin/users/${userId}`,
    },
  },

};

// Question types configuration
export const QUESTION_TYPES = {
  // Grammar Questions (6 types)
  GRAMMAR_MCQ: {
    id: 'grammar_mcq',
    name: 'Grammar Multiple Choice',
    category: 'Grammar',
    description: 'Multiple choice questions for grammar assessment',
    hasOptions: true,
    hasItems: false,
    maxOptions: 4,
    allowMultipleAnswers: false,
    scoringMethod: 'automatic',
    timeLimit: 60, // seconds
    difficulty: ['easy', 'medium', 'hard'],
    supportedMedia: ['text'],
  },
  GRAMMAR_GAP_FILLING: {
    id: 'grammar_gap_filling',
    name: 'Grammar Gap Filling',
    category: 'Grammar',
    description: 'Fill in the blanks for grammar assessment',
    hasOptions: false,
    hasItems: true,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'automatic',
    timeLimit: 90,
    difficulty: ['easy', 'medium', 'hard'],
    supportedMedia: ['text'],
  },
  GRAMMAR_ORDERING: {
    id: 'grammar_ordering',
    name: 'Grammar Word Ordering',
    category: 'Grammar',
    description: 'Order words to form correct sentences',
    hasOptions: false,
    hasItems: true,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'automatic',
    timeLimit: 120,
    difficulty: ['medium', 'hard'],
    supportedMedia: ['text'],
  },
  GRAMMAR_TRANSFORMATION: {
    id: 'grammar_transformation',
    name: 'Grammar Transformation',
    category: 'Grammar',
    description: 'Transform sentences according to given rules',
    hasOptions: false,
    hasItems: false,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'automatic',
    timeLimit: 120,
    difficulty: ['medium', 'hard'],
    supportedMedia: ['text'],
  },
  GRAMMAR_ERROR_CORRECTION: {
    id: 'grammar_error_correction',
    name: 'Grammar Error Correction',
    category: 'Grammar',
    description: 'Identify and correct grammatical errors',
    hasOptions: false,
    hasItems: true,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'manual',
    timeLimit: 180,
    difficulty: ['medium', 'hard'],
    supportedMedia: ['text'],
  },
  GRAMMAR_COMPLETION: {
    id: 'grammar_completion',
    name: 'Grammar Completion',
    category: 'Grammar',
    description: 'Complete sentences with appropriate grammar',
    hasOptions: true,
    hasItems: false,
    maxOptions: 3,
    allowMultipleAnswers: false,
    scoringMethod: 'automatic',
    timeLimit: 90,
    difficulty: ['easy', 'medium'],
    supportedMedia: ['text'],
  },

  // Reading Questions (4 types)
  READING_MCQ: {
    id: 'reading_mcq',
    name: 'Reading Multiple Choice',
    category: 'Reading',
    description: 'Multiple choice questions based on reading passages',
    hasOptions: true,
    hasItems: false,
    maxOptions: 4,
    allowMultipleAnswers: false,
    scoringMethod: 'automatic',
    timeLimit: 180,
    difficulty: ['easy', 'medium', 'hard'],
    supportedMedia: ['text', 'image'],
  },
  READING_TRUE_FALSE: {
    id: 'reading_true_false',
    name: 'Reading True/False',
    category: 'Reading',
    description: 'True/False questions based on reading passages',
    hasOptions: true,
    hasItems: false,
    maxOptions: 2,
    allowMultipleAnswers: false,
    scoringMethod: 'automatic',
    timeLimit: 120,
    difficulty: ['easy', 'medium'],
    supportedMedia: ['text', 'image'],
  },
  READING_MATCHING: {
    id: 'reading_matching',
    name: 'Reading Matching',
    category: 'Reading',
    description: 'Match items based on reading passages',
    hasOptions: false,
    hasItems: true,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'automatic',
    timeLimit: 240,
    difficulty: ['medium', 'hard'],
    supportedMedia: ['text', 'image'],
  },
  READING_SHORT_ANSWER: {
    id: 'reading_short_answer',
    name: 'Reading Short Answer',
    category: 'Reading',
    description: 'Short answer questions based on reading passages',
    hasOptions: false,
    hasItems: false,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'manual',
    timeLimit: 300,
    difficulty: ['medium', 'hard'],
    supportedMedia: ['text', 'image'],
  },

  // Listening Questions (5 types)
  LISTENING_MCQ: {
    id: 'listening_mcq',
    name: 'Listening Multiple Choice',
    category: 'Listening',
    description: 'Multiple choice questions based on audio',
    hasOptions: true,
    hasItems: false,
    maxOptions: 4,
    allowMultipleAnswers: false,
    scoringMethod: 'automatic',
    timeLimit: 180,
    difficulty: ['easy', 'medium', 'hard'],
    supportedMedia: ['audio', 'image'],
  },
  LISTENING_GAP_FILLING: {
    id: 'listening_gap_filling',
    name: 'Listening Gap Filling',
    category: 'Listening',
    description: 'Fill in blanks while listening to audio',
    hasOptions: false,
    hasItems: true,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'automatic',
    timeLimit: 240,
    difficulty: ['medium', 'hard'],
    supportedMedia: ['audio', 'text'],
  },
  LISTENING_MATCHING: {
    id: 'listening_matching',
    name: 'Listening Matching',
    category: 'Listening',
    description: 'Match items based on audio content',
    hasOptions: false,
    hasItems: true,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'automatic',
    timeLimit: 300,
    difficulty: ['medium', 'hard'],
    supportedMedia: ['audio', 'text', 'image'],
  },
  LISTENING_NOTE_COMPLETION: {
    id: 'listening_note_completion',
    name: 'Listening Note Completion',
    category: 'Listening',
    description: 'Complete notes while listening to audio',
    hasOptions: false,
    hasItems: true,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'automatic',
    timeLimit: 360,
    difficulty: ['medium', 'hard'],
    supportedMedia: ['audio', 'text'],
  },
  LISTENING_SHORT_ANSWER: {
    id: 'listening_short_answer',
    name: 'Listening Short Answer',
    category: 'Listening',
    description: 'Short answer questions based on audio',
    hasOptions: false,
    hasItems: false,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'manual',
    timeLimit: 300,
    difficulty: ['medium', 'hard'],
    supportedMedia: ['audio'],
  },

  // Writing Questions - 3 tasks per APTIS Technical Report
    scoringMethod: 'manual',
    timeLimit: 1800, // 30 minutes
    difficulty: ['medium', 'hard'],
    supportedMedia: ['text', 'image'],
    wordLimit: { min: 150, max: 250 },
  },
  WRITING_REPORT: {
    id: 'writing_report',
    name: 'Writing Report',
    category: 'Writing',
    description: 'Report writing tasks',
    hasOptions: false,
    hasItems: false,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'manual',
    timeLimit: 1500, // 25 minutes
    difficulty: ['medium', 'hard'],
    supportedMedia: ['text', 'image'],
    wordLimit: { min: 120, max: 180 },
  },

  // Speaking Questions (2 types)
  SPEAKING_MONOLOGUE: {
    id: 'speaking_monologue',
    name: 'Speaking Monologue',
    category: 'Speaking',
    description: 'Individual speaking tasks',
    hasOptions: false,
    hasItems: false,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'manual',
    timeLimit: 180, // 3 minutes
    difficulty: ['medium', 'hard'],
    supportedMedia: ['text', 'image', 'audio'],
    recordingLimit: 120, // 2 minutes max recording
  },
  SPEAKING_DIALOGUE: {
    id: 'speaking_dialogue',
    name: 'Speaking Dialogue',
    category: 'Speaking',
    description: 'Conversation-based speaking tasks',
    hasOptions: false,
    hasItems: false,
    maxOptions: 0,
    allowMultipleAnswers: false,
    scoringMethod: 'manual',
    timeLimit: 300, // 5 minutes
    difficulty: ['hard'],
    supportedMedia: ['text', 'image', 'audio'],
    recordingLimit: 240, // 4 minutes max recording
  },
};

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  EASY: { value: 'easy', label: 'Easy', color: 'success' },
  MEDIUM: { value: 'medium', label: 'Medium', color: 'warning' },
  HARD: { value: 'hard', label: 'Hard', color: 'error' },
};

// User roles
export const USER_ROLES = {
  ADMIN: { value: 'admin', label: 'Administrator', permissions: ['*'] },
  TEACHER: { value: 'teacher', label: 'Teacher', permissions: ['teacher:*'] },
  STUDENT: { value: 'student', label: 'Student', permissions: ['student:*'] },
};

// Exam status
export const EXAM_STATUS = {
  DRAFT: { value: 'draft', label: 'Draft', color: 'default' },
  PUBLISHED: { value: 'published', label: 'Published', color: 'primary' },
  ACTIVE: { value: 'active', label: 'Active', color: 'success' },
  INACTIVE: { value: 'inactive', label: 'Inactive', color: 'error' },
};

// Submission status
export const SUBMISSION_STATUS = {
  IN_PROGRESS: { value: 'in_progress', label: 'In Progress', color: 'info' },
  SUBMITTED: { value: 'submitted', label: 'Submitted', color: 'warning' },
  GRADED: { value: 'graded', label: 'Graded', color: 'success' },
  EXPIRED: { value: 'expired', label: 'Expired', color: 'error' },
};

// Pagination configuration
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_ITEMS_PER_PAGE: 100,
};

// File upload configuration
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    AUDIO: ['mp3', 'wav', 'ogg', 'm4a'],
    VIDEO: ['mp4', 'webm', 'ogg'],
    DOCUMENT: ['pdf', 'doc', 'docx'],
  },
  UPLOAD_URL: '/api/upload',
};

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Please contact administrator.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Item created successfully.',
  UPDATED: 'Item updated successfully.',
  DELETED: 'Item deleted successfully.',
  SAVED: 'Changes saved successfully.',
  UPLOADED: 'File uploaded successfully.',
  PUBLISHED: 'Item published successfully.',
  SUBMITTED: 'Submission completed successfully.',
};

// Notification settings
export const NOTIFICATION = {
  DEFAULT_DURATION: 5000, // 5 seconds
  SUCCESS_DURATION: 3000, // 3 seconds
  ERROR_DURATION: 8000, // 8 seconds
  WARNING_DURATION: 6000, // 6 seconds
};

// Date format configuration
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_TIME: 'MMM dd, yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  INPUT_TIME: 'yyyy-MM-dd HH:mm',
  API: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
};

export default APP_CONFIG;