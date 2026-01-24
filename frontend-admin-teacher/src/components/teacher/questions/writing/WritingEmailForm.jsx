'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Typography,
  Alert,
  Chip,
  Button,
  Paper
} from '@mui/material';
import { CheckCircle, Warning, Edit } from '@mui/icons-material';

/**
 * APTIS Writing Task 4: Email Writing (B2 Level)
 * Seed structure: Single content string with scenario and email tasks
 * Example: "Email discussion about a class trip\n\nRead email...\n\n1. Email to friend...\n2. Email to school manager..."
 */
export default function WritingEmailForm({ content, onChange }) {
  const defaultEmailContent = `Email discussion about a class trip

Read the email from your teacher:

From: Teacher <teacher@school.com>
Subject: School trip to the museum

Dear student,

We are planning a class trip to the museum. Do you want to go? What do you want to see there?

Please write back with your answer.

Teacher

---

1. Email to a friend (50 words)

2. Email to school manager (80-100 words)`;

  const [emailContent, setEmailContent] = useState(content || defaultEmailContent);
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [isValidated, setIsValidated] = useState(false);

  // Parse existing content if available
  useEffect(() => {
    if (content) {
      try {
        // Try to parse if it's JSON (from form submission)
        const parsed = JSON.parse(content);
        setEmailContent(parsed.content || content);
      } catch (e) {
        // If it's not JSON, use it as is (from seed)
        setEmailContent(content);
      }
    }
  }, [content]);

  // Validation function
  const validateData = useCallback(() => {
    const newErrors = {};
    
    // Check email content
    if (!emailContent.trim()) {
      newErrors.emailContent = 'Nội dung email task không được để trống';
    } else {
      // Check if contains required components
      const content = emailContent.toLowerCase();
      if (!content.includes('email') || !content.includes('friend')) {
        newErrors.emailContent = 'Nên có yêu cầu viết email cho bạn bè và người có thẩm quyền';
      }
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    
    // Send data to parent when valid
    if (isValid && onChange) {
      const formData = {
        content: emailContent.trim(),
        type: 'writing_email'
      };
      onChange(JSON.stringify(formData));
    }
    
    return isValid;
  }, [emailContent, onChange]);

  // Remove auto-validation useEffect - causes infinite loops
  // Data is sent to parent on every change (via onChange)
  // Validation is only called on demand via button click

  // Remove auto-validation useEffect - causes infinite loops
  // Data will be sent via manual save button only

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Writing Task 4 - Email Writing (B2)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Hướng dẫn:</Typography>
        <Typography variant="body2">
          • Tạo kịch bản và yêu cầu viết 2 emails (bạn bè + chính thức)<br/>
          • Nội dung bao gồm: tình huống, email mẫu, và các yêu cầu cụ thể<br/>
          • Cấp độ: B2, Scale: 0-6 (có thể mở rộng C1/C2)
        </Typography>
      </Alert>

      {/* Email Content */}
      <TextField
        fullWidth
        multiline
        rows={15}
        label="Nội dung email task (đầy đủ scenario + yêu cầu)"
        value={emailContent}
        onChange={(e) => setEmailContent(e.target.value)}
        error={!!errors.emailContent}
        helperText={errors.emailContent || 'Nhập đầy đủ: scenario, email mẫu, và yêu cầu viết 2 emails'}
        sx={{ mb: 2 }}
      />

      {/* Preview */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Edit color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle2">Xem trước (Format như seed):</Typography>
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
          {emailContent || 'Chưa có nội dung...'}
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
          Câu hỏi Writing Email hợp lệ!
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