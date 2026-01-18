'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Tab,
  Tabs,
  Divider,
  Alert,
  CircularProgress,
  Container,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Download,
  Share,
  Refresh,
  ArrowBack,
  NavigateNext,
  Home,
} from '@mui/icons-material';
import NextLink from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAttemptResults } from '@/store/slices/attemptSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ResultsSummary from '@/components/results/ResultsSummary';
import SkillScoreCard from '@/components/results/SkillScoreCard';
import RadarChart from '@/components/results/RadarChart';
import QuestionFeedback from '@/components/results/QuestionFeedback';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`result-tabpanel-${index}`}
      aria-labelledby={`result-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ResultDetailPage() {
  const [selectedSkill, setSelectedSkill] = useState(null); // Track selected skill for question details
  const { attemptId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { 
    attemptResults, 
    loading, 
    error 
  } = useSelector(state => state.attempts);
  
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    if (attemptId) {
      dispatch(fetchAttemptResults(attemptId));
    }
  }, [attemptId, dispatch]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSkillClick = (skillName) => {
    setSelectedSkill(skillName === selectedSkill ? null : skillName); // Toggle selection
  };

  const handleRetakeExam = () => {
    if (attemptResults?.exam) {
      router.push(`/exams/${attemptResults.exam.id}`);
    }
  };

  const handleGoBack = () => {
    router.push('/results');
  };

  const handleDownloadReport = () => {
    // Implementation for PDF download
  };

  const handleShare = () => {
    // Implementation for sharing results
    console.log('Sharing results...');
  };

  const formatResultDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '-';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }
  if (!attemptResults) return null;

  // Backend returns: { attempt, sectionScores, totalScore, status }
  // attempt includes: exam (nested), sections
  const { 
    attempt, 
    sectionScores = {}, 
    totalScore 
  } = attemptResults;

  // Safety check - ensure attempt exists
  if (!attempt) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Không tìm thấy kết quả bài thi. Vui lòng thử lại.
      </Alert>
    );
  }

  // Extract exam from nested structure
  const exam = attempt.exam || {};
  
  // Convert sectionScores to skillScores array format, grouping by skill type
  const skillScoresMap = {};
  Object.values(sectionScores).forEach(section => {
    const examSection = section.section;
    const skillName = examSection?.skillType?.skill_type_name || 'Unknown';
    
    if (!skillScoresMap[skillName]) {
      skillScoresMap[skillName] = {
        skillName: skillName,
        score: 0,
        maxScore: 0,
        sectionCount: 0
      };
    }
    
    skillScoresMap[skillName].score += section.score || 0;
    skillScoresMap[skillName].maxScore += examSection?.section_max_score || 0;
    skillScoresMap[skillName].sectionCount += 1;
  });

  // Convert map to array and calculate percentages
  const skillScores = Object.values(skillScoresMap).map(skill => ({
    ...skill,
    percentage: skill.maxScore > 0 
      ? Math.round((skill.score / skill.maxScore) * 100) 
      : 0
  }));

  // Calculate time spent in minutes
  const timeSpent = attempt.end_time && attempt.start_time 
    ? Math.round((new Date(attempt.end_time) - new Date(attempt.start_time)) / 60000)
    : 0;

  // Create questionResults array from attempt
  // Backend returns this in attemptResults.answers array
  const questionResults = attemptResults.answers || [];
  
  // Debug log to see what data we have
  console.log('[Results Debug] attemptResults:', attemptResults);
  console.log('[Results Debug] questionResults:', questionResults);
  console.log('[Results Debug] questionResults.length:', questionResults.length);
  if (questionResults.length > 0) {
    console.log('[Results Debug] Sample question:', questionResults[0]);
  }

  // Create overallStats object with safe values
  // For skill_practice attempts, calculate based on selected skill only
  let finalScore = totalScore || attempt.total_score || 0;
  let finalMaxScore = exam.total_score || 100;
  
  // If this is a skill practice attempt, use only that skill's score
  if (attempt.attempt_type === 'skill_practice' && skillScores.length === 1) {
    finalScore = skillScores[0].score || 0;
    finalMaxScore = skillScores[0].maxScore || skillScores[0].max_score || 1;
  }
  
  const safePercentage = finalMaxScore > 0 
    ? Math.round((finalScore / finalMaxScore) * 100) 
    : 0;

  const overallStats = {
    totalScore: finalScore,
    maxScore: finalMaxScore,
    percentage: safePercentage,
    accuracy_percentage: safePercentage,
    timeSpent: timeSpent,
    isSkillPractice: attempt.attempt_type === 'skill_practice'
  };

  const isGradingComplete = attempt.status === 'submitted' || attempt.status === 'completed';
  const hasTeacherReview = attempt.reviewed_at;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumb */}
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
            href="/results"
            underline="hover"
            color="inherit"
          >
            Kết quả
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 500 }}>
            {exam.title}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
            sx={{ mb: 1 }}
          >
            Quay lại danh sách
          </Button>
          <Typography variant="h4" component="h1">
            Kết quả bài thi: {exam.title}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Ngày làm: {formatResultDate(attempt.start_time)}
          </Typography>
        </Box>
        
        
      </Box>

      {/* Status Alert */}
      {!isGradingComplete && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Kết quả đang được xử lý. Điểm Writing và Speaking sẽ được cập nhật sau khi AI chấm điểm hoàn tất.
          </Typography>
        </Alert>
      )}
      
      {hasTeacherReview && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            ✓ Bài thi đã được giáo viên xem xét và cho feedback chi tiết.
          </Typography>
        </Alert>
      )}

      {/* Results Summary */}
      <ResultsSummary 
        attempt={{
          ...attempt,
          time_spent: attempt.time_spent || timeSpent * 60 // Use actual time_spent from backend
        }}
        exam={exam}
        skillScores={skillScores}
        overallStats={overallStats}
      />

      {/* Skills Performance - 2 columns layout */}
      {skillScores.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 2, mb: 2 }}>
            Phân tích theo kỹ năng
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {skillScores.map((skill) => (
              <Grid item xs={12} sm={6} key={skill.skillName}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.3s ease',
                    border: selectedSkill === skill.skillName ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => handleSkillClick(skill.skillName)}
                >
                  <SkillScoreCard skill={skill} />
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Question Details for Selected Skill */}
      {selectedSkill && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Chi tiết câu hỏi - {selectedSkill}
              </Typography>
              <Button 
                size="small" 
                onClick={() => setSelectedSkill(null)}
                sx={{ minWidth: 'auto' }}
              >
                ✕
              </Button>
            </Box>
            

            <QuestionFeedback 
              questionResults={questionResults.filter(answer => {
                console.log('[Question Filter] Checking answer:', {
                  id: answer.id,
                  question: answer.question,
                  questionType: answer.question?.questionType
                });
                
                // Filter questions by skill using the correct path
                const questionSkill = answer.question?.questionType?.skillType?.skill_type_name || 'Unknown';
                
                console.log('[Question Filter] Found skill:', questionSkill, 'Target:', selectedSkill);
                return questionSkill === selectedSkill;
              })}
              attemptId={attemptId}
              showDetailedScoring={true}
            />
          </CardContent>
        </Card>
      )}
    </Container>
  );
}