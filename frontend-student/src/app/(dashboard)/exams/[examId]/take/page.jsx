'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  LinearProgress,
  Card,
  CardContent,
  Alert,
  Typography,
  Button,
} from '@mui/material';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { submitAttempt, updateTimer, loadAttempt } from '@/store/slices/attemptSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import QuestionDisplay from '@/components/exam-taking/QuestionDisplay';
import ExamModeDialog from '@/components/exam-taking/ExamModeDialog';
import ExamHeader from '@/components/exam-taking/ExamHeader';
import ExamNavigation from '@/components/exam-taking/ExamNavigation';
import SkillIntroduction from '@/components/exam-taking/SkillIntroduction';
import attemptService from '@/services/attemptService';
import { useExamState } from '@/hooks/useExamState';
import { getFallbackSkills } from '@/components/exam-taking/ExamHelpers';

export default function TakeExamPage() {
  const { examId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  
  const attemptId = searchParams.get('attemptId');
  const attemptType = searchParams.get('type') || 'full_exam';
  const selectedSkill = searchParams.get('skill');
  
  const { user } = useSelector(state => state.auth);

  // Additional state for skill-based navigation
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [showSkillIntro, setShowSkillIntro] = useState(false);

  // Use custom hook for state management
  const {
    drawerOpen, setDrawerOpen,
    submitDialogOpen, setSubmitDialogOpen,
    modeDialogOpen, setModeDialogOpen,
    currentQuestionIndex, setCurrentQuestionIndex,
    hideHeader,
    availableSkills, setAvailableSkills,
    selectedSkillFilter, setSelectedSkillFilter,
    isMicrophoneTestActive,
    microphoneTestCompleted,
    isNavigationDisabled,
    currentAttempt, questions, answers, loading, error,
    timeRemaining, timerInitialized, autoSaveStatus,
    handleStartExam,
    handleAnswerChange,
    handleNextQuestion,
    handlePreviousQuestion,
    handleQuestionNavigation,
    handleHideHeader,
    startMicrophoneTest,
    completeMicrophoneTest,
    getQuestionStatus,
    getProgressPercentage
  } = useExamState(examId, attemptId, attemptType, selectedSkill);

  const timerRef = useRef(null);

  // Timer management - update timer every second
  useEffect(() => {
    if (currentAttempt && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        dispatch(updateTimer());
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [currentAttempt, timeRemaining, dispatch]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining <= 0 && currentAttempt && timerInitialized) {
      console.log('[TakeExamPage] Time up, auto-submitting');
      handleTimeUp();
    }
  }, [timeRemaining, currentAttempt, timerInitialized]);

  // Load available skills on mount
  useEffect(() => {
    const loadSkills = async () => {
      if (!examId) return;
      
      console.log('[TakeExamPage] Loading skills for examId:', examId);
      try {
        const response = await attemptService.getExamSkills(examId);
        console.log('[TakeExamPage] Skills API response:', response);
        
        // Fix the parsing logic based on the actual response structure
        const skillsArray = response.data?.data?.skills || response.data?.skills || [];
        console.log('[TakeExamPage] Final skills array:', skillsArray);
        
        // Ensure component re-renders after skills are loaded
        setAvailableSkills(skillsArray);
        
        // Set first skill as default filter for full exam
        if (skillsArray.length > 0 && attemptType === 'full_exam') {
          setSelectedSkillFilter(skillsArray[0].id);
        }
        
        console.log('[TakeExamPage] Skills set successfully:', skillsArray.length);
      } catch (error) {
        console.error('[TakeExamPage] Error loading skills:', error);
        // Fallback to default skills
        console.log('[TakeExamPage] Using fallback skills');
        const fallbackSkills = getFallbackSkills();
        setAvailableSkills(fallbackSkills);
        
        // Set first skill as default filter for full exam
        if (attemptType === 'full_exam') {
          setSelectedSkillFilter(fallbackSkills[0].id);
        }
        
        console.log('[TakeExamPage] Fallback skills set:', fallbackSkills.length);
      }
    };
    
    loadSkills();
  }, [examId, attemptType]);

  // Debug: Log current question structure
  const currentQuestion = questions[currentQuestionIndex];
  useEffect(() => {
    if (currentQuestion) {
      console.log('[TakeExamPage] Current question structure:', {
        id: currentQuestion.question?.id,
        questionType: currentQuestion.question?.questionType?.code,
        hasMediaUrl: !!currentQuestion.question?.media_url,
        media_url: currentQuestion.question?.media_url,
        hasOptions: !!currentQuestion.question?.options,
        optionsCount: currentQuestion.question?.options?.length,
        hasItems: !!currentQuestion.question?.items,
        itemsCount: currentQuestion.question?.items?.length
      });
    }
  }, [currentQuestion]);

  // Setup skill navigation when exam starts - show intro immediately for full_exam
  const hasShownIntro = useRef(false);
  useEffect(() => {
    if (currentAttempt && attemptType === 'full_exam' && availableSkills.length > 0 && !hasShownIntro.current) {
      // Show intro for first skill when exam starts and skills are loaded
      console.log('[TakeExamPage] Full exam started with skills loaded, showing intro for first skill');
      setShowSkillIntro(true);
      hasShownIntro.current = true;
    }
  }, [currentAttempt, attemptType, availableSkills]);

  // Handle time up - submit attempt and redirect
  const handleTimeUp = async () => {
    if (currentAttempt) {
      await dispatch(submitAttempt(currentAttempt.id));
      router.push(`/results/${currentAttempt.id}`);
    }
  };

  // Handle submit - called from submit dialog
  const handleSubmit = async () => {
    if (currentAttempt) {
      await dispatch(submitAttempt(currentAttempt.id));
      router.push(`/results/${currentAttempt.id}`);
    }
    setSubmitDialogOpen(false);
  };

  // Set fullscreen mode when exam starts
  useEffect(() => {
    if (currentAttempt) {
      // Hide layout header/footer by adding class to body
      document.body.classList.add('exam-fullscreen');
      
      return () => {
        // Cleanup on unmount
        document.body.classList.remove('exam-fullscreen');
      };
    }
  }, [currentAttempt]);

  // Check if we need to extract questions again from current attempt
  useEffect(() => {
    if (currentAttempt && currentAttempt.answers && questions.length === 0) {
      console.log('[TakeExamPage] Current attempt has answers but no questions extracted, attempting to extract...');
      console.log('[TakeExamPage] Answers in current attempt:', currentAttempt.answers.length);
      if (currentAttempt.answers.length > 0 && currentAttempt.answers[0].question) {
        console.log('[TakeExamPage] Sample answer structure:', currentAttempt.answers[0]);
      }
    }
  }, [currentAttempt, questions.length]);

  // Get current skill info
  const getCurrentSkillInfo = () => {
    if (attemptType === 'full_exam' && selectedSkillFilter) {
      return availableSkills.find(s => s.id === selectedSkillFilter);
    }
    return null;
  };

  // Group questions by skill for skill-based navigation
  const groupQuestionsBySkill = () => {
    const grouped = {};
    availableSkills.forEach(skill => {
      const skillQuestions = questions.filter(q => q.question?.questionType?.skill_type_id === skill.id);
      if (skillQuestions.length > 0) {
        grouped[skill.id] = {
          skill,
          questions: skillQuestions
        };
      }
    });
    return grouped;
  };

  // Handle moving to next skill
  const handleNextSkill = () => {
    const groupedSkills = groupQuestionsBySkill();
    const skillIds = Object.keys(groupedSkills);
    
    console.log('[TakeExamPage] handleNextSkill called', {
      currentSkillIndex,
      totalSkills: skillIds.length,
      willMoveToNext: currentSkillIndex < skillIds.length - 1
    });
    
    if (currentSkillIndex < skillIds.length - 1) {
      // Move to next skill
      const nextSkillIndex = currentSkillIndex + 1;
      console.log('[TakeExamPage] Moving to skill', nextSkillIndex);
      setCurrentSkillIndex(nextSkillIndex);
      setCurrentQuestionIndex(0); // Reset to first question of new skill
      setShowSkillIntro(true); // Show intro for new skill
    } else {
      // Exam completed, submit
      console.log('[TakeExamPage] All skills completed, showing submit dialog');
      setSubmitDialogOpen(true);
    }
  };

  // Handle starting a skill after introduction
  const handleStartSkill = () => {
    console.log('[TakeExamPage] Starting skill', currentSkillIndex, 'questions available:', questions.length);
    
    // Check if questions are loaded
    if (questions.length === 0) {
      console.error('[TakeExamPage] Cannot start skill - questions not loaded yet!');
      alert('Đang tải câu hỏi, vui lòng đợi...');
      return;
    }
    
    setShowSkillIntro(false);
    // Ensure we're at the first question of the skill
    setCurrentQuestionIndex(0);
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="h6" gutterBottom>Lỗi tải bài thi</Typography>
        <Typography>{error}</Typography>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/dashboard')} 
          sx={{ mt: 2 }}
        >
          Quay về Dashboard
        </Button>
      </Alert>
    );
  }
  
  // Show loading if we have an attempt but questions are still loading
  if (currentAttempt && questions.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <LoadingSpinner />
        <Typography sx={{ mt: 2 }}>Đang tải câu hỏi...</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Attempt ID: {currentAttempt.id} | Answers: {answers.length} | Questions: {questions.length}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          First Answer: {answers[0]?.id} | Has Question: {!!answers[0]?.question}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => {
            console.log('Manual refresh attempt');
            console.log('Current attempt answers:', answers.map(a => ({ id: a.id, hasQuestion: !!a.question, questionId: a.question?.id })));
            dispatch(loadAttempt(currentAttempt.id));
          }} 
          sx={{ mt: 2 }}
        >
          Thử lại
        </Button>
      </Box>
    );
  }
  
  if (!currentAttempt) {
    console.log('[TakeExamPage] No currentAttempt, rendering initialization screen with dialog');
    return (
      <Box>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Đang khởi tạo bài thi...</Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Mode Dialog Open: {modeDialogOpen ? 'true' : 'false'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Skills loaded: {availableSkills.length}
          </Typography>
          <LoadingSpinner />
          
          {/* Debug: Always show dialog */}
          <Button 
            variant="outlined" 
            onClick={() => setModeDialogOpen(true)} 
            sx={{ mt: 2 }}
          >
            Debug: Show Dialog
          </Button>
        </Box>
        
        {/* Exam Mode Selection Dialog */}
        <ExamModeDialog
          open={modeDialogOpen}
          onClose={() => {
            console.log('[TakeExamPage] ExamModeDialog onClose called');
            setModeDialogOpen(false);
            router.push('/dashboard');
          }}
          onStartExam={handleStartExam}
          exam={{ title: 'APTIS Exam', duration_minutes: 90 }}
          availableSkills={availableSkills}
        />
      </Box>
    );
  }

  // For full_exam, wait for skills to load before showing anything
  if (currentAttempt && attemptType === 'full_exam' && availableSkills.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <LoadingSpinner />
        <Typography sx={{ mt: 2 }}>Đang tải thông tin kỹ năng...</Typography>
      </Box>
    );
  }
  
  // Get questions for current skill in full exam mode
  const getCurrentSkillData = () => {
    if (attemptType === 'full_exam' && availableSkills.length > 0) {
      const currentSkill = availableSkills[currentSkillIndex];
      console.log('[TakeExamPage] Getting skill data for index:', currentSkillIndex, 'skill:', currentSkill);
      console.log('[TakeExamPage] Total questions:', questions.length);
      console.log('[TakeExamPage] First question raw structure:', questions[0]);
      console.log('[TakeExamPage] Sample questions structure:', questions.slice(0, 3).map(q => ({ 
        id: q.question?.id, 
        skill_type_id: q.question?.questionType?.skill_type_id, 
        type: q.question?.questionType?.code,
        // Try alternative paths
        alt_id: q.id,
        alt_skill_type_id: q.skill_type_id,
        alt_question_type_id: q.question_type_id,
        hasQuestion: !!q.question,
        hasQuestionType: !!q.question?.questionType,
        keys: Object.keys(q)
      })));
      
      if (currentSkill) {
        // Filter questions for this skill - questions are answers with nested question object
        const skillQuestions = questions.filter(q => {
          const skillTypeId = q.question?.questionType?.skill_type_id;
          return skillTypeId === currentSkill.id;
        });
        console.log('[TakeExamPage] Skill questions for skill id', currentSkill.id, ':', skillQuestions.length);
        
        if (skillQuestions.length === 0 && questions.length > 0) {
          console.warn('[TakeExamPage] No questions found for skill', currentSkill.skill_type_name, '- this is a problem!');
          console.log('[TakeExamPage] Available skill_type_ids in questions:', [...new Set(questions.map(q => q.question?.questionType?.skill_type_id))]);
        }
        
        return {
          skill: currentSkill,
          questions: skillQuestions
        };
      }
    }
    console.log('[TakeExamPage] Using default questions:', { questionsLength: questions.length });
    return { skill: null, questions: questions };
  };
  
  const currentSkillData = getCurrentSkillData();
  const displayQuestions = attemptType === 'full_exam' ? currentSkillData.questions : questions;
  const displayCurrentQuestion = displayQuestions[currentQuestionIndex];
  
  // Check if current question is a listening question
  const isListeningQuestion = displayCurrentQuestion?.question?.questionType?.code?.includes('LISTENING');
  const canNavigateBackward = !isListeningQuestion && currentQuestionIndex > 0;
  
  // Get current answer - find the actual answer data from answers array
  // displayCurrentQuestion is an answer object, but we need the most up-to-date answer from Redux store
  const currentAnswer = displayCurrentQuestion ? 
    answers.find(a => a.question_id === displayCurrentQuestion.question_id) || displayCurrentQuestion
    : null;
  
  console.log('[TakeExamPage] Render state:', {
    attemptType,
    showSkillIntro,
    currentSkillData,
    displayQuestionsLength: displayQuestions.length,
    currentQuestionIndex,
    hasDisplayCurrentQuestion: !!displayCurrentQuestion,
    availableSkillsLength: availableSkills.length
  });
  
  console.log('[TakeExamPage] Display data:', {
    attemptType,
    displayQuestionsLength: displayQuestions.length,
    currentQuestionIndex,
    hasDisplayCurrentQuestion: !!displayCurrentQuestion,
    displayCurrentQuestionId: displayCurrentQuestion?.question_id,
    currentAnswerHasData: !!currentAnswer,
    answerData: currentAnswer ? {
      question_id: currentAnswer.question_id,
      answer_type: currentAnswer.answer_type,
      selected_option_id: currentAnswer.selected_option_id,
      text_answer: currentAnswer.text_answer,
      has_answer_json: !!currentAnswer.answer_json,
      audio_url: currentAnswer.audio_url
    } : 'NO_ANSWER'
  });

  // Safety check for empty displayQuestions - BUT ALLOW when skill intro is showing
  if (currentAttempt && displayQuestions.length === 0 && !showSkillIntro && attemptType === 'full_exam') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <LoadingSpinner />
        <Typography sx={{ mt: 2 }}>Đang tải câu hỏi...</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Skill Index: {currentSkillIndex} | Available Skills: {availableSkills.length} | Total Questions: {questions.length}
        </Typography>
      </Box>
    );
  }
  
  // Override navigation functions for skill-based navigation
  const handleSkillBasedNextQuestion = () => {
    // Don't allow navigation while skill intro is showing
    if (showSkillIntro) {
      console.log('[TakeExamPage] Navigation blocked - skill intro is showing');
      return;
    }
    
    if (attemptType === 'full_exam') {
      if (currentQuestionIndex < displayQuestions.length - 1) {
        // Move to next question in current skill
        console.log('[TakeExamPage] Moving to next question in skill');
        handleNextQuestion();
      } else {
        // End of current skill, move to next skill
        console.log('[TakeExamPage] End of skill, moving to next skill');
        handleNextSkill();
      }
    } else {
      handleNextQuestion();
    }
  };
  
  const handleSkillBasedPreviousQuestion = () => {
    // Don't allow navigation while skill intro is showing
    if (showSkillIntro) {
      console.log('[TakeExamPage] Navigation blocked - skill intro is showing');
      return;
    }

    // Check if current question is a Listening question - prevent backward navigation
    const currentQuestion = displayCurrentQuestion?.question;
    if (currentQuestion?.questionType?.code?.includes('LISTENING')) {
      console.log('[TakeExamPage] Navigation blocked - cannot navigate backward in Listening section');
      return;
    }
    
    if (attemptType === 'full_exam') {
      if (currentQuestionIndex > 0) {
        console.log('[TakeExamPage] Moving to previous question in skill');
        handlePreviousQuestion();
      } else {
        console.log('[TakeExamPage] Already at first question of skill, cannot go back');
      }
      // Cannot go back to previous skill
    } else {
      handlePreviousQuestion();
    }
  };

  console.log('[TakeExamPage] About to render, showSkillIntro:', showSkillIntro, 'hasSkill:', !!currentSkillData.skill, 'open will be:', showSkillIntro && !!currentSkillData.skill);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Skill Introduction Dialog */}
      <SkillIntroduction
        open={showSkillIntro && !!currentSkillData.skill}
        skill={currentSkillData.skill}
        onClose={() => {
          console.log('[TakeExamPage] SkillIntroduction onClose called - this should not happen unless user clicks outside');
          setShowSkillIntro(false);
        }}
        onStartSkill={handleStartSkill}
        questionsLoaded={questions.length > 0}
      />

      {/* Header with timer and navigation */}
      <ExamHeader
        currentAttempt={currentAttempt}
        attemptType={attemptType}
        getCurrentSkillInfo={() => currentSkillData.skill}
        currentQuestionIndex={currentQuestionIndex}
        questionsLength={displayQuestions.length}
        autoSaveStatus={autoSaveStatus}
        timeRemaining={timeRemaining}
        timerInitialized={timerInitialized}
        isNavigationDisabled={isNavigationDisabled}
        setDrawerOpen={setDrawerOpen}
        setSubmitDialogOpen={setSubmitDialogOpen}
        submitDialogOpen={submitDialogOpen}
        onSubmit={handleSubmit}
        onPrevious={handleSkillBasedPreviousQuestion}
        onNext={handleSkillBasedNextQuestion}
        hideHeader={hideHeader}
        currentSkillIndex={currentSkillIndex + 1}
        totalSkills={availableSkills.length}
        showSkillIntro={showSkillIntro}
      />

      {/* Progress Bar */}
      <LinearProgress 
        variant="determinate" 
        value={getProgressPercentage()} 
        sx={{ height: 4 }}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {/* Question Content Area - Hidden when skill intro is showing */}
        {!showSkillIntro ? (
          <>
            <Box sx={{ flex: 1, p: 2, overflow: 'hidden', minHeight: 0 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 2 }}>
                  <QuestionDisplay
                    question={displayCurrentQuestion?.question}
                    answer={currentAnswer}
                    onAnswerChange={(answer) => handleAnswerChange(displayCurrentQuestion?.question?.id, answer)}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={displayQuestions.length}
                    attemptId={currentAttempt?.id}
                    onMoveToNextQuestion={handleSkillBasedNextQuestion}
                    onHideHeader={handleHideHeader}
                    microphoneTestCompleted={microphoneTestCompleted}
                    onStartMicrophoneTest={startMicrophoneTest}
                    onCompleteMicrophoneTest={completeMicrophoneTest}
                  />
                </CardContent>
              </Card>
            </Box>

            {/* Navigation Buttons - Below Question Card */}
            <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                startIcon={<NavigateBefore />}
                variant="contained"
                onClick={handleSkillBasedPreviousQuestion}
                disabled={!canNavigateBackward || isNavigationDisabled}
                title={isListeningQuestion ? 'Không thể quay lại câu Listening' : ''}
                size="large"
              >
                Câu trước
              </Button>
              
              <Typography variant="body2" color="textSecondary">
                Câu {currentQuestionIndex + 1}/{displayQuestions.length}
              </Typography>
              
              {/* Dynamic next button based on position */}
              {attemptType === 'full_exam' && currentQuestionIndex === displayQuestions.length - 1 ? (
                // At end of skill - show next skill or submit button
                currentSkillIndex < availableSkills.length - 1 ? (
                  <Button
                    endIcon={<NavigateNext />}
                    variant="contained"
                    color="primary"
                    onClick={handleSkillBasedNextQuestion}
                    disabled={isNavigationDisabled}
                    size="large"
                  >
                    Skill tiếp theo
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => setSubmitDialogOpen(true)}
                    size="large"
                  >
                    Nộp bài
                  </Button>
                )
              ) : (
                // Normal next question button
                <Button
                  endIcon={<NavigateNext />}
                  variant="contained"
                  onClick={handleSkillBasedNextQuestion}
                  disabled={currentQuestionIndex === displayQuestions.length - 1 || isNavigationDisabled}
                  size="large"
                >
                  Câu sau
                </Button>
              )}
            </Box>
          </>
        ) : (
          // Placeholder when skill intro is showing
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                {currentSkillData.skill?.skill_type_name}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Đang chờ bạn bắt đầu phần thi này...
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Question Navigation Drawer - Only current skill questions */}
      <ExamNavigation
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        questions={displayQuestions}
        answers={answers}
        attemptType={attemptType}
        availableSkills={currentSkillData.skill ? [currentSkillData.skill] : []}
        selectedSkillFilter={currentSkillData.skill?.id}
        setSelectedSkillFilter={() => {}} // Disabled in skill mode
        currentQuestionIndex={currentQuestionIndex}
        onQuestionNavigation={handleQuestionNavigation}
        getQuestionStatus={getQuestionStatus}
        skillMode={true}
      />
    </Box>
  );
}
