'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material';

export default function WritingFormFillingQuestion({ question, onAnswerChange }) {
  const [answer, setAnswer] = useState('');
  const [wordCount, setWordCount] = useState(0);

  // Parse question content
  const questionData = React.useMemo(() => {
    try {
      return typeof question.content === 'string' ? JSON.parse(question.content) : question.content;
    } catch (error) {
      console.error('Failed to parse question content:', error);
      return {
        title: "Book Club Application Form",
        description: "You want to join a book club. Fill in the form. Write in sentences. Use 20-30 words.",
        question: "When and where do you usually read books?",
        placeholder: "Please describe your reading habits in complete sentences."
      };
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

  const minWords = 20;
  const maxWords = 30;

  const getWordCountColor = () => {
    if (wordCount < minWords) return 'error';
    if (wordCount > maxWords) return 'warning';
    return 'success';
  };

  const getProgress = () => {
    return Math.min((wordCount / maxWords) * 100, 100);
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'secondary.light', color: 'secondary.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          Writing Part 2: Form Filling
        </Typography>
        <Typography variant="body2">
          {questionData.description}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
          Recommended time: 7 minutes.
        </Typography>
      </Paper>

      {/* Requirements */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'info.light' }}>
        <Typography variant="subtitle2" gutterBottom>
          Requirements:
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip 
            size="small" 
            label={`Min: ${minWords} words`}
            color={wordCount >= minWords ? 'success' : 'error'}
            variant="outlined"
          />
          <Chip 
            size="small" 
            label={`Max: ${maxWords} words`}
            color={wordCount <= maxWords ? 'success' : 'warning'}
            variant="outlined"
          />
          <Chip size="small" label="Complete sentences" color="info" variant="outlined" />
          <Chip size="small" label="7 minutes" color="warning" variant="outlined" />
        </Box>
      </Paper>

      {/* Question */}
      <Paper sx={{ p: 3, mb: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom color="primary">
          {questionData.title}
        </Typography>
        
        <Typography variant="body1" gutterBottom fontWeight="medium">
          {questionData.question}
        </Typography>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {questionData.placeholder}
        </Typography>

        {/* Word count indicator */}
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color={getWordCountColor()}>
              Words: {wordCount} / {minWords}-{maxWords}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {((answer.length / 200) * 100).toFixed(0)}% characters
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={getProgress()}
            color={getWordCountColor()}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        <TextField
          multiline
          fullWidth
          rows={4}
          value={answer}
          onChange={handleAnswerChange}
          placeholder="Example: I usually read books in the evening at home after dinner. I like to sit in my comfortable chair in the living room with a cup of tea."
          variant="outlined"
          error={wordCount < minWords || wordCount > maxWords}
          helperText={
            wordCount < minWords ? `Need ${minWords - wordCount} more words` :
            wordCount > maxWords ? `${wordCount - maxWords} words over limit` :
            'Good! Within word limit'
          }
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '1rem',
              lineHeight: 1.6,
            }
          }}
        />
      </Paper>

      {/* Tips */}
      <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          Tips for Part 2:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
          <li>Write in complete sentences, not short phrases</li>
          <li>Use 20-30 words as specified</li>
          <li>Be specific about when, where, and how</li>
          <li>Use simple past, present, or future tense appropriately</li>
          <li>Check grammar and spelling before moving on</li>
        </Typography>
      </Paper>
    </Box>
  );
}