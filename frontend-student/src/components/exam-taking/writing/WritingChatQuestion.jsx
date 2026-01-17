'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
} from '@mui/material';

export default function WritingChatQuestion({ question, onAnswerChange }) {
  const [answers, setAnswers] = useState({
    personA: '',
    personB: ''
  });

  // Parse question content - separates context messages from reply prompts
  const questionData = React.useMemo(() => {
    try {
      // If content is text format, parse it
      if (typeof question.content === 'string' && !question.content.startsWith('{')) {
        // Parse the text content to extract chat exchanges with replies
        const lines = question.content.split('\n');
        const title = lines[0]?.trim() || "Chat Messages";
        
        // Build structured chat exchanges: [{speaker, message, hasReply}, ...]
        const chatExchanges = [];
        let i = 1; // Skip title
        
        while (i < lines.length) {
          const line = lines[i].trim();
          i++;
          
          // Skip empty lines, instructions with multiple words in parentheses
          if (!line) continue;
          const isInstruction = line.includes('(') && line.includes(')') && line.length > 50;
          if (isInstruction) continue;
          
          // Check if this is a speaker message (Name: message format)
          if (line.includes(':')) {
            const colonIndex = line.indexOf(':');
            const potentialName = line.substring(0, colonIndex).trim();
            const message = line.substring(colonIndex + 1).trim();
            
            // Validate name format
            const isValidName = /^[A-Za-z][A-Za-z\s]*$/.test(potentialName) && 
                               potentialName.length < 30 && 
                               message.length > 0 &&
                               !potentialName.toLowerCase().includes('your') &&
                               !potentialName.toLowerCase().includes('you');
            
            if (isValidName) {
              // Check if next line is "Your reply:" or contains underscore placeholders
              let hasReply = false;
              if (i < lines.length) {
                const nextLine = lines[i].trim();
                if (nextLine.toLowerCase().includes('your reply') || nextLine.includes('_')) {
                  hasReply = true;
                  i++; // Skip the "Your reply:" line
                }
              }
              
              chatExchanges.push({
                speaker: potentialName,
                message,
                hasReply
              });
            }
          }
        }
        
        return {
          title,
          chatExchanges
        };
      }
      
      // Legacy JSON format support
      return typeof question.content === 'string' ? JSON.parse(question.content) : question.content;
    } catch (error) {
      console.error('Failed to parse question content:', error);
      return null;
    }
  }, [question.content]);

  // Initialize answers from question.answer_data
  useEffect(() => {
    console.log('[WritingChatQuestion] Initializing for question:', question.id);
    
    if (question.answer_data && typeof question.answer_data === 'object') {
      if (question.answer_data.text_answer) {
        console.log('[WritingChatQuestion] Found existing answer:', question.answer_data.text_answer);
        
        const textAnswer = question.answer_data.text_answer;
        let personA = '';
        let personB = '';
        
        if (textAnswer.includes('Reply 1:') && textAnswer.includes('Reply 2:')) {
          const reply1Match = textAnswer.match(/Reply 1:\n([\s\S]*?)(?:\n\nReply 2:|$)/);
          const reply2Match = textAnswer.match(/Reply 2:\n([\s\S]*?)$/);
          personA = reply1Match ? reply1Match[1].trim() : '';
          personB = reply2Match ? reply2Match[1].trim() : '';
        } else {
          personA = textAnswer.trim();
          personB = '';
        }
        
        console.log('[WritingChatQuestion] Parsed replies:', { personA, personB });
        setAnswers({ personA, personB });
      } else {
        console.log('[WritingChatQuestion] No existing answer, resetting');
        setAnswers({ personA: '', personB: '' });
      }
    } else {
      console.log('[WritingChatQuestion] No answer_data, resetting');
      setAnswers({ personA: '', personB: '' });
    }
  }, [question.id, question.answer_data]);

  const handleAnswerChange = (personKey, value) => {
    console.log(`[WritingChatQuestion] Updating ${personKey}:`, value);
    
    const newAnswers = {
      ...answers,
      [personKey]: value
    };
    
    setAnswers(newAnswers);
    
    // Convert to formatted text for consistent storage
    const formattedText = `Reply 1:\n${newAnswers.personA}\n\nReply 2:\n${newAnswers.personB}`;
    
    console.log(`[WritingChatQuestion] Sending formatted answer:`, formattedText);
    
    // Send update to parent
    onAnswerChange({
      answer_type: 'text',
      text_answer: formattedText
    });
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  if (!questionData) {
    return <Box sx={{ p: 2 }}><Typography color="error">Không thể tải câu hỏi</Typography></Box>;
  }

  return (
    <Box sx={{ p: 2 }}>
      {questionData.chatExchanges && questionData.chatExchanges.length > 0 ? (
        questionData.chatExchanges.map((exchange, index) => (
          <div key={`exchange-${index}`} style={{ marginBottom: 24 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {exchange.speaker}:
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {exchange.message}
            </Typography>
            <TextField
              multiline
              fullWidth
              rows={2}
              value={answers[exchange.replyKey] || ''}
              onChange={(e) => handleAnswerChange(exchange.replyKey, e.target.value)}
              variant="outlined"
              placeholder="Nhập câu trả lời..."
              helperText={`${countWords(answers[exchange.replyKey] || '')} từ`}
              size="small"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  fontSize: '0.9rem'
                }
              }}
            />
          </div>
        ))
      ) : (
        <Typography color="textSecondary">Không có nội dung hội thoại</Typography>
      )}
    </Box>
  );
}