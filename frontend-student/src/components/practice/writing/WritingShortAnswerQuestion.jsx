'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  Grid,
  Divider,
} from '@mui/material';

export default function WritingShortAnswerQuestion({ question, answer, onAnswerChange, isPractice = false }) {
  const [answers, setAnswers] = useState({});

  // Initialize answers from question.answer_data
  useEffect(() => {
    if (isPractice && answer) {
      // For practice mode, use the answer prop
      if (typeof answer === 'object' && answer.answer_json) {
        try {
          const parsedAnswers = typeof answer.answer_json === 'string' 
            ? JSON.parse(answer.answer_json)
            : answer.answer_json;
          setAnswers(parsedAnswers || {});
        } catch (error) {
          console.error('[WritingShortAnswerQuestion] Failed to parse practice answer_json:', error);
          setAnswers({});
        }
      } else if (answer.text_answer) {
        setAnswers({ main: answer.text_answer });
      }
    } else if (!isPractice && question.answer_data && typeof question.answer_data === 'object') {
      // If answer_data has answer_json (from database), parse it
      if (question.answer_data.answer_json) {
        try {
          const parsedAnswers = JSON.parse(question.answer_data.answer_json);
          setAnswers(parsedAnswers || {});
        } catch (error) {
          console.error('[WritingShortAnswerQuestion] Failed to parse answer_json:', error);
          setAnswers({});
        }
      } else if (question.answer_data.text_answer) {
        // Try to parse text_answer as JSON for compatibility
        try {
          const parsedAnswers = JSON.parse(question.answer_data.text_answer || '{}');
          setAnswers(parsedAnswers);
        } catch (error) {
          setAnswers({});
        }
      } else {
        setAnswers({});
      }
    } else {
      setAnswers({});
    }
  }, [question.id, question.answer_data]);

  const handleAnswerChange = (messageIndex, value) => {
    const newAnswers = {
      ...answers,
      [messageIndex]: value
    };
    
    setAnswers(newAnswers);
    
    // Send update to parent
    onAnswerChange({
      answer_type: 'json',
      answer_json: JSON.stringify(newAnswers)
    });
  };

  // Parse question content
  const questionData = React.useMemo(() => {
    try {
      return typeof question.content === 'string' ? JSON.parse(question.content) : question.content;
    } catch (error) {
      console.error('Failed to parse question content:', error);
      return {
        title: "Book Club Membership",
        description: "You want to join a Book club. Write short answers (1-5 words) to each message.",
        messages: [
          "Which sport is the most popular in your country?",
          "What do you like doing with your friend?", 
          "Which sport do you like to play the most?",
          "Where do you usually go at weekends?",
          "How often do you play sport with friends?"
        ]
      };
    }
  }, [question.content]);

  const messages = questionData.messages || [];
  const wordLimit = 5; // 1-5 words per answer

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          Writing Part 1: Short Answers
        </Typography>
        <Typography variant="body2">
          {questionData.description}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
          Recommended time: 3 minutes.
        </Typography>
      </Paper>

      {/* Requirements */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'info.light' }}>
        <Typography variant="subtitle2" gutterBottom>
          Requirements:
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip size="small" label="1-5 words per answer" color="primary" variant="outlined" />
          <Chip size="small" label="5 questions total" color="info" variant="outlined" />
          <Chip size="small" label="3 minutes" color="warning" variant="outlined" />
        </Box>
      </Paper>

      {/* Questions */}
      <Grid container spacing={3}>
        {messages.map((message, index) => {
          const answerText = answers[index] || '';
          const wordCount = countWords(answerText);
          const isOverLimit = wordCount > wordLimit;
          
          return (
            <Grid item xs={12} key={index}>
              <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body1" gutterBottom fontWeight="medium">
                  Message {index + 1}: {message}
                </Typography>
                
                <TextField
                  fullWidth
                  size="small"
                  value={answerText}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder="Write your short answer here..."
                  variant="outlined"
                  error={isOverLimit}
                  helperText={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <span>1-5 words only</span>
                      <span style={{ 
                        color: isOverLimit ? 'red' : wordCount === 0 ? 'gray' : 'green',
                        fontWeight: 'bold'
                      }}>
                        {wordCount}/5 words
                      </span>
                    </Box>
                  }
                  sx={{ mt: 1 }}
                />
              </Paper>
              
              {index < messages.length - 1 && <Divider sx={{ my: 2 }} />}
            </Grid>
          );
        })}
      </Grid>

      {/* Tips */}
      <Paper sx={{ p: 2, mt: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          Tips for Part 1:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
          <li>Keep answers short and direct</li>
          <li>Use 1-5 words maximum per answer</li>
          <li>Answer all questions to get full marks</li>
          <li>Simple phrases work best (e.g., "Football", "Very often", "At the park")</li>
        </Typography>
      </Paper>
    </Box>
  );
}