'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Typography,
  Paper,
  Chip,
  FormControlLabel,
  Checkbox,
  Slider
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import MCQForm from './MCQForm';
import MatchingForm from './MatchingForm';
import GapFillingForm from './GapFillingForm';
import OrderingForm from './OrderingForm';
import WritingPromptForm from './WritingPromptForm';
import SpeakingTaskForm from './SpeakingTaskForm';
import TrueFalseForm from './TrueFalseForm';
import NoteCompletionForm from './NoteCompletionForm';
import QuestionStructureGuide from './QuestionStructureGuide';

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Dễ', color: '#4caf50' },
  { value: 'medium', label: 'Trung bình', color: '#ff9800' },
  { value: 'hard', label: 'Khó', color: '#f44336' }
];

const questionSchema = Yup.object().shape({
  difficulty: Yup.string().required('Độ khó là bắt buộc'),
  // Remove content validation from Formik - we handle it separately with questionContent state
});

// Validation function for question content (moved outside component to prevent recreation)
const validateQuestionContent = (content) => {
  if (!content) {
    return { isValid: false, error: 'Nội dung câu hỏi không được để trống' };
  }
  
  try {
    // If it's a JSON string, parse and check if it has meaningful content
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    
    // Check if it's empty object or has some content
    if (typeof parsed === 'object' && parsed !== null) {
      // For objects, check if it has any meaningful properties
      const keys = Object.keys(parsed);
      if (keys.length === 0) {
        return { isValid: false, error: 'Câu hỏi chưa có nội dung' };
      }
      
      // Check if any property has meaningful content
      for (const key of keys) {
        const value = parsed[key];
        if (typeof value === 'string' && value.trim()) {
          return { isValid: true, error: null };
        }
        if (Array.isArray(value) && value.length > 0) {
          return { isValid: true, error: null };
        }
        if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
          return { isValid: true, error: null };
        }
      }
      return { isValid: false, error: 'Câu hỏi chưa có nội dung hợp lệ' };
    }
    
    // For string content, check if it's not empty
    const isValid = typeof parsed === 'string' && parsed.trim().length > 0;
    return { 
      isValid, 
      error: isValid ? null : 'Nội dung câu hỏi không được để trống' 
    };
  } catch (error) {
    // If it's not JSON, treat as plain string
    const isValid = typeof content === 'string' && content.trim().length > 0;
    return { 
      isValid, 
      error: isValid ? null : 'Nội dung câu hỏi không hợp lệ' 
    };
  }
};

