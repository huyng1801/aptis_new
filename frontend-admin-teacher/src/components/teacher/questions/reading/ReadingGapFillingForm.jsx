'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';
import { Add, Delete, Info, Warning, CheckCircle } from '@mui/icons-material';
import { Select, MenuItem } from '@mui/material';

/**
 * Reading Gap Filling Form - Part 1 của Reading skill
 * Dựa trên seed data: 5 câu, 10 điểm (2 điểm/câu)
 * Chọn từ từ danh sách để điền vào chỗ trống
 */
export default function ReadingGapFillingForm({ content, onChange }) {
  const [passage, setPassage] = useState('');
  const [options, setOptions] = useState(['']);
  const [correctAnswers, setCorrectAnswers] = useState(['']);
  const [prompt, setPrompt] = useState('Choose one word from the list for each gap. The first one is done for you.');
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  // Parse existing content if available
  useEffect(() => {
    if (content) {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        setPassage(parsed.passage || '');
        setOptions(parsed.options || ['']);
        setCorrectAnswers(parsed.correctAnswers || ['']);
        setPrompt(parsed.prompt || 'Choose one word from the list for each gap. The first one is done for you.');
      } catch (error) {
        // If content is not JSON, treat as passage
        setPassage(content || '');
      }
    }
  }, [content]);

  // Validation function - chỉ validate khi cần
  const validateData = useCallback(() => {
    const newErrors = {};
    
    // Check if passage has content
    if (!passage || !passage.trim()) {
      newErrors.passage = 'Đoạn văn không được để trống';
    } else {
      // Check if passage contains [GAP] placeholders
      const gapCount = (passage.match(/\[GAP\d+\]/g) || []).length;
      if (gapCount === 0) {
        newErrors.passage = 'Đoạn văn phải chứa ít nhất một [GAP1], [GAP2], v.v.';
      } else if (gapCount !== correctAnswers.filter(ans => ans.trim()).length) {
        newErrors.passage = `Số lượng GAP (${gapCount}) không khớp với số đáp án (${correctAnswers.filter(ans => ans.trim()).length})`;
      }
    }
    
    // Check options
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      newErrors.options = 'Phải có ít nhất 2 từ trong danh sách';
    }
    
    // Check correct answers
    const validAnswers = correctAnswers.filter(ans => ans.trim());
    if (validAnswers.length === 0) {
      newErrors.correctAnswers = 'Phải có ít nhất một đáp án đúng';
    }
    
    // Check if all answers are in options list
    for (const answer of validAnswers) {
      if (!validOptions.includes(answer)) {
        newErrors.correctAnswers = 'Tất cả đáp án đúng phải có trong danh sách từ';
        break;
      }
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    return isValid;
  }, [passage, options, correctAnswers]);

  // Update parent component với debounce  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const questionData = {
        passage: passage,
        options: options.filter(opt => opt.trim()),
        correctAnswers: correctAnswers.filter(ans => ans.trim()),
        prompt: prompt.trim()
      };
      
      if (onChange) {
        onChange(JSON.stringify(questionData));
      }
    }, 300); // Debounce 300ms
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage, options, correctAnswers, prompt]);

  // Handle adding new option
  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  // Handle removing option
  const handleRemoveOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    
    // Remove from correct answers if exists
    const removedOption = options[index];
    if (removedOption && correctAnswers.includes(removedOption)) {
      setCorrectAnswers(correctAnswers.filter(ans => ans !== removedOption));
    }
  };

  // Handle option change
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    const oldValue = newOptions[index];
    newOptions[index] = value;
    setOptions(newOptions);
    
    // Update correct answers if old value was in there
    if (oldValue && correctAnswers.includes(oldValue)) {
      const newCorrectAnswers = correctAnswers.map(ans => ans === oldValue ? value : ans);
      setCorrectAnswers(newCorrectAnswers);
    }
  };

  // Handle adding new correct answer
  const handleAddCorrectAnswer = () => {
    setCorrectAnswers([...correctAnswers, '']);
  };

  // Handle removing correct answer
  const handleRemoveCorrectAnswer = (index) => {
    const newCorrectAnswers = correctAnswers.filter((_, i) => i !== index);
    setCorrectAnswers(newCorrectAnswers);
  };

  // Handle correct answer change
  const handleCorrectAnswerChange = (index, value) => {
    const newCorrectAnswers = [...correctAnswers];
    newCorrectAnswers[index] = value;
    setCorrectAnswers(newCorrectAnswers);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Reading - Gap Filling (Part 1)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Hướng dẫn:</Typography>
        <Typography variant="body2">
          • Tạo đoạn văn với các chỗ trống dạng [GAP1], [GAP2], v.v.<br/>
          • Cung cấp danh sách từ để học viên chọn<br/>
          • Điểm: 2 điểm/câu đúng, tối đa 5 câu (10 điểm)
        </Typography>
      </Alert>

      {/* Prompt */}
      <TextField
        fullWidth
        label="Hướng dẫn làm bài"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        sx={{ mb: 3 }}
        placeholder="Choose one word from the list for each gap..."
      />

      {/* Passage */}
      <TextField
        fullWidth
        label="Đoạn văn (sử dụng [GAP1], [GAP2], ...)"
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        multiline
        rows={6}
        error={!!errors.passage}
        helperText={errors.passage || 'Sử dụng [GAP1], [GAP2], [GAP3]... để đánh dấu chỗ trống'}
        sx={{ mb: 3 }}
        placeholder="Dear Sam,&#10;&#10;I hope you're doing [GAP1]! I wanted to tell you about my recent trip to the park..."
      />

      {/* Options List */}
      <Typography variant="subtitle1" gutterBottom>
        Danh sách từ để chọn:
      </Typography>
      {options.map((option, index) => (
        <Box key={index} display="flex" alignItems="center" mb={2}>
          <TextField
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            label={`Từ ${index + 1}`}
            sx={{ flexGrow: 1, mr: 1 }}
            size="small"
          />
          <IconButton
            onClick={() => handleRemoveOption(index)}
            disabled={options.length <= 1}
            color="error"
          >
            <Delete />
          </IconButton>
        </Box>
      ))}
      
      <Button
        onClick={handleAddOption}
        startIcon={<Add />}
        variant="outlined"
        size="small"
        sx={{ mb: 3 }}
      >
        Thêm từ
      </Button>

      {/* Manual Validation Button */}
      <Button
        onClick={validateData}
        variant="contained"
        color="info"
        size="small"
        sx={{ mb: 3, ml: 1 }}
      >
        Kiểm tra câu hỏi
      </Button>

      {/* Correct Answers */}
      <Typography variant="subtitle1" gutterBottom>
        Đáp án đúng theo thứ tự:
      </Typography>
      {correctAnswers.map((answer, index) => (
        <Box key={index} display="flex" alignItems="center" mb={2} gap={1}>
          <FormControl sx={{ flexGrow: 1, minWidth: 200 }} size="small">
            <InputLabel>GAP{index + 1}</InputLabel>
            <Select
              value={answer}
              onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
              label={`GAP${index + 1}`}
            >
              <MenuItem value="">Chọn từ...</MenuItem>
              {options.filter(opt => opt.trim()).map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton
            onClick={() => handleRemoveCorrectAnswer(index)}
            disabled={correctAnswers.length <= 1}
            color="error"
            size="small"
          >
            <Delete />
          </IconButton>
        </Box>
      ))}
      
      <Button
        onClick={handleAddCorrectAnswer}
        startIcon={<Add />}
        variant="outlined"
        size="small"
        sx={{ mb: 3 }}
      >
        Thêm đáp án
      </Button>

      {/* Validate Button */}
      <Box mb={3}>
        <Button
          onClick={validateData}
          variant="contained"
          color="info"
        >
          Kiểm tra câu hỏi
        </Button>
      </Box>

      {/* Validation Status */}
      {isValidated && (
        <Alert severity="success" icon={<CheckCircle />}>
          Câu hỏi Gap Filling hợp lệ!
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

      {/* Success notification */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        message="Đã lưu thay đổi"
      />
    </Box>
  );
}