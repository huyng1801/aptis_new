'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
} from '@mui/material';

export default function WritingChatQuestion({ question, onAnswerChange }) {
  const [answers, setAnswers] = useState({});
  const debounceTimers = useRef({}); // Track debounce timers for each reply
  const isInitialized = useRef(false); // Track if we've initialized once

  // Parse question content - separates context messages from reply prompts
  const questionData = React.useMemo(() => {
    try {
      // If content is text format, parse it
      if (typeof question.content === 'string' && !question.content.startsWith('{')) {
        // Parse the text content to extract chat exchanges with replies
        const lines = question.content.split('\n');
        const title = lines[0]?.trim() || "Chat Messages";
        
        // Build structured chat exchanges: [{speaker, message, hasReply, replyKey}, ...]
        const chatExchanges = [];
        let replyIndex = 0; // Counter for unique reply keys
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
              
              // Generate unique reply key for this exchange
              const replyKey = hasReply ? `reply_${replyIndex}` : null;
              if (hasReply) {
                replyIndex++;
              }
              
              chatExchanges.push({
                speaker: potentialName,
                message,
                hasReply,
                replyKey
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

  // Initialize answers from question.answer_data - ONLY on mount
  useEffect(() => {
    console.log('[WritingChatQuestion] Initializing for question:', question.id);
    
    if (!questionData || !questionData.chatExchanges) {
      setAnswers({});
      return;
    }
    
    // Initialize answers object with all reply keys
    const initialAnswers = {};
    questionData.chatExchanges.forEach(exchange => {
      if (exchange.hasReply && exchange.replyKey) {
        initialAnswers[exchange.replyKey] = '';
      }
    });
    
    if (question.answer_data && typeof question.answer_data === 'object') {
      if (question.answer_data.text_answer) {
        console.log('[WritingChatQuestion] Found existing answer:', question.answer_data.text_answer);
        
        const textAnswer = question.answer_data.text_answer;
        
        // Parse replies based on pattern "Reply N:"
        const replyMatches = textAnswer.match(/Reply \d+:\n([\s\S]*?)(?=Reply \d+:|$)/g);
        
        if (replyMatches && replyMatches.length > 0) {
          replyMatches.forEach((match, idx) => {
            const replyKey = `reply_${idx}`;
            const replyContent = match.replace(/Reply \d+:\n/, '').trim();
            initialAnswers[replyKey] = replyContent;
          });
          console.log('[WritingChatQuestion] Parsed replies:', initialAnswers);
        }
      } else {
        console.log('[WritingChatQuestion] No existing answer, using empty');
      }
    }
    
    setAnswers(initialAnswers);
    isInitialized.current = true;
  }, [question.id]); // ONLY depend on question.id, not answer_data

  const handleAnswerChange = (replyKey, value) => {
    console.log(`[WritingChatQuestion] Updating ${replyKey}:`, value);
    
    const newAnswers = {
      ...answers,
      [replyKey]: value
    };
    
    // Update local state immediately - this is what the user sees
    setAnswers(newAnswers);
    
    // Clear existing debounce timer for this reply
    if (debounceTimers.current[replyKey]) {
      clearTimeout(debounceTimers.current[replyKey]);
    }
    
    // Set new debounce timer - but don't save yet, just schedule
    // We'll save on blur or unmount instead
    debounceTimers.current[replyKey] = setTimeout(() => {
      console.log(`[WritingChatQuestion] Debounce timer ready for ${replyKey}`);
    }, 300); // Just a buffer, actual save happens on blur
  };

  const saveAnswers = (answersToSave) => {
    // Build reply text with proper numbering based on reply keys in order
    const replyKeys = Object.keys(answersToSave).sort();
    let formattedText = '';
    replyKeys.forEach((key, idx) => {
      const replyNum = idx + 1;
      formattedText += `Reply ${replyNum}:\n${answersToSave[key]}`;
      if (idx < replyKeys.length - 1) {
        formattedText += '\n\n';
      }
    });
    
    console.log(`[WritingChatQuestion] Saving formatted answer:`, formattedText);
    
    // Send update to parent
    onAnswerChange({
      answer_type: 'text',
      text_answer: formattedText
    });
  };

  const handleInputBlur = (replyKey) => {
    console.log(`[WritingChatQuestion] Input blur for ${replyKey}`);
    
    // Clear existing debounce timer
    if (debounceTimers.current[replyKey]) {
      clearTimeout(debounceTimers.current[replyKey]);
    }
    
    // Save current answers immediately on blur
    console.log(`[WritingChatQuestion] Saving on blur:`, answers);
    saveAnswers(answers);
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Cleanup timers on unmount and save final answer
  useEffect(() => {
    return () => {
      console.log(`[WritingChatQuestion] Component unmounting, saving final answer`);
      
      // Clear all timers
      Object.values(debounceTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
      
      // Save final answer on unmount
      if (isInitialized.current && Object.keys(answers).length > 0) {
        saveAnswers(answers);
      }
    };
  }, [answers]); // Depend on answers to capture the latest state

  if (!questionData) {
    return <Box sx={{ p: 2 }}><Typography color="error">Không thể tải câu hỏi</Typography></Box>;
  }

  return (
    <Box sx={{ p: 2 }}>
      {questionData && questionData.chatExchanges && questionData.chatExchanges.length > 0 ? (
        questionData.chatExchanges.map((exchange, index) => (
          <div key={`exchange-${index}`} style={{ marginBottom: 24 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {exchange.speaker}:
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {exchange.message}
            </Typography>
            {exchange.hasReply && exchange.replyKey && (
              <TextField
                multiline
                fullWidth
                rows={2}
                value={answers[exchange.replyKey] || ''}
                onChange={(e) => handleAnswerChange(exchange.replyKey, e.target.value)}
                onBlur={() => handleInputBlur(exchange.replyKey)}
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
            )}
          </div>
        ))
      ) : (
        <Typography color="textSecondary">Không có nội dung hội thoại</Typography>
      )}
    </Box>
  );
}