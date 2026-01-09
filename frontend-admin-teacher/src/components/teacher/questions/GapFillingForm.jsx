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
  Snackbar
} from '@mui/material';
import { Add, Delete, Info, Warning, CheckCircle } from '@mui/icons-material';

/**
 * GapFillingForm component for Reading and Listening Gap Filling questions
 * Based on seed data structure from 05-seed-questions.js
 */
export default function GapFillingForm({ content, onChange }) {
  const [passage, setPassage] = useState('');
  const [options, setOptions] = useState(['well', 'only', 'really', 'under', 'much', 'food']);
  const [correctAnswers, setCorrectAnswers] = useState(['well', 'only', 'really', 'under', 'much', 'food']);
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
        setOptions(parsed.options || ['well', 'only', 'really', 'under', 'much', 'food']);
        setCorrectAnswers(parsed.correctAnswers || ['well', 'only', 'really', 'under', 'much', 'food']);
        setPrompt(parsed.prompt || 'Choose one word from the list for each gap. The first one is done for you.');
      } catch (error) {
        // If content is not JSON, treat as passage
        setPassage(content);
      }
    }
  }, [content]);

  // Auto-validate when data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (passage.trim() || options.some(opt => opt.trim()) || prompt.trim()) {
        validateForm();
      }
    }, 500); // Debounce validation
    
    return () => clearTimeout(timeoutId);
  }, [passage, options, correctAnswers, prompt]);

  // Update parent component when data changes
  useEffect(() => {
    try {
      const questionData = {
        passage,
        options: options.filter(opt => opt.trim()),
        correctAnswers: correctAnswers.filter((ans, index) => ans && ans.trim()),
        prompt: prompt.trim()
      };
      
      // Only update if data is meaningful
      const hasContent = passage.trim() || options.some(opt => opt.trim()) || prompt.trim();
      
      if (hasContent) {
        const jsonString = JSON.stringify(questionData);
        onChange(jsonString);
      }
    } catch (error) {
      console.error('Error updating question data:', error);
      setErrors(prev => ({...prev, general: 'Lỗi cập nhật dữ liệu'}));
    }
  }, [passage, options, correctAnswers, prompt]); // Don't include onChange as dependency

  // Auto-detect gaps in passage
  const gapMatches = passage.match(/\[GAP\d+\]/g) || [];
  const gapCount = gapMatches.length;

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      
      // Update correct answers accordingly
      const newCorrectAnswers = correctAnswers.filter((_, i) => i !== index);
      setCorrectAnswers(newCorrectAnswers);
    }
  };

  const handleOptionChange = (index, value) => {
    try {
      const newOptions = [...options];
      newOptions[index] = value;
      setOptions(newOptions);
      
      // Clear related errors
      if (errors.options) {
        setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.options;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error updating option:', error);
      setErrors(prev => ({...prev, options: 'Lỗi cập nhật từ'}));
    }
  };

  const handleCorrectAnswerChange = (index, value) => {
    try {
      const newCorrectAnswers = [...correctAnswers];
      newCorrectAnswers[index] = value;
      setCorrectAnswers(newCorrectAnswers);
      
      // Clear related errors
      if (errors.correctAnswers) {
        setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.correctAnswers;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error updating correct answer:', error);
      setErrors(prev => ({...prev, correctAnswers: 'Lỗi cập nhật đáp án'}));
    }
  };

  // Validate gap count in passage
  const validateGaps = () => {
    const gapMatches = passage.match(/\[GAP\d+\]/g) || [];
    const gapCount = gapMatches.length;
    const expectedGaps = Math.min(options.length, correctAnswers.length);
    
    return {
      gapCount,
      expectedGaps,
      isValid: gapCount === expectedGaps && gapCount > 0
    };
  };

  // Comprehensive validation function
  const validateForm = () => {
    const newErrors = {};
    
    // Validate passage
    if (!passage.trim()) {
      newErrors.passage = 'Đoạn văn không được để trống';
    } else if (passage.length < 50) {
      newErrors.passage = 'Đoạn văn quá ngắn (tối thiểu 50 ký tự)';
    } else if (!passage.includes('[GAP')) {
      newErrors.passage = 'Đoạn văn phải có ít nhất một chỗ trống [GAP1]';
    }
    
    // Validate gaps
    const gapValidation = validateGaps();
    if (!gapValidation.isValid && passage.includes('[GAP')) {
      newErrors.gaps = `Số lượng chỗ trống (${gapValidation.gapCount}) không khớp với số từ (${gapValidation.expectedGaps})`;
    }
    
    // Validate prompt
    if (!prompt.trim()) {
      newErrors.prompt = 'Hướng dẫn không được để trống';
    } else if (prompt.length < 10) {
      newErrors.prompt = 'Hướng dẫn quá ngắn (tối thiểu 10 ký tự)';
    }
    
    // Validate options
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 3) {
      newErrors.options = 'Phải có ít nhất 3 từ trong danh sách';
    }
    
    const duplicateOptions = validOptions.filter((opt, index) => 
      validOptions.indexOf(opt) !== index
    );
    if (duplicateOptions.length > 0) {
      newErrors.options = `Có từ trùng lặp: ${duplicateOptions.join(', ')}`;
    }
    
    // Validate correct answers
    const gapCount = (passage.match(/\[GAP\d+\]/g) || []).length;
    for (let i = 0; i < gapCount; i++) {
      if (!correctAnswers[i] || !correctAnswers[i].trim()) {
        newErrors.correctAnswers = `Chưa chọn đáp án cho GAP${i + 1}`;
        break;
      }
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    
    if (isValid) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
    
    return isValid;
  };

  const gapValidation = validateGaps();

  const loadSampleTemplate = () => {
    setPassage('Dear Sam,\n\nI hope you\'re doing [GAP1]! I wanted to tell you about my recent trip to the park. It was [GAP2] a lovely day to be outside. I thought it was [GAP3] hot to walk around for long. I met friends [GAP4] my birthday party, and we had a great time. We decided to grab [GAP5] snacks for our picnic.');
    setOptions(['well', 'only', 'really', 'under', 'much', 'food']);
    setCorrectAnswers(['well', 'only', 'really', 'under', 'much']);
    setPrompt('Choose one word from the list for each gap. The first one is done for you.');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Gap Filling Question
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={loadSampleTemplate}
        >
          Load Template Mẫu
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" mb={3}>
        Tạo câu hỏi điền từ vào chỗ trống. Sử dụng [GAP1], [GAP2], [GAP3]... để đánh dấu chỗ trống.
      </Typography>

      {/* Prompt */}
      <TextField
        fullWidth
        label="Hướng dẫn"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Choose one word from the list for each gap. The first one is done for you."
        sx={{ mb: 3 }}
        helperText={errors.prompt || "Hướng dẫn cho học sinh về cách làm bài"}
        error={!!errors.prompt}
      />

      {/* Passage with gaps */}
      <TextField
        fullWidth
        label="Đoạn văn có chỗ trống"
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        multiline
        rows={6}
        sx={{ mb: 2 }}
        placeholder="Dear Sam,\n\nI hope you're doing [GAP1]! I wanted to tell you about my recent trip to the park. It was [GAP2] a lovely day to be outside..."
        helperText={`Phát hiện ${gapValidation.gapCount} chỗ trống. Cần khớp với ${gapValidation.expectedGaps} từ/đáp án.`}
        error={!gapValidation.isValid && passage.trim()}
      />
      
      {/* Error alerts */}
      {errors.general && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      )}
      
      {errors.gaps && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<Warning />}>
          {errors.gaps}
        </Alert>
      )}
      
      {!gapValidation.isValid && passage.trim() && !errors.gaps && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Số lượng chỗ trống [{gapValidation.gapCount}] không khớp với số từ [{gapValidation.expectedGaps}]. 
          Hãy kiểm tra lại đoạn văn và danh sách từ.
        </Alert>
      )}
      
      {/* Success notification */}
      {isValidated && Object.keys(errors).length === 0 && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
          ✅ Câu hỏi hợp lệ và sẵn sàng sử dụng!
        </Alert>
      )}

      {/* Options list */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Danh sách từ để chọn ({options.length} từ)
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Danh sách các từ mà học sinh sẽ chọn để điền vào chỗ trống
        </Typography>
        
        {errors.options && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.options}
          </Alert>
        )}
        
        {options.map((option, index) => (
          <Box key={index} display="flex" alignItems="center" gap={2} mb={1}>
            <Typography sx={{ minWidth: 30 }}>
              {index + 1}.
            </Typography>
            <TextField
              fullWidth
              placeholder={`Từ ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              size="small"
            />
            <IconButton
              color="error"
              onClick={() => removeOption(index)}
              size="small"
              disabled={options.length <= 2}
            >
              <Delete />
            </IconButton>
          </Box>
        ))}

        <Button
          startIcon={<Add />}
          onClick={addOption}
          variant="outlined"
          size="small"
        >
          Thêm từ
        </Button>
      </Box>

      {/* Correct answers */}
      {gapCount > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Đáp án đúng cho từng chỗ trống
          </Typography>
          
          {errors.correctAnswers && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.correctAnswers}
            </Alert>
          )}
          
          {Array.from({ length: gapCount }, (_, index) => (
            <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
              <Typography sx={{ minWidth: 80 }}>
                [GAP{index + 1}]:
              </Typography>
              <TextField
                select
                value={correctAnswers[index] || ''}
                onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
                SelectProps={{
                  native: true
                }}
              >
                <option value="">-- Chọn đáp án --</option>
                {options.map((option, optIndex) => (
                  <option key={optIndex} value={option}>
                    {option}
                  </option>
                ))}
              </TextField>
            </Box>
          ))}
        </Box>
      )}

      {/* Preview */}
      {passage && gapCount > 0 && (
        <Box sx={{ p: 3, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Xem trước
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Hướng dẫn:</strong> {prompt}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Danh sách từ:</strong> {options.filter(o => o.trim()).join(', ')}
          </Typography>
          
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {passage}
          </Typography>
        </Box>
      )}
      
      {/* Success snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Form đã được validate thành công!
        </Alert>
      </Snackbar>
    </Box>
  );
}