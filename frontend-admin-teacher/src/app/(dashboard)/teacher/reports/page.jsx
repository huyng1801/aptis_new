'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Button,
  Alert,
  Skeleton,
  Grid
} from '@mui/material';
import {
  Search,
  Visibility,
  GetApp,
  Assessment,
  TrendingUp,
  People,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/shared/DataTable';
import ReportExport from '@/components/teacher/reports/ReportExport';
import reportService from '@/services/reportsService';

export default function ReportsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    exam_id: '',
    student_id: ''
  });
  const [exportOpen, setExportOpen] = useState(false);
  const [availableExams, setAvailableExams] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadReports();
    loadFilterData();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (reports.length > 0) { // Only reload if we have initial data
      loadReports();
    }
  }, [searchTerm, filters]);

  const loadReports = async () => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters
      };
      
      const data = await reportService.getReports(params);
      setReports(data.data || []);
      setPagination({
        page: data.page || 1,
        limit: data.limit || 10,
        total: data.total || 0,
        totalPages: data.totalPages || 1
      });
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Không thể tải danh sách báo cáo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFilterData = async () => {
    try {
      const [exams, students] = await Promise.all([
        reportService.getAvailableExams(),
        reportService.getAvailableStudents()
      ]);
      setAvailableExams(exams);
      setAvailableStudents(students);
    } catch (err) {
      console.error('Error loading filter data:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
    loadReports();
  };

  const handleView = (report) => {
    if (report.type === 'exam_statistics' && report.data?.id) {
      router.push(`/teacher/reports/exam-${report.data.id}`);
    } else if (report.type === 'student_progress' && report.data?.student?.id) {
      router.push(`/teacher/reports/student-${report.data.student.id}`);
    } else {
      // For trend reports or others, show a general view
      router.push(`/teacher/reports/${report.id}`);
    }
  };

  const handleDownload = async (report) => {
    try {
      let params = {
        format: 'xlsx'
      };

      if (report.type === 'student_progress') {
        params.type = 'student_performance';
        params.filters = { student_id: report.data?.student?.id };
      } else if (report.type === 'exam_statistics') {
        params.type = 'exam_statistics';
        params.filters = { exam_id: report.data?.id };
      } else {
        params.type = 'all_statistics';
        params.filters = {};
      }

      await reportService.exportStatistics(params);
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Không thể tải xuống báo cáo. Vui lòng thử lại.');
    }
  };

  const handleExport = async (exportConfig) => {
    try {
      let exportParams = {
        format: 'xlsx'
      };

      if (exportConfig.type === 'exam_statistics' && exportConfig.filters.exam_id) {
        exportParams.type = 'exam_statistics';
        exportParams.filters = { exam_id: exportConfig.filters.exam_id };
      } else if (exportConfig.type === 'student_performance' && exportConfig.filters.student_id) {
        exportParams.type = 'student_performance';
        exportParams.filters = { student_id: exportConfig.filters.student_id };
      } else {
        exportParams.type = 'all_statistics';
        exportParams.filters = {};
      }

      await reportService.exportStatistics(exportParams);
      setExportOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error exporting report:', err);
      setError('Không thể xuất báo cáo. Vui lòng thử lại.');
    }
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'student_progress': return <People />;
      case 'exam_statistics': return <Assessment />;
      case 'performance_trend': return <TrendingUp />;
      default: return <Assessment />;
    }
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case 'student_progress': return 'Báo cáo học viên';
      case 'exam_statistics': return 'Thống kê bài thi';
      case 'performance_trend': return 'Xu hướng kết quả';
      default: return type;
    }
  };

  // Filter reports based on search and filters
  const filteredReports = reports.filter(report => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        report.title?.toLowerCase().includes(searchLower) ||
        report.description?.toLowerCase().includes(searchLower) ||
        report.student_name?.toLowerCase().includes(searchLower) ||
        report.exam_title?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.type && report.type !== filters.type) {
      return false;
    }

    if (filters.exam_id && report.exam_id !== filters.exam_id) {
      return false;
    }

    if (filters.student_id && report.student_id !== filters.student_id) {
      return false;
    }

    return true;
  });

  const columns = [
    {
      id: 'title',
      label: 'Tên báo cáo',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          {getReportIcon(row.type)}
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {row.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.description}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'type',
      label: 'Loại báo cáo',
      render: (row) => (
        <Chip 
          label={getReportTypeLabel(row.type)} 
          size="small" 
          variant="outlined"
          color="primary"
        />
      )
    },
    {
      id: 'subject',
      label: 'Đối tượng',
      render: (row) => (
        <Typography variant="body2">
          {row.student_name || row.exam_title || 'Tổng hợp'}
        </Typography>
      )
    },
    {
      id: 'generated_at',
      label: 'Ngày tạo',
      render: (row) => new Date(row.generated_at).toLocaleDateString('vi-VN')
    },
    {
      id: 'data_period',
      label: 'Khoảng thời gian',
      render: (row) => {
        if (row.start_date && row.end_date) {
          return `${new Date(row.start_date).toLocaleDateString('vi-VN')} - ${new Date(row.end_date).toLocaleDateString('vi-VN')}`;
        }
        return 'Toàn bộ';
      }
    },
    {
      id: 'actions',
      label: 'Hành động',
      align: 'center',
      render: (row) => (
        <Box display="flex" gap={0.5}>
          <IconButton
            size="small"
            onClick={() => handleView(row)}
            color="primary"
            title="Xem chi tiết"
          >
            <Visibility />
          </IconButton>

        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Báo cáo & Thống kê
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            disabled={loading || refreshing}
          >
            Làm mới
          </Button>
          
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm báo cáo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Loại báo cáo</InputLabel>
                <Select
                  value={filters.type}
                  label="Loại báo cáo"
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="student_progress">Báo cáo học viên</MenuItem>
                  <MenuItem value="exam_statistics">Thống kê bài thi</MenuItem>
                  <MenuItem value="performance_trend">Xu hướng kết quả</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {availableExams.length > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Bài thi</InputLabel>
                  <Select
                    value={filters.exam_id}
                    label="Bài thi"
                    onChange={(e) => setFilters(prev => ({ ...prev, exam_id: e.target.value }))}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {availableExams.map(exam => (
                      <MenuItem key={exam.id} value={exam.id}>
                        {exam.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {availableStudents.length > 0 && (
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Học sinh</InputLabel>
                  <Select
                    value={filters.student_id}
                    label="Học sinh"
                    onChange={(e) => setFilters(prev => ({ ...prev, student_id: e.target.value }))}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {availableStudents.slice(0, 20).map(student => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.full_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Loading Skeleton */}
      {loading ? (
        <Card>
          <CardContent>
            {[1, 2, 3, 4, 5].map((item) => (
              <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
                <Skeleton variant="rectangular" width={60} height={20} />
                <Skeleton variant="rectangular" width={80} height={30} />
              </Box>
            ))}
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={filteredReports}
          columns={columns}
          loading={loading}
          pagination={{
            ...pagination,
            total: filteredReports.length
          }}
          onPageChange={handlePageChange}
        />
      )}

      <ReportExport
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
        availableExams={availableExams}
        availableStudents={availableStudents}
      />
    </Box>
  );
}