import { apiClient } from './apiClient';

class DashboardService {
  async getDashboardStats() {
    try {
      const response = await apiClient.get('/teacher/dashboard/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getRecentActivities(limit = 10) {
    try {
      const response = await apiClient.get(`/teacher/dashboard/activities?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  async getSystemOverview() {
    try {
      const response = await apiClient.get('/teacher/dashboard/overview');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching system overview:', error);
      throw error;
    }
  }

  async getGradingStats(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await apiClient.get(`/teacher/submissions/stats?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching grading stats:', error);
      throw error;
    }
  }

  async getRecentExams(limit = 5) {
    try {
      const response = await apiClient.get(`/teacher/exams?page=1&limit=${limit}&sort=created_at&order=desc`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recent exams:', error);
      throw error;
    }
  }

  async getPendingReviews() {
    try {
      const response = await apiClient.get('/teacher/submissions/stats');
      const stats = response.data.data;
      return {
        needsReview: stats.needs_review || 0,
        ungraded: stats.ungraded || 0,
        total: stats.total || 0
      };
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      throw error;
    }
  }
}

export default new DashboardService();