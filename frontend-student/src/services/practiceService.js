import { api } from './api';

export const practiceService = {
  // Get practice questions based on filters
  async getQuestions(params) {
    try {
      const queryParams = new URLSearchParams({
        skill_type: params.skillType,
        difficulty_level: params.difficultyLevel,
        limit: params.limit || 10
      });
      
      if (params.questionType) {
        queryParams.append('question_type', params.questionType);
      }

      const response = await api.get(`/students/practice/questions?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching practice questions:', error);
      throw error;
    }
  },

  // Submit practice answer
  async submitAnswer(data) {
    try {
      const response = await api.post('/students/practice/submit', {
        question_id: data.questionId,
        answer_data: data.answerData,
        skill_type: data.skillType,
        question_type: data.questionType
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting practice answer:', error);
      throw error;
    }
  },

  // Get practice statistics
  async getStats() {
    try {
      const response = await api.get('/students/practice/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching practice stats:', error);
      throw error;
    }
  },

  // Get stats for specific skill
  async getSkillStats(skillId) {
    try {
      const response = await api.get(`/student/practice/skills/${skillId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching skill stats:', error);
      throw error;
    }
  }
};