// Constants matching backend seed data exactly
export const APTIS_TYPES = [
  {
    code: 'APTIS_GENERAL',
    name: 'APTIS General', 
    description: 'General English test for all purposes',
  },
  {
    code: 'APTIS_ADVANCED', 
    name: 'APTIS Advanced',
    description: 'Advanced level English test',
  },
  {
    code: 'APTIS_FOR_TEACHERS',
    name: 'APTIS for Teachers', 
    description: 'English test specifically for teachers',
  },
  {
    code: 'APTIS_FOR_TEENS',
    name: 'APTIS for Teens',
    description: 'English test for teenagers (13-17)',
  },
];

export const SKILL_TYPES = [
  {
    code: 'GRAMMAR_VOCABULARY',
    name: 'Grammar and Vocabulary',
    description: 'Test grammar rules and vocabulary knowledge',
    order: 1,
  },
  {
    code: 'READING', 
    name: 'Reading',
    description: 'Test reading comprehension skills',
    order: 2,
  },
  {
    code: 'LISTENING',
    name: 'Listening', 
    description: 'Test listening comprehension skills',
    order: 3,
  },
  {
    code: 'WRITING',
    name: 'Writing',
    description: 'Test written communication skills', 
    order: 4,
  },
  {
    code: 'SPEAKING',
    name: 'Speaking',
    description: 'Test spoken communication skills',
    order: 5,
  },
];

export const QUESTION_TYPES = {
  // Grammar & Vocabulary
  GRAMMAR_VOCABULARY: [
    {
      code: 'GV_MCQ',
      name: 'Multiple Choice',
      scoring: 'auto',
      component: 'MCQForm',
    },
    {
      code: 'GV_GAP_FILL', 
      name: 'Gap Filling',
      scoring: 'auto',
      component: 'GapFillingForm',
    },
    {
      code: 'GV_MATCHING',
      name: 'Matching',
      scoring: 'auto', 
      component: 'MatchingForm',
    },
  ],
  
  // Reading
  READING: [
    {
      code: 'READING_MCQ',
      name: 'Multiple Choice',
      scoring: 'auto',
      component: 'MCQForm',
    },
    {
      code: 'READING_TRUE_FALSE',
      name: 'True/False',
      scoring: 'auto',
      component: 'TrueFalseForm',
    },
    {
      code: 'READING_MATCHING',
      name: 'Matching Headings',
      scoring: 'auto',
      component: 'MatchingForm',
    },
  ],
  
  // Listening  
  LISTENING: [
    {
      code: 'LISTENING_MCQ',
      name: 'Multiple Choice',
      scoring: 'auto',
      component: 'MCQForm',
    },
    {
      code: 'LISTENING_GAP_FILL',
      name: 'Gap Filling',
      scoring: 'auto',
      component: 'GapFillingForm', 
    },
    {
      code: 'LISTENING_MATCHING',
      name: 'Matching',
      scoring: 'auto',
      component: 'MatchingForm',
    },
    {
      code: 'LISTENING_NOTE_COMPLETION',
      name: 'Note Completion', 
      scoring: 'auto',
      component: 'NoteCompletionForm',
    },
  ],
  
  // Writing - Based on APTIS Technical Report (3 tasks)
  WRITING: [
    {
      code: 'WRITING_FORM',
      name: 'Form Filling (A2 - 20-30 words)',
      scoring: 'ai',
      component: 'WritingPromptForm',
    },
    {
      code: 'WRITING_LONG', 
      name: 'Chat Responses (B1 - 30-40 words)',
      scoring: 'ai',
      component: 'WritingPromptForm',
    },
    {
      code: 'WRITING_EMAIL',
      name: 'Email Writing (B2 - friend & authority)',
      scoring: 'ai', 
      component: 'WritingPromptForm',
    },
    // WRITING_ESSAY removed per APTIS Technical Report  
  ],
  
  // Speaking
  SPEAKING: [
    {
      code: 'SPEAKING_INTRO',
      name: 'Personal Introduction',
      scoring: 'ai',
      component: 'SpeakingTaskForm',
    },
    {
      code: 'SPEAKING_DESCRIPTION',
      name: 'Picture Description', 
      scoring: 'ai',
      component: 'SpeakingTaskForm',
    },
    {
      code: 'SPEAKING_COMPARISON',
      name: 'Comparison',
      scoring: 'ai',
      component: 'SpeakingTaskForm',
    },
    {
      code: 'SPEAKING_DISCUSSION',
      name: 'Topic Discussion',
      scoring: 'ai', 
      component: 'SpeakingTaskForm',
    },
  ],
};

export const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Dễ', color: '#4caf50' },
  { value: 'medium', label: 'Trung bình', color: '#ff9800' },
  { value: 'hard', label: 'Khó', color: '#f44336' },
];

export const SCORING_METHODS = [
  { value: 'auto', label: 'Tự động', description: 'Hệ thống chấm điểm tự động' },
  { value: 'ai', label: 'AI', description: 'AI chấm điểm theo tiêu chí' },
  { value: 'manual', label: 'Thủ công', description: 'Giáo viên chấm điểm' },
];

// Helper functions
export const getQuestionTypesBySkill = (skillCode) => {
  return QUESTION_TYPES[skillCode] || [];
};

export const getSkillByCode = (code) => {
  return SKILL_TYPES.find(skill => skill.code === code);
};

export const getAptisTypeByCode = (code) => {
  return APTIS_TYPES.find(aptis => aptis.code === code);
};

export const getQuestionTypeByCode = (code) => {
  for (const skill in QUESTION_TYPES) {
    const questionType = QUESTION_TYPES[skill].find(qt => qt.code === code);
    if (questionType) return questionType;
  }
  return null;
};

export const getDifficultyConfig = (level) => {
  return DIFFICULTY_LEVELS.find(d => d.value === level);
};