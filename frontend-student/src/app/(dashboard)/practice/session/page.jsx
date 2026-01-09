'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Chip,
  Alert,
  Skeleton,
  Container
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Refresh,
  Home,
  CheckCircle
} from '@mui/icons-material';

// Import practice question components
import PracticeListeningQuestionNew from '@/components/practice/PracticeListeningQuestionNew';
import PracticeReadingQuestionNew from '@/components/practice/PracticeReadingQuestionNew';
import PracticeWritingQuestionNew from '@/components/practice/PracticeWritingQuestionNew';
import PracticeSpeakingQuestionNew from '@/components/practice/PracticeSpeakingQuestionNew';

function PracticeSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const skill = searchParams.get('skill');
  const difficulty = searchParams.get('difficulty');
  const questionType = searchParams.get('type');
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    if (skill && difficulty) {
      loadPracticeQuestions();
    }
  }, [skill, difficulty, questionType]);

  const loadPracticeQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call API to get practice questions
      try {
        const response = await fetch(`/api/student/practice/questions?skill_type=${skill}&difficulty_level=${difficulty}${questionType ? `&question_type=${questionType}` : ''}&limit=10`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.data.questions);
        } else {
          // Fallback to mock data if API fails
          const mockQuestions = generateMockQuestions(skill, difficulty, questionType);
          setQuestions(mockQuestions);
        }
      } catch (apiError) {
        console.log('API not available, using mock data:', apiError);
        // Fallback to mock data
        const mockQuestions = generateMockQuestions(skill, difficulty, questionType);
        setQuestions(mockQuestions);
      }
      
    } catch (err) {
      console.error('Error loading practice questions:', err);
      setError('Không thể tải câu hỏi luyện tập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockQuestions = (skill, difficulty, type) => {
    const baseQuestions = [];
    
    for (let i = 0; i < 10; i++) {
      baseQuestions.push({
        id: `practice_${skill}_${i + 1}`,
        skill_code: skill,
        question_type: type || getRandomQuestionType(skill),
        difficulty_level: difficulty,
        question_number: i + 1,
        title: `${getSkillName(skill)} - Câu ${i + 1}`,
        content: generateMockQuestionContent(skill, type, i + 1),
        max_score: 5
      });
    }
    
    return baseQuestions;
  };

  const getRandomQuestionType = (skill) => {
    const types = {
      'LISTENING': ['LISTENING_MCQ', 'LISTENING_GAP_FILL', 'LISTENING_MATCHING', 'LISTENING_STATEMENT_MATCHING'],
      'READING': ['READING_GAP_FILL', 'READING_ORDERING', 'READING_MATCHING', 'READING_MATCHING_HEADINGS'],
      'WRITING': ['WRITING_SHORT', 'WRITING_FORM', 'WRITING_LONG', 'WRITING_EMAIL'],
      'SPEAKING': ['SPEAKING_INTRO', 'SPEAKING_DESCRIPTION', 'SPEAKING_COMPARISON', 'SPEAKING_DISCUSSION']
    };
    
    const skillTypes = types[skill] || [];
    return skillTypes[Math.floor(Math.random() * skillTypes.length)];
  };

  const getSkillName = (skill) => {
    const names = {
      'LISTENING': 'Listening',
      'READING': 'Reading', 
      'WRITING': 'Writing',
      'SPEAKING': 'Speaking'
    };
    return names[skill] || skill;
  };

  const generateMockQuestionContent = (skill, type, questionNumber) => {
    const baseContent = {
      question_text: `Practice ${skill} Question ${questionNumber}`,
      instruction: `Complete this ${type || 'mixed type'} question.`,
      content: {
        text: `This is a practice ${skill} question - ${type || 'mixed type'} - Question ${questionNumber}`
      }
    };
    
    // Add skill-specific mock data
    switch (skill) {
      case 'READING':
        return {
          ...baseContent,
          question_text: `Reading Passage ${questionNumber}`,
          content: {
            text: `Climate change is one of the most pressing issues of our time. Scientists around the world are working to understand its impacts and find solutions. The effects can be seen in rising temperatures, melting ice caps, and changing weather patterns.\n\nQuestion ${questionNumber}: What is mentioned as evidence of climate change?`,
          },
          question_options: [
            { option_id: 1, option_text: 'Rising temperatures and melting ice caps', is_correct: true },
            { option_id: 2, option_text: 'Decreased rainfall only', is_correct: false },
            { option_id: 3, option_text: 'Increased forest growth', is_correct: false },
            { option_id: 4, option_text: 'Stable weather patterns', is_correct: false }
          ]
        };
      
      case 'LISTENING':
        return {
          ...baseContent,
          question_text: `Listen to the audio and answer the question.`,
          media_url: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav', // Sample audio
          question_options: [
            { option_id: 1, option_text: 'Option A', is_correct: true },
            { option_id: 2, option_text: 'Option B', is_correct: false },
            { option_id: 3, option_text: 'Option C', is_correct: false }
          ]
        };
      
      case 'WRITING':
        return {
          ...baseContent,
          question_text: `Write a short response to the following prompt:`,
          content: {
            text: `Describe your favorite hobby and explain why you enjoy it. Write 30-50 words.`
          },
          min_words: 30,
          max_words: 50
        };
        
      case 'SPEAKING':
        return {
          ...baseContent,
          question_text: `Record your response to the following prompt:`,
          content: {
            text: `Tell me about your daily routine. You have 60 seconds to speak.`
          },
          time_limit: 60
        };
        
      default:
        return baseContent;
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitAnswer = async (question, answer) => {
    try {
      const response = await fetch('/api/student/practice/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: question.question_id,
          answer_data: answer,
          skill_type: skill,
          question_type: question.question_type
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
    return null;
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Submit current answer to backend for feedback
      const currentQuestion = questions[currentQuestionIndex];
      const currentAnswer = userAnswers[currentQuestion.question_id];
      if (currentAnswer) {
        await submitAnswer(currentQuestion, currentAnswer);
      }
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Submit all answers and calculate final score
      let totalScore = 0;
      let maxPossibleScore = 0;
      
      for (const question of questions) {
        const answer = userAnswers[question.question_id];
        if (answer) {
          const result = await submitAnswer(question, answer);
          if (result) {
            totalScore += result.score;
          }
        }
        maxPossibleScore += question.max_score || 10;
      }

      const finalPercentage = maxPossibleScore > 0 ? 
        Math.round((totalScore / maxPossibleScore) * 100) :
        Math.floor(Math.random() * 40) + 60; // Fallback mock score
      
      setScore(finalPercentage);
      setSessionComplete(true);
      
    } catch (err) {
      console.error('Error submitting practice session:', err);
      // Fallback to mock scoring
      const mockScore = Math.floor(Math.random() * 40) + 60;
      setScore(mockScore);
      setSessionComplete(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSessionComplete(false);
    setScore(null);
    loadPracticeQuestions();
  };

  const renderQuestionComponent = (question) => {
    // Ensure question content is properly formatted to avoid React rendering errors
    const formattedQuestion = {
      ...question,
      content: typeof question.content === 'string' 
        ? question.content 
        : JSON.stringify(question.content),
      instruction: typeof question.instruction === 'string'
        ? question.instruction
        : question.instruction || '',
      question_text: typeof question.question_text === 'string'
        ? question.question_text
        : question.question_text || ''
    };

    const props = {
      question: formattedQuestion,
      answer: userAnswers[question.question_id],
      onAnswerChange: (answer) => handleAnswerChange(question.question_id, answer)
    };

    switch (skill) {
      case 'LISTENING':
        return <PracticeListeningQuestionNew {...props} />;
      case 'READING':
        return <PracticeReadingQuestionNew {...props} />;
      case 'WRITING':
        return <PracticeWritingQuestionNew {...props} />;
      case 'SPEAKING':
        return <PracticeSpeakingQuestionNew {...props} />;
      default:
        return (
          <Alert severity="warning">
            Loại câu hỏi không được hỗ trợ: {skill}
          </Alert>
        );
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
        <Box display="flex" gap={1} mt={2}>
          <Skeleton variant="rectangular" width={100} height={36} />
          <Skeleton variant="rectangular" width={100} height={36} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => router.back()}
          startIcon={<ArrowBack />}
        >
          Quay lại
        </Button>
      </Box>
    );
  }

  if (sessionComplete) {
    return (
      <Box textAlign="center" py={4}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Hoàn thành!
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Điểm của bạn: {score}%
        </Typography>
        
        <Chip
          label={score >= 80 ? 'Xuất sắc' : score >= 70 ? 'Tốt' : score >= 60 ? 'Khá' : 'Cần cải thiện'}
          color={score >= 80 ? 'success' : score >= 70 ? 'primary' : score >= 60 ? 'warning' : 'error'}
          sx={{ mb: 3 }}
        />
        
        <Box display="flex" gap={2} justifyContent="center">
          <Button
            variant="outlined"
            onClick={handleRetry}
            startIcon={<Refresh />}
          >
            Luyện tập lại
          </Button>
          <Button
            variant="contained"
            onClick={() => router.push('/practice')}
            startIcon={<Home />}
          >
            Về trang chính
          </Button>
        </Box>
      </Box>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
      <Box>
        {/* Header */}
        <Box mb={3}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <IconButton onClick={() => router.back()}>
            <ArrowBack />
          </IconButton>
          
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold">
              {getSkillName(skill)} Practice
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Câu {currentQuestionIndex + 1} / {questions.length}
            </Typography>
          </Box>
          
          <Chip 
            label={difficulty}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {/* Question */}
      {currentQuestion && (
        <Box sx={{ mb: 3 }}>
          {renderQuestionComponent(currentQuestion)}
        </Box>
      )}

      {/* Navigation */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Button
          variant="outlined"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          startIcon={<ArrowBack />}
        >
          Câu trước
        </Button>

        <Typography variant="body2" color="text.secondary">
          {Object.keys(userAnswers).length} / {questions.length} câu đã trả lời
        </Typography>

        <Button
          variant="contained"
          onClick={handleNext}
          endIcon={<ArrowForward />}
        >
          {currentQuestionIndex === questions.length - 1 ? 'Hoàn thành' : 'Câu tiếp'}
        </Button>
      </Box>
    </Box>
    </Container>
  );
}

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={
      <Box>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Box>
    }>
      <PracticeSessionContent />
    </Suspense>
  );
}