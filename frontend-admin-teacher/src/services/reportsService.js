import { apiClient } from './apiClient';

class ReportService {
  // Teacher reports - match backend exactly
  
  async getExamStatistics(examId) {
    try {
      const response = await apiClient.get(`/teacher/reports/exam-statistics/${examId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching exam statistics:', error);
      throw error;
    }
  }

  async getStudentStatistics(params = {}) {
    try {
      const response = await apiClient.get('/teacher/reports/student-statistics', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching student statistics:', error);
      throw error;
    }
  }

  async getStudentReport(studentId) {
    try {
      const response = await apiClient.get(`/teacher/reports/student/${studentId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching student report:', error);
      throw error;
    }
  }

  async exportStatistics(params = {}) {
    try {
      const response = await apiClient.get('/teacher/reports/export', { 
        params,
        responseType: 'blob'
      });
      
      // Determine filename based on type
      let filename = `report-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (params.type === 'student_performance' && params.filters?.student_id) {
        filename = `student-report-${params.filters.student_id}-${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (params.type === 'exam_statistics' && params.filters?.exam_id) {
        filename = `exam-report-${params.filters.exam_id}-${new Date().toISOString().split('T')[0]}.xlsx`;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Export completed successfully' };
    } catch (error) {
      console.error('Error exporting statistics:', error);
      throw error;
    }
  }

  // Mock functions for existing UI (since backend doesn't have these yet)
  async getReports(params = {}) {
    // Since the backend doesn't have a general reports endpoint,
    // we'll create a combined overview using the available endpoints
    try {
      const [studentsData, examsData] = await Promise.all([
        this.getStudentStatistics(params),
        apiClient.get('/teacher/exams?page=1&limit=50') // Get exams list
      ]);

      const mockReports = [];

      // Create student performance reports
      if (studentsData && studentsData.length > 0) {
        studentsData.slice(0, 10).forEach((student, index) => {
          mockReports.push({
            id: `student-${student.student.id}`,
            title: `Báo cáo học viên: ${student.student.full_name}`,
            description: `Báo cáo chi tiết về tiến độ học tập`,
            type: 'student_progress',
            student_name: student.student.full_name,
            generated_at: new Date().toISOString(),
            data: student
          });
        });
      }

      // Create exam statistics reports 
      if (examsData?.data?.data && examsData.data.data.length > 0) {
        examsData.data.data.slice(0, 10).forEach((exam) => {
          mockReports.push({
            id: `exam-${exam.id}`,
            title: `Thống kê bài thi: ${exam.title}`,
            description: `Phân tích kết quả và hiệu suất bài thi`,
            type: 'exam_statistics',
            exam_title: exam.title,
            generated_at: new Date().toISOString(),
            data: exam
          });
        });
      }

      // Add some trend analysis reports
      mockReports.push({
        id: 'trend-overall',
        title: 'Xu hướng kết quả tổng thể',
        description: 'Phân tích xu hướng kết quả học tập theo thời gian',
        type: 'performance_trend',
        generated_at: new Date().toISOString(),
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      });

      return {
        data: mockReports,
        page: params.page || 1,
        limit: params.limit || 10,
        total: mockReports.length,
        totalPages: Math.ceil(mockReports.length / (params.limit || 10))
      };
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  async generateExamReport(examId, options = {}) {
    try {
      const statistics = await this.getExamStatistics(examId);
      
      // Create a formatted report
      const report = {
        id: `generated-exam-${examId}-${Date.now()}`,
        title: `Báo cáo thống kê: ${statistics.exam?.title || 'Bài thi'}`,
        description: 'Báo cáo được tạo tự động',
        type: 'exam_statistics',
        exam_title: statistics.exam?.title,
        generated_at: new Date().toISOString(),
        data: statistics,
        options
      };

      return report;
    } catch (error) {
      console.error('Error generating exam report:', error);
      throw error;
    }
  }

  async generateStudentReport(studentId, options = {}) {
    try {
      const studentData = await this.getStudentReport(studentId);
      
      const report = {
        id: `generated-student-${studentId}-${Date.now()}`,
        title: `Báo cáo học viên: ${studentData.student?.full_name || 'Học sinh'}`,
        description: 'Báo cáo được tạo tự động',
        type: 'student_progress',
        student_name: studentData.student?.full_name,
        generated_at: new Date().toISOString(),
        data: studentData,
        options
      };

      return report;
    } catch (error) {
      console.error('Error generating student report:', error);
      throw error;
    }
  }

  async getAvailableExams() {
    try {
      const response = await apiClient.get('/teacher/exams?page=1&limit=100');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching available exams:', error);
      return [];
    }
  }

  async getAvailableStudents() {
    try {
      const studentStats = await this.getStudentStatistics();
      return studentStats.map(stat => stat.student);
    } catch (error) {
      console.error('Error fetching available students:', error);
      return [];
    }
  }
}

export default new ReportService();