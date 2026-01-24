'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import { CheckCircle, Warning, Edit } from '@mui/icons-material';

/**
 * APTIS Writing Task 1: Form Filling (A1 Level)
 * Seed structure: Simple content string with multiple questions
 * Example: "What is your name?\nHow old are you?\nWhat city do you live in?"
 */
export default function WritingShortResponseForm({ content, onChange }) {
  const [questionContent, setQuestionContent] = useState('');
  const [instructions, setInstructions] = useState('Fill in the form with basic information. Answer each question with a few words.');
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [isValidated, setIsValidated] = useState(false);

  // Parse existing content if available
  useEffect(() => {
    if (content) {
      try {
        // Try to parse if it's JSON (from form submission)
        const parsed = JSON.parse(content);
        setQuestionContent(parsed.content || content);
      } catch (e) {
        // If it's not JSON, use it as is (from seed)
        setQuestionContent(content || '');
      }
    }
  }, [content]);

  // Validation function
  const validateData = useCallback(() => {
    const newErrors = {};
    
    // Check question content
    if (!questionContent.trim()) {
      newErrors.questionContent = 'Nội dung câu hỏi không được để trống';
    } else {
      // Check if contains at least one question
      const lines = questionContent.trim().split('\n').filter(line => line.trim());
      if (lines.length < 3) {
        newErrors.questionContent = 'Nên có ít nhất 3 câu hỏi cơ bản (tên, tuổi, địa chỉ, nghề nghiệp, email...)';
      }
    }
    
    // Check instructions
    if (!instructions.trim()) {
      newErrors.instructions = 'Hướng dẫn không được để trống';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    
    // Send data to parent when valid
    if (isValid && onChange) {
      const formData = {
        content: questionContent.trim(),
        instructions: instructions.trim(),
        type: 'writing_form_filling'
      };
      onChange(JSON.stringify(formData));
    }
    
    return isValid;
  }, [questionContent, instructions, onChange]);

  // Remove auto-validation useEffect - causes infinite loops
  // Data is sent to parent on every change (via onChange)
  // Validation is only called on demand via button click

  // Remove auto-validation useEffect - causes infinite loops
  // Data will be sent via manual save button only

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Writing Task 1 - Form Filling (A1)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Hướng dẫn:</Typography>
        <Typography variant="body2">
          • Tạo các câu hỏi thông tin cơ bản (tên, tuổi, địa chỉ, nghề nghiệp...)<br/>
          • Mỗi câu hỏi trên 1 dòng riêng biệt<br/>
          • Cấp độ: A1, Scale: 0-4 (AI chấm)
        </Typography>
      </Alert>

      {/* Question Content */}
      <TextField
        fullWidth
        multiline
        rows={8}
        label="Nội dung câu hỏi (mỗi câu 1 dòng)"
        value={questionContent}
        onChange={(e) => setQuestionContent(e.target.value)}
        error={!!errors.questionContent}
        helperText={errors.questionContent || 'Ví dụ: What is your name?\\nHow old are you?\\nWhat city do you live in?'}
        sx={{ mb: 2 }}
        placeholder="What is your name?&#10;How old are you?&#10;What city do you live in?&#10;What is your job?&#10;What is your email address?"
      />

      {/* Instructions */}
      <TextField
        fullWidth
        multiline
        rows={2}
        label="Hướng dẫn"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        error={!!errors.instructions}
        helperText={errors.instructions}
        sx={{ mb: 2 }}
      />

      {/* Preview */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Edit color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle2">Xem trước (Format như seed):</Typography>
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
          {questionContent || 'Chưa có nội dung...'}
        </Typography>
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
          Câu hỏi Writing Form Filling hợp lệ!
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