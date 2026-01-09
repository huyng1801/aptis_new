'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Grading as GradingIcon,
  TrendingUp,
  TrendingDown,
  Schedule,
  CheckCircle,
  Error,
  Warning,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/app.config';
import dashboardService from '@/services/dashboardService';

// Remove all mock data - using real data now

const StatCard = ({ title, value, change, trend, icon: Icon, onClick }) => (
  <Card
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease-in-out',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: 4,
      } : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value.toLocaleString()}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {trend === 'up' ? (
              <TrendingUp color="success" fontSize="small" />
            ) : (
              <TrendingDown color="error" fontSize="small" />
            )}
            <Typography
              variant="body2"
              color={trend === 'up' ? 'success.main' : 'error.main'}
              sx={{ ml: 0.5 }}
            >
              {change > 0 ? '+' : ''}{change} từ tháng trước
            </Typography>
          </Box>
        </Box>
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 56,
            height: 56,
          }}
        >
          <Icon />
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const getStatusChip = (status) => {
  const statusConfig = {
    published: { label: 'Đã xuất bản', color: 'success' },
    draft: { label: 'Nháp', color: 'default' },
    scheduled: { label: 'Đã lên lịch', color: 'info' },
  };
  
  const config = statusConfig[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" />;
};

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setError(null);
      const data = await dashboardService.getSystemOverview();
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight="bold">
            {getCurrentGreeting()}, {user?.name || 'Admin'}! 👋
          </Typography>
          <IconButton onClick={handleRefresh} disabled={loading || refreshing}>
            <RefreshIcon />
          </IconButton>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Đây là tổng quan về hệ thống APTIS của bạn
        </Typography>
        {(loading || refreshing) && <LinearProgress sx={{ mt: 2 }} />}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" height={40} />
                    <Skeleton variant="text" width="80%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3 }}>
                <Skeleton variant="text" width="30%" />
                {[1, 2, 3].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="70%" />
                      <Skeleton variant="text" width="50%" />
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3 }}>
                <Skeleton variant="text" width="40%" />
                {[1, 2, 3].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="70%" />
                      <Skeleton variant="text" width="50%" />
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </>
      ) : dashboardData ? (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tổng số câu hỏi"
                value={dashboardData.stats?.questions?.total || 0}
                change={dashboardData.stats?.questions?.change || 0}
                trend={dashboardData.stats?.questions?.trend || 'stable'}
                icon={QuizIcon}
                onClick={() => router.push(ROUTES.QUESTIONS.LIST)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tổng số bài thi"
                value={dashboardData.stats?.exams?.total || 0}
                change={dashboardData.stats?.exams?.change || 0}
                trend={dashboardData.stats?.exams?.trend || 'stable'}
                icon={AssignmentIcon}
                onClick={() => router.push(ROUTES.EXAMS.LIST)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tổng số người dùng"
                value={dashboardData.stats?.users?.total || 0}
                change={dashboardData.stats?.users?.change || 0}
                trend={dashboardData.stats?.users?.trend || 'stable'}
                icon={PeopleIcon}
                onClick={() => router.push(ROUTES.USERS.LIST)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Bài thi cần chấm"
                value={dashboardData.stats?.submissions?.ungraded || 0}
                change={dashboardData.stats?.submissions?.change || 0}
                trend={dashboardData.stats?.submissions?.trend || 'stable'}
                icon={GradingIcon}
                onClick={() => router.push(ROUTES.SUBMISSIONS.LIST)}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Recent Activities */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Hoạt động gần đây
                </Typography>
                <List>
                  {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 ? (
                    dashboardData.recentActivities.map((activity, index) => (
                      <Box key={activity.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar>
                              <AssignmentIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={activity.title}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {activity.subtitle}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  • {new Date(activity.timestamp).toLocaleDateString('vi-VN')}
                                </Typography>
                              </Box>
                            }
                          />
                          <Chip 
                            label={activity.type === 'exam_created' ? 'Tạo bài thi' : 'Bài làm mới'} 
                            color={activity.type === 'exam_created' ? 'primary' : 'success'} 
                            size="small" 
                          />
                        </ListItem>
                        {index < dashboardData.recentActivities.length - 1 && <Divider />}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      Chưa có hoạt động gần đây
                    </Typography>
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Grading Summary */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Tình trạng chấm bài
                </Typography>
                <List>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <Schedule />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Chưa chấm"
                      secondary={`${dashboardData.stats?.submissions?.ungraded || 0} bài`}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'info.main' }}>
                        <Warning />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Cần review"
                      secondary={`${dashboardData.stats?.submissions?.needs_review || 0} bài`}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <CheckCircle />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Đã chấm xong"
                      secondary={`${dashboardData.stats?.submissions?.manually_graded || 0} bài`}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </>
      ) : null}

      {/* Quick Actions or Recent Activities could go here */}
    </Box>
  );
}