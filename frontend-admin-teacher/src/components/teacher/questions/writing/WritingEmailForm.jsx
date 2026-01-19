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
 * Writing Email Form - Task 4 của Writing skill
 * Dựa trên seed data: B2 level, 0-6 scale with C1/C2 extension
 * Two emails: friend + authority
 */
export default function WritingEmailForm({ content, onChange }) {
  const [scenario, setScenario] = useState('');
  const [friendEmailPrompt, setFriendEmailPrompt] = useState('');
  const [authorityEmailPrompt, setAuthorityEmailPrompt] = useState('');
  const [instructions, setInstructions] = useState('');
  const [minWords, setMinWords] = useState(100);
  const [maxWords, setMaxWords] = useState(150);
  const [timeLimit, setTimeLimit] = useState(30);
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [isValidated, setIsValidated] = useState(false);

  // Parse existing content if available
  useEffect(() => {
    if (content) {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        setScenario(parsed.scenario || '');
        setFriendEmailPrompt(parsed.friend_email_prompt || '');
        setAuthorityEmailPrompt(parsed.authority_email_prompt || '');
        setInstructions(parsed.instructions || '');
        setMinWords(parsed.min_words || 100);
        setMaxWords(parsed.max_words || 150);
        setTimeLimit(parsed.time_limit || 30);
      } catch (error) {
        // If content is not JSON, treat as scenario
        setScenario(content || '');
      }
    }
  }, [content]);

  // Validation function
  const validateData = useCallback(() => {
    const newErrors = {};
    
    // Check scenario
    if (!scenario.trim()) {
      newErrors.scenario = 'Tình huống không được để trống';
    }
    
    // Check friend email prompt
    if (!friendEmailPrompt.trim()) {
      newErrors.friendEmailPrompt = 'Yêu cầu email bạn bè không được để trống';
    }
    
    // Check authority email prompt
    if (!authorityEmailPrompt.trim()) {
      newErrors.authorityEmailPrompt = 'Yêu cầu email chính thức không được để trống';
    }
    
    // Check instructions
    if (!instructions.trim()) {
      newErrors.instructions = 'Hướng dẫn không được để trống';
    }
    
    // Check word limits
    if (minWords < 50 || minWords > 200) {
      newErrors.minWords = 'Số từ tối thiểu nên từ 50-200';
    }
    
    if (maxWords < minWords || maxWords > 300) {
      newErrors.maxWords = `Số từ tối đa phải >= ${minWords} và <= 300`;
    }
    
    // Check time limit
    if (timeLimit < 20 || timeLimit > 60) {
      newErrors.timeLimit = 'Thời gian nên từ 20-60 phút';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    return isValid;
  }, [scenario, friendEmailPrompt, authorityEmailPrompt, instructions, minWords, maxWords, timeLimit]);

  // Remove auto-validation useEffect - causes infinite loops
  // Data is sent to parent on every change (via onChange)
  // Validation is only called on demand via button click

  // Update parent component
  useEffect(() => {
    const questionData = {
      scenario: scenario.trim(),
      friend_email_prompt: friendEmailPrompt.trim(),
      authority_email_prompt: authorityEmailPrompt.trim(),
      instructions: instructions.trim(),
      min_words: parseInt(minWords) || 100,
      max_words: parseInt(maxWords) || 150,
      time_limit: parseInt(timeLimit) || 30,
      level: 'B2',
      scale: '0-6'
    };
    
    if (onChange) {
      onChange(JSON.stringify(questionData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, friendEmailPrompt, authorityEmailPrompt, instructions, minWords, maxWords, timeLimit]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Writing - Email Writing (Task 4)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Hướng dẫn:</Typography>
        <Typography variant="body2">
          • Task 4: Two emails (friend + authority), B2 level<br/>
          • Chấm điểm: 0-6 scale bởi AI với khả năng mở rộng C1/C2<br/>
          • Tập trung: Formal vs informal register, appropriate tone
        </Typography>
      </Alert>

      {/* Level and Scale Info */}
      <Box sx={{ mb: 3 }}>
        <Chip label="Level: B2" color="primary" variant="outlined" sx={{ mr: 1 }} />
        <Chip label="Scale: 0-6" color="secondary" variant="outlined" sx={{ mr: 1 }} />
        <Chip label="C1/C2 Extension" color="info" variant="outlined" />
      </Box>

      {/* Scenario */}
      <TextField
        fullWidth
        label="Tình huống chung"
        value={scenario}
        onChange={(e) => setScenario(e.target.value)}
        multiline
        rows={3}
        error={!!errors.scenario}
        helperText={errors.scenario}
        sx={{ mb: 3 }}
        placeholder="You are planning to attend a university abroad. You need to gather information and make arrangements."
      />

      {/* Instructions */}
      <TextField
        fullWidth
        label="Hướng dẫn tổng quát"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        multiline
        rows={2}
        error={!!errors.instructions}
        helperText={errors.instructions}
        sx={{ mb: 3 }}
        placeholder="Write two emails about the same topic. Pay attention to the different writing styles required."
      />

      {/* Friend Email */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
        Email cho bạn bè (Informal):
      </Typography>
      <TextField
        fullWidth
        label="Yêu cầu email bạn bè"
        value={friendEmailPrompt}
        onChange={(e) => setFriendEmailPrompt(e.target.value)}
        multiline
        rows={4}
        error={!!errors.friendEmailPrompt}
        helperText={errors.friendEmailPrompt || 'Sử dụng giọng điệu thân thiện, thoải mái'}
        sx={{ mb: 3 }}
        placeholder="Write an email to your friend telling them about your plans to study abroad. Ask for their advice and share your feelings about this decision."
      />

      {/* Authority Email */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
        Email chính thức (Formal):
      </Typography>
      <TextField
        fullWidth
        label="Yêu cầu email chính thức"
        value={authorityEmailPrompt}
        onChange={(e) => setAuthorityEmailPrompt(e.target.value)}
        multiline
        rows={4}
        error={!!errors.authorityEmailPrompt}
        helperText={errors.authorityEmailPrompt || 'Sử dụng giọng điệu trang trọng, lịch sự'}
        sx={{ mb: 3 }}
        placeholder="Write an email to the university admissions office requesting information about the application process, accommodation, and scholarship opportunities."
      />

      {/* Settings */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Số từ tối thiểu (mỗi email)"
            type="number"
            value={minWords}
            onChange={(e) => setMinWords(e.target.value)}
            error={!!errors.minWords}
            helperText={errors.minWords}
            inputProps={{ min: 50, max: 200 }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Số từ tối đa (mỗi email)"
            type="number"
            value={maxWords}
            onChange={(e) => setMaxWords(e.target.value)}
            error={!!errors.maxWords}
            helperText={errors.maxWords}
            inputProps={{ min: minWords, max: 300 }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Thời gian tổng (phút)"
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            error={!!errors.timeLimit}
            helperText={errors.timeLimit}
            inputProps={{ min: 20, max: 60 }}
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
          <strong>Time Limit:</strong> {timeLimit} minutes (for both emails)
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Word Count:</strong> {minWords}-{maxWords} words per email
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Scenario:</strong> {scenario || 'Chưa có nội dung'}
        </Typography>
        
        {friendEmailPrompt && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'blue.50', borderRadius: 1, border: '1px solid #e3f2fd' }}>
            <Typography variant="body2" fontWeight="bold" color="primary" gutterBottom>
              Email 1 - Friend (Informal):
            </Typography>
            <Typography variant="body2">{friendEmailPrompt}</Typography>
          </Box>
        )}
        
        {authorityEmailPrompt && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'orange.50', borderRadius: 1, border: '1px solid #fff3e0' }}>
            <Typography variant="body2" fontWeight="bold" color="warning.main" gutterBottom>
              Email 2 - Authority (Formal):
            </Typography>
            <Typography variant="body2">{authorityEmailPrompt}</Typography>
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