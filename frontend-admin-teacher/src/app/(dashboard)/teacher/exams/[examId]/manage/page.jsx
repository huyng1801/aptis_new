'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Skeleton,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Add as AddIcon,
  Settings as SectionIcon,
  Quiz as QuestionIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import {
  fetchExamById,
  addExamSection,
  updateExamSection,
  removeExamSection,
  addQuestionToSection,
  removeQuestionFromSection
} from '@/store/slices/examSlice';
import { showNotification } from '@/store/slices/uiSlice';
import { usePublicData } from '@/hooks/usePublicData';
import { examApi } from '@/services/examService';
import { LazyQuestionDisplay } from '@/components/teacher/questions/LazyQuestionDisplay';
import AddQuestionDialog from '@/components/teacher/exams/AddQuestionDialog';
import QuestionRenderer from '@/components/teacher/exams/QuestionRenderer';

export default function ExamManagePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useParams();
  
  const examId = params.examId;
  const examState = useSelector(state => state.exams || {});
  const { currentExam, isLoading, error } = examState;
  const { skillTypes, loading: publicDataLoading } = usePublicData();
  
  const [loading, setLoading] = useState(false);
  const [openSectionDialog, setOpenSectionDialog] = useState(false);
  const [openEditSectionDialog, setOpenEditSectionDialog] = useState(false);
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [removingQuestionId, setRemovingQuestionId] = useState(null);
  const [sectionForm, setSectionForm] = useState({
    skill_type_id: '',
    section_order: 1,
    duration_minutes: 30,
    instruction: ''
  });
  const [editSectionForm, setEditSectionForm] = useState({
    skill_type_id: '',
    duration_minutes: 30,
    instruction: ''
  });

  // Fetch exam data on mount
  useEffect(() => {
    if (examId) {
      dispatch(fetchExamById(examId));
    }
  }, [dispatch, examId]);

  const handleAddSection = async () => {
    setLoading(true);
    try {
      const result = await dispatch(addExamSection({
        examId,
        sectionData: {
          ...sectionForm,
          skill_type_id: parseInt(sectionForm.skill_type_id),
          section_order: parseInt(sectionForm.section_order),
          duration_minutes: parseInt(sectionForm.duration_minutes)
        }
      }));
      
      if (addExamSection.fulfilled.match(result)) {
        dispatch(showNotification({
          message: 'Thêm phần thi thành công!',
          type: 'success'
        }));
        setOpenSectionDialog(false);
        // Reset form with next order
        const nextOrder = ((currentExam?.sections?.length || 0) + 1);
        setSectionForm({
          skill_type_id: '',
          section_order: nextOrder,
          duration_minutes: 30,
          instruction: ''
        });
        // Refresh exam data
        dispatch(fetchExamById(examId));
      }
    } catch (error) {
      dispatch(showNotification({
        message: 'Có lỗi xảy ra khi thêm phần thi',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSection = (section) => {
    setSelectedSection(section);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteSection = async () => {
    if (!selectedSection) return;
    
    setLoading(true);
    try {
      const result = await dispatch(removeExamSection({
        examId,
        sectionId: selectedSection.id
      }));
      
      if (removeExamSection.fulfilled.match(result)) {
        dispatch(showNotification({
          message: 'Xóa phần thi thành công!',
          type: 'success'
        }));
        // Refresh exam data
        dispatch(fetchExamById(examId));
      }
    } catch (error) {
      dispatch(showNotification({
        message: 'Có lỗi xảy ra khi xóa phần thi',
        type: 'error'
      }));
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setSelectedSection(null);
    }
  };

  const handleAddQuestion = (section) => {
    if (currentExam?.status === 'published') {
      setErrorMessage('Không thể thêm câu hỏi khi bài thi đang công khai!');
      return;
    }
    setSelectedSection(section);
    setOpenQuestionDialog(true);
  };

  const handleEditSection = (section) => {
    if (currentExam?.status === 'published') {
      setErrorMessage('Không thể chỉnh sửa phần thi khi bài thi đang công khai!');
      return;
    }
    setSelectedSection(section);
    setEditSectionForm({
      skill_type_id: section.skill_type_id,
      duration_minutes: section.duration_minutes,
      instruction: section.instruction || ''
    });
    setOpenEditSectionDialog(true);
  };

  const handleUpdateSection = async () => {
    setLoading(true);
    try {
      const result = await dispatch(updateExamSection({
        examId,
        sectionId: selectedSection.id,
        sectionData: {
          ...editSectionForm,
          skill_type_id: parseInt(editSectionForm.skill_type_id),
          duration_minutes: parseInt(editSectionForm.duration_minutes)
        }
      }));
      
      if (updateExamSection.fulfilled.match(result)) {
        dispatch(showNotification({
          message: 'Cập nhật phần thi thành công!',
          type: 'success'
        }));
        setOpenEditSectionDialog(false);
        // Refresh exam data
        dispatch(fetchExamById(examId));
      }
    } catch (error) {
      dispatch(showNotification({
        message: 'Có lỗi xảy ra khi cập nhật phần thi',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionAdded = async (questionData) => {
    if (!selectedSection) return;

    try {
      const result = await dispatch(addQuestionToSection({
        examId,
        sectionId: selectedSection.id,
        questionData
      }));

      if (addQuestionToSection.fulfilled.match(result)) {
        dispatch(showNotification({
          message: 'Thêm câu hỏi thành công!',
          type: 'success'
        }));
        // Refresh exam data
        dispatch(fetchExamById(examId));
        setOpenQuestionDialog(false);
        setSelectedSection(null);
      }
    } catch (error) {
      throw error; // Let AddQuestionDialog handle the error
    }
  };

  const handleRemoveQuestionFromSection = async (sectionId, questionId) => {
    setRemovingQuestionId(questionId);
    try {
      const result = await dispatch(removeQuestionFromSection({
        examId,
        sectionId,
        questionId
      }));

      if (removeQuestionFromSection.fulfilled.match(result)) {
        dispatch(showNotification({
          message: 'Xóa câu hỏi khỏi phần thi thành công!',
          type: 'success'
        }));
        // Refresh exam data
        dispatch(fetchExamById(examId));
      }
    } catch (error) {
      dispatch(showNotification({
        message: 'Có lỗi xảy ra khi xóa câu hỏi',
        type: 'error'
      }));
    } finally {
      setRemovingQuestionId(null);
    }
  };

  const handleOpenSectionDialog = () => {
    // Calculate next section order
    const nextOrder = (currentExam?.sections?.length || 0) + 1;
    setSectionForm(prev => ({
      ...prev,
      section_order: nextOrder
    }));
    setOpenSectionDialog(true);
  };

  // Loading skeleton
  if (isLoading && !currentExam) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Có lỗi xảy ra khi tải bài thi: {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Error Alert */}
      {errorMessage && (
        <Alert 
          severity="error" 
          onClose={() => setErrorMessage('')}
          sx={{ mb: 3 }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push(`/teacher/exams/${examId}`)}
            sx={{ mr: 2 }}
          >
            Quay lại
          </Button>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Quản lý Sections - {currentExam?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Thêm và quản lý các phần thi và câu hỏi
            </Typography>
          </Box>
        </Box>

      </Box>

      {/* Overview Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Tổng số phần thi
              </Typography>
              <Typography variant="h5" color="primary">
                {currentExam?.sections?.length || 0}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Tổng câu hỏi
              </Typography>
              <Typography variant="h5" color="primary">
                {currentExam?.sections?.reduce((total, section) => 
                  total + (section.questions?.length || 0), 0) || 0}
              </Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Trạng thái
              </Typography>
              <Chip 
                label={currentExam?.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                color={currentExam?.status === 'published' ? 'success' : 'default'}
                size="small"
                sx={{ '& .MuiChip-label': { color: '#fff', fontWeight: 400 } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sections List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Danh sách phần thi
          </Typography>
          
          {!currentExam?.sections || currentExam.sections.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Chưa có phần thi nào. Hãy thêm phần thi đầu tiên để bắt đầu xây dựng bài thi.
            </Alert>
          ) : (
            <List>
              {currentExam.sections.map((section, index) => (
                <Box key={section.id || index}>
                  <ListItem divider>
                   
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight={500}>
                            Phần {section.section_order || index + 1}: {section.skillType?.skill_type_name || 'N/A'}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={`${section.questions?.length || 0} câu hỏi`}
                            variant="outlined"
                          />
                        
                        </Box>
                      }
                      secondary={
                        <Box>
                          {section.instruction && (
                            <Typography variant="body2" color="text.secondary">
                              Hướng dẫn: {section.instruction}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" gap={1} alignItems="center">
                        <IconButton
                          size="small"
                          onClick={() => setExpandedSectionId(
                            expandedSectionId === section.id ? null : section.id
                          )}
                        >
                          {expandedSectionId === section.id ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleAddQuestion(section)}
                        >
                          <QuestionIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="default"
                          onClick={() => handleEditSection(section)}
                          disabled={loading}
                        >
                          <EditIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>

                  {/* Questions List - Expanded */}
                  {expandedSectionId === section.id && section.questions && section.questions.length > 0 && (
                    <Box sx={{ pl: 4, pr: 2, py: 1, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Danh sách câu hỏi:
                      </Typography>
                      <List disablePadding>
                        {section.questions.map((question, qIndex) => (
                          <ListItem 
                            key={question.id || qIndex}
                            dense
                            sx={{ 
                              bgcolor: 'background.paper',
                              mb: 0.5,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <QuestionIcon fontSize="small" color="action" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box>
                                  <Typography variant="body2" fontWeight={500}>
                                    Câu {question.question_order} - ID: {question.question_id}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Điểm tối đa: {question.max_score}
                                  </Typography>
                                </Box>
                              }
                              secondary={null}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveQuestionFromSection(section.id, question.id)}
                              disabled={removingQuestionId === question.id}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Empty Questions Message */}
                  {expandedSectionId === section.id && (!section.questions || section.questions.length === 0) && (
                    <Box sx={{ pl: 4, pr: 2, py: 2, bgcolor: 'background.default' }}>
                      <Alert severity="info" sx={{ m: 0 }}>
                        Chưa có câu hỏi trong phần thi này. Hãy thêm câu hỏi bằng cách nhấn nút Thêm.
                      </Alert>
                    </Box>
                  )}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Edit Section Dialog */}
      <Dialog 
        open={openEditSectionDialog} 
        onClose={() => setOpenEditSectionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa phần thi</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 1 }}>
            <FormControl fullWidth disabled>
              <InputLabel>Kỹ năng</InputLabel>
              <Select
                value={editSectionForm.skill_type_id}
                label="Kỹ năng"
                onChange={(e) => setEditSectionForm(prev => ({ ...prev, skill_type_id: e.target.value }))}
              >
                {skillTypes && skillTypes.length > 0 ? (
                  skillTypes.map((skill) => (
                    <MenuItem key={skill.id} value={skill.id}>
                      {skill.skill_type_name || skill.name || 'Unknown'}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    {publicDataLoading ? 'Đang tải...' : 'Không có dữ liệu'}
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            {/* Hidden field for duration_minutes, value still sent */}
            <input type="hidden" value={editSectionForm.duration_minutes} readOnly />

            <TextField
              fullWidth
              label="Hướng dẫn"
              multiline
              rows={3}
              value={editSectionForm.instruction}
              onChange={(e) => setEditSectionForm(prev => ({ ...prev, instruction: e.target.value }))}
              placeholder="Nhập hướng dẫn cho phần thi này..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditSectionDialog(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleUpdateSection}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Question Dialog */}
      <AddQuestionDialog
        open={openQuestionDialog}
        onClose={() => {
          setOpenQuestionDialog(false);
          setSelectedSection(null);
        }}
        section={selectedSection}
        onQuestionAdded={handleQuestionAdded}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa phần thi</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Bạn có chắc chắn muốn xóa phần thi này không?
          </Alert>
          {selectedSection && (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Phần {selectedSection.section_order}: {selectedSection.skillType?.skill_type_name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Thời gian: {selectedSection.duration_minutes} phút
              </Typography>
              {selectedSection.instruction && (
                <Typography variant="body2" color="text.secondary">
                  Hướng dẫn: {selectedSection.instruction}
                </Typography>
              )}
              <Alert severity="error" sx={{ mt: 2 }}>
                <strong>Cảnh báo:</strong> Tất cả câu hỏi trong phần này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button 
            onClick={confirmDeleteSection}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Đang xóa...' : 'Xóa phần thi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}