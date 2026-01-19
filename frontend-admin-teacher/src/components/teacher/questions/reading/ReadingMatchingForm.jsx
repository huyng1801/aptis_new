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
  Paper,
  Chip
} from '@mui/material';
import { Add, Delete, CheckCircle, Warning } from '@mui/icons-material';

/**
 * Reading Matching Form - Part 3 của Reading skill
 * Dựa trên seed data: 5 câu, 5 điểm (1 điểm/câu)  
 * Ghép người/câu hỏi với câu trả lời
 */
export default function ReadingMatchingForm({ content, onChange }) {
  const [instructions, setInstructions] = useState('');
  const [passage, setPassage] = useState('');
  const [persons, setPersons] = useState([{ name: 'Person A', text: '' }]);
  const [questions, setQuestions] = useState([{ text: '', correct: 'A' }]);
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [isValidated, setIsValidated] = useState(false);

  // Parse existing content if available
  useEffect(() => {
    if (content) {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        setInstructions(parsed.instructions || '');
        setPassage(parsed.passage || '');
        setPersons(parsed.persons || [{ name: 'Person A', text: '' }]);
        setQuestions(parsed.questions || [{ text: '', correct: 'A' }]);
      } catch (error) {
        // If content is not JSON, treat as instructions
        setInstructions(content || '');
      }
    }
  }, [content]);

  // Validation function
  const validateData = useCallback(() => {
    const newErrors = {};
    
    // Check instructions
    if (!instructions.trim()) {
      newErrors.instructions = 'Hướng dẫn làm bài không được để trống';
    }
    
    // Check passage
    if (!passage.trim()) {
      newErrors.passage = 'Đoạn văn giới thiệu không được để trống';
    }
    
    // Check persons
    const validPersons = persons.filter(person => person.name.trim() && person.text.trim());
    if (validPersons.length < 2) {
      newErrors.persons = 'Phải có ít nhất 2 người với nội dung';
    }
    
    // Check questions
    const validQuestions = questions.filter(q => q.text.trim() && q.correct);
    if (validQuestions.length < 2) {
      newErrors.questions = 'Phải có ít nhất 2 câu hỏi với đáp án';
    }
    
    // Check if all correct answers refer to valid persons
    const personLetters = validPersons.map(p => p.name.slice(-1));
    for (const question of validQuestions) {
      if (!personLetters.includes(question.correct)) {
        newErrors.questions = 'Có đáp án không hợp lệ (không tương ứng với người nào)';
        break;
      }
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    return isValid;
  }, [instructions, passage, persons, questions]);

  // Remove auto-validation useEffect - causes infinite loops
  // Data is sent to parent on every change (via onChange)
  // Validation is only called on demand via button click

  // Update parent component
  useEffect(() => {
    const questionData = {
      instructions: instructions.trim(),
      passage: passage.trim(),
      persons: persons.filter(p => p.name.trim() && p.text.trim()),
      questions: questions.filter(q => q.text.trim() && q.correct)
    };
    
    if (onChange) {
      onChange(JSON.stringify(questionData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructions, passage, persons, questions]);

  // Handle adding new person
  const handleAddPerson = () => {
    const nextLetter = String.fromCharCode(65 + persons.length); // A, B, C, D...
    setPersons([...persons, { name: `Person ${nextLetter}`, text: '' }]);
  };

  // Handle removing person
  const handleRemovePerson = (index) => {
    const newPersons = persons.filter((_, i) => i !== index);
    
    // Update person names to maintain A, B, C sequence
    const updatedPersons = newPersons.map((person, i) => ({
      ...person,
      name: `Person ${String.fromCharCode(65 + i)}`
    }));
    
    setPersons(updatedPersons);
    
    // Update questions to use valid person letters
    const validLetters = updatedPersons.map(p => p.name.slice(-1));
    const updatedQuestions = questions.map(q => ({
      ...q,
      correct: validLetters.includes(q.correct) ? q.correct : validLetters[0] || 'A'
    }));
    setQuestions(updatedQuestions);
  };

  // Handle person change
  const handlePersonChange = (index, field, value) => {
    const newPersons = [...persons];
    if (field === 'name') {
      // Keep the letter format
      const letter = value.slice(-1).toUpperCase();
      newPersons[index].name = `Person ${letter}`;
    } else {
      newPersons[index][field] = value;
    }
    setPersons(newPersons);
  };

  // Handle adding new question
  const handleAddQuestion = () => {
    const firstPersonLetter = persons.length > 0 ? persons[0].name.slice(-1) : 'A';
    setQuestions([...questions, { text: '', correct: firstPersonLetter }]);
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

  // Get available person letters for select options
  const getPersonOptions = () => {
    return persons
      .filter(p => p.name.trim() && p.text.trim())
      .map(p => p.name.slice(-1));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Reading - Matching (Part 3)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Hướng dẫn:</Typography>
        <Typography variant="body2">
          • Tạo 4 người (Person A, B, C, D) với quan điểm khác nhau<br/>
          • Tạo 5 câu hỏi để ghép với đúng người<br/>
          • Điểm: 1 điểm/câu đúng, tối đa 5 câu (5 điểm)
        </Typography>
      </Alert>

      {/* Instructions */}
      <TextField
        fullWidth
        label="Hướng dẫn làm bài"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        error={!!errors.instructions}
        helperText={errors.instructions}
        sx={{ mb: 3 }}
        placeholder="Four people share their feelings about reading books. Read their answers and answer the questions below."
      />

      {/* Passage */}
      <TextField
        fullWidth
        label="Đoạn văn giới thiệu"
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        multiline
        rows={2}
        error={!!errors.passage}
        helperText={errors.passage}
        sx={{ mb: 3 }}
        placeholder="Giới thiệu ngắn về bối cảnh hoặc chủ đề..."
      />

      {/* Persons */}
      <Typography variant="subtitle1" gutterBottom>
        Người và quan điểm:
      </Typography>
      
      {persons.map((person, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <TextField
              label="Tên"
              value={person.name}
              onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
              size="small"
              sx={{ width: '120px', mr: 2 }}
            />
            <Chip
              label={person.name.slice(-1)}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Box flexGrow={1} />
            <IconButton
              onClick={() => handleRemovePerson(index)}
              disabled={persons.length <= 1}
              color="error"
              size="small"
            >
              <Delete />
            </IconButton>
          </Box>
          
          <TextField
            fullWidth
            label={`Quan điểm của ${person.name}`}
            value={person.text}
            onChange={(e) => handlePersonChange(index, 'text', e.target.value)}
            multiline
            rows={3}
            size="small"
            placeholder="Ví dụ: I have to read a lot for my job, and I find that reading factual books is often boring..."
          />
        </Paper>
      ))}
      
      <Button
        onClick={handleAddPerson}
        startIcon={<Add />}
        variant="outlined"
        size="small"
        sx={{ mb: 3 }}
        disabled={persons.length >= 6}
      >
        Thêm người
      </Button>

      {/* Questions */}
      <Typography variant="subtitle1" gutterBottom>
        Câu hỏi ghép cặp:
      </Typography>
      
      {questions.map((question, index) => (
        <Box key={index} display="flex" alignItems="center" mb={2}>
          <Typography variant="body2" sx={{ minWidth: '30px', mr: 1 }}>
            {index + 1}.
          </Typography>
          <TextField
            value={question.text}
            onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
            label="Câu hỏi"
            size="small"
            sx={{ flexGrow: 1, mr: 2 }}
            placeholder="Who thinks reading factual books is boring?"
          />
          <FormControl size="small" sx={{ minWidth: '100px', mr: 1 }}>
            <InputLabel>Đáp án</InputLabel>
            <Select
              value={question.correct}
              onChange={(e) => handleQuestionChange(index, 'correct', e.target.value)}
              label="Đáp án"
            >
              {getPersonOptions().map((letter) => (
                <MenuItem key={letter} value={letter}>
                  Person {letter}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton
            onClick={() => handleRemoveQuestion(index)}
            disabled={questions.length <= 1}
            color="error"
            size="small"
          >
            <Delete />
          </IconButton>
        </Box>
      ))}
      
      <Button
        onClick={handleAddQuestion}
        startIcon={<Add />}
        variant="outlined"
        size="small"
        sx={{ mb: 3 }}
        disabled={questions.length >= 10 || getPersonOptions().length === 0}
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
          Câu hỏi Matching hợp lệ!
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