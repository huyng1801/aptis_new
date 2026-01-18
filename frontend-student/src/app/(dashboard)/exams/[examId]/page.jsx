'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Tab,
  Tabs,
  Divider,
  Alert,
} from '@mui/material';
import {
  AccessTime,
  Quiz,
  PlayArrow,
  Refresh,
  Star,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExamDetails, fetchMyAttempts } from '@/store/slices/examSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AttemptHistory from '@/components/exams/AttemptHistory';
import StartExamDialog from '@/components/exams/StartExamDialog';
import { Container, Breadcrumbs, Link } from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';
import NextLink from 'next/link';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`exam-tabpanel-${index}`}
      aria-labelledby={`exam-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ExamDetailPage() {
  const [tabValue, setTabValue] = useState(0);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const { examId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { currentExam, isLoadingDetails, myAttempts, error } = useSelector(state => state.exams);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    if (examId) {
      dispatch(fetchExamDetails(examId));
      dispatch(fetchMyAttempts());
    }
  }, [examId, dispatch]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStartExam = () => {
    // Open dialog to choose exam mode
    setStartDialogOpen(true);
  };

  const handleContinueExam = (attemptId) => {
    router.push(`/exams/${examId}/take?attemptId=${attemptId}`);
  };

  if (isLoadingDetails) return <LoadingSpinner />;
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }
  if (!currentExam) return null;

  // Backend trả về exam object directly
  const exam = currentExam;
  // Filter attempts for this specific exam
  const userAttempts = Array.isArray(myAttempts)
    ? myAttempts.filter(attempt => attempt.exam_id === parseInt(examId))
    : [];
  // const stats = {};
  // const hasActiveAttempt = userAttempts.some(attempt => attempt.status === 'in_progress');
  // const bestScore = userAttempts.length > 0 ? Math.max(...userAttempts.map(a => a.total_score || 0)) : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: 'calc(100vh - 300px)', display: 'flex', flexDirection: 'column' }}>
      {/* Custom Breadcrumb for Exam Detail */}
      <Box mb={3}>
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link
            component={NextLink}
            href="/home"
            underline="hover"
            color="inherit"
            display="flex"
            alignItems="center"
            gap={0.5}
          >
            <Home fontSize="small" />
            Trang chủ
          </Link>
          <Link
            component={NextLink}
            href="/exams"
            underline="hover"
            color="inherit"
          >
            Danh sách bài thi
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 500 }}>
            {exam.title}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Card sx={{ mb: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {exam.title}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                {exam.description}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Chip 
                label={exam.aptisType?.aptis_type_name || exam.aptis_type} 
                color="primary" 
                variant="outlined"
              />
            </Box>
          </Box>

         

          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={handleStartExam}
            >
              Bắt đầu làm bài
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fafafa' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: 'text.secondary',
              },
              '& .Mui-selected': {
                color: 'primary.main',
                fontWeight: 600,
              },
            }}
          >
            <Tab label="Phần thi" />
            <Tab label="Lịch sử làm bài" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Mô tả bài thi
          </Typography>
          <Typography paragraph>
            {exam.description || 'Không có mô tả chi tiết.'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          {/* Exam structure below */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Cấu trúc bài thi
            </Typography>
            {(() => {
              if (!exam.sections || exam.sections.length === 0) {
                return <Typography color="textSecondary">Không có thông tin chi tiết về cấu trúc bài thi.</Typography>;
              }
              // Gộp sections theo skill
              const groupedBySkill = exam.sections.reduce((acc, section, idx) => {
                const skillName = section.skillType?.skill_type_name || 'N/A';
                if (!acc[skillName]) {
                  acc[skillName] = [];
                }
                acc[skillName].push({ ...section, sectionIndex: idx + 1 });
                return acc;
              }, {});

              return Object.entries(groupedBySkill).map(([skillName, sections]) => {
                const totalQuestions = sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
                const totalScore = sections.reduce((sum, s) => sum + (s.questions?.reduce((sq, q) => sq + (parseInt(q.max_score) || 0), 0) || 0), 0);
                const totalDuration = sections.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

                return (
                  <Card 
                    key={skillName} 
                    variant="outlined" 
                    sx={{ 
                      mb: 3, 
                      borderColor: 'divider',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        borderColor: 'primary.light',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    <CardContent>
                      {/* Skill Header */}
                      <Box sx={{ mb: 2, pb: 2, borderBottom: '2px solid #e0e0e0' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                          {skillName}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccessTime sx={{ fontSize: 20, color: 'text.secondary' }} />
                              <Box>
                                <Typography variant="caption" color="text.secondary">Thời gian</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {totalDuration} phút
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Quiz sx={{ fontSize: 20, color: 'text.secondary' }} />
                              <Box>
                                <Typography variant="caption" color="text.secondary">Tổng câu</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {totalQuestions} câu
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Star sx={{ fontSize: 20, color: 'text.secondary' }} />
                              <Box>
                                <Typography variant="caption" color="text.secondary">Tổng điểm</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {totalScore} điểm
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Parts/Sections */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                          Các phần:
                        </Typography>
                        <Grid container spacing={1.5}>
                          {sections.map((section) => {
                            const sectionQuestions = section.questions?.length || 0;
                            const sectionScore = section.questions?.reduce((sum, q) => sum + (parseInt(q.max_score) || 0), 0) || 0;
                            return (
                              <Grid item xs={12} key={section.id}>
                                <Box sx={{ 
                                  p: 1.5, 
                                  bgcolor: '#fafafa', 
                                  borderRadius: 1, 
                                  borderLeft: '3px solid #1976d2',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {section.instruction || 'Part'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                      {section.duration_minutes}p
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                      {sectionQuestions} câu
                                    </Typography>
                                    <Chip 
                                      label={`${sectionScore}đ`} 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ height: 24 }}
                                    />
                                  </Box>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AttemptHistory attempts={userAttempts} examId={examId} />
        </TabPanel>
      </Card>

      {/* Start Exam Dialog */}
      <StartExamDialog
        open={startDialogOpen}
        onClose={() => setStartDialogOpen(false)}
        exam={exam}
        onStart={(attemptType, selectedSkill) => {
          const queryParams = new URLSearchParams();
          queryParams.set('type', attemptType);
          if (selectedSkill) {
            queryParams.set('skill', selectedSkill);
          }
          router.push(`/exams/${examId}/take?${queryParams.toString()}`);
        }}
      />
    </Container>
  );
}