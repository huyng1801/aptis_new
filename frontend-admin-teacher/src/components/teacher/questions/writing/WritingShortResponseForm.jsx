'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Typography,
  Alert,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import { CheckCircle, Warning, Edit } from '@mui/icons-material';

/**
 * Writing Short Response Form - Task 1 của Writing skill
 * Dựa trên seed data: A1 level, 0-4 scale
 * Basic information/form filling
 */
export default function WritingShortResponseForm({ content, onChange }) {
  const [prompt, setPrompt] = useState('');
  const [instructions, setInstructions] = useState('');
  const [formFields, setFormFields] = useState('');
  const [minWords, setMinWords] = useState(5);
  const [maxWords, setMaxWords] = useState(15);
  const [timeLimit, setTimeLimit] = useState(10);
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [isValidated, setIsValidated] = useState(false);

  // Parse existing content if available
  useEffect(() => {
    if (content) {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        setPrompt(parsed.prompt || '');
        setInstructions(parsed.instructions || '');
        setFormFields(parsed.form_fields || '');
        setMinWords(parsed.min_words || 5);
        setMaxWords(parsed.max_words || 15);
        setTimeLimit(parsed.time_limit || 10);
      } catch (error) {
        // If content is not JSON, treat as prompt
        setPrompt(content || '');
      }
    }
  }, [content]);

  // Validation function
  const validateData = useCallback(() => {
    const newErrors = {};
    
    // Check prompt
    if (!prompt.trim()) {
      newErrors.prompt = 'Yêu cầu viết không được để trống';
    }
    
    // Check instructions
    if (!instructions.trim()) {
      newErrors.instructions = 'Hướng dẫn không được để trống';
    }
    
    // Check word limits
    if (minWords < 1 || minWords > 50) {
      newErrors.minWords = 'Số từ tối thiểu nên từ 1-50';
    }
    
    if (maxWords < minWords || maxWords > 100) {
      newErrors.maxWords = `Số từ tối đa phải >= ${minWords} và <= 100`;
    }
    
    // Check time limit
    if (timeLimit < 5 || timeLimit > 60) {
      newErrors.timeLimit = 'Thời gian nên từ 5-60 phút';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    return isValid;
  }, [prompt, instructions, minWords, maxWords, timeLimit]);

  // Remove auto-validation useEffect - causes infinite loops
  // Data is sent to parent on every change (via onChange)
  // Validation is only called on demand via button click

  // Update parent component
  useEffect(() => {
    const questionData = {
      prompt: prompt.trim(),
      instructions: instructions.trim(),
      form_fields: formFields.trim(),
      min_words: parseInt(minWords) || 5,
      max_words: parseInt(maxWords) || 15,
      time_limit: parseInt(timeLimit) || 10,
      level: 'A1',
      scale: '0-4'
    };
    
    if (onChange) {
      onChange(JSON.stringify(questionData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, instructions, formFields, minWords, maxWords, timeLimit]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Writing - Short Response (Task 1)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Hướng dẫn:</Typography>
        <Typography variant="body2">
          • Task 1: Basic information/form filling, A1 level<br/>
          • Chấm điểm: 0-4 scale bởi AI<br/>
          • Tập trung: Basic personal information, simple responses
        </Typography>
      </Alert>

      {/* Level and Scale Info */}
      <Box sx={{ mb: 3 }}>
        <Chip label="Level: A1" color="primary" variant="outlined" sx={{ mr: 1 }} />
        <Chip label="Scale: 0-4" color="secondary" variant="outlined" />
      </Box>

      {/* Prompt */}
      <TextField
        fullWidth
        label="Yêu cầu viết"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        multiline
        rows={3}
        error={!!errors.prompt}
        helperText={errors.prompt}
        sx={{ mb: 3 }}
        placeholder="Complete the form with your personal information. Write 5-15 words for each field."
      />

      {/* Instructions */}
      <TextField
        fullWidth
        label="Hướng dẫn chi tiết"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        multiline
        rows={2}
        error={!!errors.instructions}
        helperText={errors.instructions}
        sx={{ mb: 3 }}
        placeholder="Fill in the form with basic information about yourself. Use simple sentences."
      />

      {/* Form Fields */}
      <TextField
        fullWidth
        label="Các trường thông tin cần điền"
        value={formFields}
        onChange={(e) => setFormFields(e.target.value)}
        multiline
        rows={4}
        sx={{ mb: 3 }}
        placeholder="• Name: ___________&#10;• Age: ___________&#10;• Hometown: ___________&#10;• Hobby: ___________&#10;• Favorite food: ___________"
      />

      {/* Settings */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Số từ tối thiểu"
            type="number"
            value={minWords}
            onChange={(e) => setMinWords(e.target.value)}
            error={!!errors.minWords}
            helperText={errors.minWords}
            inputProps={{ min: 1, max: 50 }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Số từ tối đa"
            type="number"
            value={maxWords}
            onChange={(e) => setMaxWords(e.target.value)}
            error={!!errors.maxWords}
            helperText={errors.maxWords}
            inputProps={{ min: minWords, max: 100 }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Thời gian (phút)"
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            error={!!errors.timeLimit}
            helperText={errors.timeLimit}
            inputProps={{ min: 5, max: 60 }}
          />
        </Grid>
      </Grid>

      {/* Preview */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Edit color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle2">Xem trước bài thi:</Typography>
        </Box>
        <Typography variant="body2" gutterBottom>
          <strong>Time Limit:</strong> {timeLimit} minutes
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Word Count:</strong> {minWords}-{maxWords} words per field
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Task:</strong> {prompt || 'Chưa có nội dung'}
        </Typography>
        {formFields && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>Form to complete:</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {formFields}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Manual Validation Button */}
      <Button
        onClick={validateData}
        variant="contained"
        color="info"
        size="small"
        sx={{ mb: 3 }}
      >
        Kiểm tra câu hỏi
      </Button>

      {/* Validation Status */}
      {isValidated && (
        <Alert severity="success" icon={<CheckCircle />}>
          Câu hỏi Writing Short Response hợp lệ!
        </Alert>
      )}

      {/* Show validation errors */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Cần hoàn thiện:</Typography>
          {Object.entries(errors).map(([field, message]) => (
            <Typography key={field} variant="body2">• {message}</Typography>
          ))}
        </Alert>
      )}
    </Box>
  );
}