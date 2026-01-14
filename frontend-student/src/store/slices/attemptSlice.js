import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import attemptService from '@/services/attemptService';
import { getAssetUrl } from '@/services/api';

// Async thunks
export const startNewAttempt = createAsyncThunk(
  'attempts/startNewAttempt',
  async ({ exam_id, attempt_type, selected_skill }, { rejectWithValue }) => {

    try {
      const payload = {
        exam_id,
        attempt_type,
      };
      
      // Only add selected_skill_id if it's a valid number or null for full_exam
      if (attempt_type === 'single_skill' && selected_skill) {
        payload.selected_skill_id = selected_skill;
      } else if (attempt_type === 'full_exam') {
        payload.selected_skill_id = null;
      }
      
      const response = await attemptService.startAttempt(payload);
      // Extract the inner data object from the response
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi bắt đầu bài thi');
    }
  }
);

export const loadAttempt = createAsyncThunk(
  'attempts/loadAttempt',
  async (attemptId, { rejectWithValue }) => {
    try {
      const response = await attemptService.getAttempt(attemptId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải bài thi');
    }
  }
);

export const loadQuestions = createAsyncThunk(
  'attempts/loadQuestions',
  async ({ attemptId, sectionId, offset = 0, limit = 999 }, { rejectWithValue }) => {
    try {
      const params = { offset, limit };
      if (sectionId) params.section_id = sectionId;
      
      const response = await attemptService.getAttemptQuestions(attemptId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải câu hỏi');
    }
  }
);

export const saveAnswer = createAsyncThunk(
  'attempts/saveAnswer',
  async (answerPayload, { rejectWithValue }) => {
    try {
      // answerPayload should already be in correct format from page
      const response = await attemptService.saveAnswer(answerPayload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi lưu câu trả lời');
    }
  }
);

export const submitAttempt = createAsyncThunk(
  'attempts/submitAttempt',
  async (attemptId, { rejectWithValue }) => {
    try {
      const response = await attemptService.submitAttempt(attemptId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi nộp bài thi');
    }
  }
);

export const fetchAttemptResults = createAsyncThunk(
  'attempts/fetchAttemptResults',
  async (attemptId, { rejectWithValue }) => {
    try {
      const response = await attemptService.getAttemptResults(attemptId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải kết quả bài thi');
    }
  }
);

export const fetchUserAttempts = createAsyncThunk(
  'attempts/fetchUserAttempts',
  async ({ page = 1, limit = 10, examId }, { rejectWithValue }) => {
    try {
      const response = await attemptService.getUserAttempts({ page, limit, examId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải lịch sử bài thi');
    }
  }
);

export const startAttempt = createAsyncThunk(
  'attempts/startAttempt',
  async (attemptData, { rejectWithValue }) => {
    try {
      const response = await attemptService.startAttempt(attemptData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start attempt');
    }
  }
);

export const fetchCurrentAttempt = createAsyncThunk(
  'attempts/fetchCurrentAttempt',
  async (attemptId, { rejectWithValue }) => {
    try {
      const response = await attemptService.getAttempt(attemptId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attempt');
    }
  }
);

export const uploadAudioAnswer = createAsyncThunk(
  'attempts/uploadAudioAnswer',
  async ({ attemptId, questionId, audioFile }, { rejectWithValue }) => {
    try {
      const response = await attemptService.uploadAudioAnswer(attemptId, questionId, audioFile);
      return { ...response.data, questionId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload audio');
    }
  }
);

const initialState = {
  currentAttempt: null,
  questions: [],
  answers: [],
  questionsLoaded: false, // Track if questions loaded
  questionsLoading: false, // Loading state for questions
  currentQuestionIndex: 0,
  timeRemaining: 0,
  timerInitialized: false,
  isExamStarted: false,
  isPaused: false,
  isSubmitting: false,
  autoSaveStatus: 'idle', // idle, saving, saved, error
  loading: false,
  error: null,
  submissionResult: null,
  attemptResults: null,
  userAttempts: [],
  pagination: {
    page: 1,
    totalPages: 1,
    totalItems: 0
  }
};

const attemptSlice = createSlice({
  name: 'attempts',
  initialState,
  reducers: {
    setCurrentQuestion: (state, action) => {
      state.currentQuestionIndex = action.payload;
    },
    updateTimer: (state) => {
      if (state.timeRemaining > 0) {
        state.timeRemaining -= 1;
      }
    },
    setTimeRemaining: (state, action) => {
      state.timeRemaining = action.payload;
    },
    pauseExam: (state) => {
      state.isPaused = true;
    },
    resumeExam: (state) => {
      state.isPaused = false;
    },
    setAutoSaveStatus: (state, action) => {
      state.autoSaveStatus = action.payload;
    },
    updateLocalAnswer: (state, action) => {
      const { questionId, answer } = action.payload;
      console.log('[updateLocalAnswer] Updating Q' + questionId + ':', answer);
      
      const existingIndex = state.answers.findIndex(a => a.question_id === questionId);
      if (existingIndex >= 0) {
        // Update existing answer - preserve important fields
        const existingAnswer = state.answers[existingIndex];
        
        // CRITICAL: For audio answers, don't overwrite if existing has audio data
        if (existingAnswer.answer_type === 'audio' && existingAnswer.audio_url && 
            answer.answer_type !== 'audio') {
          console.warn('[updateLocalAnswer] Preventing overwrite of audio answer with:', answer);
          return;
        }
        
        state.answers[existingIndex] = {
          ...existingAnswer, // Keep existing data like id, attempt_id, etc.
          ...answer,         // Apply new answer data
          question_id: questionId,
          isModified: true,
          lastModified: new Date().toISOString(),
          answered_at: existingAnswer.answered_at || answer.answered_at || new Date().toISOString()
        };
        console.log('[updateLocalAnswer] Updated existing answer:', state.answers[existingIndex]);
      } else {
        // Add new answer
        const newAnswer = {
          question_id: questionId,
          ...answer,
          isModified: true,
          lastModified: new Date().toISOString(),
          answered_at: answer.answered_at || new Date().toISOString()
        };
        state.answers.push(newAnswer);
        console.log('[updateLocalAnswer] Added new answer:', newAnswer);
      }
    },
    markAnswerForReview: (state, action) => {
      const { questionId, forReview } = action.payload;
      const existingIndex = state.answers.findIndex(a => a.question_id === questionId);
      
      if (existingIndex >= 0) {
        state.answers[existingIndex] = {
          ...state.answers[existingIndex],
          markedForReview: forReview
        };
      } else {
        state.answers.push({
          question_id: questionId,
          answer_data: null,
          markedForReview: forReview
        });
      }
    },
    clearCurrentAttempt: (state) => {
      state.currentAttempt = null;
      state.questions = [];
      state.answers = [];
      state.questionsLoaded = false;
      state.questionsLoading = false;
      state.currentQuestionIndex = 0;
      state.timeRemaining = 0;
      state.timerInitialized = false;
      state.isExamStarted = false;
      state.isPaused = false;
      state.submissionResult = null;
      state.error = null;
    },
    clearSubmissionResult: (state) => {
      state.submissionResult = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Start New Attempt
      .addCase(startNewAttempt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startNewAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null; // Clear error on successful start
        state.currentAttempt = action.payload;
        state.isExamStarted = true;
        state.currentQuestionIndex = 0;
        
        // New strategy: questions will be loaded separately
        state.questions = [];
        state.questionsLoaded = false;
        state.answers = [];
        
        // Set timer based on exam duration
        const durationMinutes = state.currentAttempt.exam?.duration_minutes || 90;
        state.timeRemaining = durationMinutes * 60;
        state.timerInitialized = true;
        

      })
      .addCase(startNewAttempt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Load Attempt
      .addCase(loadAttempt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttempt = action.payload;
        if (action.payload.answers && action.payload.answers.length > 0) {
          state.answers = action.payload.answers;
          // CRITICAL: Store full answer objects to preserve questionType relationship
          // questions array should contain answer objects with nested question data
          state.questions = action.payload.answers.filter(answer => answer.question);
        } else {
          state.questions = [];
          state.answers = [];
        }
        if (action.payload.exam?.duration_minutes && action.payload.start_time) {
          const startTime = new Date(action.payload.start_time);
          const now = new Date();
          const elapsedSeconds = (now - startTime) / 1000;
          const totalSeconds = action.payload.exam.duration_minutes * 60;
          state.timeRemaining = Math.max(0, totalSeconds - elapsedSeconds);
          state.timerInitialized = true;
        }
      })
      .addCase(loadAttempt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Save Answer
      .addCase(saveAnswer.pending, (state) => {
        state.autoSaveStatus = 'saving';
      })
      .addCase(saveAnswer.fulfilled, (state, action) => {
        state.autoSaveStatus = 'saved';
        
        const answerIndex = state.answers.findIndex(a => a.question_id === action.payload.question_id);
        
        if (answerIndex >= 0) {
          // Update existing answer with full response data
          state.answers[answerIndex] = {
            ...state.answers[answerIndex],
            ...action.payload,
            isModified: false,
            lastSaved: new Date().toISOString()
          };
        } else {
          // Add new answer if not found
          state.answers.push({
            ...action.payload,
            isModified: false,
            lastSaved: new Date().toISOString()
          });
        }
        
      })
      .addCase(saveAnswer.rejected, (state, action) => {
        state.autoSaveStatus = 'error';
        state.error = action.payload;
      })

      // Submit Attempt
      .addCase(submitAttempt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.submissionResult = action.payload;
        state.isExamStarted = false;
      })
      .addCase(submitAttempt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Load Questions Progressively
      .addCase(loadQuestions.pending, (state) => {
        state.questionsLoading = true;
        state.error = null; // Clear any previous errors when loading questions
      })
      .addCase(loadQuestions.fulfilled, (state, action) => {
        state.questionsLoading = false;
        state.error = null; // Clear error on successful load
        
        // Extract questions and answers from response
        const { answers: newAnswers, pagination } = action.payload.data || action.payload;
        
        
        if (newAnswers && newAnswers.length > 0) {
          newAnswers.forEach(answer => {
            if (answer.question) {
              // Convert media_url to full URL if present
              if (answer.question.media_url) {
                answer.question.media_url = getAssetUrl(answer.question.media_url);
                console.log('[loadQuestions] Q' + answer.question.id + ' converted media_url to:', answer.question.media_url);
              }
              
              // CRITICAL: Store full answer object with nested question (preserving questionType relationship)
              // This maintains the skill_type_id path: answer.question.questionType.skill_type_id
              const answerWithQuestion = {
                ...answer,
                question: {
                  ...answer.question,
                  answer_data: answer.answer_data // Also merge answer_data for backward compatibility
                }
              };
              
              // Add/update in questions array (questions are actually answer objects)
              const existingQuestionIndex = state.questions.findIndex(q => q.question_id === answer.question_id);
              if (existingQuestionIndex >= 0) {
                state.questions[existingQuestionIndex] = answerWithQuestion;
              } else {
                state.questions.push(answerWithQuestion);
              }
              
              // Add/update answer with full data
              const existingAnswerIndex = state.answers.findIndex(a => a.question_id === answer.question_id);
              if (existingAnswerIndex >= 0) {
                state.answers[existingAnswerIndex] = {
                  ...state.answers[existingAnswerIndex],
                  ...answer
                };
              } else {
                state.answers.push(answer);
              }
            }
          });
          console.log('[loadQuestions] Loaded questions with answer_data:', state.questions.length);
        }
        
        state.questionsLoaded = !pagination?.hasMore; // Mark as fully loaded if no more
      })
      .addCase(loadQuestions.rejected, (state, action) => {
        state.questionsLoading = false;
        state.error = action.payload;
      })

      // Fetch Attempt Results
      .addCase(fetchAttemptResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttemptResults.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns: { success: true, data: { attempt, sectionScores, totalScore, status } }
        // We want to extract the data part
        state.attemptResults = action.payload.data || action.payload;
      })
      .addCase(fetchAttemptResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch User Attempts
      .addCase(fetchUserAttempts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAttempts.fulfilled, (state, action) => {
        state.loading = false;
        state.userAttempts = action.payload.attempts || [];
        state.pagination = {
          page: action.payload.page || 1,
          totalPages: action.payload.totalPages || 1,
          totalItems: action.payload.totalItems || 0
        };
      })
      .addCase(fetchUserAttempts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Start Attempt
      .addCase(startAttempt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttempt = action.payload;
        state.isExamStarted = true;
        state.currentQuestionIndex = 0;
        state.answers = [];
        state.timeRemaining = action.payload.exam?.duration_minutes ? action.payload.exam.duration_minutes * 60 : 0;
      })
      .addCase(startAttempt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Current Attempt
      .addCase(fetchCurrentAttempt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttempt = action.payload;
        state.isExamStarted = true;
        if (action.payload.answers) {
          state.answers = action.payload.answers;
        }
        if (action.payload.exam?.duration_minutes && action.payload.start_time) {
          const startTime = new Date(action.payload.start_time);
          const now = new Date();
          const elapsedSeconds = (now - startTime) / 1000;
          const totalSeconds = action.payload.exam.duration_minutes * 60;
          state.timeRemaining = Math.max(0, totalSeconds - elapsedSeconds);
        }
      })
      .addCase(fetchCurrentAttempt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Upload Audio Answer
      .addCase(uploadAudioAnswer.pending, (state) => {
        state.autoSaveStatus = 'saving';
      })
      .addCase(uploadAudioAnswer.fulfilled, (state, action) => {
        state.autoSaveStatus = 'saved';
        const answerIndex = state.answers.findIndex(a => a.question_id === action.payload.questionId);
        if (answerIndex >= 0) {
          state.answers[answerIndex].audio_url = action.payload.audio_url;
          state.answers[answerIndex].isModified = false;
        }
      })
      .addCase(uploadAudioAnswer.rejected, (state, action) => {
        state.autoSaveStatus = 'error';
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentQuestion,
  updateTimer,
  setTimeRemaining,
  pauseExam,
  resumeExam,
  setAutoSaveStatus,
  updateLocalAnswer,
  markAnswerForReview,
  clearCurrentAttempt,
  clearSubmissionResult,
  clearError,
} = attemptSlice.actions;

export default attemptSlice.reducer;