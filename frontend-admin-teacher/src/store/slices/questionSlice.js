import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { questionApi } from '@/services/questionService';

const initialState = {
  questions: [],
  currentQuestion: null,
  aptisTypes: [],
  skillTypes: [],
  questionTypes: [],
  filterOptions: {
    aptisTypes: [],
    skills: [],
    questionTypes: [],
    difficulties: ['easy', 'medium', 'hard'],
    statuses: ['draft', 'active', 'inactive']
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    aptis_type_id: '',
    skill_type_code: '',
    question_type_code: '',
    difficulty: '',
    status: '',
    search: '',
  },
  isLoading: false,
  isLoadingFilterOptions: false,
  error: null,
  uploadProgress: 0,
  bulkUploadStatus: null,
};

// Async thunks
export const fetchQuestions = createAsyncThunk(
  'questions/fetchQuestions',
  async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await questionApi.getQuestions({ page, limit, ...filters });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch questions');
    }
  }
);

export const fetchQuestionById = createAsyncThunk(
  'questions/fetchQuestionById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await questionApi.getQuestionById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch question');
    }
  }
);

export const createQuestion = createAsyncThunk(
  'questions/createQuestion',
  async (questionData, { rejectWithValue }) => {
    try {
      console.log('[createQuestion thunk] Input data:', questionData);
      
      // Use question_type_code and aptis_type_code directly if provided
      let question_type_id = questionData.question_type_id;
      let aptis_type_id = questionData.aptis_type_id;
      
      // If codes are provided, fetch the IDs
      if (questionData.question_type_code && !question_type_id) {
        const questionTypeResponse = await questionApi.getQuestionTypeByCode(questionData.question_type_code);
        question_type_id = questionTypeResponse.data.id;
      }
      
      if (questionData.aptis_type_code && !aptis_type_id) {
        const aptisTypeResponse = await questionApi.getAptisTypeByCode(questionData.aptis_type_code);
        aptis_type_id = aptisTypeResponse.data.id;
      }
      
      if (!question_type_id || !aptis_type_id) {
        throw new Error('Missing required question_type_id or aptis_type_id');
      }

      const backendData = {
        question_type_id,
        aptis_type_id,
        difficulty: questionData.difficulty || 'medium',
        content: questionData.content,
        media_url: questionData.media_url || '',
        duration_seconds: questionData.duration_seconds ? parseInt(questionData.duration_seconds) : 0,
        parent_question_id: questionData.parent_question_id || null,
        additional_media: questionData.additional_media || null,
        status: questionData.status || 'draft'
      };
      
      console.log('[createQuestion thunk] Backend data:', backendData);
      const response = await questionApi.createQuestion(backendData);
      console.log('[createQuestion thunk] Response:', response);
      return response.data;
    } catch (error) {
      console.error('[createQuestion thunk] Error:', error);
      return rejectWithValue(error.message || 'Failed to create question');
    }
  }
);

