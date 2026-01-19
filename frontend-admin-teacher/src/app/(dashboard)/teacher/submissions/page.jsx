'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Alert,
  Snackbar,
  Container,
  CircularProgress,
  Chip,
  Icon
} from '@mui/material';
import {
  Psychology,
  Person,
  Warning,
  Assignment,
  CheckCircle
} from '@mui/icons-material';
import SubmissionFilters from '@/components/teacher/submissions/SubmissionFilters';
import SubmissionList from '@/components/teacher/submissions/SubmissionList';
import { submissionApi } from '@/services/submissionService';
import { useRouter } from 'next/navigation';

export default function SubmissionsPage() {
  const router = useRouter();
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  
  const [filters, setFilters] = useState({
    grading_status: '',
    skill_type: '', // Mặc định sẽ được filter trong API chỉ lấy WRITING và SPEAKING
    page: 1,
    limit: 20
  });

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load data when component mounts or filters change
  useEffect(() => {
    loadSubmissions();
    loadStats();
  }, [filters]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const response = await submissionApi.getSubmissions(filters);
      setSubmissions(response.data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
      showNotification('Lỗi khi tải danh sách bài làm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Chỉ gọi API stats khi có filter cụ thể
      const hasFilters = filters.skill_type;
      
      if (!hasFilters) {
        // Load all submissions stats by default
        const response = await submissionApi.getGradingStats({});
        setStats(response.data);
        return;
      }

      const response = await submissionApi.getGradingStats({
        skill_type: filters.skill_type
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default stats on error
      setStats({
        total: 0,
        ungraded: 0,
        ai_graded: 0,
        manually_graded: 0,
        needs_review: 0
      });
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 }); // Reset to page 1 when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      grading_status: '',
      skill_type: '', // Reset nhưng API vẫn chỉ lấy WRITING và SPEAKING
      page: 1,
      limit: 20
    });
  };

  const handleViewSubmission = (submission) => {
    // Navigate to submission detail view using attempt ID
    router.push(`/teacher/submissions/${submission.attempt?.id}?mode=view`);
  };

  const handleGradeSubmission = (submission) => {
    // Navigate to same page as view but with grading mode
    router.push(`/teacher/submissions/${submission.attempt?.id}?mode=grade`);
  };

  const handleRegradeSubmissions = async (answerIds, regradeType) => {
    try {
      const response = await submissionApi.regradeSubmissions(answerIds, regradeType);
      
      showNotification(
        `Đã đánh dấu ${response.data.regradedCount} bài làm để chấm lại bằng AI`,
        'success'
      );
      
      // Refresh data
      await loadSubmissions();
      await loadStats();
    } catch (error) {
      console.error('Error regrading submissions:', error);
      showNotification('Lỗi khi chấm lại bài làm', 'error');
    }
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Quản lý chấm bài
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Chấm điểm và quản lý bài làm Writing & Speaking của học sinh
          </Typography>
        </Box>


        {/* Filters */}
        <SubmissionFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Main Content */}
        <Paper sx={{ mt: 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress />
              <Typography variant="h6" sx={{ ml: 2 }}>
                Đang tải dữ liệu...
              </Typography>
            </Box>
          ) : (
            <SubmissionList
              submissions={submissions}
              loading={loading}
              onRefresh={loadSubmissions}
              onViewSubmission={handleViewSubmission}
              onGradeSubmission={handleGradeSubmission}
              onRegradeSubmissions={handleRegradeSubmissions}
            />
          )}
        </Paper>

        {/* Notification */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}