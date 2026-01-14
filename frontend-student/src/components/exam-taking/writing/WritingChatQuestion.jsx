'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
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
        // Parse the text content to extract chat context and reply prompts
        const lines = question.content.split('\n');
        const title = lines[0]?.trim() || "Chat Messages";
        
        // Separate context messages from reply prompts
        const contextMessages = [];
        const peopleInChat = new Set(); // Track unique people names
        const instructionKeywords = ['reply', 'your', 'response', 'chat', 'word', 'messages'];
        
        // First pass: Extract actual chat messages and identify people
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Skip empty lines, title, and instruction lines
          if (!line || line === title) continue;
          
          // Skip lines that contain instruction keywords
          const isInstruction = instructionKeywords.some(keyword => 
            line.toLowerCase().includes(keyword) && 
            (line.includes('(') || line.includes(')') || line.length > 100)
          );
          if (isInstruction) continue;
          
          // Check if this is a message (contains colon and a name)
          if (line.includes(':')) {
            const colonIndex = line.indexOf(':');
            const potentialName = line.substring(0, colonIndex).trim();
            const message = line.substring(colonIndex + 1).trim();
            
            // Valid name: alphanumeric, no numbers at start, reasonable length
            const isValidName = /^[A-Za-z][A-Za-z\s]*$/.test(potentialName) && 
                               potentialName.length < 30 && 
                               message.length > 0;
            
            if (isValidName) {
              contextMessages.push({
                user: potentialName,
                message
              });
              peopleInChat.add(potentialName);
            }
          }
        }
        
        // Create reply prompts only for people who appeared in context
        const replyPrompts = Array.from(peopleInChat).map(person => ({ user: person }));
        
        // If no people found, use defaults
        if (replyPrompts.length === 0) {
          replyPrompts.push({ user: 'Alex' }, { user: 'Sam' });
        }
        
        return {
          title,
          contextMessages,
          replyPrompts
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
        
        // Parse structured text format: Reply 1:\n<content>\n\nReply 2:\n<content>
        const textAnswer = question.answer_data.text_answer;
        
        // More robust parsing to handle different formats
        let personA = '';
        let personB = '';
        
        if (textAnswer.includes('Reply 1:') && textAnswer.includes('Reply 2:')) {
          // Standard format
          const reply1Match = textAnswer.match(/Reply 1:\n([\s\S]*?)(?:\n\nReply 2:|$)/);
          const reply2Match = textAnswer.match(/Reply 2:\n([\s\S]*?)$/);
          
          personA = reply1Match ? reply1Match[1].trim() : '';
          personB = reply2Match ? reply2Match[1].trim() : '';
        } else {
          // Fallback - treat as single reply for personA
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

  const personAWordCount = countWords(answers.personA);
  const personBWordCount = countWords(answers.personB);

  return (
    <Box sx={{ maxHeight: '100vh', overflow: 'auto', p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        {questionData.title}
      </Typography>

      {/* Chat Context - Read Only */}
      {questionData.contextMessages && questionData.contextMessages.length > 0 && (
        <Box sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.secondary' }}>
            Chat Context:
          </Typography>
          {questionData.contextMessages.map((msg, index) => (
            <Box key={`context-${index}`} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {msg.user}:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2, color: 'text.primary' }}>
                {msg.message}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Reply Prompts - Input Fields */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.secondary' }}>
          Your Replies:
        </Typography>
        
        <Grid container spacing={3}>
          {questionData.replyPrompts.map((prompt, index) => {
            const answerKey = index === 0 ? 'personA' : 'personB';
            const answerText = answers[answerKey] || '';
            const wordCount = countWords(answerText);
            
            return (
              <Grid item xs={12} key={`reply-${index}-${answerKey}`}>
                <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                    Reply to {prompt.user}:
                  </Typography>
                  
                  <TextField
                    multiline
                    fullWidth
                    rows={4}
                    value={answerText}
                    onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                    variant="outlined"
                    placeholder={`Type your reply here (30-40 words recommended)...`}
                    helperText={`${wordCount} words ${wordCount >= 30 && wordCount <= 40 ? '✓' : wordCount < 30 ? '(need more)' : '(too many)'}`}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.95rem',
                        lineHeight: 1.5,
                        backgroundColor: 'white'
                      }
                    }}
                  />
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}