export const updateQuestion = createAsyncThunk(
  'questions/updateQuestion',
  async ({ id, questionData }, { rejectWithValue }) => {
    try {
      const response = await questionApi.updateQuestion(id, questionData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update question');
    }
  }
);

export const deleteQuestion = createAsyncThunk(
  'questions/deleteQuestion',
  async (id, { rejectWithValue }) => {
    try {
      await questionApi.deleteQuestion(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete question');
    }
  }
);

export const deleteMultipleQuestions = createAsyncThunk(
  'questions/deleteMultipleQuestions',
  async (ids, { rejectWithValue }) => {
    try {
      await questionApi.deleteMultipleQuestions(ids);
      return ids;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete questions');
    }
  }
);

export const duplicateQuestion = createAsyncThunk(
  'questions/duplicateQuestion',
  async (id, { rejectWithValue }) => {
    try {
      const response = await questionApi.duplicateQuestion(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to duplicate question');
    }
  }
);

export const importQuestions = createAsyncThunk(
  'questions/importQuestions',
  async ({ file, format }, { rejectWithValue }) => {
    try {
      const response = await questionApi.importQuestions(file, format);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to import questions');
    }
  }
);

export const exportQuestions = createAsyncThunk(
  'questions/exportQuestions',
  async ({ filters, format }, { rejectWithValue }) => {
    try {
      const response = await questionApi.exportQuestions(filters, format);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to export questions');
    }
  }
);

export const fetchQuestionTypes = createAsyncThunk(
  'questions/fetchQuestionTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await questionApi.getQuestionTypes();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch question types');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'questions/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await questionApi.getCategories();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

export const bulkUpdateQuestions = createAsyncThunk(
  'questions/bulkUpdateQuestions',
  async ({ ids, updateData }, { rejectWithValue }) => {
    try {
      const response = await questionApi.bulkUpdateQuestions(ids, updateData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to bulk update questions');
    }
  }
);

export const fetchFilterOptions = createAsyncThunk(
  'questions/fetchFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await questionApi.getFilterOptions();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch filter options');
    }
  }
);

const questionSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload;
    },
    clearCurrentQuestion: (state) => {
      state.currentQuestion = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    setBulkUploadStatus: (state, action) => {
      state.bulkUploadStatus = action.payload;
    },
    clearBulkUploadStatus: (state) => {
      state.bulkUploadStatus = null;
      state.uploadProgress = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch questions
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.questions = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.error = null;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch question by ID
    builder
      .addCase(fetchQuestionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuestionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentQuestion = action.payload;
        state.error = null;
      })
      .addCase(fetchQuestionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create question
    builder
      .addCase(createQuestion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.questions.unshift(action.payload);
        state.pagination.total += 1;
        state.error = null;
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update question
    builder
      .addCase(updateQuestion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.questions.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.questions[index] = action.payload;
        }
        if (state.currentQuestion?.id === action.payload.id) {
          state.currentQuestion = action.payload;
        }
        state.error = null;
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete question
    builder
      .addCase(deleteQuestion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.questions = state.questions.filter(q => q.id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        if (state.currentQuestion?.id === action.payload) {
          state.currentQuestion = null;
        }
        state.error = null;
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete multiple questions
    builder
      .addCase(deleteMultipleQuestions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMultipleQuestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.questions = state.questions.filter(q => !action.payload.includes(q.id));
        state.pagination.total = Math.max(0, state.pagination.total - action.payload.length);
        state.error = null;
      })
      .addCase(deleteMultipleQuestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Duplicate question
    builder
      .addCase(duplicateQuestion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(duplicateQuestion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.questions.unshift(action.payload);
        state.pagination.total += 1;
        state.error = null;
      })
      .addCase(duplicateQuestion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Import questions
    builder
      .addCase(importQuestions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(importQuestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bulkUploadStatus = action.payload;
        state.uploadProgress = 100;
        state.error = null;
      })
      .addCase(importQuestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.uploadProgress = 0;
      });

    // Export questions
    builder
      .addCase(exportQuestions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exportQuestions.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(exportQuestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch question types
    builder
      .addCase(fetchQuestionTypes.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchQuestionTypes.fulfilled, (state, action) => {
        state.questionTypes = action.payload;
        state.error = null;
      })
      .addCase(fetchQuestionTypes.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Bulk update questions
    builder
      .addCase(bulkUpdateQuestions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkUpdateQuestions.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedQuestions = action.payload;
        updatedQuestions.forEach(updatedQuestion => {
          const index = state.questions.findIndex(q => q.id === updatedQuestion.id);
          if (index !== -1) {
            state.questions[index] = updatedQuestion;
          }
        });
        state.error = null;
      })
      .addCase(bulkUpdateQuestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch filter options
    builder
      .addCase(fetchFilterOptions.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.filterOptions = action.payload;
        state.error = null;
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setPagination,
  setCurrentQuestion,
  clearCurrentQuestion,
  setUploadProgress,
  setBulkUploadStatus,
  clearBulkUploadStatus,
} = questionSlice.actions;

export default questionSlice.reducer;