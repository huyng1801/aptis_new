'use client';

import { useState, useEffect } from 'react';
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
  IconButton
} from '@mui/material';
import { Search, Add, FilterList, Visibility } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { fetchQuestions, fetchFilterOptions } from '@/store/slices/questionSlice';
import { 
  DEFAULT_FILTER_OPTIONS,
  DEFAULT_APTIS_TYPES,
  DEFAULT_SKILLS,
  DEFAULT_QUESTION_TYPES,
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
    question_type: '',
    aptis_type: '',
    skill: '',
    difficulty: '',
    status: ''
  });
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  useEffect(() => {
    if (isClient) {
      handleFetchQuestions();
    }
  }, [searchTerm, filters]);

  const handleFetchQuestions = (page = 1) => {
    dispatch(fetchQuestions({
      page,
      limit: 10,
      search: searchTerm,
      ...filters
    }));
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handlePreview = (question) => {
    setPreviewQuestion(question);
    setPreviewOpen(true);
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
              {row.is_used_in_exam && (
                <Chip
                  label="Đã thêm"
                  size="small"
                  color="success"
                  variant="filled"
                  sx={{ height: 20 }}
                />
              )}
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
        <Chip 
          label={row.difficulty?.charAt(0).toUpperCase() + row.difficulty?.slice(1) || 'N/A'} 
          size="small"
          color={getDifficultyColor(row.difficulty)}
        />
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
            onClick={() => handlePreview(row)}
            color="info"
          >
            <Visibility />
          </IconButton>
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

  if (viewMode === 'grid') {
    return (
      <Box>
        {/* Header and Filters */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Danh sách câu hỏi</Typography>
            {showActions && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => router.push('/teacher/questions/new')}
              >
                Tạo câu hỏi mới
              </Button>
            )}
          </Box>

          {/* Search and Filter */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Loại APTIS</InputLabel>
                <Select
                  value={filters.aptis_type}
                  label="Loại APTIS"
                  onChange={(e) => handleFilterChange('aptis_type', e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {(filterOptions?.aptisTypes || DEFAULT_FILTER_OPTIONS.aptisTypes).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Kỹ năng</InputLabel>
                <Select
                  value={filters.skill}
                  label="Kỹ năng"
                  onChange={(e) => handleFilterChange('skill', e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {(filterOptions?.skills || DEFAULT_FILTER_OPTIONS.skills).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Loại câu</InputLabel>
                <Select
                  value={filters.question_type}
                  label="Loại câu"
                  onChange={(e) => handleFilterChange('question_type', e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {(filterOptions?.questionTypes || DEFAULT_FILTER_OPTIONS.questionTypes).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Độ khó</InputLabel>
                <Select
                  value={filters.difficulty}
                  label="Độ khó"
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {DEFAULT_FILTER_OPTIONS.difficulties.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Trạng thái"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {DEFAULT_FILTER_OPTIONS.statuses.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Questions Grid */}
        <Grid container spacing={3}>
          {(questions || []).map((question) => (
            <Grid item xs={12} sm={6} md={4} key={question.id}>
              <QuestionCard 
                question={question}
                onPreview={() => handlePreview(question)}
                showActions={showActions}
              />
            </Grid>
          ))}
          {(!questions || questions.length === 0) && !loading && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  Không tìm thấy câu hỏi nào
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Preview Dialog */}
        {isClient && (
          <QuestionPreview
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            question={previewQuestion}
          />
        )}
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
                <InputLabel>Loại APTIS</InputLabel>
                <Select
                  value={filters.aptis_type}
                  label="Loại APTIS"
                  onChange={(e) => setFilters(prev => ({ ...prev, aptis_type: e.target.value }))}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {(filterOptions?.aptisTypes || DEFAULT_FILTER_OPTIONS.aptisTypes).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Kỹ năng</InputLabel>
                <Select
                  value={filters.skill}
                  label="Kỹ năng"
                  onChange={(e) => setFilters(prev => ({ ...prev, skill: e.target.value }))}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {(filterOptions?.skills || DEFAULT_FILTER_OPTIONS.skills).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Loại câu</InputLabel>
                <Select
                  value={filters.question_type}
                  label="Loại câu"
                  onChange={(e) => setFilters(prev => ({ ...prev, question_type: e.target.value }))}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {(filterOptions?.questionTypes || DEFAULT_FILTER_OPTIONS.questionTypes).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Độ khó</InputLabel>
                <Select
                  value={filters.difficulty}
                  label="Độ khó"
                  onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {DEFAULT_FILTER_OPTIONS.difficulties.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Trạng thái"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {DEFAULT_FILTER_OPTIONS.statuses.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
    </Box>
  );
}