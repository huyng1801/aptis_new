'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material';

export default function FormFillingQuestionResult({ answer, question, feedback = null }) {
  const formData = answer.answer_data ? JSON.parse(answer.answer_data) : {};
  const items = question.items || [];
  
  // Extract score from feedback if available
  const score = feedback?.score || answer.score || 0;
  const maxScore = question.score_points || items.length;
  const completedFields = Object.values(formData).filter(value => value && value.trim() !== '').length;

  return (
    <Box>
      {/* Instructions */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {question.content}
        </Typography>
      </Paper>

      {/* Score and completion status */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Chip 
            label={`Score: ${score}/${maxScore}`}
            color={score >= maxScore * 0.7 ? 'success' : score >= maxScore * 0.4 ? 'warning' : 'error'}
          />
          <Chip 
            label={`Completed: ${completedFields}/${items.length} fields`}
            color={completedFields === items.length ? 'success' : 'warning'}
            variant="outlined"
          />
        </Stack>
      </Box>

      {/* Form fields */}
      <Grid container spacing={2}>
        {items.map((item, index) => {
          const fieldValue = formData[item.field_name] || formData[`field_${index}`] || '';
          const hasValue = fieldValue.trim() !== '';
          const sampleAnswer = item.sample_answer || item.correct_answer;

          return (
            <Grid item xs={12} md={6} key={item.id || index}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {item.field_label || item.item_text || `Field ${index + 1}`}
                  {item.required && <span style={{ color: 'red' }}>*</span>}
                </Typography>
                
                <TextField
                  fullWidth
                  value={fieldValue}
                  placeholder={!hasValue ? "Not filled" : ""}
                  InputProps={{ readOnly: true }}
                  multiline={item.field_type === 'textarea'}
                  rows={item.field_type === 'textarea' ? 3 : 1}
                  variant="outlined"
                  sx={{
                    '& .MuiInputBase-root': {
                      bgcolor: hasValue ? 'background.paper' : 'grey.50',
                      border: hasValue ? '1px solid #4caf50' : '1px solid #f44336'
                    }
                  }}
                />
                
                {/* Sample answer if available */}
                {sampleAnswer && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="success.dark">
                      Sample: {sampleAnswer}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* AI Feedback */}
      {feedback?.feedback && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>AI Feedback:</Typography>
          <Paper sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {feedback.feedback}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Additional notes */}
      {question.additional_info && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Additional Information:</Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2">
              {question.additional_info}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
}