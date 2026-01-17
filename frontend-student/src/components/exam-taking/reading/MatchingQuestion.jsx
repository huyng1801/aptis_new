'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';

export default function ReadingMatchingQuestion({ question, onAnswerChange }) {
  const [matches, setMatches] = useState({});
  const [matchingType, setMatchingType] = useState('person'); // 'person' or 'text'

  useEffect(() => {
    // Detect matching type based on content
    const isTextMatching = question.content && question.content.includes('Short Texts:');
    setMatchingType(isTextMatching ? 'text' : 'person');

    if (question.answer_data?.answer_json) {
      try {
        const parsed = JSON.parse(question.answer_data.answer_json);
        if (parsed.matches) {
          setMatches(parsed.matches);
          return;
        }
      } catch (error) {
        console.error('[ReadingMatchingQuestion] Error parsing answer_json:', error);
      }
    }
    
    if (question.items) {
      const initialMatches = {};
      question.items.forEach(item => {
        initialMatches[item.id] = '';
      });
      setMatches(initialMatches);
    }
  }, [question.id, question.answer_data?.answer_json, question.items, question.content]);

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

  // ========== SHORT TEXT MATCHING ==========
  if (matchingType === 'text') {
    console.log('[ReadingMatchingQuestion] Rendering SHORT TEXT MATCHING');
    
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

    // Sort items by item_order
    const sortedItems = [...question.items].sort((a, b) => a.item_order - b.item_order);

    return (
      <Box>
        {/* Instructions */}
        <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
          {instruction}
        </Typography>


        {sortedItems.map((item, index) => (
          <Box key={`text-item-${item.id}`} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Typography variant="body1" sx={{ flex: 1, minWidth: 300, pt: 1 }}>
              <strong>Text {index + 1}:</strong> {item.item_text}
            </Typography>
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={matches[item.id] || ''}
                onChange={(e) => handleMatchChange(item.id, e.target.value)}
                displayEmpty
                sx={{
                  backgroundColor: matches[item.id] ? '#e3f2fd' : 'white',
                  '& .MuiSelect-select': {
                    fontWeight: matches[item.id] ? 600 : 400
                  }
                }}
              >
                <MenuItem value="">
                  <em>-- Chọn --</em>
                </MenuItem>
                {question.options.map((option) => (
                  <MenuItem key={option.id} value={option.option_text}>
                    {option.option_text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ))}

        {/* Summary */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Hoàn thành {Object.values(matches).filter(Boolean).length}/{sortedItems.length} câu hỏi
        </Typography>
      </Box>
    );
  }

  // ========== PERSON MATCHING (Original) ==========
  console.log('[ReadingMatchingQuestion] Rendering PERSON MATCHING');
  
  const contentLines = question.content.split('\n').filter(line => line.trim() !== '');
  
  // Extract person descriptions (Person A, Person B, etc.)
  const personDescriptions = [];
  
  let currentPerson = null;
  let instructionText = '';
  let collectingInstruction = true;
  
  for (const line of contentLines) {
    if (line.startsWith('Person ')) {
      // Save previous person if exists
      if (currentPerson) {
        personDescriptions.push(currentPerson);
      }
      
      collectingInstruction = false;
      
      // Extract person letter and start new person
      const personMatch = line.match(/Person ([A-Z]):/);
      if (personMatch) {
        currentPerson = {
          letter: personMatch[1],
          description: line.substring(personMatch[0].length).trim()
        };
      }
    } else if (line.includes('Match the following') || line.includes('→')) {
      // Save last person if exists
      if (currentPerson) {
        personDescriptions.push(currentPerson);
        currentPerson = null;
      }
      collectingInstruction = false;
      // Skip question matching lines as they are handled by items
    } else if (collectingInstruction && line.trim() !== '') {
      // Collect instruction text before first Person
      instructionText += (instructionText ? '\n' : '') + line;
    } else if (currentPerson && !line.includes('→') && !line.includes('Match the following') && line.trim() !== '') {
      // Continue current person's description
      currentPerson.description += ' ' + line;
    }
  }
  
  // Add last person if exists
  if (currentPerson) {
    personDescriptions.push(currentPerson);
  }

  // Default instruction if not found
  if (!instructionText.trim()) {
    instructionText = 'Match the following questions with the correct person.';
  }

  console.log('[ReadingMatchingQuestion] Debug data:', {
    items: question.items,
    options: question.options,
    content: question.content,
    personDescriptions: personDescriptions,
    instructionText: instructionText
  });

  // Sort items by item_order to match question order  
  const sortedItems = [...question.items].sort((a, b) => a.item_order - b.item_order);

  return (
    <Box>
      {/* Instructions */}
      <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
        {instructionText}
      </Typography>

      {/* Person Descriptions */}
      {personDescriptions.length > 0 ? (
        personDescriptions.map((person) => (
          <Paper key={`person-${person.letter}`} elevation={1} sx={{ p: 1.2, mb: 1.2 }}>
            <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600, color: '#1976d2' }}>
              Person {person.letter}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.5, textAlign: 'justify' }}>
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

      {/* Questions with Dropdowns */}
      <Typography variant="h6" sx={{ mb: 2}}>
        Match each question with the correct person:
      </Typography>

      {sortedItems.map((item, index) => (
        <Box key={`question-${item.id}`} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" sx={{ flex: 1, minWidth: 300 }}>
            <strong>{index + 1}.</strong> {item.item_text}
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={matches[item.id] || ''}
              onChange={(e) => handleMatchChange(item.id, e.target.value)}
              displayEmpty
              sx={{
                backgroundColor: matches[item.id] ? '#e3f2fd' : 'white',
                '& .MuiSelect-select': {
                  fontWeight: matches[item.id] ? 600 : 400
                }
              }}
            >
              <MenuItem value="">
                <em>-- Chọn --</em>
              </MenuItem>
              {question.options.map((option) => (
                <MenuItem key={option.id} value={option.option_text}>
                  {option.option_text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      ))}

      {/* Summary */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Hoàn thành {Object.values(matches).filter(Boolean).length}/{sortedItems.length} câu hỏi
      </Typography>
    </Box>
  );
}
