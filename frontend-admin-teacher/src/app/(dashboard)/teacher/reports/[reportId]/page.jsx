'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Alert,
  Skeleton,
  Divider,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack,
  GetApp,
  Person,
  Assessment,
  TrendingUp,
  Score,
  Schedule,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import reportService from '@/services/reportsService';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { reportId } = params;
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState(null);
  const [entityId, setEntityId] = useState(null);

  useEffect(() => {
    if (reportId) {
      parseReportId();
    }
  }, [reportId]);

  useEffect(() => {
    if (reportType && entityId) {
      loadReportData();
    }
  }, [reportType, entityId]);

  const parseReportId = () => {
    // Parse patterns like: student-6, exam-12, trend-analysis-2024
    if (reportId.startsWith('student-')) {
      setReportType('student');
      setEntityId(reportId.replace('student-', ''));
    } else if (reportId.startsWith('exam-')) {
      setReportType('exam');
      setEntityId(reportId.replace('exam-', ''));
    } else if (reportId.startsWith('trend-')) {
      setReportType('trend');
      setEntityId(reportId);
    } else {
      setError('Invalid report ID format');
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      switch (reportType) {
        case 'student':
          data = await reportService.getStudentReport(entityId);
          break;
        case 'exam':
          data = await reportService.getExamStatistics(entityId);
          break;
        case 'trend':
          // For trend analysis, use general reports
          data = await reportService.getReports({ type: 'performance_trend' });
          data = data.data?.[0] || data; // Get first trend report if array
          break;
        default:
          throw new Error('Unsupported report type');
      }
      
      setReportData(data.data || data);
    } catch (err) {
      console.error('Error loading report:', err);
      setError(err.response?.data?.message || 'Không thể tải báo cáo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      let exportParams = {
        format: 'xlsx'
      };

      if (reportType === 'student') {
        exportParams.type = 'student_performance';
        exportParams.filters = { student_id: entityId };
      } else if (reportType === 'exam') {
        exportParams.type = 'exam_statistics';
        exportParams.filters = { exam_id: entityId };
      } else {
        exportParams.type = 'all_statistics';
        exportParams.filters = {};
      }

      await reportService.exportStatistics(exportParams);
    } catch (err) {
      console.error('Error exporting report:', err);
      setError('Không thể xuất báo cáo. Vui lòng thử lại.');
    }
  };

  const getReportTitle = () => {
    if (!reportData) return '';
    
    switch (reportType) {
      case 'student':
        return `Báo cáo học viên: ${reportData.student?.full_name || reportData.full_name || 'N/A'}`;
      case 'exam':
        return `Thống kê bài thi: ${reportData.exam?.title || reportData.title || 'N/A'}`;
      case 'trend':
        return 'Báo cáo xu hướng kết quả';
      default:
        return 'Chi tiết báo cáo';
    }
  };

  const renderStudentReport = () => {
    const { student, totalAttempts, completedAttempts, averageScore, attempts } = reportData;
    
    return (
      <>
        {/* Student Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar sx={{ width: 60, height: 60 }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {student?.full_name || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {student?.email || 'N/A'}
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {totalAttempts || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng lần thi
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {completedAttempts || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hoàn thành
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {averageScore || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Điểm TB
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {completedAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tỷ lệ hoàn thành
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Attempts History */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Lịch sử làm bài
            </Typography>
            
            {attempts && attempts.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Bài thi</TableCell>
                      <TableCell>Ngày thi</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell align="right">Điểm số</TableCell>
                      <TableCell align="right">Thời gian</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attempts.map((attempt, index) => (
                      <TableRow key={attempt.id || index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {attempt.exam?.title || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(attempt.start_time).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={attempt.status === 'submitted' ? <CheckCircle /> : <Cancel />}
                            label={attempt.status === 'submitted' ? 'Hoàn thành' : 'Chưa hoàn thành'}
                            color={attempt.status === 'submitted' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {attempt.status === 'submitted' ? 
                              `${attempt.total_score || 0}/${attempt.exam?.total_score || 100}` : 
                              'N/A'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {attempt.duration_minutes ? `${attempt.duration_minutes} phút` : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                Chưa có lịch sử làm bài
              </Typography>
            )}
          </CardContent>
        </Card>
      </>
    );
  };

  const renderExamReport = () => {
    const { totalAttempts, averageScore, highestScore, lowestScore, passRate, scoreDistribution } = reportData;
    
    return (
      <>
        {/* Statistics Overview */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent textAlign="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {totalAttempts || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng lượt thi
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent textAlign="center">
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {averageScore || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Điểm trung bình
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent textAlign="center">
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {highestScore || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Điểm cao nhất
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent textAlign="center">
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {passRate || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tỷ lệ đậu
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Score Distribution */}
        {scoreDistribution && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Phân bố điểm số
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Xuất sắc (≥90%)</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {scoreDistribution.excellent || 0}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={totalAttempts > 0 ? (scoreDistribution.excellent / totalAttempts) * 100 : 0}
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Tốt (70-89%)</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {scoreDistribution.good || 0}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={totalAttempts > 0 ? (scoreDistribution.good / totalAttempts) * 100 : 0}
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Trung bình (50-69%)</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {scoreDistribution.average || 0}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={totalAttempts > 0 ? (scoreDistribution.average / totalAttempts) * 100 : 0}
                      color="warning"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Yếu (50%)</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {scoreDistribution.poor || 0}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={totalAttempts > 0 ? (scoreDistribution.poor / totalAttempts) * 100 : 0}
                      color="error"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  const renderTrendReport = () => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Phân tích xu hướng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Báo cáo xu hướng đang được phát triển...
          </Typography>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width={200} height={40} />
        </Box>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Skeleton variant="text" width="60%" height={40} />
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {[1, 2, 3, 4].map((item) => (
                <Grid item xs={12} sm={3} key={item}>
                  <Skeleton variant="rectangular" height={100} />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={30} />
            <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 3 }}
        >
          Quay lại
        </Button>
        
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            variant="outlined"
          >
            Quay lại
          </Button>
          <Typography variant="h4" fontWeight="bold">
            {getReportTitle()}
          </Typography>
        </Box>
        
      
      </Box>

      {/* Report Type Badge */}
      <Box mb={3}>
        <Chip
          icon={
            reportType === 'student' ? <Person /> :
            reportType === 'exam' ? <Assessment /> : <TrendingUp />
          }
          label={
            reportType === 'student' ? 'Báo cáo học viên' :
            reportType === 'exam' ? 'Thống kê bài thi' : 'Phân tích xu hướng'
          }
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Report Content */}
      {reportData && (
        <>
          {reportType === 'student' && renderStudentReport()}
          {reportType === 'exam' && renderExamReport()}
          {reportType === 'trend' && renderTrendReport()}
        </>
      )}
    </Box>
  );
}