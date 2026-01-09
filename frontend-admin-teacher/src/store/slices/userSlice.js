import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from '@/services/userService';

const initialState = {
  users: [],
  currentUser: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    role: 'all',
    status: 'all',
    search: '',
  },
  isLoading: false,
  error: null,
  uploadProgress: 0,
  bulkUploadStatus: null,
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await userApi.getUsers({ page, limit, ...filters });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch users');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await userApi.getUserById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch user');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await userApi.createUser(userData);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Tạo người dùng thất bại';
      console.error('Create user error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await userApi.updateUser(id, userData);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Cập nhật người dùng thất bại';
      console.error('Update user error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await userApi.deleteUser(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete user');
    }
  }
);

export const deleteMultipleUsers = createAsyncThunk(
  'users/deleteMultipleUsers',
  async (ids, { rejectWithValue }) => {
    try {
      await userApi.deleteMultipleUsers(ids);
      return ids;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete users');
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'users/updateUserStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await userApi.updateUserStatus(id, status);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update user status');
    }
  }
);

export const updateUserRole = createAsyncThunk(
  'users/updateUserRole',
  async ({ id, role }, { rejectWithValue }) => {
    try {
      const response = await userApi.updateUserRole(id, role);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update user role');
    }
  }
);

export const resetUserPassword = createAsyncThunk(
  'users/resetUserPassword',
  async (id, { rejectWithValue }) => {
    try {
      const response = await userApi.resetUserPassword(id);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Đặt lại mật khẩu thất bại';
      console.error('Reset password error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const importUsers = createAsyncThunk(
  'users/importUsers',
  async ({ file, format }, { rejectWithValue }) => {
    try {
      const response = await userApi.importUsers(file, format);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to import users');
    }
  }
);

export const exportUsers = createAsyncThunk(
  'users/exportUsers',
  async ({ filters, format }, { rejectWithValue }) => {
    try {
      const response = await userApi.exportUsers(filters, format);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to export users');
    }
  }
);

export const bulkUpdateUsers = createAsyncThunk(
  'users/bulkUpdateUsers',
  async ({ ids, updateData }, { rejectWithValue }) => {
    try {
      const response = await userApi.bulkUpdateUsers(ids, updateData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to bulk update users');
    }
  }
);

export const sendWelcomeEmail = createAsyncThunk(
  'users/sendWelcomeEmail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await userApi.sendWelcomeEmail(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to send welcome email');
    }
  }
);

export const uploadUserAvatar = createAsyncThunk(
  'users/uploadUserAvatar',
  async ({ id, avatarFile }, { rejectWithValue }) => {
    try {
      const response = await userApi.uploadUserAvatar(id, avatarFile);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to upload avatar');
    }
  }
);

const userSlice = createSlice({
  name: 'users',
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
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
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
    // Fetch users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend trả về cấu trúc: { data: { users, pagination } }
        const { users, pagination } = action.payload.data || action.payload;
        state.users = users || action.payload.data || [];
        state.pagination = {
          page: pagination?.page || 1,
          limit: pagination?.limit || 20,
          total: pagination?.total || 0,
          pages: pagination?.pages || 1,
        };
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch user by ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend trả về { data: { user } }
        state.currentUser = action.payload.data?.user || action.payload.user || action.payload.data;
        state.error = null;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create user
    builder
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend trả về { data: { user, tempPassword } }
        const newUser = action.payload.data?.user || action.payload.user || action.payload.data;
        if (newUser) {
          state.users.unshift(newUser);
          state.pagination.total += 1;
        }
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update user
    builder
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend trả về { data: user }
        const updatedUser = action.payload.data?.user || action.payload.user || action.payload.data;
        if (updatedUser) {
          const index = state.users.findIndex(user => user.id === updatedUser.id);
          if (index !== -1) {
            state.users[index] = updatedUser;
          }
          if (state.currentUser?.id === updatedUser.id) {
            state.currentUser = updatedUser;
          }
        }
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete user
    builder
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter(user => user.id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        if (state.currentUser?.id === action.payload) {
          state.currentUser = null;
        }
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete multiple users
    builder
      .addCase(deleteMultipleUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMultipleUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter(user => !action.payload.includes(user.id));
        state.pagination.total = Math.max(0, state.pagination.total - action.payload.length);
        state.error = null;
      })
      .addCase(deleteMultipleUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update user status
    builder
      .addCase(updateUserStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...action.payload };
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = { ...state.currentUser, ...action.payload };
        }
        state.error = null;
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Update user role
    builder
      .addCase(updateUserRole.pending, (state) => {
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...action.payload };
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = { ...state.currentUser, ...action.payload };
        }
        state.error = null;
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Reset user password
    builder
      .addCase(resetUserPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetUserPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetUserPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Import users
    builder
      .addCase(importUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(importUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bulkUploadStatus = action.payload;
        state.uploadProgress = 100;
        state.error = null;
      })
      .addCase(importUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.uploadProgress = 0;
      });

    // Export users
    builder
      .addCase(exportUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exportUsers.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(exportUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Bulk update users
    builder
      .addCase(bulkUpdateUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkUpdateUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedUsers = action.payload;
        updatedUsers.forEach(updatedUser => {
          const index = state.users.findIndex(user => user.id === updatedUser.id);
          if (index !== -1) {
            state.users[index] = updatedUser;
          }
        });
        state.error = null;
      })
      .addCase(bulkUpdateUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Send welcome email
    builder
      .addCase(sendWelcomeEmail.pending, (state) => {
        state.error = null;
      })
      .addCase(sendWelcomeEmail.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(sendWelcomeEmail.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Upload user avatar
    builder
      .addCase(uploadUserAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], avatar: action.payload.avatar };
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = { ...state.currentUser, avatar: action.payload.avatar };
        }
        state.error = null;
      })
      .addCase(uploadUserAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setPagination,
  setCurrentUser,
  clearCurrentUser,
  setUploadProgress,
  setBulkUploadStatus,
  clearBulkUploadStatus,
} = userSlice.actions;

export default userSlice.reducer;