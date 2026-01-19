import React from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

/**
 * APTIS Writing Task 2: Short Response (A2 Level)
 * Seed structure: Simple content string with question and instructions
 * Example: "What is your hobby?\n\nWrite about your hobby (20-30 words):\nWhat do you like to do in your free time?"
 */
const WritingFormFillingForm = ({ questionData, onChange, onValidate }) => {
  const [formContent, setFormContent] = React.useState(questionData?.content || questionData?.formContent || '');
  const [timeLimit, setTimeLimit] = React.useState(questionData?.time_limit || 10);
  const [errors, setErrors] = React.useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Validate form content
    if (!formContent.trim()) {
      newErrors.formContent = 'Form content is required';
    } else {
      // Check if contains question structure
      const content = formContent.toLowerCase();
      if (!content.includes('?') && !content.includes('write')) {
        newErrors.formContent = 'Nên có câu hỏi hoặc yêu cầu viết';
      }
    }
    
    // Check time limit
    if (timeLimit < 5 || timeLimit > 15) {
      newErrors.timeLimit = 'Thời gian nên từ 5-15 phút';
    }
    
    setErrors(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    
    // Send data to parent when valid
    if (isValid && onChange) {
      const formData = {
        content: formContent.trim(),
        timeLimit: timeLimit,
        type: 'writing_form_filling'
      };
      onChange(JSON.stringify(formData));
    }
    
    if (onValidate) {
      onValidate(isValid, newErrors);
    }
    
    return isValid;
  };

  // Remove auto-validation useEffect - causes infinite loops
  // Data will be sent via manual save button only

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Writing Task 2 - Short Response (A2)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Hướng dẫn:</Typography>
        <Typography variant="body2">
          • Tạo câu hỏi yêu cầu trả lời ngắn 20-30 từ<br/>
          • Focus: Personal information, simple responses<br/>
          • Cấp độ: A2, Scale: 0-5 (AI chấm)
        </Typography>
      </Alert>

      {/* Level and Scale Info */}
      <Box sx={{ mb: 3 }}>
        <Chip label="Level: A2" color="primary" variant="outlined" sx={{ mr: 1 }} />
        <Chip label="Scale: 0-5" color="secondary" variant="outlined" />
      </Box>

      {/* Form Content */}
      <TextField
        fullWidth
        multiline
        rows={8}
        label="Nội dung câu hỏi (đầy đủ instructions + câu hỏi)"
        value={formContent}
        onChange={(e) => setFormContent(e.target.value)}
        error={!!errors.formContent}
        helperText={errors.formContent || 'Nhập câu hỏi và hướng dẫn cho học viên'}
        sx={{ mb: 2 }}
        placeholder={`What is your hobby?

Write about your hobby (20-30 words):
What do you like to do in your free time?

Write your answer here:`}
      />

      {/* Time Limit */}
      <TextField
        type="number"
        label="Thời gian (phút)"
        value={timeLimit}
        onChange={(e) => setTimeLimit(parseInt(e.target.value) || 10)}
        error={!!errors.timeLimit}
        helperText={errors.timeLimit}
        inputProps={{ min: 5, max: 15 }}
        sx={{ mb: 2, width: '200px' }}
      />

      {/* Preview */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <AssignmentIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle2">Xem trước (Format như seed):</Typography>
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
          {formContent || 'Chưa có nội dung...'}
        </Typography>
      </Paper>

      {/* Manual Validation Button */}
      <Button
        onClick={validateForm}
        variant="contained"
        color="info"
        size="small"
        sx={{ mb: 3 }}
      >
        Kiểm tra câu hỏi
      </Button>

      {/* Validation Status */}
      {Object.keys(errors).length === 0 && formContent && (
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
};

export default WritingFormFillingForm;