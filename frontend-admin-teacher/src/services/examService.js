import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '@/config/api.config';

export const examApi = {
  // Get all exams with pagination and filters
  getExams: async (params) => {
    const response = await apiClient.get(API_ENDPOINTS.TEACHER.EXAMS.LIST, { params });
    return response.data;
  },

  // Get a single exam by ID
  getExamById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.TEACHER.EXAMS.BY_ID(id));
    return response.data;
  },

  // Create a new exam
  createExam: async (examData) => {
    const response = await apiClient.post(API_ENDPOINTS.TEACHER.EXAMS.CREATE, examData);
    return response.data;
  },

  // Update an existing exam
  updateExam: async (id, examData) => {
    const response = await apiClient.put(API_ENDPOINTS.TEACHER.EXAMS.UPDATE(id), examData);
    return response.data;
  },

  // Delete an exam
  deleteExam: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.TEACHER.EXAMS.DELETE(id));
    return response.data;
  },

  // Publish an exam
  publishExam: async (id) => {
    const response = await apiClient.post(API_ENDPOINTS.TEACHER.EXAMS.PUBLISH(id));
    return response.data;
  },

  // Unpublish an exam
  unpublishExam: async (id) => {
    const response = await apiClient.post(API_ENDPOINTS.TEACHER.EXAMS.UNPUBLISH(id));
    return response.data;
  },

  // Duplicate an exam
  duplicateExam: async (id) => {
    const response = await apiClient.post(API_ENDPOINTS.TEACHER.EXAMS.DUPLICATE(id));
    return response.data;
  },

  // Add section to exam
  addSection: async (examId, sectionData) => {
    const response = await apiClient.post(API_ENDPOINTS.TEACHER.EXAMS.ADD_SECTION(examId), sectionData);
    return response.data;
  },

  // Remove section from exam
  removeSection: async (examId, sectionId) => {
    const response = await apiClient.delete(API_ENDPOINTS.TEACHER.EXAMS.REMOVE_SECTION(examId, sectionId));
    return response.data;
  },

  // Update section
  updateSection: async (examId, sectionId, sectionData) => {
    const response = await apiClient.put(API_ENDPOINTS.TEACHER.EXAMS.UPDATE_SECTION(examId, sectionId), sectionData);
    return response.data;
  },

  // Add question to section
  addQuestionToSection: async (examId, sectionId, questionData) => {
    const response = await apiClient.post(
      API_ENDPOINTS.TEACHER.EXAMS.ADD_QUESTION_TO_SECTION(examId, sectionId), 
      questionData
    );
    return response.data;
  },

  // Remove question from section
  removeQuestionFromSection: async (examId, sectionId, questionId) => {
    const response = await apiClient.delete(
      API_ENDPOINTS.TEACHER.EXAMS.REMOVE_QUESTION_FROM_SECTION(examId, sectionId, questionId)
    );
    return response.data;
  },

  // Update question in section
  updateQuestionInSection: async (examId, sectionId, questionId, questionData) => {
    const response = await apiClient.put(
      API_ENDPOINTS.TEACHER.EXAMS.UPDATE_QUESTION_IN_SECTION(examId, sectionId, questionId),
      questionData
    );
    return response.data;
  },

  // Get questions by skill type
  getQuestionsBySkill: async (skillTypeId, limit = 100) => {
    const response = await apiClient.get(API_ENDPOINTS.TEACHER.QUESTIONS.LIST, {
      params: {
        skill_type_id: skillTypeId, // Changed from 'skill' to 'skill_type_id'
        limit: limit,
        page: 1
      }
    });
    return response.data;
  },

  // Get questions with flexible parameters (supports filters like question_type_code)
  getQuestions: async (params) => {
    const response = await apiClient.get(API_ENDPOINTS.TEACHER.QUESTIONS.LIST, { params });
    return response.data;
  },
};