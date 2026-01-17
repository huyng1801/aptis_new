'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Paper,
  Divider
} from '@mui/material';

export default function ReadingMatchingHeadingsQuestion({ question, onAnswerChange }) {
  const [matches, setMatches] = useState({});

  // Initialize from existing answer or create empty matches
  useEffect(() => {
    if (question.answer_data?.answer_json) {
      try {
        const parsedData = JSON.parse(question.answer_data.answer_json);
        if (parsedData.matches) {
          setMatches(parsedData.matches);
          return;
        }
      } catch (error) {
        console.error('[ReadingMatchingHeadingsQuestion] Error parsing answer_json:', error);
      }
    }
    
    // Initialize empty matches
    if (question.items) {
      const initialMatches = {};
      question.items.forEach(item => {
        initialMatches[item.id] = '';
      });
      setMatches(initialMatches);
    }
  }, [question.id, question.answer_data?.answer_json, question.items]);

  const handleMatchChange = (itemId, optionText) => {
    const newMatches = { ...matches, [itemId]: optionText };
    setMatches(newMatches);
    
    onAnswerChange({
      answer_type: 'json',
      answer_json: JSON.stringify({ matches: newMatches })
    });
  };

  if (!question.content || !question.items || !question.options) {
    return (
      <Typography color="error">
        Dữ liệu câu hỏi không đầy đủ.
      </Typography>
    );
  }

  console.log('[ReadingMatchingHeadingsQuestion] Debug data:', {
    items: question.items,
    options: question.options,
    content: question.content
  });

  // Parse content to extract main content and paragraph sections
  const contentLines = question.content.split('\n');
  const instructionEndIndex = contentLines.findIndex(line => line.includes('Available Headings:'));
  const paragraphStartIndex = contentLines.findIndex(line => line.includes('PARAGRAPH'));

  const instructionText = contentLines.slice(0, instructionEndIndex).join('\n');
  const availableHeadings = question.options.map(option => option.option_text);
  
  // Extract paragraph content between PARAGRAPH markers
  const paragraphSections = [];
  let currentParagraph = null;
  
  for (let i = paragraphStartIndex; i < contentLines.length; i++) {
    const line = contentLines[i];
    if (line.startsWith('PARAGRAPH')) {
      if (currentParagraph) {
        paragraphSections.push(currentParagraph);
      }
      currentParagraph = {
        number: line.match(/PARAGRAPH (\d+)/)?.[1] || '1',
        content: []
      };
    } else if (currentParagraph && line.trim() !== '') {
      currentParagraph.content.push(line);
    }
  }
  
  if (currentParagraph) {
    paragraphSections.push(currentParagraph);
  }

  // Sort items by item_order to match paragraph order
  const sortedItems = [...question.items].sort((a, b) => a.item_order - b.item_order);

  return (
    <Box>
      {/* Instructions */}
      <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
        {instructionText}
      </Typography>

      {/* Paragraphs with Dropdown Selections */}
      {paragraphSections.map((paragraph, index) => {
        const correspondingItem = sortedItems[index];
        if (!correspondingItem) return null;

        return (
          <Paper key={`paragraph-${paragraph.number}`} elevation={1} sx={{ p: 2, mb: 2 }}>
            {/* Paragraph Header with Dropdown */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ mr: 2,minWidth: 100 }}>
                Paragraph {paragraph.number}:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 300 }}>
                <Select
                  value={matches[correspondingItem.id] || ''}
                  onChange={(e) => handleMatchChange(correspondingItem.id, e.target.value)}
                  displayEmpty
                  sx={{
                    backgroundColor: matches[correspondingItem.id] ? '#e3f2fd' : 'white',
                    '& .MuiSelect-select': {
                      fontWeight: matches[correspondingItem.id] ? 600 : 400
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>-- Chọn heading --</em>
                  </MenuItem>
                  {question.options.map((option) => (
                    <MenuItem key={option.id} value={option.option_text}>
                      {option.option_text}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Paragraph Content */}
            <Typography variant="body1" sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
              {paragraph.content.join(' ')}
            </Typography>
          </Paper>
        );
      })}

      {/* Available Headings List (moved below paragraphs) */}
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

      {/* Summary */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Hoàn thành {Object.values(matches).filter(Boolean).length}/{sortedItems.length} paragraphs
      </Typography>
    </Box>
  );
}
