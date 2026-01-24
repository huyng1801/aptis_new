'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  List,
  ListItem,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Pagination
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import { examApi } from '@/services/examService';
import { publicApi } from '@/services/publicService';
import { showNotification } from '@/store/slices/uiSlice';
import QuestionRenderer from './QuestionRenderer';

export default function AddQuestionDialog({ 
  open, 
  onClose, 
  section, 
  onQuestionAdded 
}) {
  const dispatch = useDispatch();
  
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [openAddForm, setOpenAddForm] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [questionTypes, setQuestionTypes] = useState([
    { value: 'all', label: 'Tất cả loại câu hỏi' }
  ]);
  const [questionTypesLoading, setQuestionTypesLoading] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    question_order: 1,
    max_score: 10
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    difficulty: 'all',
    questionType: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const difficulties = [
    { value: 'all', label: 'Tất cả độ khó' },
    { value: 'easy', label: 'Dễ' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'hard', label: 'Khó' }
  ];

  // Load question types from API
  useEffect(() => {
    loadQuestionTypes();
  }, []);

  const loadQuestionTypes = async () => {
    setQuestionTypesLoading(true);
    try {
      const result = await publicApi.getQuestionTypes();
      if (result.success && result.data) {
        const types = [
          { value: 'all', label: 'Tất cả loại câu hỏi' },
          ...result.data.map(type => ({
            value: type.code,
            label: `${type.question_type_name}`
          }))
        ];
        setQuestionTypes(types);
      }
    } catch (error) {
      console.error('Error loading question types:', error);
      dispatch(showNotification({
        message: 'Lỗi khi tải loại câu hỏi: ' + error.message,
        type: 'error'
      }));
    } finally {
      setQuestionTypesLoading(false);
    }
  };

  useEffect(() => {
    if (open && section) {
      loadAvailableQuestions();
      const nextOrder = (section.questions?.length || 0) + 1;
      setQuestionForm({
        question_order: nextOrder,
        max_score: 10
      });
    }
  }, [open, section, filters.questionType]);

  useEffect(() => {
    applyFilters();
  }, [availableQuestions, filters, currentPage]);

  const loadAvailableQuestions = async () => {
    setQuestionsLoading(true);
    try {
      console.log('[AddQuestionDialog] Fetching questions for skill:', section.skill_type_id);
      const params = {
        skill_type_id: section.skill_type_id,
        limit: 100,
        page: 1
      };
      // Add question type filter if selected
      if (filters.questionType && filters.questionType !== 'all') {
        params.question_type_code = filters.questionType;
      }
      const result = await examApi.getQuestions(params);
      console.log('[AddQuestionDialog] Response:', result);
      
      if (result.success && result.data) {
        setAvailableQuestions(result.data);
      } else {
        setAvailableQuestions([]);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      dispatch(showNotification({
        message: 'Lỗi khi tải danh sách câu hỏi: ' + error.message,
        type: 'error'
      }));
      setAvailableQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = availableQuestions;

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(q => 
        (q.content && q.content.toLowerCase().includes(searchTerm)) ||
        (q.question_type && q.question_type.toLowerCase().includes(searchTerm)) ||
        (q.questionType?.question_type_name && q.questionType.question_type_name.toLowerCase().includes(searchTerm)) ||
        (q.questionType?.code && q.questionType.code.toLowerCase().includes(searchTerm)) ||
        q.id.toString().includes(searchTerm)
      );
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === filters.difficulty);
    }

    // Note: Question type filter is done on backend via API, not here

    setFilteredQuestions(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleAddQuestionClick = (question) => {
    setSelectedQuestion(question);
    setOpenAddForm(true);
  };

  const handleConfirmAddQuestion = async () => {
    if (!selectedQuestion || !section) return;

    setAddingQuestion(true);
    try {
      await onQuestionAdded({
        question_id: selectedQuestion.id,
        question_order: parseInt(questionForm.question_order),
        max_score: parseFloat(questionForm.max_score)
      });

      setOpenAddForm(false);
      setSelectedQuestion(null);
      onClose();
    } catch (error) {
      dispatch(showNotification({
        message: 'Có lỗi xảy ra khi thêm câu hỏi',
        type: 'error'
      }));
    } finally {
      setAddingQuestion(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      {/* Main Dialog */}
      <Dialog 
        open={open && !openAddForm} 
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ py: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Thêm câu hỏi: {section?.skillType?.skill_type_name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <FilterList fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {filteredQuestions.length} / {availableQuestions.length}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          {/* Filters */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Tìm kiếm câu hỏi..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Loại câu hỏi</InputLabel>
                  <Select
                    value={filters.questionType}
                    label="Loại câu hỏi"
                    onChange={(e) => handleFilterChange('questionType', e.target.value)}
                    disabled={questionTypesLoading}
                  >
                    {questionTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Độ khó</InputLabel>
                  <Select
                    value={filters.difficulty}
                    label="Độ khó"
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  >
                    {difficulties.map(diff => (
                      <MenuItem key={diff.value} value={diff.value}>
                        {diff.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Questions List */}
          <Box>
            {questionsLoading ? (
              <Alert severity="info" sx={{ py: 1 }}>Đang tải danh sách câu hỏi...</Alert>
            ) : paginatedQuestions.length > 0 ? (
              <Box>
                <List sx={{ py: 0 }}>
                  {paginatedQuestions.map((question, index) => (
                    <ListItem 
                      key={question.id} 
                      divider 
                      sx={{ 
                        py: 2, 
                        px: 2,
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        bgcolor: 'background.paper',
                        mb: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      {/* Question Header */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box flex={1}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Q{startIndex + index + 1} (ID: {question.id})
                          </Typography>
                          <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                            <Chip 
                              size="small" 
                              label={question.questionType?.question_type_name || question.questionType?.code || question.question_type || 'N/A'}
                              color="primary"
                              variant="outlined"
                            />
                            <Chip 
                              size="small" 
                              label={question.difficulty || 'medium'}
                              color={
                                question.difficulty === 'easy' ? 'success' : 
                                question.difficulty === 'hard' ? 'error' : 'warning'
                              }
                              variant="outlined"
                            />
                            {question.media_url && (
                              <Chip 
                                size="small" 
                                label="Media" 
                                color="info" 
                                variant="outlined"
                                icon={<AudioFile fontSize="small" />}
                              />
                            )}
                          </Box>
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleAddQuestionClick(question)}
                          disabled={addingQuestion}
                          sx={{ ml: 1, minWidth: '70px' }}
                        >
                          {addingQuestion ? '...' : 'Thêm'}
                        </Button>
                      </Box>

                      {/* Question Content */}
                      <QuestionRenderer question={question} compact={true} />
                    </ListItem>
                  ))}
                </List>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination 
                      count={totalPages}
                      page={currentPage}
                      onChange={(e, page) => setCurrentPage(page)}
                      color="primary"
                      size="small"
                    />
                  </Box>
                )}
              </Box>
            ) : (
              <Alert severity="warning" sx={{ py: 1 }}>
                {availableQuestions.length === 0 
                  ? 'Không tìm thấy câu hỏi nào. Tạo câu hỏi trước khi thêm vào phần thi.'
                  : 'Không có câu hỏi nào phù hợp với bộ lọc hiện tại.'
                }
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ py: 1.5, px: 2 }}>
          <Button onClick={onClose} size="small">
            Đóng
          </Button>
          <Button 
            variant="contained"
            size="small"
            onClick={() => window.open('/teacher/questions/new', '_blank')}
          >
            Tạo mới
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Question Form Dialog */}
      <Dialog 
        open={openAddForm} 
        onClose={() => setOpenAddForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Thêm câu hỏi vào phần thi</DialogTitle>
        <DialogContent>
          {selectedQuestion && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <QuestionRenderer question={selectedQuestion} compact={true} />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Loại: {selectedQuestion.questionType?.question_type_name || 'N/A'} | Độ khó: {selectedQuestion.difficulty}
                </Typography>
              </Alert>

              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  fullWidth
                  label="Thứ tự câu hỏi"
                  type="number"
                  value={questionForm.question_order}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, question_order: e.target.value }))}
                  inputProps={{ min: 1 }}
                  helperText="Vị trí của câu hỏi trong phần thi"
                />

                <TextField
                  fullWidth
                  label="Điểm tối đa"
                  type="number"
                  value={questionForm.max_score}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, max_score: e.target.value }))}
                  inputProps={{ min: 0.1, step: 0.1 }}
                  helperText="Điểm tối đa mà học sinh có thể đạt được cho câu hỏi này"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenAddForm(false)}
            disabled={addingQuestion}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleConfirmAddQuestion}
            variant="contained"
            disabled={addingQuestion || !questionForm.question_order || !questionForm.max_score}
          >
            {addingQuestion ? 'Đang thêm...' : 'Thêm câu hỏi'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}