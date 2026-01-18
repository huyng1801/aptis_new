'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Paper,
  Divider,
  Badge,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Skeleton,
} from '@mui/material';
import {
  PlayArrow,
  Schedule,
  Assessment,
  School,
  TrendingUp,
  Quiz,
  Star,
  Person,
  CheckCircle,
  FitnessCenter,
  BarChart,
  Timeline,
  Refresh,
} from '@mui/icons-material';
import { api } from '@/services/api';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyAttempts } from '@/store/slices/examSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Breadcrumb from '@/components/common/Breadcrumb';
import StatsCard from '@/components/practice/StatsCard';
import SkillSelector from '@/components/practice/SkillSelector';
import ExamsList from '@/components/practice/ExamsList';
import PracticeHistory from '@/components/practice/PracticeHistory';

export default function PracticePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  // State for skills
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [overallStats, setOverallStats] = useState({
    totalExams: 0,
    completedAttempts: 0,
    averageScore: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // State for exams
  const [exams, setExams] = useState([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState(null);
  
  // Get attempts from Redux
  const { myAttempts } = useSelector(state => state.exams);
  
  // Format skill name
  const formatSkillName = (name) => {
    const skillMap = {
      'READING': 'Reading',
      'LISTENING': 'Listening',
      'WRITING': 'Writing',
      'SPEAKING': 'Speaking',
    };
    return skillMap[name] || name;
  };

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const response = await api.get('/student/dashboard/stats');
      const data = response.data?.data || response.data;
      
      if (data) {
        setOverallStats({
          totalExams: data.totalExams || 0,
          completedAttempts: data.totalAttempts || 0,
          averageScore: data.averageScore || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setOverallStats({
        totalExams: 0,
        completedAttempts: 0,
        averageScore: 0,
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Calculate skill-specific stats from myAttempts
  const getSkillStatsFromAttempts = (skillId) => {
    if (!myAttempts || !Array.isArray(myAttempts)) {
      return {
        examCount: 5, // Fallback estimate
        completedCount: 0
      };
    }

    const skillAttempts = myAttempts.filter(attempt => 
      attempt.attempt_type === 'single_skill' &&
      (attempt.skillType === skillId || 
       attempt.skill_id === skillId ||
       attempt.skill_type_id === skillId)
    );

    return {
      examCount: Math.max(5, skillAttempts.length + 3), // At least 5, plus some available
      completedCount: skillAttempts.filter(attempt => 
        attempt.status === 'submitted' || attempt.status === 'completed'
      ).length
    };
  };

  // Fetch skills và stats
  useEffect(() => {
    const fetchSkillsAndStats = async () => {
      try {
        setIsLoadingSkills(true);
        setError(null);

        // Fetch skill types
        const skillsRes = await api.get('/public/skill-types');
        const skillsData = skillsRes.data?.data || skillsRes.data || [];
        setSkills(Array.isArray(skillsData) ? skillsData : []);

        // Stats will be calculated from myAttempts in SkillSelector and overall stats useEffect

        // Set first skill as selected by default and auto-fetch its exams
        if (skillsData.length > 0) {
          const firstSkill = skillsData[0];
          setSelectedSkill(firstSkill);
          // Auto-fetch exams for first skill
          fetchExamsBySkill(firstSkill.id);
        }

      } catch (err) {
        console.error('Failed to fetch skills:', err);
        setError(err.response?.data?.message || 'Không thể tải danh sách kỹ năng');
        setSkills([]);
      } finally {
        setIsLoadingSkills(false);
      }
    };

    fetchSkillsAndStats();
    fetchStats();
    dispatch(fetchMyAttempts());
  }, [dispatch, fetchStats]);

  // Fetch exams theo skill được chọn
  const fetchExamsBySkill = useCallback(async (skillId) => {
    if (!skillId) {
      setExams([]);
      return;
    }

    try {
      setIsLoadingExams(true);
      setError(null);

      // Use skill filter for better API call
      const response = await api.get(`/student/exams?skill_type=${skillId}&limit=50`);
      const examsData = response.data?.data || response.data?.exams || [];
      setExams(Array.isArray(examsData) ? examsData : []);

    } catch (err) {
      console.error('Failed to fetch exams for skill:', err);
      setError(err.response?.data?.message || 'Không thể tải bài thi cho kỹ năng này');
      setExams([]);
    } finally {
      setIsLoadingExams(false);
    }
  }, []);

  // Handle skill selection
  const handleSkillSelect = useCallback((skill) => {
    setSelectedSkill(skill);
    fetchExamsBySkill(skill.id);
  }, [fetchExamsBySkill]);

  // Handle start practice
  const handleStartPractice = useCallback((examId) => {
    if (!selectedSkill) return;
    
    // Get the correct skill name for the query
    const skillName = formatSkillName(selectedSkill.skill_type_name);
    router.push(`/exams/${examId}/take?type=single_skill&skill=${selectedSkill.id}`);
  }, [router, selectedSkill]);

  const getSkillColor = useCallback((skillName) => {
    const colors = {
      'Reading': '#1976d2',    // Blue
      'Listening': '#388e3c',  // Green  
      'Writing': '#f57c00',    // Orange
      'Speaking': '#d32f2f',   // Red
      'READING': '#1976d2',
      'LISTENING': '#388e3c',
      'WRITING': '#f57c00',
      'SPEAKING': '#d32f2f',
    };
    return colors[skillName] || '#757575';
  }, []);

  const getSkillIcon = useCallback((skillName) => {
    const icons = {
      'Reading': '📖',
      'Listening': '🎧',
      'Writing': '✍️',
      'Speaking': '🗣️',
      'READING': '📖',
      'LISTENING': '🎧',
      'WRITING': '✍️',
      'SPEAKING': '🗣️',
    };
    return icons[skillName] || '📚';
  }, []);

  const formatDuration = useCallback((minutes) => {
    if (!minutes) return 'Không xác định';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  // Filter attempts for practice (single_skill attempts)
  const practiceAttempts = Array.isArray(myAttempts)
    ? myAttempts
        .filter(attempt => attempt.attempt_type === 'single_skill')
        .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
        .slice(0, 10)
    : [];

  // Calculate overall stats from myAttempts if available
  const calculateStatsFromAttempts = () => {
    if (myAttempts && Array.isArray(myAttempts)) {
      const singleSkillAttempts = myAttempts.filter(attempt => attempt.attempt_type === 'single_skill');
      const completed = singleSkillAttempts.filter(attempt => attempt.status === 'submitted').length;
      const totalScore = singleSkillAttempts
        .filter(attempt => attempt.total_score !== null && attempt.total_score !== undefined)
        .reduce((sum, attempt) => sum + (attempt.total_score || 0), 0);
      const avgScore = completed > 0 ? (totalScore / completed).toFixed(1) : 0;
      
      return {
        completedAttempts: completed,
        averageScore: avgScore
      };
    }
    return { completedAttempts: 0, averageScore: 0 };
  };

  // Refresh stats when attempts change
  useEffect(() => {
    if (myAttempts && Array.isArray(myAttempts)) {
      fetchStats();
    }
  }, [myAttempts, fetchStats]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoadingSkills) {
    return <LoadingSpinner message="Đang tải danh sách kỹ năng..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4, minHeight: 'calc(100vh - 300px)' }}>
      {/* Breadcrumb */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumb />
      </Box>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          Luyện tập theo kỹ năng
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Luyện tập từng kỹ năng riêng biệt để cải thiện điểm số
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Overall Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Tổng bài thi"
            value={overallStats.totalExams}
            subtitle="bài thi có sẵn"
            icon={Assessment}
            color="#1976d2"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Đã hoàn thành"
            value={overallStats.completedAttempts}
            subtitle="lần làm bài"
            icon={CheckCircle}
            color="#388e3c"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Điểm trung bình"
            value={overallStats.averageScore}
            subtitle="trên 50 điểm"
            icon={Star}
            color="#f57c00"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Kỹ năng"
            value={skills.length}
            subtitle="kỹ năng có thể luyện"
            icon={FitnessCenter}
            color="#d32f2f"
          />
        </Grid>
      </Grid>

      {/* Main Content - Two Columns */}
      <Grid container spacing={3}>
        {/* Left Column - Skills and Exams */}
        <Grid item xs={12} md={8}>
          {/* Skills Selection */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FitnessCenter fontSize="small" />
              Chọn kỹ năng luyện tập
            </Typography>

            <SkillSelector 
              skills={skills}
              selectedSkill={selectedSkill}
              onSelectSkill={handleSkillSelect}
              getSkillColor={getSkillColor}
              getSkillIcon={getSkillIcon}
              formatSkillName={formatSkillName}
            />
          </Paper>

          {/* Exams for Selected Skill */}
          {selectedSkill && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <ExamsList
                selectedSkill={selectedSkill}
                exams={exams}
                isLoadingExams={isLoadingExams}
                onStartPractice={handleStartPractice}
                getSkillColor={getSkillColor}
                getSkillIcon={getSkillIcon}
                formatSkillName={formatSkillName}
                formatDuration={formatDuration}
              />
            </Paper>
          )}
        </Grid>

        {/* Right Column - Practice History */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <PracticeHistory
              attempts={practiceAttempts}
              formatDate={formatDate}
              formatSkillName={formatSkillName}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}