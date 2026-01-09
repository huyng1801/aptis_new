'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  Grid,
  LinearProgress,
  Divider,
} from '@mui/material';

export default function WritingChatQuestion({ question, onAnswerChange }) {
  const [answers, setAnswers] = useState({
    personA: '',
    personB: ''
  });

  // Parse question content
  const questionData = React.useMemo(() => {
    try {
      return typeof question.content === 'string' ? JSON.parse(question.content) : question.content;
    } catch (error) {
      console.error('Failed to parse question content:', error);
      return {
        title: "Book Club Chat Room",
        description: "You are talking to other members of the club in the chat room. Talk to them using sentences. Use 30-40 words per answer.",
        messages: [
          {
            person: "Person A",
            message: "Tell me about your favourite time and place to read a book?"
          },
          {
            person: "Person B", 
            message: "I bought a book as a gift for my friend but I don't know what kind of book he likes. Can you give me some advice?"
          }
        ]
      };
    }
  }, [question.content]);

  // Initialize answers from question.answer_data
  useEffect(() => {
    if (question.answer_data && typeof question.answer_data === 'object') {
      if (question.answer_data.answer_json) {
        try {
          const parsedAnswers = JSON.parse(question.answer_data.answer_json);
          setAnswers(parsedAnswers || { personA: '', personB: '' });
        } catch (error) {
          console.error('[WritingChatQuestion] Failed to parse answer_json:', error);
          setAnswers({ personA: '', personB: '' });
        }
      } else {
        setAnswers({ personA: '', personB: '' });
      }
    } else {
      setAnswers({ personA: '', personB: '' });
    }
  }, [question.id, question.answer_data]);

  const handleAnswerChange = (personKey, value) => {
    const newAnswers = {
      ...answers,
      [personKey]: value
    };
    
    setAnswers(newAnswers);
    
    // Send update to parent
    onAnswerChange({
      answer_type: 'json',
      answer_json: JSON.stringify(newAnswers)
    });
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const minWords = 30;
  const maxWords = 40;

  const getWordCountColor = (wordCount) => {
    if (wordCount < minWords) return 'error';
    if (wordCount > maxWords) return 'warning'; 
    return 'success';
  };

  const getProgress = (wordCount) => {
    return Math.min((wordCount / maxWords) * 100, 100);
  };

  const personAWordCount = countWords(answers.personA);
  const personBWordCount = countWords(answers.personB);

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'success.light', color: 'success.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          Writing Part 3: Chat Room
        </Typography>
        <Typography variant="body2">
          {questionData.description}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
          Recommended time: 10 minutes.
        </Typography>
      </Paper>

      {/* Requirements */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'info.light' }}>
        <Typography variant="subtitle2" gutterBottom>
          Requirements:
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip size="small" label={`${minWords}-${maxWords} words per response`} color="primary" variant="outlined" />
          <Chip size="small" label="Complete sentences" color="info" variant="outlined" />
          <Chip size="small" label="Conversational tone" color="secondary" variant="outlined" />
          <Chip size="small" label="10 minutes" color="warning" variant="outlined" />
        </Box>
      </Paper>

      {/* Chat Interface */}
      <Paper sx={{ p: 3, backgroundColor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom color="primary">
          📚 {questionData.title}
        </Typography>
        
        <Grid container spacing={3}>
          {/* Person A */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="primary.dark">
                {questionData.messages[0]?.person}: {questionData.messages[0]?.message}
              </Typography>
              
              <Box sx={{ mt: 2, mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color={getWordCountColor(personAWordCount)}>
                    Words: {personAWordCount} / {minWords}-{maxWords}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Response to Person A
                  </Typography>
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={getProgress(personAWordCount)}
                  color={getWordCountColor(personAWordCount)}
                  sx={{ height: 4, borderRadius: 2, mb: 1 }}
                />
              </Box>

              <TextField
                multiline
                fullWidth
                rows={3}
                value={answers.personA}
                onChange={(e) => handleAnswerChange('personA', e.target.value)}
                placeholder="Example: My favourite time to read is in the evening after work. I love sitting in my garden with a good book and a cup of coffee. The quiet atmosphere helps me focus and relax completely."
                variant="outlined"
                error={personAWordCount < minWords || personAWordCount > maxWords}
                helperText={
                  personAWordCount < minWords ? `Need ${minWords - personAWordCount} more words` :
                  personAWordCount > maxWords ? `${personAWordCount - maxWords} words over limit` :
                  'Perfect! Within word limit'
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                  }
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Divider>
              <Chip label="Next Message" size="small" />
            </Divider>
          </Grid>

          {/* Person B */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="secondary.dark">
                {questionData.messages[1]?.person}: {questionData.messages[1]?.message}
              </Typography>
              
              <Box sx={{ mt: 2, mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color={getWordCountColor(personBWordCount)}>
                    Words: {personBWordCount} / {minWords}-{maxWords}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Response to Person B
                  </Typography>
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={getProgress(personBWordCount)}
                  color={getWordCountColor(personBWordCount)}
                  sx={{ height: 4, borderRadius: 2, mb: 1 }}
                />
              </Box>

              <TextField
                multiline
                fullWidth
                rows={3}
                value={answers.personB}
                onChange={(e) => handleAnswerChange('personB', e.target.value)}
                placeholder="Example: I suggest asking your friend about their hobbies and interests first. Maybe choose a popular thriller or mystery novel as most people enjoy them. You could also check what books are currently bestsellers."
                variant="outlined"
                error={personBWordCount < minWords || personBWordCount > maxWords}
                helperText={
                  personBWordCount < minWords ? `Need ${minWords - personBWordCount} more words` :
                  personBWordCount > maxWords ? `${personBWordCount - maxWords} words over limit` :
                  'Perfect! Within word limit'
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                  }
                }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Tips */}
      <Paper sx={{ p: 2, mt: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          Tips for Part 3:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
          <li>Write like you're having a friendly conversation</li>
          <li>Use 30-40 words for each response</li>
          <li>Be helpful and give relevant advice or information</li>
          <li>Use connecting words (but, because, so, however)</li>
          <li>Stay on topic and answer the questions directly</li>
        </Typography>
      </Paper>
    </Box>
  );
}