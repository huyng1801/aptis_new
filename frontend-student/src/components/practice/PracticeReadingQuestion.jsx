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
  Chip
} from '@mui/material';
import {
  MenuBook,
  Assignment
} from '@mui/icons-material';

export default function PracticeReadingQuestion({ question, answer, onAnswerChange }) {
  const [localAnswer, setLocalAnswer] = useState(answer || {});

  useEffect(() => {
    setLocalAnswer(answer || {});
  }, [answer, question.question_id]);

  const handleAnswerChange = (newAnswer) => {
    setLocalAnswer(newAnswer);
    onAnswerChange(newAnswer);
  };

  const renderQuestion = () => {
    const questionType = question.question_type_name || question.type || question.question_type;
    
    switch (questionType) {
      case 'multiple_choice':
      case 'READING_MCQ':
        return renderMCQ();
      case 'gap_filling':
      case 'READING_GAP_FILL':
        return renderGapFilling();
      case 'matching':
      case 'READING_MATCHING':
        return renderMatching();
      case 'matching_headings':
      case 'READING_HEADING_MATCHING':
        return renderHeadingMatching();
      case 'ordering':
      case 'READING_ORDERING':
        return renderOrdering();
      default:
        return renderMCQ();
    }
  };

  const renderMCQ = () => {
    const options = question.question_options || question.options || [];
    
    return (
      <RadioGroup
        value={localAnswer || ''}
        onChange={(e) => handleAnswerChange(e.target.value)}
        sx={{ mt: 2 }}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.option_id || option.id}
            value={option.option_id?.toString() || option.id?.toString()}
            control={<Radio />}
            label={option.option_text || option.text}
            sx={{
              mb: 1,
              '& .MuiFormControlLabel-label': {
                fontSize: '1rem',
                lineHeight: 1.6
              }
            }}
          />
        ))}
      </RadioGroup>
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

      sortedItems.forEach((item, index) => {
        const gapNumber = item.item_number || (index + 1);
        const gapPattern = `[GAP${gapNumber}]`;
        
        const gapIndex = content.indexOf(gapPattern, lastIndex);
        
        if (gapIndex !== -1) {
          // Add text before gap
          if (gapIndex > lastIndex) {
            parts.push(
              <span key={`text-${item.item_id}-${index}`}>
                {content.substring(lastIndex, gapIndex)}
              </span>
            );
          }

          // Add dropdown for gap
          parts.push(
            <FormControl 
              key={`gap-${item.item_id}-${index}`} 
              size="small" 
              sx={{ 
                mx: 0.5,
                minWidth: 120,
                display: 'inline-flex',
                verticalAlign: 'middle'
              }}
            >
              <Select
                value={gaps[item.item_id] || ''}
                onChange={(e) => {
                  const newGaps = { ...gaps, [item.item_id]: e.target.value };
                  handleAnswerChange(newGaps);
                }}
                displayEmpty
                sx={{
                  height: 32,
                  fontSize: '0.95rem',
                  backgroundColor: gaps[item.item_id] ? '#e3f2fd' : 'white',
                  '& .MuiSelect-select': {
                    py: 0.5,
                    fontWeight: gaps[item.item_id] ? 600 : 400
                  }
                }}
              >
                <MenuItem value="">
                  <em>-- Choose word --</em>
                </MenuItem>
                {options.map((option) => (
                  <MenuItem key={option.option_id || option.id} value={option.option_text || option.text}>
                    {option.option_text || option.text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );

          lastIndex = gapIndex + gapPattern.length;
        }
      });

      // Add remaining text
      if (lastIndex < content.length) {
        parts.push(
          <span key="text-end">
            {content.substring(lastIndex)}
          </span>
        );
      }

      return parts.length > 0 ? parts : content;
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Typography 
          variant="body1" 
          component="div"
          sx={{ 
            lineHeight: 2,
            fontSize: '1rem',
            whiteSpace: 'pre-wrap'
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
      <Box sx={{ mt: 2 }}>
        {items.map((item, index) => (
          <Box key={item.item_id || index} sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
              {item.item_text || `Item ${index + 1}`}
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={matches[item.item_id] || ''}
                onChange={(e) => {
                  const newMatches = { ...matches, [item.item_id]: e.target.value };
                  handleAnswerChange(newMatches);
                }}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Select an option</em>
                </MenuItem>
                {options.map((option) => (
                  <MenuItem 
                    key={option.option_id || option.id} 
                    value={option.option_text || option.text}
                  >
                    {option.option_text || option.text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ))}
      </Box>
    );
  };

  const renderHeadingMatching = () => {
    const items = question.question_items || question.items || [];
    const options = question.question_options || question.options || [];
    const matches = localAnswer || {};

    return (
      <Box sx={{ mt: 2 }}>
        {items.map((item, index) => (
          <Paper key={item.item_id || index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Paragraph {index + 1}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
              {item.item_text || item.content}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={matches[item.item_id] || ''}
                onChange={(e) => {
                  const newMatches = { ...matches, [item.item_id]: e.target.value };
                  handleAnswerChange(newMatches);
                }}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Choose heading</em>
                </MenuItem>
                {options.map((option) => (
                  <MenuItem 
                    key={option.option_id || option.id} 
                    value={option.option_text || option.text}
                  >
                    {option.option_text || option.text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        ))}
      </Box>
    );
  };

  const renderOrdering = () => {
    const items = question.question_items || question.items || [];
    const orders = localAnswer || {};

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Put the following statements in the correct order (1 = first, {items.length} = last):
        </Typography>
        {items.map((item, index) => (
          <Box key={item.item_id || index} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              type="number"
              size="small"
              inputProps={{ min: 1, max: items.length }}
              value={orders[item.item_id] || ''}
              onChange={(e) => {
                const newOrders = { ...orders, [item.item_id]: e.target.value };
                handleAnswerChange(newOrders);
              }}
              sx={{ width: 80 }}
            />
            <Typography variant="body1">
              {item.item_text || `Statement ${index + 1}`}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Paper elevation={0} sx={{ p: 0 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2, 
          p: 2, 
          bgcolor: 'success.50',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'success.200'
        }}>
          <MenuBook sx={{ mr: 1, color: 'success.main' }} />
          <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 600 }}>
            Reading Question
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <Chip 
              label={question.question_type_name || question.type || 'Reading'} 
              size="small" 
              color="success"
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
          {question.content?.question_text || question.question_text || 'Read the text and answer the questions.'}
        </Typography>
        
        {(question.content?.passage || question.passage) && (
          <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              {question.content?.passage || question.passage}
            </Typography>
          </Paper>
        )}
      </Box>

      {renderQuestion()}
    </Paper>
  );
}