'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';

export default function MatchingQuestionResult({ answer, question, showCorrectAnswer = true }) {
  const matches = answer.answer_data ? JSON.parse(answer.answer_data)?.matches || {} : {};
  const options = question.options || [];
  const items = question.items || [];

  // Detect matching type based on content (same logic as exam-taking)
  const isTextMatching = question.content && question.content.includes('Short Texts:');
  const matchingType = isTextMatching ? 'text' : 'person';

  if (matchingType === 'text') {
    // ========== SHORT TEXT MATCHING ==========
    const contentLines = question.content.split('\n').filter(line => line.trim() !== '');
    
    // Extract instruction
    let instruction = '';
    let shortTextsStart = -1;
    
    for (let i = 0; i < contentLines.length; i++) {
      if (contentLines[i].includes('Short Texts:')) {
        shortTextsStart = i;
        instruction = contentLines.slice(0, i).join(' ').trim();
        break;
      }
    }

    if (!instruction.trim()) {
      instruction = 'Match each short text with the correct description.';
    }

    // Sort items by item_order (same as exam-taking)
    const sortedItems = [...items].sort((a, b) => a.item_order - b.item_order);

    return (
      <Box>
        {/* Instructions */}
        <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
            {instruction}
          </Typography>
        </Paper>

        {/* Text Matching Results */}
        {sortedItems.map((item, index) => {
          const userMatch = matches[item.id];
          // Backend stores correct answer in answer_text field, or use correct_option_text
          const correctMatch = item.answer_text || item.correct_option_text || item.correct_answer;
          const isCorrect = userMatch === correctMatch;

          return (
            <Box key={`text-item-${item.id}`} sx={{ mb: 2 }}>
              <Paper sx={{
                p: 2,
                bgcolor: isCorrect ? 'success.50' : (userMatch ? 'error.50' : 'grey.50'),
                border: '1px solid',
                borderColor: isCorrect ? 'success.main' : (userMatch ? 'error.main' : 'grey.300')
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Typography variant="body1" sx={{ flex: 1, minWidth: 300 }}>
                    <strong>Text {index + 1}:</strong> {item.item_text}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ 
                      px: 2, 
                      py: 0.5, 
                      borderRadius: 1, 
                      bgcolor: 'white',
                      border: '1px solid #ddd'
                    }}>
                      {userMatch || 'Not answered'}
                    </Typography>
                    {isCorrect ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Cancel color="error" />
                    )}
                  </Box>
                </Box>

                {showCorrectAnswer && !isCorrect && (
                  <Typography variant="body2" color="success.dark">
                    <strong>Correct answer:</strong> {correctMatch}
                  </Typography>
                )}
              </Paper>
            </Box>
          );
        })}

        {/* Available descriptions */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Available descriptions:
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={1}>
              {options.map((option, index) => (
                <Grid item xs={12} sm={6} key={option.id}>
                  <Typography variant="body2">
                    {String.fromCharCode(65 + index)}. {option.option_text}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      </Box>
    );
  }

  // ========== PERSON MATCHING (Original) ==========
  const contentLines = question.content.split('\n').filter(line => line.trim() !== '');
  
  // Extract person descriptions and instruction (same logic as exam-taking)
  const personDescriptions = [];
  let currentPerson = null;
  let instructionText = '';
  let collectingInstruction = true;
  
  for (const line of contentLines) {
    if (line.match(/^Person [A-Z]:/)) {
      collectingInstruction = false;
      if (currentPerson) {
        personDescriptions.push(currentPerson);
      }
      const letter = line.match(/^Person ([A-Z]):/)[1];
      currentPerson = {
        letter: letter,
        description: line.replace(/^Person [A-Z]: /, '')
      };
    } else if (currentPerson && !collectingInstruction) {
      currentPerson.description += ' ' + line.trim();
    } else if (collectingInstruction && line.trim()) {
      instructionText += line + ' ';
    }
  }
  
  if (currentPerson) {
    personDescriptions.push(currentPerson);
  }

  if (!instructionText.trim()) {
    instructionText = 'Four people share their thoughts. Read and match each question with the correct person.';
  }

  // Sort items by item_order (same as exam-taking)
  const sortedItems = [...items].sort((a, b) => a.item_order - b.item_order);

  return (
    <Box>
      {/* Instructions */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
          {instructionText.trim()}
        </Typography>
      </Paper>

      {/* Person Descriptions */}
      {personDescriptions.length > 0 ? (
        personDescriptions.map((person) => (
          <Paper key={`person-${person.letter}`} elevation={1} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#1976d2' }}>
              Person {person.letter}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, textAlign: 'justify' }}>
              {person.description}
            </Typography>
          </Paper>
        ))
      ) : (
        <Typography color="error" sx={{ mb: 2 }}>
          Không tìm thấy thông tin của các người (Person A, B, C, D).
        </Typography>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Question Matching Results */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Match each question with the correct person:
      </Typography>

      {sortedItems.map((item, index) => {
        const userMatch = matches[item.id];
        // Backend stores correct answer in answer_text field for person matching
        const correctMatch = item.answer_text || item.correct_option_text || item.correct_answer;
        const isCorrect = userMatch === correctMatch;

        return (
          <Box key={`question-${item.id}`} sx={{ mb: 2 }}>
            <Paper sx={{
              p: 2,
              bgcolor: isCorrect ? 'success.50' : (userMatch ? 'error.50' : 'grey.50'),
              border: '1px solid',
              borderColor: isCorrect ? 'success.main' : (userMatch ? 'error.main' : 'grey.300')
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1" sx={{ flex: 1, minWidth: 300 }}>
                  <strong>{index + 1}.</strong> {item.item_text}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
                  <Typography variant="body2" sx={{ 
                    px: 2, 
                    py: 0.5, 
                    borderRadius: 1, 
                    bgcolor: 'white',
                    border: '1px solid #ddd',
                    fontWeight: 600
                  }}>
                    {userMatch || 'Not answered'}
                  </Typography>
                  {isCorrect ? (
                    <CheckCircle color="success" />
                  ) : (
                    <Cancel color="error" />
                  )}
                </Box>
              </Box>

              {showCorrectAnswer && !isCorrect && (
                <Typography variant="body2" color="success.dark" sx={{ mt: 1 }}>
                  <strong>Correct answer:</strong> {correctMatch}
                </Typography>
              )}
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
}