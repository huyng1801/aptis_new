'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';

export default function WordLevelWritingResult({ answer, question, feedback = null }) {
  // Parse student answers from formatted text "Answer 1: text\n\nAnswer 2: text"
  const textAnswer = answer.text_answer || '';
  const parsedAnswers = {};
  
  if (textAnswer) {
    const answerParts = textAnswer.split('\n\n');
    answerParts.forEach(part => {
      const match = part.match(/^Answer (\d+):\s*(.*)$/s);
      if (match) {
        const [, index, text] = match;
        parsedAnswers[index] = text.trim();
      }
    });
  }
  
  // Parse questions from content
  const questions = question.content.split('\n').filter(q => q.trim() && q.includes('?'));
  
  // Extract score and feedback
  const score = feedback?.score || answer.final_score || answer.score || 0;
  const maxScore = answer.max_score || question.max_score || 10; // Use actual max_score from answer/question
  const cefrLevel = feedback?.cefr_level || 'Not assessed';
  const comment = feedback?.comment || '';
  const suggestions = feedback?.suggestions || '';
  
  // Convert parsed answers to array format for display
  const answers = questions.map((_, index) => parsedAnswers[index + 1] || '');

  // Color coding based on score
  const getScoreColor = (score) => {
    if (score >= 3) return 'success';
    if (score >= 2) return 'info';
    if (score >= 1) return 'warning';
    return 'error';
  };

  // CEFR level mapping for Task 1
  const getCefrDisplay = (level) => {
    const mapping = {
      'A0': 'A0 (No intelligible responses)',
      'A1.1': 'A1.1 (1-2 intelligible responses)',
      'A1.2': 'A1.2 (3-4 intelligible responses)',
      'above A1': 'Above A1 (All responses intelligible)'
    };
    return mapping[level] || level;
  };

  return (
    <Box>
      {/* Task Instructions */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'blue.50', border: '1px solid #e3f2fd' }}>
        <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, fontWeight: 'bold' }}>
          APTIS Writing Task 1 - Word-level Writing
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Fill in basic information using 1-5 words per question. Assessment focuses on task fulfillment and communicative competence.
        </Typography>
      </Paper>

      {/* Score Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip 
            label={`Score: ${score}/${maxScore}`}
            color={getScoreColor(score)}
            size="large"
            sx={{ fontWeight: 'bold' }}
          />
          <Chip 
            label={getCefrDisplay(cefrLevel)}
            variant="outlined"
            color="primary"
          />
          <Chip 
            label={`Responses: ${answers.length}/${questions.length}`}
            variant="outlined"
            color={answers.length >= questions.length ? 'success' : 'warning'}
          />
        </Stack>
        
        {comment && (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            {comment}
          </Typography>
        )}
      </Paper>

      {/* Questions and Answers */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
          Your Responses
        </Typography>
        
        <Grid container spacing={2}>
          {questions.map((question, index) => (
            <Grid item xs={12} key={index}>
              <Box sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                bgcolor: answers[index] ? 'success.50' : 'grey.50'
              }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {index + 1}. {question.trim()}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: answers[index] ? 'text.primary' : 'text.secondary',
                    fontStyle: answers[index] ? 'normal' : 'italic',
                    p: 1,
                    bgcolor: 'white',
                    borderRadius: 0.5,
                    border: '1px solid #ddd'
                  }}
                >
                  {answers[index] || 'No response provided'}
                </Typography>
              </Box>
              {index < questions.length - 1 && <Divider sx={{ my: 1 }} />}
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* AI Feedback */}
      {feedback?.suggestions && feedback.suggestions.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'orange.50', border: '1px solid #fff3e0' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'orange.800' }}>
            🤖 AI Comprehensive Assessment
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', color: 'orange.900', fontWeight: 'bold' }}>
            Suggestions for Improvement
          </Typography>
          
          {Array.isArray(feedback.suggestions) ? (
            <Stack spacing={2}>
              {feedback.suggestions.map((suggestion, idx) => (
                <Box key={idx} sx={{ 
                  p: 2, 
                  bgcolor: 'white', 
                  border: '1px solid #ffe0b2',
                  borderRadius: 1
                }}>
                  {typeof suggestion === 'string' ? (
                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                      {suggestion}
                    </Typography>
                  ) : (
                    <Box>
                      {(suggestion.context || suggestion.original || suggestion.incorrect_phrase) && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Original:</strong> "{suggestion.context || suggestion.original || suggestion.incorrect_phrase}"
                        </Typography>
                      )}
                      {(suggestion.corrected || suggestion.corrected_version) && (
                        <Typography variant="body2" sx={{ mb: 1, color: 'success.main' }}>
                          <strong>✓ Corrected:</strong> "{suggestion.corrected || suggestion.corrected_version}"
                        </Typography>
                      )}
                      {suggestion.explanation && (
                        <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                          <strong>Why:</strong> {suggestion.explanation}
                        </Typography>
                      )}
                      {suggestion.rationale && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          <strong>Impact:</strong> {suggestion.rationale}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {feedback.suggestions}
            </Typography>
          )}
        </Paper>
      )}

      {/* Task Requirements Reminder */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.100' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          <strong>APTIS Task 1 Scoring (0-3 scale):</strong><br/>
          3 = All responses intelligible, complete task achievement<br/>
          2 = 3-4 responses intelligible<br/>
          1 = 1-2 responses intelligible<br/>
          0 = No intelligible responses
        </Typography>
      </Paper>
    </Box>
  );
}