'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material';

export default function OrderingQuestionResult({ answer, question, showCorrectAnswer = true }) {
  // Parse user answers from answer_data (matches exam-taking structure)  
  // exam-taking saves as: { ordered_items: [{ id, text, original_order }] }
  const userOrderData = answer.answer_data ? JSON.parse(answer.answer_data) : {};
  const userOrder = userOrderData.ordered_items || userOrderData.order || [];
  const items = question.items || [];
  
  // Get correct order from items based on answer_text field (contains correct position)
  const correctOrder = [...items].sort((a, b) => {
    // answer_text contains the correct position (1, 2, 3...) from backend
    const aOrder = parseInt(a.answer_text) || a.item_order || a.correct_position || a.correct_order || 0;
    const bOrder = parseInt(b.answer_text) || b.item_order || b.correct_position || b.correct_order || 0;
    return aOrder - bOrder;
  });
  
  // Calculate score - check if user order matches correct order
  const userOrderIds = Array.isArray(userOrder) && userOrder.length > 0 
    ? (typeof userOrder[0] === 'object' ? userOrder.map(item => item.id) : userOrder)
    : [];
  
  const isCompletelyCorrect = JSON.stringify(userOrderIds) === JSON.stringify(correctOrder.map(item => item.id));
  
  const correctPositions = userOrderIds.reduce((count, userItemId, userIndex) => {
    const correctIndex = correctOrder.findIndex(correctItem => correctItem.id === userItemId);
    return userIndex === correctIndex ? count + 1 : count;
  }, 0);

  return (
    <Box>
      {/* Instructions */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {question.content}
        </Typography>
      </Paper>

      {/* User's ordering */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Order:
          <Chip 
            label={isCompletelyCorrect ? 'Perfect!' : `${correctPositions}/${items.length} correct positions`}
            color={isCompletelyCorrect ? 'success' : correctPositions > 0 ? 'warning' : 'error'}
            sx={{ ml: 2 }}
          />
        </Typography>
        
        {userOrderIds.length > 0 ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {userOrderIds.map((itemId, userIndex) => {
              const item = items.find(i => i.id === itemId);
              const correctIndex = correctOrder.findIndex(i => i.id === itemId);
              const isInCorrectPosition = userIndex === correctIndex;
              
              return (
                <Chip
                  key={`${itemId}-${userIndex}`}
                  label={`${userIndex + 1}. ${item?.item_text || 'Unknown'}`}
                  color={isInCorrectPosition ? 'success' : 'error'}
                  variant={isInCorrectPosition ? 'filled' : 'outlined'}
                  sx={{ 
                    mb: 1,
                    fontWeight: isInCorrectPosition ? 600 : 400
                  }}
                />
              );
            })}
          </Stack>
        ) : (
          <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No ordering provided
          </Typography>
        )}
      </Box>

      {/* Correct ordering (if showing answers and user was wrong) */}
      {showCorrectAnswer && !isCompletelyCorrect && userOrderIds.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom color="success.dark">
            Correct Order:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {correctOrder.map((item, index) => (
              <Chip
                key={item.id}
                label={`${index + 1}. ${item.item_text}`}
                color="success"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* All available items for reference */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>All items:</Typography>
        <List>
          {items.map(item => (
            <ListItem key={item.id} sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}>
              <ListItemText primary={item.item_text} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
}