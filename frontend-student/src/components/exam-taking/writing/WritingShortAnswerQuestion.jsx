'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
} from '@mui/material';

export default function WritingShortAnswerQuestion({ question, onAnswerChange }) {
  const [answers, setAnswers] = useState({});

  // Initialize answers from question.answer_data
  useEffect(() => {
    if (question.answer_data && typeof question.answer_data === 'object') {
      if (question.answer_data.text_answer) {
        try {
          // Parse formatted text like "Answer 1: text\n\nAnswer 2: text"
          const textAnswer = question.answer_data.text_answer;
          const parsedAnswers = {};
          
          // Split by double newlines and parse each answer
          const answerParts = textAnswer.split('\n\n');
          answerParts.forEach(part => {
            const match = part.match(/^Answer (\d+):\s*(.*)$/s);
            if (match) {
              const [, index, text] = match;
              parsedAnswers[index] = text;
            }
          });
          
          setAnswers(parsedAnswers);
        } catch (error) {
          console.error('[WritingShortAnswerQuestion] Failed to parse text_answer:', error);
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
      [messageIndex + 1]: value  // Convert 0-based index to 1-based string key
    };
    
    setAnswers(newAnswers);
    
    // Convert to formatted text for consistent storage
    const formattedText = Object.entries(newAnswers)
      .map(([key, value]) => `Answer ${key}: ${value}`)
      .join('\n\n');
    
    // Send update to parent
    onAnswerChange({
      answer_type: 'text',
      text_answer: formattedText
    });
  };

  // Parse question content
  const questionData = React.useMemo(() => {
    try {
      // If content is text format, parse it
      if (typeof question.content === 'string' && !question.content.startsWith('{')) {
        // Parse the text content to extract title and input fields
        const lines = question.content.split('\n').filter(line => line.trim());
        const title = lines[0] || "Short Answer Questions";
        
        // For form-like content, extract fields marked with _______
        let messages = [];
        
        // Check if this is a form completion task
        if (question.content.includes('_______') || question.content.includes('Complete the registration')) {
          // Extract form fields from content
          const content = question.content;
          
          // Parse form fields like "First name: _______"
          const fieldMatches = content.match(/([^:]+):\s*_+/g);
          if (fieldMatches) {
            messages = fieldMatches.map(match => {
              const field = match.replace(/:\s*_+/, '').trim();
              return `What is your ${field.toLowerCase()}?`;
            });
          }
          
          // If no fields found, create generic questions
          if (messages.length === 0) {
            messages = [
              "What is your first name?",
              "What is your last name?", 
              "What is your phone number?",
              "What is your address?",
              "What is your country?"
            ];
          }
        } else {
          // Extract questions that end with '?'
          messages = lines.filter(line => line.trim().endsWith('?'));
        }
        
        return {
          title,
          messages: messages.length > 0 ? messages : ["Please provide your answer:"]
        };
      }
      
      // Legacy JSON format support
      return typeof question.content === 'string' ? JSON.parse(question.content) : question.content;
    } catch (error) {
      console.error('Failed to parse question content:', error);
      return null;
    }
  }, [question.content]);

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  if (!questionData) {
    return <Box sx={{ p: 2 }}><Typography color="error">Không thể tải câu hỏi</Typography></Box>;
  }

  const messages = questionData.messages || [];

  return (
    <Box sx={{ maxHeight: '100vh', overflow: 'auto', p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        {questionData.title}
      </Typography>

      <Grid container spacing={2}>
        {messages.map((message, index) => {
          const answerText = answers[index + 1] || '';  // Use 1-based key to get answer
          const wordCount = countWords(answerText);
          
          return (
            <Grid item xs={12} key={index}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" gutterBottom sx={{ mb: 1 }}>
                  {index + 1}. {message}
                </Typography>
                
                <TextField
                  fullWidth
                  size="small"
                  value={answerText}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  variant="outlined"
                  helperText={`${wordCount} words`}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white'
                    }
                  }}
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}