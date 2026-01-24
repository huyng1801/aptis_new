'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid
} from '@mui/material';
import { Add, Delete, CheckCircle, Warning, Upload, AudioFile } from '@mui/icons-material';
import { questionApi } from '../../../../services/questionService';

/**
 * Listening MCQ Single Question Form - Part 1 của Listening skill
 * Chỉ 1 câu hỏi với nhiều lựa chọn
 */
export default function ListeningMCQSingleForm({ content, onChange, isEdit = false }) {
  const [title, setTitle] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [instructions, setInstructions] = useState('Listen carefully and choose the correct answer.');
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [isValidated, setIsValidated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Audio file selection function
  const handleAudioFileSelect = (file) => {
    if (!file) return;
    
    setAudioFile(file);
    console.log('✅ Audio file selected:', file.name);
  };

  const validateData = useCallback(() => {
    const newErrors = {};
    
    // Check title
    if (!title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }
    
    // Check audio file - allow either audioUrl OR audioFile (File object or string)
    const hasAudioUrl = audioUrl && typeof audioUrl === 'string' && audioUrl.trim();
    const hasAudioFile = audioFile && (audioFile instanceof File || typeof audioFile === 'object');
    
    if (!hasAudioUrl && !hasAudioFile) {
      newErrors.audio = 'Vui lòng chọn file audio';
    }
    
    // Check question
    if (!question.trim()) {
      newErrors.question = 'Câu hỏi không được để trống';
    }
    
    // Check options
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      newErrors.options = 'Phải có ít nhất 2 lựa chọn';
    }
    
    // Check correct answer
    if (correctAnswer >= options.length || !options[correctAnswer].trim()) {
      newErrors.correctAnswer = 'Đáp án đúng không hợp lệ';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    
    // Send data to parent when valid
    if (isValid && onChange) {
      // Prepare data for backend helper function
      const structuredData = {
        questions: [{
          question: question.trim(),
          options: options.filter(opt => opt.trim()).map(opt => ({ text: opt })),
          correctAnswer: correctAnswer
        }],
        isMultiple: false, // Single choice MCQ
        audioUrl: audioUrl,
        audioFile: audioFile, // Include file object for upload
        instructions: instructions.trim(),
        title: title.trim()
      };
      
      // Send content as JSON string for backend auto-generation
      onChange(JSON.stringify(structuredData));
    }
    
    return isValid;
  }, [title, audioUrl, audioFile, question, options, correctAnswer, instructions, onChange]);

  // Handle option changes
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Handle adding new option
  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  // Handle removing option
  const handleRemoveOption = (index) => {
    if (options.length <= 2) return; // Minimum 2 options required
    
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    
    // Adjust correct answer if necessary
    if (correctAnswer === index) {
      setCorrectAnswer(0); // Reset to first option
    } else if (correctAnswer > index) {
      setCorrectAnswer(correctAnswer - 1); // Adjust index
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Listening MCQ - Single Question
      </Typography>
      
      <Typography variant="body2" color="text.secondary" mb={3}>
        Tạo câu hỏi Listening với 1 câu hỏi và nhiều lựa chọn
      </Typography>

      {/* Title */}
      <TextField
        label="Tiêu đề câu hỏi"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        margin="normal"
        error={!!errors.title}
        helperText={errors.title}
      />

      {/* Audio Upload */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          File Audio
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            component="label"
            startIcon={isUploading ? <Upload /> : <AudioFile />}
            disabled={isUploading}
          >
            {isUploading ? 'Đang tải lên...' : 'Chọn file audio'}
            <input
              type="file"
              hidden
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setAudioFile(file);
                  handleAudioFileSelect(file);
                }
              }}
            />
          </Button>
          
          {audioFile && (
            <Typography variant="body2" color="text.secondary">
              {audioFile.name}
            </Typography>
          )}
          
          {audioUrl && (
            <audio controls style={{ maxWidth: 300 }}>
              <source src={audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          )}
        </Box>
        
        {errors.audio && (
          <Typography variant="caption" color="error" display="block" mt={1}>
            {errors.audio}
          </Typography>
        )}
      </Paper>

      {/* Question */}
      <TextField
        label="Câu hỏi"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        fullWidth
        multiline
        rows={2}
        margin="normal"
        error={!!errors.question}
        helperText={errors.question}
      />

      {/* Options */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
        Lựa chọn:
      </Typography>

      {options.map((option, index) => (
        <Box key={index} display="flex" alignItems="center" mb={2}>
          <TextField
            label={`Lựa chọn ${String.fromCharCode(65 + index)}`}
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            sx={{ flexGrow: 1, mr: 1 }}
            size="small"
          />
          <IconButton
            onClick={() => handleRemoveOption(index)}
            disabled={options.length <= 2}
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
        Thêm lựa chọn
      </Button>

      {/* Correct Answer */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Đáp án đúng</InputLabel>
        <Select
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          label="Đáp án đúng"
          error={!!errors.correctAnswer}
        >
          {options.map((option, index) => (
            <MenuItem key={index} value={index} disabled={!option.trim()}>
              {String.fromCharCode(65 + index)}: {option.trim() || '(Trống)'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Instructions */}
      <TextField
        label="Hướng dẫn"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        fullWidth
        multiline
        rows={2}
        margin="normal"
      />

      {/* Manual Validation Button */}
      <Button
        onClick={validateData}
        variant="contained"
        color="info"
        size="small"
        sx={{ mb: 3 }}
        disabled={isUploading}
        startIcon={isUploading ? <Upload /> : <CheckCircle />}
      >
        {isUploading ? 'Đang tải audio...' : 'Kiểm tra câu hỏi'}
      </Button>

      {/* Validation Status */}
      {isValidated && (
        <Alert severity="success" icon={<CheckCircle />}>
          Câu hỏi Listening MCQ Single hợp lệ!
        </Alert>
      )}

      {/* Show validation errors */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" icon={<Warning />} sx={{ mt: 2 }}>
          <Typography variant="body2">
            Vui lòng sửa các lỗi sau:
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {Object.values(errors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}
    </Box>
  );
}