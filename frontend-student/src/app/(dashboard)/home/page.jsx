'use client';

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  Alert,
  List,
  ListItem,
  LinearProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  School,
  Assessment,
  TrendingUp,
  LocalFireDepartment,
  CheckCircle,
  History,
  PlayArrow,
  Star,
  Schedule,
  EmojiEvents,
  BookmarkBorder,
} from '@mui/icons-material';
import { fetchDashboardData } from '@/store/slices/dashboardSlice';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StatsCard from '@/components/common/StatsCard';
import { formatDistanceToNow } from 'date-fns';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats, recentAttempts, isLoading, error } = useSelector((state) => state.dashboard);

  // Debug: Log stats data
  useEffect(() => {
    console.log('Dashboard stats:', stats);
    console.log('Recent attempts:', recentAttempts);
  }, [stats, recentAttempts]);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchDashboardData());
    }
  }, [dispatch, user]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const getStreak = () => {
    return stats?.streak || 0;
  };

  const getAverageScore = () => {
    return stats?.averageScore || 0;
  };

  const attemptsArray = Array.isArray(recentAttempts) ? recentAttempts : [];
  const displayAttempts = attemptsArray.slice(0, 3);
  const hasAttempts = attemptsArray.length > 0;

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const quickActions = [
    {
      title: 'Thi thử nhanh',
      description: 'Làm bài thi mô phỏng đầy đủ 4 kỹ năng',
      icon: <PlayArrow sx={{ fontSize: 24 }} />,
      color: '#1976d2',
      action: () => router.push('/exams')
    },
    {
      title: 'Ôn tập',
      description: 'Ôn tập theo kỹ năng với các bài tập đa dạng',
      icon: <BookmarkBorder sx={{ fontSize: 24 }} />,
      color: '#2e7d32',
      action: () => router.push('/practice')
    },
  ];

  // Calculate weekly goal progress
  const getWeeklyGoal = () => {
    const weeklyTarget = 5; // Mục tiêu 5 bài/tuần
    const completedThisWeek = stats?.totalAttempts || 0;
    const remaining = Math.max(0, weeklyTarget - completedThisWeek);
    const progress = Math.min(100, (completedThisWeek / weeklyTarget) * 100);
    
    return {
      completed: completedThisWeek,
      target: weeklyTarget,
      remaining,
      progress,
    };
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Hero Section */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                color: '#1a1a1a',
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' }
              }}
              data-testid="user-greeting"
            >
              {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Bạn'}!
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                maxWidth: 600, 
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.6
              }}
            >
              Chào mừng bạn trở lại với APTIS Master. Hãy tiếp tục hành trình chinh phục kỳ thi APTIS của bạn.
            </Typography>
          </Box>

          {getStreak() > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Chip
                icon={<LocalFireDepartment />}
                label={`Chuỗi học liên tiếp ${getStreak()} ngày! Tuyệt vời!`}
                sx={{
                  backgroundColor: '#fff3e0',
                  color: '#e65100',
                  fontWeight: 600,
                  py: 2,
                  px: 1,
                  '& .MuiChip-icon': {
                    color: '#e65100'
                  }
                }}
              />
            </Box>
          )}
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 5 }} data-testid="quick-actions">
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
            Bắt đầu luyện tập ngay
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      borderColor: action.color
                    }
                  }}
                  onClick={action.action}
                  data-testid={index === 0 ? "quick-action-exam" : "quick-action-practice"}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Box sx={{ 
                      display: 'inline-flex',
                      p: 2,
                      borderRadius: '12px',
                      backgroundColor: action.color + '15',
                      color: action.color,
                      mb: 2
                    }}>
                      {action.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Stats Overview */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
            Tiến độ học tập của bạn
          </Typography>
          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }} data-testid="stats-loading">
              <Typography color="text.secondary">Đang tải dữ liệu...</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#fff'
                  }}
                  data-testid="total-exams-stat"
                >
                  <Assessment sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }} data-testid="total-exams-value">
                    {stats?.totalExams ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng số bài thi
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {stats?.totalAttempts ?? 0} lần làm
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#fff'
                  }}
                  data-testid="average-score-stat"
                >
                  <TrendingUp sx={{ fontSize: 40, color: '#2e7d32', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }} data-testid="average-score-value">
                    {getAverageScore().toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Điểm trung bình
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {stats?.completedExams ?? 0} bài đã làm
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#fff'
                  }}
                  data-testid="streak-stat"
                >
                  <LocalFireDepartment sx={{ fontSize: 40, color: '#ed6c02', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed6c02' }} data-testid="streak-value">
                    {getStreak() ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ngày liên tiếp
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Giữ chuỗi học tập
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#fff'
                  }}
                  data-testid="total-time-stat"
                >
                  <Schedule sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#9c27b0' }} data-testid="total-time-value">
                    {stats?.totalTime || '0h'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Thời gian luyện
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Tổng cộng
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Recent Activity */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <History sx={{ color: '#1976d2' }} />
                  Hoạt động gần đây
                </Typography>
                
                {hasAttempts ? (
                  <Box>
                    <List disablePadding>
                      {displayAttempts.map((attempt, index) => (
                        <Box key={attempt.id}>
                          <ListItem sx={{ px: 0, py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <Box sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 48,
                                height: 48,
                                borderRadius: '12px',
                                backgroundColor: '#e3f2fd',
                                mr: 3
                              }}>
                                <CheckCircle sx={{ color: '#1976d2' }} />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {attempt.examTitle || 'Unknown Exam'}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 0.5 }}>
                                  {attempt.skills && Array.isArray(attempt.skills) && attempt.skills.length > 0 ? (
                                    attempt.skills.map((skill, idx) => (
                                      <Typography key={skill.name} variant="body2" color="text.secondary">
                                        {skill.name}: {parseInt(skill.score, 10)}/{parseInt(skill.maxScore, 10)}
                                      </Typography>
                                    ))
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      Điểm tổng: {parseInt(attempt.score, 10)}/{parseInt(attempt.maxScore, 10)}
                                    </Typography>
                                  )}
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDistanceToNow(new Date(attempt.startedAt), { addSuffix: true })}
                                </Typography>
                              </Box>
                            </Box>
                          </ListItem>
                          {index < displayAttempts.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </List>
                    {attemptsArray.length > 3 && (
                      <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Button 
                          variant="outlined"
                          onClick={() => router.push('/results')}
                        >
                          Xem tất cả kết quả
                        </Button>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Assessment sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Chưa có hoạt động nào
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Hãy bắt đầu với bài thi đầu tiên để theo dõi tiến độ của bạn
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => router.push('/exams')}
                    >
                      Bắt đầu ngay
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ border: '1px solid #e0e0e0', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEvents sx={{ color: '#ffd700' }} />
                  Mục tiêu tuần này
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Hoàn thành bài thi</Typography>
                    <Typography variant="body2">{getWeeklyGoal().completed}/{getWeeklyGoal().target}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={getWeeklyGoal().progress} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: '#f5f5f5',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getWeeklyGoal().remaining === 0 ? '#4caf50' : '#ff9800'
                      }
                    }} 
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {getWeeklyGoal().remaining > 0 
                    ? `Còn ${getWeeklyGoal().remaining} bài thi nữa để đạt mục tiêu tuần này`
                    : '🎉 Bạn đã đạt mục tiêu tuần này!'}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Lời khuyên hôm nay
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  "Thành công trong APTIS đến từ việc luyện tập đều đặn mỗi ngày. Hãy dành ít nhất 30 phút mỗi ngày để cải thiện kỹ năng của bạn."
                </Typography>
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => router.push('/practice')}
                >
                  Bắt đầu luyện tập
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}