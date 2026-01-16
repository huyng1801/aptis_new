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
  Divider,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';

export default function MatchingHeadingsQuestionResult({ answer, question, showCorrectAnswer = true }) {
  const matches = answer.answer_data ? JSON.parse(answer.answer_data)?.matches || {} : {};
  const items = question.items || [];
  const options = question.options || [];

  // Parse content to extract instruction and paragraph sections (same logic as exam-taking)
  const contentLines = question.content.split('\n');
  const instructionEndIndex = contentLines.findIndex(line => line.includes('Available Headings:'));
  const paragraphStartIndex = contentLines.findIndex(line => line.includes('PARAGRAPH'));

  const instructionText = contentLines.slice(0, instructionEndIndex).join('\n');
  const availableHeadings = options.map(option => option.option_text);
  
  // Extract paragraph content between PARAGRAPH markers (same logic as exam-taking)
  const paragraphSections = [];
  let currentParagraph = null;
  
  for (let i = paragraphStartIndex; i < contentLines.length; i++) {
    const line = contentLines[i];
    if (line.startsWith('PARAGRAPH')) {
      if (currentParagraph) {
        paragraphSections.push(currentParagraph);
      }
      currentParagraph = {
        title: line,
        content: ''
      };
    } else if (currentParagraph) {
      currentParagraph.content += line + '\n';
    }
  }
  
  if (currentParagraph) {
    paragraphSections.push(currentParagraph);
  }

  // Sort items by item_order to match paragraph order (same logic as exam-taking)
  const sortedItems = [...items].sort((a, b) => a.item_order - b.item_order);

  // Calculate correctness for each match
  const calculateResults = () => {
    const results = [];
    paragraphSections.forEach((paragraph, index) => {
      const correspondingItem = sortedItems[index];
      if (!correspondingItem) return;

      const userMatch = matches[correspondingItem.id] || matches[correspondingItem.item_number?.toString()];
      // Backend stores correct answer in answer_text field for matching headings
      const correctMatch = correspondingItem.answer_text || correspondingItem.correct_option_text || correspondingItem.correct_answer;
      const isCorrect = userMatch === correctMatch;
      
      results.push({
        itemId: correspondingItem.id,
        itemNumber: correspondingItem.item_number || (index + 1),
        paragraphTitle: paragraph.title,
        paragraphContent: paragraph.content.trim(),
        userMatch,
        correctMatch,
        isCorrect
      });
    });
    return results;
  };

  const results = calculateResults();
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = results.length;

  return (
    <Box>
      {/* Instructions */}
      <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
        {instructionText}
      </Typography>

      {/* Available Headings List (same as exam-taking) */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem', fontWeight: 600 }}>
          Available Headings:
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {availableHeadings.map((heading, index) => (
            <Typography key={index} component="li" variant="body2" sx={{ mb: 0.5 }}>
              {heading}
            </Typography>
          ))}
        </Box>
      </Paper>

      {/* Score summary */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip 
            label={`Score: ${correctCount}/${totalCount}`}
            color={correctCount === totalCount ? 'success' : correctCount > 0 ? 'warning' : 'error'}
            size="large"
          />
          <Chip 
            label={`${Math.round((correctCount / totalCount) * 100)}% correct`}
            variant="outlined"
          />
        </Stack>
      </Box>

      {/* Paragraphs with Results (matching exam-taking structure) */}
      {results.map((result, index) => (
        <Box key={result.itemId} sx={{ mb: 3 }}>
          <Paper sx={{
            p: 3,
            bgcolor: result.isCorrect ? 'success.50' : (result.userMatch ? 'error.50' : 'grey.50'),
            border: '1px solid',
            borderColor: result.isCorrect ? 'success.main' : (result.userMatch ? 'error.main' : 'grey.300')
          }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#1976d2' }}>
              {result.paragraphTitle}
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, textAlign: 'justify' }}>
              {result.paragraphContent}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: '100px' }}>
                Selected Heading:
              </Typography>
              <Typography variant="body2" sx={{ 
                px: 2, 
                py: 0.5, 
                borderRadius: 1, 
                bgcolor: 'white',
                border: '1px solid #ddd',
                flex: 1
              }}>
                {result.userMatch || 'Not answered'}
              </Typography>
              {result.isCorrect ? (
                <CheckCircle color="success" />
              ) : (
                <Cancel color="error" />
              )}
            </Box>

            {showCorrectAnswer && !result.isCorrect && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: '100px', color: 'success.dark' }}>
                  Correct Heading:
                </Typography>
                <Typography variant="body2" sx={{ 
                  px: 2, 
                  py: 0.5, 
                  borderRadius: 1, 
                  bgcolor: 'success.100',
                  border: '1px solid',
                  borderColor: 'success.main',
                  flex: 1,
                  color: 'success.dark',
                  fontWeight: 600
                }}>
                  {result.correctMatch}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      ))}

      {/* Progress indicator (same as exam-taking) */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Hoàn thành {correctCount}/{totalCount} paragraphs
      </Typography>
    </Box>
  );
}