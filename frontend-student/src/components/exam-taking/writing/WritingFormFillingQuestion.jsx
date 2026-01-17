'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
} from '@mui/material';

export default function WritingFormFillingQuestion({ question, onAnswerChange }) {
  const [answer, setAnswer] = useState('');
  const [wordCount, setWordCount] = useState(0);

  // Parse question content
  const questionData = React.useMemo(() => {
    try {
      // If content is text format, parse it
      if (typeof question.content === 'string' && !question.content.startsWith('{')) {
        // Parse the text content to extract title
        const lines = question.content.split('\n').filter(line => line.trim());
        const title = lines[0] || "Form Filling Task";
        
        return {
          title,
          question: question.content // Use full content as question for display
        };
      }
      
      // Legacy JSON format support
      return typeof question.content === 'string' ? JSON.parse(question.content) : question.content;
    } catch (error) {
      console.error('Failed to parse question content:', error);
      return null;
    }
  }, [question.content]);

  // Initialize answer from question.answer_data
  useEffect(() => {
    if (question.answer_data?.text_answer) {
      setAnswer(question.answer_data.text_answer);
    } else if (question.answer_data?.answer_json) {
      try {
        const parsed = JSON.parse(question.answer_data.answer_json);
        setAnswer(parsed.text || '');
      } catch (error) {
        setAnswer('');
      }
    } else {
      setAnswer('');
    }
  }, [question.id, question.answer_data]);

  useEffect(() => {
    // Count words
    const words = answer.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [answer]);

  const handleAnswerChange = (event) => {
    const newText = event.target.value;
    setAnswer(newText);
    
    onAnswerChange({
      answer_type: 'text',
      text_answer: newText
    });
  };

  if (!questionData) {
    return <Box sx={{ p: 2 }}><Typography color="error">Không thể tải câu hỏi</Typography></Box>;
  }

  return (
    <Box sx={{ maxHeight: '100vh', overflow: 'auto', p: 2 }}>
      {/* Question Content */}
      <Box sx={{ mb: 3 }}>
        {questionData.question.split('\n').map((line, index) => {
          if (line.trim() === '') return null;
          
          return (
            <Typography 
              key={index} 
              variant="body1" 
              sx={{ mb: 1, whiteSpace: 'pre-line' }}
            >
              {line}
            </Typography>
          );
        })}
      </Box>

      <TextField
        multiline
        fullWidth
        rows={4}
        value={answer}
        onChange={handleAnswerChange}
        variant="outlined"
        helperText={`${wordCount} words`}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '1rem',
            lineHeight: 1.6,
            backgroundColor: 'white'
          }
        }}
      />
    </Box>
  );
}