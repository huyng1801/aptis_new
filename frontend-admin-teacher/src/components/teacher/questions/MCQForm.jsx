'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Typography,
  IconButton
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

export default function MCQForm({ content, onChange, skillType, questionType, aptisData, skillData, questionTypeData }) {
  // Determine if this is a Listening MCQ
  const isListeningMCQ = skillType?.code === 'LISTENING' || skillType === 'LISTENING';
  
  const [title, setTitle] = useState(() => {
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content || '{}') : content;
      return parsed.title || '';
    } catch {
      return '';
    }
  });

  const [audioScript, setAudioScript] = useState(() => {
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content || '{}') : content;
      return parsed.audioScript || parsed.script || '';
    } catch {
      return '';
    }
  });

  const [questionText, setQuestionText] = useState(() => {
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content || '{}') : content;
      return parsed.question || '';
    } catch {
      return '';
    }
  });
  
  const [passage, setPassage] = useState(() => {
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content || '{}') : content;
      return parsed.passage || '';
    } catch {
      return '';
    }
  });

  const [options, setOptions] = useState(() => {
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content || '{}') : content;
      return parsed.options || [
        { id: 'A', text: '', isCorrect: false },
        { id: 'B', text: '', isCorrect: false },
        { id: 'C', text: '', isCorrect: false },
        { id: 'D', text: '', isCorrect: false }
      ];
    } catch {
      return [
        { id: 'A', text: '', isCorrect: false },
        { id: 'B', text: '', isCorrect: false },
        { id: 'C', text: '', isCorrect: false },
        { id: 'D', text: '', isCorrect: false }
      ];
    }
  });

  const [explanation, setExplanation] = useState(() => {
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content || '{}') : content;
      return parsed.explanation || '';
    } catch {
      return '';
    }
  });

  // Update parent when data changes
  useEffect(() => {
    const questionData = {
      title,
      question: questionText,
      options,
      explanation
    };
    
    if (isListeningMCQ) {
      questionData.audioScript = audioScript;
    } else {
      questionData.passage = passage;
    }
    
    const jsonString = JSON.stringify(questionData);
    if (jsonString !== content) {
      onChange(jsonString);
    }
  }, [title, questionText, passage, audioScript, options, explanation, isListeningMCQ, content]); // Add content, remove onChange

  const handleTitleChange = (value) => {
    setTitle(value);
  };

  const handleQuestionChange = (value) => {
    setQuestionText(value);
  };

  const handlePassageChange = (value) => {
    setPassage(value);
  };

  const handleAudioScriptChange = (value) => {
    setAudioScript(value);
  };

  const handleOptionChange = (index, text) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const handleCorrectAnswerChange = (optionId) => {
    const newOptions = options.map(option => ({
      ...option,
      isCorrect: option.id === optionId
    }));
    setOptions(newOptions);
  };

  const handleExplanationChange = (value) => {
    setExplanation(value);
  };

  const addOption = () => {
    const nextLetter = String.fromCharCode(65 + options.length);
    const newOptions = [...options, { id: nextLetter, text: '', isCorrect: false }];
    setOptions(newOptions);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      // Cập nhật lại ID cho các tuỳ chọn
      const updatedOptions = newOptions.map((option, i) => ({
        ...option,
        id: String.fromCharCode(65 + i)
      }));
      setOptions(updatedOptions);
    }
  };

  const needsPassage = skillType === 'READING' || (skillType?.code === 'READING');
  const correctAnswer = options.find(opt => opt.isCorrect)?.id || '';

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {isListeningMCQ ? 'Listening - Multiple Choice' : 'Reading - Multiple Choice'}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {isListeningMCQ ? 'Tạo câu hỏi trắc nghiệm Listening với audio script' : 'Tạo câu hỏi trắc nghiệm Reading với đoạn văn'}
      </Typography>

      {/* Title */}
      <Box mb={3}>
        <TextField
          fullWidth
          label="Tiêu đề câu hỏi"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={isListeningMCQ ? "VD: Listen to the conversation and answer the question" : "VD: Read the passage and answer the question"}
          helperText="Tiêu đề ngắn gọn mô tả nội dung câu hỏi"
        />
      </Box>

      {/* Audio Script for Listening / Reading Passage for Reading */}
      {isListeningMCQ ? (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Audio Script
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={8}
            label="Nội dung audio script"
            value={audioScript}
            onChange={(e) => handleAudioScriptChange(e.target.value)}
            placeholder="Speaker A: Hello, I'd like to book a table for tonight...&#10;Speaker B: Of course, how many people will be dining with us?&#10;Speaker A: Just two people, please..."
            helperText="Script âm thanh mà học sinh sẽ nghe. Ghi rõ Speaker A, Speaker B nếu có đối thoại."
          />
        </Box>
      ) : needsPassage && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Đoạn văn đọc
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Nhập đoạn văn"
            value={passage}
            onChange={(e) => handlePassageChange(e.target.value)}
            placeholder="Nhập đoạn văn cho học sinh đọc..."
          />
        </Box>
      )}

      {/* Question */}
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Câu hỏi
        </Typography>
        <TextField
          fullWidth
          label="Nội dung câu hỏi"
          value={questionText}
          onChange={(e) => handleQuestionChange(e.target.value)}
          multiline
          rows={2}
          placeholder={isListeningMCQ ? "What is the main topic of the conversation?" : needsPassage ? "Theo đoạn văn trên, ..." : "Hoàn thành câu sau: She ___ to work every day."}
          helperText={isListeningMCQ ? "Câu hỏi về nội dung audio mà học sinh vừa nghe" : "Câu hỏi liên quan đến nội dung"}
        />
      </Box>

      {/* Options */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Các lựa chọn ({options.length} đáp án)
          </Typography>
          {options.length < 6 && (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addOption}
              size="small"
            >
              Thêm lựa chọn
            </Button>
          )}
        </Box>

        {options.map((option, index) => (
          <Box key={option.id} display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="body1" sx={{ minWidth: 24, textAlign: 'center', fontWeight: 'bold' }}>
              {option.id}.
            </Typography>
            
            <TextField
              fullWidth
              label={`Lựa chọn ${option.id}`}
              value={option.text}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              size="small"
            />
            
            {options.length > 2 && (
              <IconButton
                color="error"
                onClick={() => removeOption(index)}
                size="small"
              >
                <Delete />
              </IconButton>
            )}
          </Box>
        ))}
      </Box>

      {/* Correct Answer */}
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Đáp án đúng
        </Typography>
        <RadioGroup
          value={correctAnswer}
          onChange={(e) => handleCorrectAnswerChange(e.target.value)}
        >
          {options.map((option) => (
            <FormControlLabel
              key={option.id}
              value={option.id}
              control={<Radio />}
              label={`${option.id}. ${option.text || '(Chưa nhập)'}`}
              disabled={!option.text.trim()}
            />
          ))}
        </RadioGroup>
      </Box>

      {/* Explanation */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Giải thích (Tùy chọn)
        </Typography>
        <TextField
          fullWidth
          label="Giải thích đáp án"
          value={explanation}
          onChange={(e) => handleExplanationChange(e.target.value)}
          multiline
          rows={3}
          placeholder={isListeningMCQ ? "Giải thích tại sao đáp án này đúng dựa trên audio script..." : "Giải thích tại sao đáp án này đúng..."}
        />
      </Box>
    </Box>
  );
}