'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Search, Add, FilterList, Visibility, Delete, Clear } from '@mui/icons-material';
import { Edit } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { fetchQuestions, fetchFilterOptions, deleteQuestion } from '@/store/slices/questionSlice';
import { 
  getDifficultyColor, 
  getStatusColor 
} from '@/constants/filterOptions';
import DataTable from '@/components/shared/DataTable';
import QuestionCard from './QuestionCard';
import QuestionPreview from './QuestionPreview';

export default function QuestionList({
  viewMode = 'table',
  showActions = true,
  showFilters = true,
  readOnlyMode = false
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { questions, loading, pagination, filterOptions } = useSelector(state => state.questions);
  const [isClient, setIsClient] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    question_type: '', // Maps to question_type_id in backend
    aptis_type: '',   // Maps to aptis_type_id in backend
    skill: '',        // Maps to skill_type_id through QuestionType join
    difficulty: '',
    status: ''
  });
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      dispatch(fetchFilterOptions());
      handleFetchQuestions();
    }
  }, [isClient]);

  // Log filterOptions for debugging
  useEffect(() => {
    if (filterOptions && Object.keys(filterOptions).length > 0) {
      console.log('[QuestionList] ✅ FilterOptions loaded:', filterOptions);
      console.log('[QuestionList] Skills data:', filterOptions.skills);
      console.log('[QuestionList] AptisTypes data:', filterOptions.aptisTypes);
    }
  }, [filterOptions]);

  // Debounce search and filters - separate from filter state changes
  useEffect(() => {
    if (!isClient) return;
    
    // Create a JSON string to compare filter changes
    const currentFilterString = JSON.stringify({ searchTerm, ...filters });
    
    const timeoutId = setTimeout(() => {
      console.log('[QuestionList] Fetching with filters:', { searchTerm, ...filters });
      handleFetchQuestions(1); // Reset to page 1 when filters change
    }, 500); // 500ms debounce delay
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, isClient]);

  const handleFetchQuestions = (page = 1) => {
    // Map filter field names to backend API names
    const apiFilters = {
      question_type_id: filters.question_type ? parseInt(filters.question_type) : undefined,
      aptis_type_id: filters.aptis_type ? parseInt(filters.aptis_type) : undefined,
      skill_type_id: filters.skill ? parseInt(filters.skill) : undefined,
      difficulty: filters.difficulty || undefined,
      status: filters.status || undefined,
      search: searchTerm || undefined
    };
    
    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(apiFilters).filter(([, v]) => v !== undefined)
    );
    
    console.log('[QuestionList] API filters being sent:', cleanFilters);
    
    dispatch(fetchQuestions({
      page,
      limit: 10,
      ...cleanFilters
    }));
  };

  const handleFilterChange = (field, value) => {
    console.log(`[QuestionList] Filter changed: ${field} = ${value}`);
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      console.log('[QuestionList] New filters state:', newFilters);
      return newFilters;
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.question_type) count++;
    if (filters.aptis_type) count++;
    if (filters.skill) count++;
    if (filters.difficulty) count++;
    if (filters.status) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({
      question_type: '',
      aptis_type: '',
      skill: '',
      difficulty: '',
      status: ''
    });
  };

  const handlePreview = (question) => {
    setPreviewQuestion(question);
    setPreviewOpen(true);
  };

  const handleDelete = async (questionId) => {
    const questionToDelete = questions.find(q => q.id === questionId);
    setQuestionToDelete(questionToDelete);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    
    try {
      await dispatch(deleteQuestion(questionToDelete.id)).unwrap();
      // Refresh the list after deletion
      handleFetchQuestions(pagination.page);
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Có lỗi xảy ra khi xóa câu hỏi: ' + error);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  // Helper function to extract title and description from JSON content
  const extractTitleAndDescription = (content) => {
    try {
      // Try to parse as JSON
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Extract title based on content structure
      let title = '';
      let description = '';
      
      if (parsed.title) {
        title = parsed.title;
      } else if (parsed.content) {
        title = parsed.content.substring(0, 50) + (parsed.content.length > 50 ? '...' : '');
      } else if (parsed.summary) {
        title = parsed.summary.substring(0, 60) + (parsed.summary.length > 60 ? '...' : '');
      } else {
        // For other formats, try to extract first meaningful content
        const keys = Object.keys(parsed);
        if (keys.length > 0) {
          const firstValue = parsed[keys[0]];
          if (typeof firstValue === 'string') {
            title = firstValue.substring(0, 50) + (firstValue.length > 50 ? '...' : '');
          } else {
            title = `[${keys[0]}]`;
          }
        }
      }
      
      // Extract description from various possible fields
      if (parsed.passage) {
        description = parsed.passage.substring(0, 80) + (parsed.passage.length > 80 ? '...' : '');
      } else if (parsed.audioScript) {
        description = parsed.audioScript.substring(0, 80) + (parsed.audioScript.length > 80 ? '...' : '');
      } else if (parsed.instructions) {
        description = parsed.instructions.substring(0, 80) + (parsed.instructions.length > 80 ? '...' : '');
      } else if (parsed.prompt) {
        description = parsed.prompt.substring(0, 80) + (parsed.prompt.length > 80 ? '...' : '');
      }
      
      return { title: title || 'Unnamed Question', description };
    } catch (error) {
      // If not JSON, treat as plain text
      const text = String(content || '');
      return {
        title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        description: text.substring(50, 130) + (text.length > 130 ? '...' : '')
      };
    }
  };

  const columns = [
    {
      id: 'title',
      label: 'Tên câu hỏi',
      render: (row) => {
        const { title, description } = extractTitleAndDescription(row.content);
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="body2" fontWeight="bold">
                {title}
              </Typography>
            </Box>
            {description && (
              <Typography variant="caption" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
        );
      }
    },
    {
      id: 'question_type',
      label: 'Loại câu',
      render: (row) => (
        <Chip 
          label={row.question_type} 
          size="small" 
          variant="outlined"
          color="primary"
        />
      )
    },
    {
      id: 'skill',
      label: 'Kỹ năng',
      render: (row) => (
        <Chip 
          label={row.skill} 
          size="small" 
          variant="filled"
          color="secondary"
        />
      )
    },
    {
      id: 'difficulty',
      label: 'Độ khó',
      render: (row) => (
        (() => {
          const color = getDifficultyColor(row.difficulty);
          return (
            <Chip
              label={row.difficulty?.charAt(0).toUpperCase() + row.difficulty?.slice(1) || 'N/A'}
              size="small"
              color={color}
              sx={color !== 'default' ? { color: 'white' } : {}}
            />
          );
        })()
      )
    },
    {
      id: 'usage_count',
      label: 'Số lần dùng',
      align: 'center',
      render: (row) => (
        <Chip 
          label={`${row.usage_count} lần`} 
          size="small"
          variant={row.usage_count > 0 ? 'filled' : 'outlined'}
          color={row.usage_count > 0 ? 'success' : 'default'}
          sx={row.usage_count > 0 ? { color: 'white' } : {}}
        />
      )
    },
    {
      id: 'updated_at',
      label: 'Cập nhật cuối',
      render: (row) => new Date(row.updated_at).toLocaleDateString('vi-VN')
    },
    {
      id: 'actions',
      label: 'Hành động',
      align: 'center',
      render: (row) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => router.push(`/teacher/questions/edit/${row.id}`)}
            color="primary"
            title="Sửa câu hỏi"
          >
            <Edit />
          </IconButton>
          {showActions && !readOnlyMode && (
            <span title={row.usage_count > 0 ? 'Không thể xóa vì đã được sử dụng trong đề thi' : 'Xóa câu hỏi'}>
              <IconButton
                size="small"
                onClick={() => handleDelete(row.id)}
                color="error"
                sx={{ ml: 1 }}
                disabled={row.usage_count > 0}
              >
                <Delete />
              </IconButton>
            </span>
          )}
        </Box>
      )
    }
  ];

  // Don't render until client-side to prevent hydration mismatch
  if (!isClient) {
    return (
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '300px' 
      }}>
        <Typography variant="h6" color="text.secondary">
          Đang tải danh sách câu hỏi...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filter */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <TextField
                placeholder="Tìm kiếm câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Kỹ năng</InputLabel>
                <Select
                  value={filters.skill || ''}
                  label="Kỹ năng"
                  onChange={(e) => handleFilterChange('skill', String(e.target.value))}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {(filterOptions?.skills || []).map((option) => (
                    <MenuItem key={option.id} value={String(option.id)}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Loại câu</InputLabel>
                <Select
                  value={filters.question_type || ''}
                  label="Loại câu"
                  onChange={(e) => handleFilterChange('question_type', String(e.target.value))}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {(filterOptions?.questionTypes || []).map((option) => (
                    <MenuItem key={option.id} value={String(option.id)}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Độ khó</InputLabel>
                <Select
                  value={filters.difficulty || ''}
                  label="Độ khó"
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {(filterOptions?.difficulties || []).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

            

              <Box display="flex" gap={1} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                  size="small"
                  sx={{ ml: 2 }}
                  disabled={activeFiltersCount === 0}
                  color={activeFiltersCount > 0 ? 'error' : 'inherit'}
                >
                  Xóa bộ lọc
                </Button>
                {activeFiltersCount > 0 && (
                  <Chip 
                    label={`${activeFiltersCount} bộ lọc đang áp dụng`}
                    color="error"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={questions || []}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={handleFetchQuestions}
        emptyMessage="Không tìm thấy câu hỏi nào"
      />

      {isClient && (
        <QuestionPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          question={previewQuestion}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Xác nhận xóa câu hỏi
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa câu hỏi "{questionToDelete?.title || 'này'}" không?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Hủy
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            autoFocus
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}