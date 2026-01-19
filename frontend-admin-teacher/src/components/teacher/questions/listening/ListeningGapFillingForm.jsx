'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Paper
} from '@mui/material';
import { Add, Delete, CheckCircle, Warning, VolumeUp } from '@mui/icons-material';

/**
 * Listening Gap Filling Form - Parts 2-4 của Listening skill
 * Dựa trên seed data: Part 2-4 mỗi part có 4 câu nhỏ (12 câu total), 24 điểm (2 điểm/câu)
 * Gap filling với audio script
 */
export default function ListeningGapFillingForm({ content, onChange }) {
  const [title, setTitle] = useState('');
  const [audioScript, setAudioScript] = useState('');
  const [passage, setPassage] = useState('');
  const [options, setOptions] = useState(['']);
  const [correctAnswers, setCorrectAnswers] = useState(['']);
  const [instructions, setInstructions] = useState('Listen and complete the gaps with the correct words.');
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [isValidated, setIsValidated] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Audio generation function
  const generateAudio = async (text) => {
    if (!text || !text.trim()) return;
    
    try {
      setIsGeneratingAudio(true);
      console.log('🎵 Generating audio for Listening Gap Filling...');
      
      // Call backend API to generate audio
      const response = await fetch('/api/teacher/speech/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), language: 'en' })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Audio generated:', result.audioUrl);
        // Could store audioUrl in state if needed
      }
    } catch (error) {
      console.error('❌ Audio generation failed:', error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Parse existing content if available
  useEffect(() => {
    if (content) {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        setTitle(parsed.title || '');
        setAudioScript(parsed.audioScript || parsed.script || '');
        setPassage(parsed.passage || '');
        setOptions(parsed.options || ['']);
        setCorrectAnswers(parsed.correctAnswers || ['']);
        setInstructions(parsed.instructions || 'Listen and complete the gaps with the correct words.');
      } catch (error) {
        // If content is not JSON, treat as title
        setTitle(content || '');
      }
    }
  }, [content]);

  // Validation function
  const validateData = useCallback(() => {
    const newErrors = {};
    
    // Check title
    if (!title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }
    
    // Check audio script
    if (!audioScript.trim()) {
      newErrors.audioScript = 'Script âm thanh không được để trống';
    }
    
    // Check passage
    if (!passage.trim()) {
      newErrors.passage = 'Đoạn văn gap filling không được để trống';
    } else {
      // Check if passage contains [GAP] placeholders
      const gapCount = (passage.match(/\[GAP\d+\]/g) || []).length;
      if (gapCount === 0) {
        newErrors.passage = 'Đoạn văn phải chứa ít nhất một [GAP1], [GAP2], v.v.';
      } else if (gapCount !== correctAnswers.filter(ans => ans.trim()).length) {
        newErrors.passage = `Số lượng GAP (${gapCount}) không khớp với số đáp án (${correctAnswers.filter(ans => ans.trim()).length})`;
      }
    }
    
    // Check options (for multiple choice gap filling)
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length > 0 && validOptions.length < 2) {
      newErrors.options = 'Nếu có danh sách từ thì phải có ít nhất 2 từ';
    }
    
    // Check correct answers
    const validAnswers = correctAnswers.filter(ans => ans.trim());
    if (validAnswers.length === 0) {
      newErrors.correctAnswers = 'Phải có ít nhất một đáp án đúng';
    }
    
    // If options provided, check if all answers are in options list
    if (validOptions.length > 0) {
      for (const answer of validAnswers) {
        if (!validOptions.includes(answer)) {
          newErrors.correctAnswers = 'Tất cả đáp án đúng phải có trong danh sách từ';
          break;
        }
      }
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    
    // Send data to parent and generate audio when valid
    if (isValid && onChange) {
      const validOptions = options.filter(opt => opt.trim());
      const validAnswers = correctAnswers.filter(ans => ans.trim());
      
      const formData = {
        title: title.trim(),
        audioScript: audioScript.trim(),
        passage: passage.trim(),
        options: validOptions,
        correctAnswers: validAnswers,
        instructions: instructions.trim(),
        type: 'listening_gap_filling',
        // Create summary content for database
        summary: `Listening Gap Filling: ${title.trim()}. Audio script: ${audioScript.trim().substring(0, 100)}... Gap filling with ${validAnswers.length} gaps.`
      };
      
      // Auto-generate audio from script
      generateAudio(audioScript.trim());
      
      // Send content as JSON string for backend - MUST have meaningful content
      onChange(JSON.stringify(formData));
    }
    
    return isValid;
  }, [title, audioScript, passage, options, correctAnswers, instructions, onChange]);

  // Remove auto-validation useEffect - causes infinite loops
  // Data is sent to parent on every change (via onChange)
  // Validation is only called on demand via button click

  // Remove auto-update useEffect - causes infinite loops
  // Data will be sent via manual save button only

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
        Listening - Gap Filling (Parts 2-4)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Hướng dẫn:</Typography>
        <Typography variant="body2">
          • Tạo script âm thanh và đoạn văn có chỗ trống [GAP1], [GAP2]...<br/>
          • Có thể cung cấp danh sách từ hoặc để học viên tự điền<br/>
          • Điểm: 2 điểm/câu đúng, mỗi part 4 câu (8 điểm/part)
        </Typography>
      </Alert>

      {/* Title */}
      <TextField
        fullWidth
        label="Tiêu đề bài nghe"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={!!errors.title}
        helperText={errors.title}
        sx={{ mb: 3 }}
        placeholder="Hotel Information"
      />

      {/* Instructions */}
      <TextField
        fullWidth
        label="Hướng dẫn làm bài"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        sx={{ mb: 3 }}
        placeholder="Listen and complete the gaps with the correct words."
      />

      {/* Audio Script */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" mb={1}>
          <VolumeUp color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle1">Script âm thanh</Typography>
        </Box>
        <TextField
          fullWidth
          value={audioScript}
          onChange={(e) => setAudioScript(e.target.value)}
          multiline
          rows={6}
          error={!!errors.audioScript}
          helperText={errors.audioScript || 'Nội dung âm thanh mà học viên sẽ nghe'}
          placeholder="Receptionist: Good morning, Sunrise Hotel. How can I help you?&#10;Caller: I'd like to make a reservation for next weekend..."
        />
      </Box>

      {/* Passage with gaps */}
      <TextField
        fullWidth
        label="Đoạn văn có chỗ trống (sử dụng [GAP1], [GAP2], ...)"
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        multiline
        rows={6}
        error={!!errors.passage}
        helperText={errors.passage || 'Đoạn văn mà học viên sẽ thấy với các chỗ trống'}
        sx={{ mb: 3 }}
        placeholder="Hotel Information:&#10;Name: [GAP1] Hotel&#10;Price per night: $[GAP2]&#10;Check-in time: [GAP3] PM..."
      />

      {/* Options List (Optional) */}
      <Typography variant="subtitle1" gutterBottom>
        Danh sách từ để chọn (tùy chọn):
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Để trống nếu muốn học viên tự điền từ
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
        disabled={isGeneratingAudio}
        startIcon={isGeneratingAudio ? <VolumeUp /> : <CheckCircle />}
      >
        {isGeneratingAudio ? 'Đang tạo audio...' : 'Kiểm tra câu hỏi'}
      </Button>

      {/* Correct Answers */}
      <Typography variant="subtitle1" gutterBottom>
        Đáp án đúng theo thứ tự:
      </Typography>
      
      {correctAnswers.map((answer, index) => (
        <Box key={index} display="flex" alignItems="center" mb={2}>
          {options.filter(opt => opt.trim()).length > 0 ? (
            <FormControl fullWidth sx={{ mr: 1 }} size="small">
              <InputLabel>GAP{index + 1}</InputLabel>
              <Select
                value={answer}
                onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
                label={`GAP${index + 1}`}
              >
                <option value="">Chọn từ...</option>
                {options.filter(opt => opt.trim()).map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              value={answer}
              onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
              label={`GAP${index + 1}`}
              sx={{ flexGrow: 1, mr: 1 }}
              size="small"
              placeholder="Đáp án đúng"
            />
          )}
          <IconButton
            onClick={() => handleRemoveCorrectAnswer(index)}
            disabled={correctAnswers.length <= 1}
            color="error"
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

      {/* Validation Status */}
      {isValidated && (
        <Alert severity="success" icon={<CheckCircle />}>
          Câu hỏi Listening Gap Filling hợp lệ!
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