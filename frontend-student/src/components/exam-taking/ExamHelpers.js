// Helper functions for exam taking
export const getSkillFromQuestionType = (code) => {
  if (!code) return 'Khác';
  
  if (code.includes('READING') || code === 'GV_MCQ' || code === 'GV_GAP_FILL' || code === 'GV_MATCHING') {
    return 'Reading';
  }
  if (code.includes('LISTENING')) {
    return 'Listening';
  }
  if (code.includes('WRITING')) {
    return 'Writing';
  }
  if (code.includes('SPEAKING')) {
    return 'Speaking';
  }
  return 'Khác';
};

export const getSectionFromQuestionType = (code) => {
  if (!code) return 'Phần khác';
  
  // Reading sections
  if (code.includes('GAP_FILL')) return 'Gap Filling';
  if (code.includes('ORDERING')) return 'Ordering';
  if (code.includes('MATCHING_HEADINGS')) return 'Matching Headings';
  if (code.includes('MATCHING')) return 'Matching';
  if (code.includes('MCQ') || code.includes('TRUE_FALSE')) return 'Multiple Choice';
  
  // Listening sections
  if (code === 'LISTENING_MCQ') return 'Multiple Choice';
  if (code === 'LISTENING_MATCHING') return 'Speaker Matching';
  if (code === 'LISTENING_STATEMENT_MATCHING') return 'Statement Matching';
  
  // Writing sections
  if (code === 'WRITING_SHORT') return 'Short Answers';
  if (code === 'WRITING_FORM') return 'Form Filling';
  if (code === 'WRITING_LONG') return 'Chat Responses';
  if (code === 'WRITING_EMAIL') return 'Email Writing';
  
  // Speaking sections
  if (code === 'SPEAKING_INTRO') return 'Personal Introduction';
  if (code === 'SPEAKING_DESCRIPTION') return 'Picture Description';
  if (code === 'SPEAKING_COMPARISON') return 'Comparison';
  if (code === 'SPEAKING_DISCUSSION') return 'Topic Discussion';
  
  return 'Phần khác';
};

export const getQuestionTypeLabel = (code) => {
  const typeNameMap = {
    'GV_MCQ': 'Multiple Choice',
    'GV_GAP_FILL': 'Gap Filling',
    'GV_MATCHING': 'Matching',
    'READING_MCQ': 'Multiple Choice',
    'READING_TRUE_FALSE': 'True/False',
    'READING_GAP_FILL': 'Gap Filling',
    'READING_ORDERING': 'Ordering',
    'READING_MATCHING': 'Matching',
    'READING_MATCHING_HEADINGS': 'Matching Headings',
    'LISTENING_MCQ': 'Multiple Choice',
    'LISTENING_MATCHING': 'Speaker Matching',
    'LISTENING_STATEMENT_MATCHING': 'Statement Matching',
    'WRITING_SHORT': 'Short Answers',
    'WRITING_EMAIL': 'Email Writing',
    'WRITING_LONG': 'Chat Responses',
    'WRITING_ESSAY': 'Essay Writing',
    'WRITING_FORM': 'Form Filling',
    'SPEAKING_INTRO': 'Personal Introduction',
    'SPEAKING_DESCRIPTION': 'Picture Description',
    'SPEAKING_COMPARISON': 'Comparison',
    'SPEAKING_DISCUSSION': 'Topic Discussion',
  };
  return typeNameMap[code] || code;
};

// Helper function to group questions by skill
export const groupQuestionsBySkill = (questions) => {
  const grouped = {};
  questions.forEach(q => {
    // Questions are answer objects with nested question.questionType.skill_type_id
    const skillId = q.question?.questionType?.skill_type_id || 'unknown';
    if (!grouped[skillId]) {
      grouped[skillId] = [];
    }
    grouped[skillId].push(q);
  });
  return grouped;
};

// Helper function to group questions by section
export const groupQuestionsBySection = (skillQuestions) => {
  const grouped = {};
  skillQuestions.forEach(q => {
    const sectionId = q.section_id || 'general';
    const sectionName = q.section?.section_name || q.section_name || 'General';
    if (!grouped[sectionId]) {
      grouped[sectionId] = {
        name: sectionName,
        questions: []
      };
    }
    grouped[sectionId].questions.push(q);
  });
  return grouped;
};

// Fallback skills for error cases
export const getFallbackSkills = () => [
  { id: 1, skill_type_name: 'Grammar & Vocabulary', description: 'Test your grammar and vocabulary knowledge' },
  { id: 2, skill_type_name: 'Reading', description: 'Reading comprehension exercises' },
  { id: 3, skill_type_name: 'Writing', description: 'Writing tasks and essays' },
  { id: 4, skill_type_name: 'Listening', description: 'Listening comprehension tests' },
  { id: 5, skill_type_name: 'Speaking', description: 'Speaking and pronunciation practice' }
];