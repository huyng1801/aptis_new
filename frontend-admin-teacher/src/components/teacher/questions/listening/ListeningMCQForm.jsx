'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import { Add, Delete, CheckCircle, Warning, VolumeUp } from '@mui/icons-material';

/**
 * Listening MCQ Form - Part 1 & 4 của Listening skill
 * Dựa trên seed data: 
 * - Part 1: 13 single MCQ (13 câu riêng biệt)
 * - Part 4: 2 multi-question MCQ (mỗi audio có 2 sub-questions)
 */
export default function ListeningMCQForm({ content, onChange }) {
  const [title, setTitle] = useState('');
  const [audioScript, setAudioScript] = useState('');
  const [isMultiQuestion, setIsMultiQuestion] = useState(false); // New: support multi-question
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', ''], correctAnswer: 0 }
  ]);
  const [subQuestions, setSubQuestions] = useState([ // New: for multi-question format
    { question: '', options: ['', '', ''], correctAnswer: 0 },
    { question: '', options: ['', '', ''], correctAnswer: 0 }
  ]);
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [isValidated, setIsValidated] = useState(false);

  // Parse existing content if available
  useEffect(() => {
    if (content) {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        setTitle(parsed.title || '');
        setAudioScript(parsed.audioScript || parsed.script || '');
        setIsMultiQuestion(parsed.isMultiQuestion || false);
        
        if (parsed.isMultiQuestion) {
          setSubQuestions(parsed.subQuestions || [
            { question: '', options: ['', '', ''], correctAnswer: 0 },
            { question: '', options: ['', '', ''], correctAnswer: 0 }
          ]);
        } else {
          setQuestions(parsed.questions || [{ question: '', options: ['', '', ''], correctAnswer: 0 }]);
        }
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
    
    // Check questions based on format
    const questionsToCheck = isMultiQuestion ? subQuestions : questions;
    const validQuestions = questionsToCheck.filter(q => {
      const hasQuestion = q.question.trim();
      const hasOptions = q.options.filter(opt => opt.trim()).length >= 2;
      const hasValidAnswer = q.correctAnswer >= 0 && q.correctAnswer < q.options.length && q.options[q.correctAnswer].trim();
      return hasQuestion && hasOptions && hasValidAnswer;
    });
    
    if (validQuestions.length === 0) {
      newErrors.questions = 'Phải có ít nhất 1 câu hỏi hợp lệ';
    }
    
    // Check multi-question format (must have exactly 2 sub-questions)
    if (isMultiQuestion && validQuestions.length < 2) {
      newErrors.questions = 'Multi-question format cần đúng 2 câu hỏi phụ';
    }
    
    // Check individual questions
    for (let i = 0; i < questionsToCheck.length; i++) {
      const q = questionsToCheck[i];
      if (q.question.trim()) { // Only validate if question has content
        const validOptions = q.options.filter(opt => opt.trim());
        if (validOptions.length < 2) {
          newErrors.questions = `Câu ${i + 1}: Phải có ít nhất 2 lựa chọn`;
          break;
        }
        if (q.correctAnswer >= q.options.length || !q.options[q.correctAnswer].trim()) {
          newErrors.questions = `Câu ${i + 1}: Đáp án đúng không hợp lệ`;
          break;
        }
      }
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    return isValid;
  }, []);

  // Remove auto-validation useEffect - causes infinite loops
  // Data is sent to parent on every change (via onChange)
  // Validation is only called on demand via button click

  // Update parent component - removed auto-update to prevent infinite loops
  // Data is sent to parent via manual validation only

  // Handle adding new question
  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', ''], correctAnswer: 0 }]);
  };

  // Handle removing question
  const handleRemoveQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  // Handle question change
  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  // Handle option change
  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[optIndex] = value;
    setQuestions(newQuestions);
  };

  // Handle adding option
  const handleAddOption = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push('');
    setQuestions(newQuestions);
  };

  // Handle removing option
  const handleRemoveOption = (qIndex, optIndex) => {
    const newQuestions = [...questions];
    const question = newQuestions[qIndex];
    
    // Remove the option
    question.options = question.options.filter((_, i) => i !== optIndex);
    
    // Adjust correct answer if necessary
    if (question.correctAnswer === optIndex) {
      question.correctAnswer = 0; // Reset to first option
    } else if (question.correctAnswer > optIndex) {
      question.correctAnswer -= 1; // Adjust index
    }
    
    setQuestions(newQuestions);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Listening - Multiple Choice (Part 1 & 4)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Hướng dẫn:</Typography>
        <Typography variant="body2">
          • <strong>Part 1:</strong> 13 single MCQ questions (2 điểm/câu)<br/>
          • <strong>Part 4:</strong> 2 multi-question MCQ (2 sub-questions per audio)<br/>
          • Chọn format phù hợp với loại bài nghe
        </Typography>
      </Alert>

      {/* Format Toggle */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>Format:</Typography>
        <RadioGroup 
          row 
          value={isMultiQuestion ? 'multi' : 'single'} 
          onChange={(e) => setIsMultiQuestion(e.target.value === 'multi')}
        >
          <FormControlLabel 
            value="single" 
            control={<Radio />} 
            label="Single MCQ (Part 1)" 
          />
          <FormControlLabel 
            value="multi" 
            control={<Radio />} 
            label="Multi-Question MCQ (Part 4)" 
          />
        </RadioGroup>
      </Paper>

      {/* Title */}
      <TextField
        fullWidth
        label="Tiêu đề bài nghe"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={!!errors.title}
        helperText={errors.title}
        sx={{ mb: 3 }}
        placeholder="Conversation about weekend plans"
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
          placeholder="Speaker 1: Hello, what are you planning to do this weekend?&#10;Speaker 2: I'm thinking of going to the park if the weather is nice..."
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Questions */}
      <Typography variant="subtitle1" gutterBottom>
        Câu hỏi trắc nghiệm:
      </Typography>
      
      {questions.map((question, qIndex) => (
        <Paper key={qIndex} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="subtitle2" sx={{ mr: 2, minWidth: '60px' }}>
              Câu {qIndex + 1}:
            </Typography>
            <Box flexGrow={1} />
            <IconButton
              onClick={() => handleRemoveQuestion(qIndex)}
              disabled={questions.length <= 1}
              color="error"
              size="small"
            >
              <Delete />
            </IconButton>
          </Box>
          
          <TextField
            fullWidth
            label="Câu hỏi"
            value={question.question}
            onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
            sx={{ mb: 2 }}
            placeholder="What are they talking about?"
          />
          
          <Typography variant="body2" gutterBottom>
            Các lựa chọn:
          </Typography>
          
          <RadioGroup
            value={question.correctAnswer}
            onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', parseInt(e.target.value))}
          >
            {question.options.map((option, optIndex) => (
              <Box key={optIndex} display="flex" alignItems="center">
                <FormControlLabel
                  value={optIndex}
                  control={<Radio size="small" />}
                  label=""
                  sx={{ mr: 1 }}
                />
                <TextField
                  value={option}
                  onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                  label={`Lựa chọn ${String.fromCharCode(65 + optIndex)}`}
                  size="small"
                  sx={{ flexGrow: 1, mr: 1 }}
                  placeholder="Weekend plans"
                />
                <IconButton
                  onClick={() => handleRemoveOption(qIndex, optIndex)}
                  disabled={question.options.length <= 2}
                  color="error"
                  size="small"
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}
          </RadioGroup>
          
          <Button
            onClick={() => handleAddOption(qIndex)}
            startIcon={<Add />}
            variant="outlined"
            size="small"
            sx={{ mt: 1 }}
            disabled={question.options.length >= 6}
          >
            Thêm lựa chọn
          </Button>
        </Paper>
      ))}
      
      <Button
        onClick={handleAddQuestion}
        startIcon={<Add />}
        variant="outlined"
        size="small"
        sx={{ mb: 3 }}
        disabled={questions.length >= 13}
      >
        Thêm câu hỏi
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

      {/* Validation Status */}
      {isValidated && (
        <Alert severity="success" icon={<CheckCircle />}>
          Câu hỏi Listening MCQ hợp lệ!
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