export default function QuestionForm({
  aptisType,
  skillType, 
  questionType,
  aptisData = null,
  skillData = null,
  questionTypeData = null,
  initialData = {},
  onSubmit,
  onBack,
  isEditing = false
}) {
  const [questionContent, setQuestionContent] = useState(initialData.content || '');
  const [mediaUrl, setMediaUrl] = useState(initialData.media_url || '');
  const [hasDuration, setHasDuration] = useState(!!initialData.duration_seconds);
  const [duration, setDuration] = useState(initialData.duration_seconds ? Math.floor(initialData.duration_seconds / 60) : 5);

  // Use provided data instead of constants
  const selectedAptis = aptisData;
  const selectedSkill = skillData;
  const selectedQuestionType = questionTypeData;

  // Get current validation state (memoized to prevent infinite loops)
  const validationResult = useMemo(() => {
    return validateQuestionContent(questionContent);
  }, [questionContent]);
  const isValidQuestionContent = validationResult.isValid;

  const formik = useFormik({
    initialValues: {
      content: initialData.content || '',
      difficulty: initialData.difficulty || 'medium',
      media_url: initialData.media_url || '',
      duration_seconds: initialData.duration_seconds || null,
      status: initialData.status || 'draft'
    },
    validationSchema: questionSchema,
    enableReinitialize: false, // Disable to prevent infinite loops
    onSubmit: async (values) => {
      if (!isValidQuestionContent) {
        console.error('Question content validation failed:', validationResult.error);
        return;
      }
      
      const submissionData = {
        ...values,
        content: questionContent,
        media_url: mediaUrl,
        duration_seconds: hasDuration ? duration * 60 : null
      };
      
      try {
        await onSubmit(submissionData);
      } catch (error) {
        console.error('[QuestionForm] Error in onSubmit:', error);
        // Re-throw để parent component có thể xử lý
        throw new Error(`Lỗi submit form: ${error.message || error}`);
      }
    }
  });

  const renderSpecificForm = () => {
    // Safety check
    if (!selectedQuestionType) {
      return (
        <Box textAlign="center" py={4}>
          <Typography color="error">
            ❌ Loại câu hỏi không được chọn
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Vui lòng quay lại và chọn loại câu hỏi
          </Typography>
        </Box>
      );
    }

    const props = {
      content: questionContent,
      onChange: setQuestionContent,
      skillType: selectedSkill,
      questionType: selectedQuestionType,
      aptisData,
      skillData,
      questionTypeData
    };

    // Use the code from questionTypeData (from database)
    const questionCode = selectedQuestionType?.code;

    switch (questionCode) {
      // Listening types
      case 'LISTENING_MCQ':
        return <MCQForm {...props} />;
      case 'LISTENING_GAP_FILL':
        return <GapFillingForm {...props} />;
      case 'LISTENING_MATCHING':
        return <MatchingForm {...props} speakerMatching={true} />;
      case 'LISTENING_STATEMENT_MATCHING':
        return <MatchingForm {...props} statementMatching={true} />;
      
      // Reading types  
      case 'READING_GAP_FILL':
        return <GapFillingForm {...props} />;
      case 'READING_ORDERING':
        return <OrderingForm {...props} />;
      case 'READING_MATCHING':
        return <MatchingForm {...props} personMatching={true} />;
      case 'READING_MATCHING_HEADINGS':
        return <MatchingForm {...props} headingMatching={true} />;
      
      // Speaking types
      case 'SPEAKING_INTRO':
      case 'SPEAKING_DESCRIPTION': 
      case 'SPEAKING_COMPARISON':
      case 'SPEAKING_DISCUSSION':
        return <SpeakingTaskForm {...props} speakingType={questionCode} />;
      
      // Writing types
      case 'WRITING_SHORT':
      case 'WRITING_FORM':
      case 'WRITING_LONG':
      case 'WRITING_EMAIL':
      case 'WRITING_ESSAY':
        return <WritingPromptForm {...props} writingType={questionCode} />;
      
      default:
        return (
          <Box textAlign="center" py={4}>
            <Typography color="error" gutterBottom>
              ⚠️ Loại câu hỏi này chưa được hỗ trợ
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1} sx={{ wordBreak: 'break-all' }}>
              Question Code: {questionCode}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Selected Type: {JSON.stringify(selectedQuestionType, null, 2)}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={2}>
              Cần thêm form component cho loại câu hỏi này.
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      {/* Header Info */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Thông tin câu hỏi
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          <Chip label={selectedAptis?.aptis_type_name} color="primary" />
          <Chip label={selectedSkill?.skill_type_name} color="secondary" />
          <Chip label={selectedQuestionType?.question_type_name} color="info" />
        </Box>
        
        <Grid container spacing={3}>
          {/* Difficulty */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Độ khó</InputLabel>
              <Select
                name="difficulty"
                value={formik.values.difficulty}
                onChange={formik.handleChange}
                label="Độ khó"
                error={formik.touched.difficulty && Boolean(formik.errors.difficulty)}
              >
                {DIFFICULTY_LEVELS.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: level.color
                        }}
                      />
                      {level.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Media URL (for listening/speaking) */}
          {(selectedSkill?.code === 'LISTENING' || selectedSkill?.code === 'SPEAKING') && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="URL Media (Audio/Video)"
                name="media_url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                helperText="URL file âm thanh hoặc video cho câu hỏi"
              />
            </Grid>
          )}

          {/* Duration */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hasDuration}
                  onChange={(e) => setHasDuration(e.target.checked)}
                />
              }
              label="Giới hạn thời gian làm bài"
            />
            
            {hasDuration && (
              <Box sx={{ ml: 4, mt: 2 }}>
                <Typography gutterBottom>
                  Thời gian: {duration} phút
                </Typography>
                <Slider
                  value={duration}
                  onChange={(e, value) => setDuration(value)}
                  min={1}
                  max={30}
                  step={1}
                  marks={[
                    { value: 1, label: '1 phút' },
                    { value: 10, label: '10 phút' },
                    { value: 20, label: '20 phút' },
                    { value: 30, label: '30 phút' }
                  ]}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Question Content Form */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Nội dung câu hỏi
        </Typography>
        
        {/* Debug Panel - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Debug Info (Dev Mode)
            </Typography>
            <Typography variant="caption" display="block">
              Question Type: {selectedQuestionType?.code}
            </Typography>
            <Typography variant="caption" display="block">
              Content Length: {questionContent?.length || 0}
            </Typography>
            <Typography variant="caption" display="block" color={isValidQuestionContent ? 'success.main' : 'error.main'}>
              Content Validation: {isValidQuestionContent ? 'PASSED' : 'FAILED'}
            </Typography>
            <Typography variant="caption" display="block" color={Object.keys(formik.errors).length === 0 ? 'success.main' : 'error.main'}>
              Form Validation: {Object.keys(formik.errors).length === 0 ? 'PASSED' : 'FAILED'}
            </Typography>
            {Object.keys(formik.errors).length > 0 && (
              <Typography variant="caption" display="block" color="error">
                Formik Errors: {JSON.stringify(formik.errors)}
              </Typography>
            )}
            {validationResult.error && (
              <Typography variant="caption" display="block" color="error">
                Content Error: {validationResult.error}
              </Typography>
            )}
            <Typography variant="caption" display="block">
              Submit Disabled: {formik.isSubmitting || !isValidQuestionContent || Object.keys(formik.errors).length > 0}
            </Typography>
          </Box>
        )}
        
        {/* Hiển thị hướng dẫn cấu trúc câu hỏi */}
        <QuestionStructureGuide questionType={selectedQuestionType} />
        
        {renderSpecificForm()}
      </Paper>

      {/* Actions */}
      <Box display="flex" gap={2} justifyContent="space-between">
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={onBack}
          disabled={formik.isSubmitting}
        >
          Quay lại
        </Button>
        
        <Box display="flex" flexDirection="column" alignItems="flex-end">
          {!isValidQuestionContent && validationResult.error && (
            <Typography 
              variant="caption" 
              color="error" 
              sx={{ mb: 1 }}
            >
              {validationResult.error}
            </Typography>
          )}
          
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={
              formik.isSubmitting || 
              !isValidQuestionContent || 
              Object.keys(formik.errors).length > 0
            }
            size="large"
          >
            {isEditing ? 'Cập nhật câu hỏi' : 'Tiếp tục'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}