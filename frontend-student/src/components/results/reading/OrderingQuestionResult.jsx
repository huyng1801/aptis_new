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
  // Parse user answers from answer_json (matches exam-taking structure)  
  // exam-taking saves as: { ordered_items: [{ id, text, original_order }] }
  const userOrderData = answer.answer_json ? JSON.parse(answer.answer_json) : {};
  const userOrder = userOrderData.ordered_items || userOrderData.order || [];
  const items = question?.items || [];
  
  // Get correct order from items based on answer_text field (contains correct position)
  const correctOrder = [...items].sort((a, b) => {
    // answer_text contains the correct position (1, 2, 3...) from backend
    const aOrder = a.answer_text ? parseInt(a.answer_text) : (a.item_order || 0);
    const bOrder = b.answer_text ? parseInt(b.answer_text) : (b.item_order || 0);
    return aOrder - bOrder;
  });

  // Filter out instruction items (position <= 0)
  const orderableItems = correctOrder.filter(item => {
    const position = item.answer_text ? parseInt(item.answer_text) : 0;
    return position > 0;
  });
  
  // Calculate score - check if user order matches correct order
  const userOrderIds = Array.isArray(userOrder) && userOrder.length > 0 
    ? (typeof userOrder[0] === 'object' ? userOrder.map(item => item.id) : userOrder)
    : [];
  
  const correctOrderIds = orderableItems.map(item => item.id);
  const isCompletelyCorrect = JSON.stringify(userOrderIds) === JSON.stringify(correctOrderIds);
  
  const correctPositions = userOrderIds.reduce((count, userItemId, userIndex) => {
    const correctIndex = correctOrderIds.indexOf(userItemId);
    return userIndex === correctIndex ? count + 1 : count;
  }, 0);

  // Extract instruction from content
  const contentLines = question.content.split('\n');
  const instructionLine = contentLines.find(line => line.match(/^0\./));
  const instructionText = instructionLine ? instructionLine.replace(/^0\.\s*/, '') : '';
  
  // Filter out instruction lines for display
  const displayContent = contentLines
    .filter(line => !line.match(/^0\./) && line.trim() !== '')
    .join('\n');

  return (
    <Box>
      {/* Instruction text */}
      {instructionText && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd' }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {instructionText}
          </Typography>
        </Paper>
      )}

      {/* Content/passage to order */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
          {displayContent}
        </Typography>
      </Paper>

      {/* User's ordering */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Order:
          <Chip 
            label={isCompletelyCorrect ? 'Perfect!' : `${correctPositions}/${orderableItems.length} correct positions`}
            color={isCompletelyCorrect ? 'success' : correctPositions > 0 ? 'warning' : 'error'}
            sx={{ ml: 2 }}
          />
        </Typography>
        
        {userOrderIds.length > 0 ? (
          <Stack direction="column" spacing={1} sx={{ mb: 2 }}>
            {userOrderIds.map((itemId, userIndex) => {
              const item = orderableItems.find(i => i.id === itemId);
              const correctIndex = correctOrderIds.indexOf(itemId);
              const isInCorrectPosition = userIndex === correctIndex;
              
              return (
                <Chip
                  key={`${itemId}-${userIndex}`}
                  label={`${userIndex + 1}. ${item?.item_text || 'Unknown'}`}
                  color={isInCorrectPosition ? 'success' : 'error'}
                  variant={isInCorrectPosition ? 'filled' : 'outlined'}
                  icon={isInCorrectPosition ? undefined : undefined}
                  sx={{ 
                    width: '100%',
                    justifyContent: 'flex-start',
                    fontWeight: isInCorrectPosition ? 600 : 400,
                    padding: '20px 12px'
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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="success.dark">
            Correct Order:
          </Typography>
          <Stack direction="column" spacing={1}>
            {orderableItems.map((item, index) => (
              <Chip
                key={item.id}
                label={`${index + 1}. ${item.item_text}`}
                color="success"
                variant="outlined"
                sx={{ 
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '20px 12px'
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* All available items for reference - sorted by correct order */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>All items (in correct order):</Typography>
        <List>
          {orderableItems.map((item, index) => (
            <ListItem key={item.id} sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}>
              <ListItemText 
                primary={`${index + 1}. ${item.item_text}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
}