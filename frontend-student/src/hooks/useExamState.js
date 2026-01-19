import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  startNewAttempt, 
  loadAttempt,
  loadQuestions, 
  saveAnswer, 
  submitAttempt,
  updateTimer,
  updateLocalAnswer 
} from '@/store/slices/attemptSlice';

export const useExamState = (examId, attemptId, attemptType, selectedSkill) => {
  // UI States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hideHeader, setHideHeader] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState(null);
  
  // Speaking Test States
  const [isMicrophoneTestActive, setIsMicrophoneTestActive] = useState(false);
  const [microphoneTestCompleted, setMicrophoneTestCompleted] = useState(false);
  
  const dispatch = useDispatch();
  const timerRef = useRef(null);
  
  const { 
    currentAttempt, 
    questions, 
    answers, 
    loading, 
    error,
    timeRemaining,
    timerInitialized,
    autoSaveStatus 
  } = useSelector(state => state.attempts);
  
  // Load microphone test status from localStorage
  useEffect(() => {
    if (!examId) return; // Wait for examId to be available
    
    const testKey = `mic_test_completed_speaking_${examId}`;
    const completed = localStorage.getItem(testKey) === 'true';
    console.log('[useExamState] Loading mic test status for exam:', examId, 'completed:', completed);
    setMicrophoneTestCompleted(completed);
  }, [examId]); // Only depend on examId
  
  // Save microphone test status to localStorage
  const completeMicrophoneTest = useCallback(() => {
    const testKey = `mic_test_completed_speaking_${examId}`;
    console.log('[useExamState] Marking mic test completed for exam:', examId);
    localStorage.setItem(testKey, 'true');
    setMicrophoneTestCompleted(true);
    setIsMicrophoneTestActive(false);
    setHideHeader(false); // Show header again after test
  }, [examId]);
  
  // Start microphone test
  const startMicrophoneTest = useCallback(() => {
    setIsMicrophoneTestActive(true);
  }, []);
  
  // Handle hiding header directly - component calls this when test/prep starts
  const handleHideHeader = useCallback((hide) => {
    console.log('[useExamState] handleHideHeader called with:', hide);
    setHideHeader(hide);
  }, []);
  
  const handleStartExam = useCallback(async ({ attemptType, selectedSkill }) => {
    console.log('[useExamState] Starting exam with:', { attemptType, selectedSkill });
    setModeDialogOpen(false);
    
    try {
      const action = await dispatch(startNewAttempt({
        exam_id: parseInt(examId, 10),
        attempt_type: attemptType,
        selected_skill: selectedSkill
      })).unwrap();
      
      console.log('[useExamState] Attempt created:', action);
      // Extract attemptId from response - it comes directly as attemptId property
      const newAttemptId = action.attemptId || action.data?.id || action.id;
      
      if (newAttemptId) {
        console.log('[useExamState] Loading questions for new attempt:', newAttemptId);
        dispatch(loadQuestions({ attemptId: newAttemptId }));
      }
    } catch (error) {
      console.error('[useExamState] Failed to start exam:', error);
    }
  }, [examId, dispatch]);

  // Initialize attempt
  useEffect(() => {
    console.log('[useExamState] Initialization check:', {
      examId,
      attemptId, 
      attemptType, 
      selectedSkill,
      hasInitialized
    });
    
    // Prevent multiple initializations
    if (hasInitialized || !examId) {
      return;
    }
    
    console.log('[useExamState] Starting initialization...');
    setHasInitialized(true);
    
    if (attemptId) {
      console.log('[useExamState] Loading existing attempt:', attemptId);
      dispatch(loadAttempt(attemptId));
    } else if (attemptType) {
      console.log('[useExamState] Auto-starting with URL params');
      handleStartExam({ attemptType, selectedSkill: selectedSkill || null });
    } else {
      console.log('[useExamState] Showing mode selection dialog');
      setModeDialogOpen(true);
    }
  }, [examId, attemptId, attemptType, selectedSkill, hasInitialized, dispatch]); // Remove handleStartExam from deps

  // Load questions when attempt is ready
  useEffect(() => {
    if (!currentAttempt?.id || questions.length > 0 || loading) {
      return;
    }
      
    console.log('[useExamState] Loading questions for attempt:', currentAttempt.id);
    dispatch(loadQuestions({ attemptId: currentAttempt.id, limit: 999 }));
  }, [currentAttempt?.id, questions.length, loading, dispatch]);

  // Timer management
  useEffect(() => {
    if (!currentAttempt?.id || timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    timerRef.current = setInterval(() => {
      dispatch(updateTimer());
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentAttempt?.id, timeRemaining, dispatch]);

  // Helper function to determine answer_type based on question
  const getAnswerTypeFromQuestion = useCallback((questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return 'text';
    
    const questionType = question.questionType?.code;
    
    // Map question types to answer types
    if (questionType?.includes('MCQ') || questionType?.includes('TRUE_FALSE')) {
      return 'option';
    } else if (questionType?.includes('SPEAKING')) {
      return 'audio';
    } else if (questionType?.includes('MATCHING') || questionType?.includes('GAP_FILL') || questionType?.includes('ORDERING')) {
      return 'json';
    } else {
      return 'text';  // writing, short answer, etc.
    }
  }, [questions]);

  const handleAnswerChange = useCallback((questionId, answer) => {
    console.log('[handleAnswerChange] Called with:', { questionId, answer });
    console.trace('[handleAnswerChange] Call stack:');
    
    if (!currentAttempt?.id) {
      console.warn('[useExamState] No current attempt found');
      return;
    }
    
    if (!answer || typeof answer !== 'object') {
      console.warn('[useExamState] Invalid answer object:', answer);
      return;
    }
    
    // PRIORITY: Handle audio answers first and separately
    if (answer?.answer_type === 'audio') {
      console.log('[handleAnswerChange] AUDIO ANSWER - Only updating local state, no API call');
      dispatch(updateLocalAnswer({ questionId, answer }));
      return;
    }
    
    // Always update local state FIRST
    console.log('[handleAnswerChange] Updating local state...');
    dispatch(updateLocalAnswer({ questionId, answer }));
    
    // For other answer types, call save API
    const saveData = {
      attempt_id: currentAttempt.id,
      question_id: questionId,
      answer_type: answer.answer_type || getAnswerTypeFromQuestion(questionId),
      ...answer
    };
    
    console.log('[handleAnswerChange] Calling saveAnswer API with:', saveData);
    dispatch(saveAnswer(saveData));
  }, [dispatch, currentAttempt?.id]);

  const handleNextQuestion = useCallback(() => {
    console.log('[useExamState] handleNextQuestion called - current:', currentQuestionIndex, 'total:', questions.length);
    setCurrentQuestionIndex(prev => {
      const next = Math.min(prev + 1, questions.length - 1);
      console.log('[useExamState] Moving from question', prev, 'to', next);
      return next;
    });
  }, [questions.length, currentQuestionIndex]);

  const handlePreviousQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const handleQuestionNavigation = useCallback((index) => {
    // Check if current question is a speaking question and the target is a previous question
    const currentQuestion = questions[currentQuestionIndex];
    const targetIndex = index;
    
    // If current question is a speaking question and we're trying to go backward, prevent navigation
    // currentQuestion is now an answer object with nested question
    if (currentQuestion?.question?.questionType?.code?.includes('SPEAKING') && targetIndex < currentQuestionIndex) {
      console.log('[useExamState] Backward navigation blocked for speaking question');
      return;
    }
    
    setCurrentQuestionIndex(index);
  }, [currentQuestionIndex, questions]);

  const getQuestionStatus = useCallback((questionId) => {
    const answer = answers.find(a => a.question_id === questionId);
    const currentQuestion = questions[currentQuestionIndex];
    // questions array now contains answer objects with nested question data
    const targetQuestionIndex = questions.findIndex(q => q.question_id === questionId);
    
    // Remove FORCED COMPLETED logic - let speaking questions show their actual status
    // This was causing all speaking questions to show as completed incorrectly
    
    if (!answer) {
      console.log(`[getQuestionStatus] Q${questionId}: NO ANSWER`);
      return 'unanswered';
    }
    
    console.log(`[getQuestionStatus] Q${questionId}:`, {
      answer_type: answer.answer_type,
      selected_option_id: answer.selected_option_id,
      text_answer: answer.text_answer ? 'present' : 'missing',
      audio_url: answer.audio_url ? 'present' : 'missing',
      answer_json: answer.answer_json ? 'present' : 'missing'
    });
    
    // Check different answer types
    if (answer.answer_type === 'option' && answer.selected_option_id) {
      console.log(`[getQuestionStatus] Q${questionId}: ANSWERED (option)`);
      return 'answered';
    }
    if (answer.answer_type === 'text' && answer.text_answer?.trim()) {
      console.log(`[getQuestionStatus] Q${questionId}: ANSWERED (text)`);
      return 'answered';
    }
    if (answer.answer_type === 'audio' && answer.audio_url) {
      console.log(`[getQuestionStatus] Q${questionId}: ANSWERED (audio)`);
      return 'answered';
    }
    if (answer.answer_type === 'json' && answer.answer_json) {
      console.log(`[getQuestionStatus] Q${questionId}: ANSWERED (json)`);
      return 'answered';
    }
    
    // Legacy checks for backwards compatibility
    if (answer.selected_option_id) {
      console.log(`[getQuestionStatus] Q${questionId}: ANSWERED (legacy option)`);
      return 'answered';
    }
    if (answer.text_answer?.trim()) {
      console.log(`[getQuestionStatus] Q${questionId}: ANSWERED (legacy text)`);
      return 'answered';
    }
    
    console.log(`[getQuestionStatus] Q${questionId}: PARTIAL`);
    return 'partial';
  }, [answers, currentQuestionIndex, questions]);

  const getProgressPercentage = useCallback(() => {
    const answeredQuestions = questions.filter(q => 
      getQuestionStatus(q.id) === 'answered'
    ).length;
    return questions.length > 0 ? (answeredQuestions / questions.length) * 100 : 0;
  }, [questions, getQuestionStatus]);

  // Navigation should be disabled during mic test
  const isNavigationDisabled = isMicrophoneTestActive;

  // Debug: Log when questions or answers change
  useEffect(() => {
    console.log('[useExamState] Questions updated:', questions.length, 'questions');
    if (questions.length > 0) {
      console.log('[useExamState] Sample question with answer_data:', {
        id: questions[0].id,
        answer_data: questions[0].answer_data
      });
    }
  }, [questions]);

  useEffect(() => {
    console.log('[useExamState] Answers updated:', answers.length, 'answers');
    if (answers.length > 0) {
      console.log('[useExamState] Sample answer:', {
        question_id: answers[0].question_id,
        answer_type: answers[0].answer_type,
        answer_data: answers[0].answer_data
      });
    }
  }, [answers]);

  return {
    // States
    drawerOpen, setDrawerOpen,
    exitDialogOpen, setExitDialogOpen,
    submitDialogOpen, setSubmitDialogOpen,
    modeDialogOpen, setModeDialogOpen,
    currentQuestionIndex, setCurrentQuestionIndex,
    hideHeader,
    availableSkills, setAvailableSkills,
    selectedSkillFilter, setSelectedSkillFilter,
    
    // Speaking test states
    isMicrophoneTestActive,
    microphoneTestCompleted,
    isNavigationDisabled,
    
    // Redux states
    currentAttempt, questions, answers, loading, error,
    timeRemaining, timerInitialized, autoSaveStatus,
    
    // Handlers
    handleStartExam,
    handleAnswerChange,
    handleNextQuestion,
    handlePreviousQuestion,
    handleQuestionNavigation,
    handleHideHeader,
    startMicrophoneTest,
    completeMicrophoneTest,
    
    // Computed values
    getQuestionStatus,
    getProgressPercentage
  };
};