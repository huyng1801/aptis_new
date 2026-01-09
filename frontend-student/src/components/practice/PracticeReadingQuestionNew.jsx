'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  FormControl,
  TextField,
  Paper,
  Divider,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  MenuBook,
  Assignment
} from '@mui/icons-material';

export default function PracticeReadingQuestionNew({ question, answer, onAnswerChange }) {
  const [localAnswer, setLocalAnswer] = useState(answer || {});

  useEffect(() => {
    setLocalAnswer(answer || {});
  }, [answer, question.question_id]);

  const handleAnswerChange = (newAnswer) => {
    setLocalAnswer(newAnswer);
    onAnswerChange(newAnswer);
  };

  // Get question type from various possible locations
  const getQuestionType = () => {
    return question.question_type_name || 
           question.type || 
           question.question_type || 
           question.question_type?.code ||
           'READING_MCQ';
  };

  const renderMCQ = () => {
    const options = question.question_options || question.options || [];
    
    return (
      <Box sx={{ mt: 3 }}>
        <RadioGroup
          value={localAnswer || ''}
          onChange={(e) => handleAnswerChange(e.target.value)}
        >
          {options.map((option) => (
            <FormControlLabel
              key={option.option_id || option.id}
              value={option.option_id?.toString() || option.id?.toString()}
              control={<Radio />}
              label={option.option_text || option.text}
              sx={{
                mb: 1.5,
                '& .MuiFormControlLabel-label': {
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  color: 'text.primary'
                }
              }}
            />
          ))}
        </RadioGroup>
      </Box>
    );
  };

  const renderGapFilling = () => {
    const items = question.question_items || question.items || [];
    const options = question.question_options || question.options || [];
    const gaps = localAnswer || {};

    const renderContent = () => {
      let content = question.content?.text || question.content || question.question_text || '';
      const parts = [];
      let lastIndex = 0;

      // Sort items by item_number or item_order
      const sortedItems = [...items].sort((a, b) => {
        const aNum = a.item_number || a.item_order || 0;
        const bNum = b.item_number || b.item_order || 0;
        return aNum - bNum;
      });

      sortedItems.forEach((item) => {
        const gapMarker = `[GAP${item.item_number || item.item_order}]`;
        const index = content.indexOf(gapMarker, lastIndex);
        
        if (index !== -1) {
          // Add text before gap
          if (index > lastIndex) {
            parts.push(content.substring(lastIndex, index));
          }
          
          // Add gap selector
          parts.push(
            <FormControl size="small" sx={{ mx: 0.5, minWidth: 120 }} key={item.id}>
              <Select
                value={gaps[item.id] || ''}
                onChange={(e) => {
                  const newGaps = { ...gaps, [item.id]: e.target.value };
                  handleAnswerChange(newGaps);
                }}
                displayEmpty
                sx={{ 
                  backgroundColor: 'background.paper',
                  '& .MuiSelect-select': {
                    py: 0.5
                  }
                }}
              >
                <MenuItem value="">
                  <em>Choose...</em>
                </MenuItem>
                {options.map((option) => (
                  <MenuItem 
                    key={option.option_id || option.id} 
                    value={option.option_id || option.id}
                  >
                    {option.option_text || option.text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
          
          lastIndex = index + gapMarker.length;
        }
      });

      // Add remaining text
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      return parts;
    };

    return (
      <Box sx={{ mt: 3 }}>
        <Typography 
          variant="body1" 
          sx={{ 
            lineHeight: 1.8,
            '& > *': { display: 'inline' }
          }}
        >
          {renderContent()}
        </Typography>
      </Box>
    );
  };

  const renderMatching = () => {
    const items = question.question_items || question.items || [];
    const options = question.question_options || question.options || [];
    const matches = localAnswer || {};

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Match each item on the left with the correct option on the right:
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Left Column - Items */}
          <Paper sx={{ flex: 1, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Items
            </Typography>
            {items.map((item, index) => (
              <Box key={item.id} sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {String.fromCharCode(65 + index)}.
                </Typography>
                <Typography variant="body1">
                  {item.item_text || item.text}
                </Typography>
              </Box>
            ))}
          </Paper>

          {/* Right Column - Options with dropdowns */}
          <Paper sx={{ flex: 1, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Your Answers
            </Typography>
            {items.map((item, index) => (
              <Box key={item.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 24 }}>
                    {String.fromCharCode(65 + index)}:
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={matches[item.id] || ''}
                      onChange={(e) => {
                        const newMatches = { ...matches, [item.id]: e.target.value };
                        handleAnswerChange(newMatches);
                      }}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Select an option...</em>
                      </MenuItem>
                      {options.map((option) => (
                        <MenuItem 
                          key={option.option_id || option.id} 
                          value={option.option_id || option.id}
                        >
                          {option.option_text || option.text}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>
    );
  };

  const renderHeadingMatching = () => {
    const items = question.question_items || question.items || [];
    const options = question.question_options || question.options || [];
    const headings = localAnswer || {};

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Choose a heading for each paragraph from the dropdown:
        </Typography>
        
        {items.map((item, index) => (
          <Paper key={item.id} sx={{ p: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Paragraph {index + 1}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={headings[item.id] || ''}
                  onChange={(e) => {
                    const newHeadings = { ...headings, [item.id]: e.target.value };
                    handleAnswerChange(newHeadings);
                  }}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Choose heading...</em>
                  </MenuItem>
                  {options.map((option) => (
                    <MenuItem 
                      key={option.option_id || option.id} 
                      value={option.option_id || option.id}
                    >
                      {option.option_text || option.text}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              {item.item_text || item.text}
            </Typography>
          </Paper>
        ))}
      </Box>
    );
  };

  const renderOrdering = () => {
    const items = question.question_items || question.items || [];
    const order = localAnswer || {};

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Put the sentences in the right order (1 = first, {items.length} = last):
        </Typography>
        
        {items.map((item, index) => (
          <Paper key={item.id} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={order[item.id] || ''}
                onChange={(e) => {
                  const newOrder = { ...order, [item.id]: e.target.value };
                  handleAnswerChange(newOrder);
                }}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Order</em>
                </MenuItem>
                {Array.from({ length: items.length }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {i + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Typography variant="body1" sx={{ flex: 1 }}>
              {item.item_text || item.text}
            </Typography>
          </Paper>
        ))}
      </Box>
    );
  };

  const renderQuestion = () => {
    const questionType = getQuestionType();
    
    switch (questionType) {
      case 'READING_MCQ':
      case 'multiple_choice':
        return renderMCQ();
      case 'READING_GAP_FILL':
      case 'gap_filling':
        return renderGapFilling();
      case 'READING_MATCHING':
      case 'matching':
        return renderMatching();
      case 'READING_MATCHING_HEADINGS':
      case 'matching_headings':
        return renderHeadingMatching();
      case 'READING_ORDERING':
      case 'ordering':
        return renderOrdering();
      default:
        return renderMCQ();
    }
  };

  const questionType = getQuestionType();
  const questionText = question.question_text || question.content?.text || question.content;

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 3 }}>
        {/* Question Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <MenuBook color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Reading Question
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={questionType} 
                size="small" 
                variant="outlined"
                color="primary"
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Question Text */}
        {questionText && (
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                color: 'text.primary'
              }}
            >
              {questionText}
            </Typography>
          </Box>
        )}

        {/* Question Content */}
        {renderQuestion()}
      </CardContent>
    </Card>
  );
}