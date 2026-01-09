'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Container
} from '@mui/material';
import {
  Psychology,
  Hearing,
  MenuBook,
  RecordVoiceOver,
  Edit,
  PlayArrow,
  AutoAwesome,
  TrendingUp
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { practiceService } from '@/services/practiceService';

const skillTypes = [
  {
    code: 'LISTENING',
    name: 'Listening',
    nameVi: 'Nghe',
    description: 'Luyện tập kỹ năng nghe hiểu tiếng Anh',
    icon: <Hearing />,
    color: '#2196F3',
    questionTypes: [
      { code: 'LISTENING_MCQ', name: 'Multiple Choice', nameVi: 'Trắc nghiệm' },
      { code: 'LISTENING_GAP_FILL', name: 'Gap Filling', nameVi: 'Điền từ' },
      { code: 'LISTENING_MATCHING', name: 'Speaker Matching', nameVi: 'Ghép người nói' },
      { code: 'LISTENING_STATEMENT_MATCHING', name: 'Statement Matching', nameVi: 'Ghép câu' }
    ]
  },
  {
    code: 'READING',
    name: 'Reading', 
    nameVi: 'Đọc',
    description: 'Luyện tập kỹ năng đọc hiểu tiếng Anh',
    icon: <MenuBook />,
    color: '#4CAF50',
    questionTypes: [
      { code: 'READING_GAP_FILL', name: 'Gap Filling', nameVi: 'Điền từ' },
      { code: 'READING_ORDERING', name: 'Ordering', nameVi: 'Sắp xếp' },
      { code: 'READING_MATCHING', name: 'Matching', nameVi: 'Ghép cặp' },
      { code: 'READING_MATCHING_HEADINGS', name: 'Matching Headings', nameVi: 'Ghép tiêu đề' }
    ]
  },
  {
    code: 'WRITING',
    name: 'Writing',
    nameVi: 'Viết', 
    description: 'Luyện tập kỹ năng viết tiếng Anh',
    icon: <Edit />,
    color: '#FF9800',
    questionTypes: [
      { code: 'WRITING_SHORT', name: 'Short Answers', nameVi: 'Câu trả lời ngắn' },
      { code: 'WRITING_FORM', name: 'Form Filling', nameVi: 'Điền form' },
      { code: 'WRITING_LONG', name: 'Chat Responses', nameVi: 'Trả lời chat' },
      { code: 'WRITING_EMAIL', name: 'Email Writing', nameVi: 'Viết email' }
    ]
  },
  {
    code: 'SPEAKING',
    name: 'Speaking',
    nameVi: 'Nói',
    description: 'Luyện tập kỹ năng nói tiếng Anh', 
    icon: <RecordVoiceOver />,
    color: '#E91E63',
    questionTypes: [
      { code: 'SPEAKING_INTRO', name: 'Personal Introduction', nameVi: 'Tự giới thiệu' },
      { code: 'SPEAKING_DESCRIPTION', name: 'Picture Description', nameVi: 'Miêu tả hình' },
      { code: 'SPEAKING_COMPARISON', name: 'Comparison', nameVi: 'So sánh' },
      { code: 'SPEAKING_DISCUSSION', name: 'Topic Discussion', nameVi: 'Thảo luận' }
    ]
  }
];

const difficultyLevels = [
  { code: 'BEGINNER', name: 'Beginner', nameVi: 'Cơ bản', color: '#4CAF50' },
  { code: 'INTERMEDIATE', name: 'Intermediate', nameVi: 'Trung cấp', color: '#FF9800' },
  { code: 'ADVANCED', name: 'Advanced', nameVi: 'Nâng cao', color: '#F44336' }
];

export default function PracticePage() {
  const router = useRouter();
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [practiceStats, setPracticeStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPracticeStats();
  }, []);

  const loadPracticeStats = async () => {
    try {
      setLoading(true);
      
      // Try to load real stats from API
      try {
        const response = await fetch('/api/student/practice/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const apiStats = result.data;
            setPracticeStats({
              totalPracticed: apiStats.total_questions || 45,
              skillProgress: {
                LISTENING: apiStats.skills_progress?.LISTENING?.average_score || 75,
                READING: apiStats.skills_progress?.READING?.average_score || 60,
                WRITING: apiStats.skills_progress?.WRITING?.average_score || 40,
                SPEAKING: apiStats.skills_progress?.SPEAKING?.average_score || 55
              },
              recentActivity: apiStats.recent_activity || []
            });
            return;
          }
        }
      } catch (apiError) {
        console.log('API not available, using mock data:', apiError);
      }
      
      // Mock data for now
      setPracticeStats({
        totalPracticed: 45,
        skillProgress: {
          LISTENING: 75,
          READING: 60,
          WRITING: 40,
          SPEAKING: 55
        },
        recentActivity: [
          { skill: 'LISTENING', type: 'MCQ', score: 85, date: '2024-01-08' },
          { skill: 'READING', type: 'GAP_FILL', score: 78, date: '2024-01-07' }
        ]
      });
    } catch (error) {
      console.error('Error loading practice stats:', error);
      // Set default stats on error
      setPracticeStats({
        totalPracticed: 0,
        skillProgress: { LISTENING: 0, READING: 0, WRITING: 0, SPEAKING: 0 },
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkillSelect = (skillCode) => {
    setSelectedSkill(skillCode);
    setSelectedQuestionType(''); // Reset question type when skill changes
  };

  const handleStartPractice = () => {
    if (!selectedSkill || !selectedDifficulty) {
      return;
    }

    const params = new URLSearchParams({
      skill: selectedSkill,
      difficulty: selectedDifficulty
    });

    if (selectedQuestionType) {
      params.append('type', selectedQuestionType);
    }

    router.push(`/practice/session?${params.toString()}`);
  };

  const getSkillIcon = (skillCode) => {
    const skill = skillTypes.find(s => s.code === skillCode);
    return skill?.icon || <Psychology />;
  };

  const getSelectedSkill = () => {
    return skillTypes.find(s => s.code === selectedSkill);
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
      <Box>
        {/* Header */}
        <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Ôn tập kỹ năng
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Chọn kỹ năng và độ khó để luyện tập các câu hỏi APTIS
        </Typography>
      </Box>

      {/* Practice Stats */}
      {practiceStats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent textAlign="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {practiceStats.totalPracticed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bài luyện tập
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {skillTypes.map((skill) => (
            <Grid item xs={12} md={2.25} key={skill.code}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Avatar sx={{ bgcolor: skill.color, width: 24, height: 24 }}>
                      {skill.icon}
                    </Avatar>
                    <Typography variant="body2" fontWeight="bold">
                      {skill.nameVi}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={practiceStats.skillProgress[skill.code] || 0}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: skill.color
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" mt={1}>
                    {practiceStats.skillProgress[skill.code] || 0}% hoàn thành
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Skill Selection */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Chọn kỹ năng luyện tập
              </Typography>
              
              <Grid container spacing={2} mb={3}>
                {skillTypes.map((skill) => (
                  <Grid item xs={12} sm={6} md={3} key={skill.code}>
                    <Card 
                      variant="outlined"
                      onClick={() => handleSkillSelect(skill.code)}
                      sx={{
                        cursor: 'pointer',
                        border: selectedSkill === skill.code ? `2px solid ${skill.color}` : '1px solid #e0e0e0',
                        '&:hover': {
                          borderColor: skill.color,
                          boxShadow: 1
                        }
                      }}
                    >
                      <CardContent textAlign="center">
                        <Avatar 
                          sx={{ 
                            bgcolor: skill.color, 
                            mx: 'auto', 
                            mb: 2,
                            width: 56,
                            height: 56
                          }}
                        >
                          {skill.icon}
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {skill.nameVi}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontSize={12}>
                          {skill.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Question Type Selection */}
              {selectedSkill && (
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Loại câu hỏi (tùy chọn)
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label="Tất cả"
                      onClick={() => setSelectedQuestionType('')}
                      color={!selectedQuestionType ? 'primary' : 'default'}
                      variant={!selectedQuestionType ? 'filled' : 'outlined'}
                    />
                    {getSelectedSkill()?.questionTypes.map((type) => (
                      <Chip
                        key={type.code}
                        label={type.nameVi}
                        onClick={() => setSelectedQuestionType(type.code)}
                        color={selectedQuestionType === type.code ? 'primary' : 'default'}
                        variant={selectedQuestionType === type.code ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Difficulty Selection */}
              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Độ khó
                </Typography>
                <Box display="flex" gap={1}>
                  {difficultyLevels.map((level) => (
                    <Chip
                      key={level.code}
                      label={level.nameVi}
                      onClick={() => setSelectedDifficulty(level.code)}
                      color={selectedDifficulty === level.code ? 'primary' : 'default'}
                      variant={selectedDifficulty === level.code ? 'filled' : 'outlined'}
                      sx={{
                        borderColor: level.color,
                        '&.MuiChip-filled': {
                          backgroundColor: level.color,
                          color: 'white'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Start Practice Button */}
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={handleStartPractice}
                disabled={!selectedSkill || !selectedDifficulty}
                fullWidth
                sx={{ mt: 2 }}
              >
                Bắt đầu luyện tập
              </Button>

              {(!selectedSkill || !selectedDifficulty) && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Vui lòng chọn kỹ năng và độ khó để bắt đầu luyện tập
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                <TrendingUp sx={{ mr: 1 }} />
                Hoạt động gần đây
              </Typography>
              
              {practiceStats?.recentActivity?.length > 0 ? (
                <Box>
                  {practiceStats.recentActivity.map((activity, index) => (
                    <Box key={index} mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        {getSkillIcon(activity.skill)}
                        <Typography variant="body2" fontWeight="bold">
                          {skillTypes.find(s => s.code === activity.skill)?.nameVi}
                        </Typography>
                        <Chip 
                          label={`${activity.score}%`}
                          size="small"
                          color={activity.score >= 80 ? 'success' : activity.score >= 60 ? 'warning' : 'error'}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {activity.type} • {new Date(activity.date).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  Chưa có hoạt động luyện tập nào
                </Typography>
              )}

              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => router.push('/progress')}
              >
                Xem báo cáo tiến độ
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>
    </Container>
  );
}