'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
} from '@mui/material';

export default function GapFillingQuestionResult({ answer, question, showCorrectAnswer = true }) {
  // Parse user answers from answer_data (matches exam-taking structure)
  const gaps = answer.answer_data ? JSON.parse(answer.answer_data)?.gaps || {} : {};
  const options = question.options || [];
  const items = question.items || [];

  // Score calculation
  let correctCount = 0;
  let totalGaps = items.length;

  // Render content with gaps (matches exam-taking logic exactly)
  const renderContentWithGaps = () => {
    let content = question.content;
    const parts = [];
    let lastIndex = 0;

    if (!items || items.length === 0) {
      return <Typography>{content}</Typography>;
    }

    // Sort items by item_number if available, otherwise by item_order (same as exam-taking)
    const sortedItems = [...items].sort((a, b) => {
      const aNum = a.item_number || a.item_order || 0;
      const bNum = b.item_number || b.item_order || 0;
      return aNum - bNum;
    });

    sortedItems.forEach((item, index) => {
      // Try both item_number and index-based gap patterns (same as exam-taking)
      const gapNumber = item.item_number || (index + 1);
      const gapPattern = `[GAP${gapNumber}]`;
      
      const gapIndex = content.indexOf(gapPattern, lastIndex);
      
      if (gapIndex !== -1) {
        // Add text before gap
        if (gapIndex > lastIndex) {
          parts.push(
            <span key={`text-${item.id}-${index}`}>
              {content.substring(lastIndex, gapIndex)}
            </span>
          );
        }

        // Get user answer (stored by item.id, value is option_text)
        const userAnswer = gaps[item.id] || '';
        // Find correct answer from item (answer_text is the definitive field from backend)
        const correctAnswer = item.answer_text || item.correct_option_text || item.correct_answer;
        const isCorrect = userAnswer === correctAnswer;
        
        if (isCorrect) correctCount++;

        // Add styled gap showing result
        parts.push(
          <Box 
            key={`gap-${item.id}-${index}`} 
            component="span" 
            sx={{ 
              display: 'inline-flex',
              alignItems: 'center',
              mx: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: userAnswer ? (isCorrect ? 'success.100' : 'error.100') : 'grey.100',
              border: '1px solid',
              borderColor: userAnswer ? (isCorrect ? 'success.main' : 'error.main') : 'grey.300',
              minWidth: 120,
              justifyContent: 'center'
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 600,
                color: userAnswer ? (isCorrect ? 'success.dark' : 'error.dark') : 'text.secondary',
                fontSize: '0.95rem'
              }}
            >
              {userAnswer || '-- Chọn từ --'}
            </Typography>
            {showCorrectAnswer && userAnswer && !isCorrect && (
              <Typography variant="caption" sx={{ ml: 1, color: 'success.dark', fontWeight: 500 }}>
                (→ {correctAnswer})
              </Typography>
            )}
          </Box>
        );

        lastIndex = gapIndex + gapPattern.length;
      }
    });

    // Add remaining text after all gaps
    if (lastIndex < content.length) {
      parts.push(
        <span key="text-end">
          {content.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : <Typography>{content}</Typography>;
  };

  return (
    <Box>
      {/* Score Summary */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip 
            label={`Score: ${correctCount}/${totalGaps}`}
            color={correctCount === totalGaps ? 'success' : correctCount > 0 ? 'warning' : 'error'}
            size="large"
          />
          <Chip 
            label={`${Math.round((correctCount / totalGaps) * 100)}% correct`}
            variant="outlined"
          />
        </Stack>
      </Box>

      {/* Question content with gaps (matching exam-taking exactly) */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
        <Typography 
          variant="body1" 
          component="div"
          sx={{ 
            lineHeight: 2,
            fontSize: '1rem',
            whiteSpace: 'pre-wrap'
          }}
        >
          {renderContentWithGaps()}
        </Typography>
      </Paper>

      {/* Available options reference (same as exam-taking) */}
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Available words:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
          {options.map(option => (
            <Chip 
              key={option.id} 
              label={option.option_text} 
              variant="outlined" 
              size="small"
              sx={{ 
                bgcolor: 'background.paper',
                border: '1px solid #e0e0e0'
              }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}