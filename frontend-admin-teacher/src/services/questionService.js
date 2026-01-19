import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '@/config/api.config';

// Helper to ensure response data is always defined (handles 304 responses)
const getResponseData = (response, defaultValue = null) => {
  return response.data ?? defaultValue;
};

export const questionApi = {
  // Get all questions with pagination and filters
  getQuestions: async (params) => {
    const response = await apiClient.get(API_ENDPOINTS.TEACHER.QUESTIONS.LIST, { params });
    return getResponseData(response, { questions: [], total: 0 });
  },

  // Get a single question by ID
  getQuestionById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.TEACHER.QUESTIONS.BY_ID(id));
    // Ensure we return the data even if response is 304
    return getResponseData(response, {});
  },

  // Create a new question with proper backend structure
  createQuestion: async (questionData) => {
    // Transform frontend data to backend structure
    const backendData = {
      question_type_id: questionData.question_type_id,
      aptis_type_id: questionData.aptis_type_id,
      difficulty: questionData.difficulty,
      content: questionData.content, // JSON string from forms
      media_url: questionData.media_url || null,
      duration_seconds: questionData.duration_seconds || null,
      parent_question_id: questionData.parent_question_id || null,
      additional_media: questionData.additional_media || null,
      status: questionData.status || 'draft'
    };

    const response = await apiClient.post(API_ENDPOINTS.TEACHER.QUESTIONS.CREATE, backendData);
    return response.data;
  },

  // Update an existing question
  updateQuestion: async (id, questionData) => {
    const backendData = {
      question_type_id: questionData.question_type_id,
      aptis_type_id: questionData.aptis_type_id,
      difficulty: questionData.difficulty,
      content: questionData.content,
      media_url: questionData.media_url || null,
      duration_seconds: questionData.duration_seconds || null,
      status: questionData.status || 'draft'
    };

    const response = await apiClient.put(API_ENDPOINTS.TEACHER.QUESTIONS.UPDATE(id), backendData);
    return response.data;
  },

  // Get APTIS types
  getAptisTypes: async () => {
    const response = await apiClient.get('/api/aptis-types');
    return getResponseData(response, []);
  },

  // Get skill types
  getSkillTypes: async () => {
    const response = await apiClient.get('/api/skill-types');
    return getResponseData(response, []);
  },

  // Get question types by skill
  getQuestionTypes: async (skillCode = null) => {
    const params = skillCode ? { skill_code: skillCode } : {};
    const response = await apiClient.get('/api/question-types', { params });
    return getResponseData(response, []);
  },

  // Get question type by code
  getQuestionTypeByCode: async (code) => {
    const response = await apiClient.get(`/api/question-types/${code}`);
    return getResponseData(response, {});
  },

  // Get APTIS type by code  
  getAptisTypeByCode: async (code) => {
    const response = await apiClient.get(`/api/aptis-types/${code}`);
    return getResponseData(response, {});
  },

  // Delete a question
  deleteQuestion: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.TEACHER.QUESTIONS.DELETE(id));
    return response.data;
  },

  // Get question usage
  getQuestionUsage: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.TEACHER.QUESTIONS.USAGE(id));
    return getResponseData(response, []);
  },

  // Delete multiple questions
  deleteMultipleQuestions: async (ids) => {
    const response = await apiClient.delete(API_ENDPOINTS.TEACHER.QUESTIONS.DELETE_MULTIPLE, {
      data: { ids }
    });
    return response.data;
  },

  // Duplicate a question
  duplicateQuestion: async (id) => {
    const response = await apiClient.post(API_ENDPOINTS.TEACHER.QUESTIONS.DUPLICATE(id));
    return response.data;
  },

  // Import questions
  importQuestions: async (file, format) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    
    const response = await apiClient.post(API_ENDPOINTS.TEACHER.QUESTIONS.IMPORT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },

  // Export questions
  exportQuestions: async (filters, format) => {
    const response = await apiClient.post(API_ENDPOINTS.TEACHER.QUESTIONS.EXPORT, {
      filters,
      format
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get question types
  getQuestionTypes: async () => {
    const response = await apiClient.get(API_ENDPOINTS.TEACHER.QUESTIONS.TYPES);
    return getResponseData(response, []);
  },

  // Get categories
  getCategories: async () => {
    const response = await apiClient.get(API_ENDPOINTS.TEACHER.QUESTIONS.CATEGORIES);
    return getResponseData(response, []);
  },

  // Bulk update questions
  bulkUpdateQuestions: async (ids, updateData) => {
    const response = await apiClient.put(API_ENDPOINTS.TEACHER.QUESTIONS.BULK_UPDATE, {
      ids,
      updateData
    });
    return response.data;
  },

  // Get filter options from API
  getFilterOptions: async () => {
    const response = await apiClient.get(API_ENDPOINTS.TEACHER.QUESTIONS.FILTER_OPTIONS);
    return getResponseData(response, {});
  },

  // Upload images for a question
  uploadQuestionImages: async (questionId, imageFiles) => {
    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    const response = await apiClient.post(
      `/teacher/questions/${questionId}/upload-images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};