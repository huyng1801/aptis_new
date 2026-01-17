'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';

export default function ReadingGapFillingQuestion({ question, onAnswerChange }) {
  const [gaps, setGaps] = useState({});

  // Initialize from existing answer or create empty gaps
  useEffect(() => {
    if (question.answer_data?.answer_json) {
      try {
        const parsedData = JSON.parse(question.answer_data.answer_json);
        if (parsedData.gaps) {
          setGaps(parsedData.gaps);
          return;
        }
      } catch (error) {
        console.error('[ReadingGapFillingQuestion] Error parsing answer_json:', error);
      }
    }
    
    // Initialize empty gaps
    if (question.items) {
      const initialGaps = {};
      question.items.forEach(item => {
        initialGaps[item.id] = '';
      });
      setGaps(initialGaps);
    }
  }, [question.id, question.answer_data?.answer_json, question.items]);

  const handleGapChange = (itemId, optionId) => {
    const newGaps = { ...gaps, [itemId]: optionId };
    setGaps(newGaps);
    
    onAnswerChange({
      answer_type: 'json',
      answer_json: JSON.stringify({ gaps: newGaps })
    });
  };

  if (!question.content || !question.items || !question.options) {
    return (
      <Typography color="error">
        Dữ liệu câu hỏi không đầy đủ.
      </Typography>
    );
  }

  // Parse content and replace [GAP1], [GAP2], etc. with dropdowns
  const renderContent = () => {
    let content = question.content;
    const parts = [];
    let lastIndex = 0;

    // Debug logging
    console.log('[ReadingGapFillingQuestion] Debug data:', {
      items: question.items,
      options: question.options,
      content: content
    });

    if (!question.items || question.items.length === 0) {
      console.error('[ReadingGapFillingQuestion] No items found');
      return content;
    }

    // Sort items by item_number if available, otherwise by item_order
    const sortedItems = [...question.items].sort((a, b) => {
      const aNum = a.item_number || a.item_order || 0;
      const bNum = b.item_number || b.item_order || 0;
      return aNum - bNum;
    });

    console.log('[ReadingGapFillingQuestion] Sorted items:', sortedItems);

    sortedItems.forEach((item, index) => {
      // Try both item_number and index-based gap patterns
      const gapNumber = item.item_number || (index + 1);
      const gapPattern = `[GAP${gapNumber}]`;
      
      console.log(`[ReadingGapFillingQuestion] Looking for pattern: ${gapPattern}`);
      
      const gapIndex = content.indexOf(gapPattern, lastIndex);
      
      if (gapIndex !== -1) {
        console.log(`[ReadingGapFillingQuestion] Found gap at index ${gapIndex}`);
        
        // Add text before gap
        if (gapIndex > lastIndex) {
          parts.push(
            <span key={`text-${item.id}-${index}`}>
              {content.substring(lastIndex, gapIndex)}
            </span>
          );
        }

        // Add dropdown for gap
        parts.push(
          <FormControl 
            key={`gap-${item.id}-${index}`} 
            size="small" 
            sx={{ 
              mx: 0.5,
              minWidth: 120,
              display: 'inline-flex',
              verticalAlign: 'middle'
            }}
          >
            <Select
              value={gaps[item.id] || ''}
              onChange={(e) => handleGapChange(item.id, e.target.value)}
              displayEmpty
              sx={{
                minWidth: 140,
                fontSize: '0.95rem',
                backgroundColor: gaps[item.id] ? '#e3f2fd' : 'white',
                '& .MuiSelect-select': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: gaps[item.id] ? 600 : 400
                }
              }}
            >
              <MenuItem value="">
                <em>-- Chọn từ --</em>
              </MenuItem>
              {question.options && question.options.length > 0 ? (
                question.options.map((option) => (
                  <MenuItem key={`opt-${option.id}`} value={option.option_text}>
                    {option.option_text}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="no-options" disabled>
                  <em>Không có từ nào</em>
                </MenuItem>
              )}
            </Select>
          </FormControl>
        );

        lastIndex = gapIndex + gapPattern.length;
      } else {
        console.warn(`[ReadingGapFillingQuestion] Gap pattern ${gapPattern} not found in content from index ${lastIndex}`);
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

    console.log('[ReadingGapFillingQuestion] Generated parts:', parts.length);
    
    // If no parts were generated, return the original content
    if (parts.length === 0) {
      console.warn('[ReadingGapFillingQuestion] No parts generated, returning original content');
      return content;
    }

    return parts;
  };

  return (
    <Box>
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
}
