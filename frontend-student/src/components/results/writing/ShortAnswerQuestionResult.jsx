'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Chip,
  Stack,
} from '@mui/material';

export default function ShortAnswerQuestionResult({ answer, question, feedback = null }) {
  const userAnswer = answer.text_answer || '';
  const sampleAnswer = question.sampleAnswer?.content || '';
  const hasAnswer = userAnswer.trim() !== '';

  // Extract score from feedback if available
  const score = feedback?.score || answer.score || 0;
  const maxScore = question.score_points || 5;

  return (
    <Box>
      {/* Question prompt */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {question.content}
        </Typography>
        {question.additional_info && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {question.additional_info}
          </Typography>
        )}
      </Paper>

      {/* Score display */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip 
            label={`Score: ${score}/${maxScore}`}
            color={score >= maxScore * 0.7 ? 'success' : score >= maxScore * 0.4 ? 'warning' : 'error'}
          />
          {hasAnswer ? (
            <Chip label="Answered" color="info" variant="outlined" />
          ) : (
            <Chip label="Not Answered" color="default" variant="outlined" />
          )}
        </Stack>
      </Box>

      {/* User's answer */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Your Answer:</Typography>
        <TextField
          multiline
          fullWidth
          value={userAnswer}
          placeholder={!hasAnswer ? "No answer provided" : ""}
          InputProps={{ readOnly: true }}
          minRows={3}
          maxRows={8}
          variant="outlined"
          sx={{
            '& .MuiInputBase-root': {
              bgcolor: hasAnswer ? 'background.paper' : 'grey.50',
            }
          }}
        />
        {userAnswer && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Word count: {userAnswer.split(' ').filter(word => word.trim() !== '').length}
          </Typography>
        )}
      </Box>

      {/* AI Feedback */}
      {feedback?.feedback && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>AI Feedback:</Typography>
          <Paper sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {feedback.feedback}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Sample answer (if available) */}
      {sampleAnswer && (
        <Box>
          <Typography variant="h6" gutterBottom color="success.dark">Sample Answer:</Typography>
          <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {sampleAnswer}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
}