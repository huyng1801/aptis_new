'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
} from '@mui/material';

export default function WritingEmailQuestion({ question, onAnswerChange }) {
  const [answers, setAnswers] = useState({
    friendEmail: '',
    managerEmail: ''
  });

  // Parse question content
  const questionData = React.useMemo(() => {
    try {
      // If content is text format, parse it
      if (typeof question.content === 'string' && !question.content.startsWith('{')) {
        // Parse the text content to extract email information
        const lines = question.content.split('\n').filter(line => line.trim());
        const title = lines[0] || "Email Writing Task";
        
        // Extract email content between "From:" and "---"
        let inEmailSection = false;
        let emailLines = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line.startsWith('From:')) {
            inEmailSection = true;
            continue;
          }
          
          if (line.startsWith('---')) {
            inEmailSection = false;
            break;
          }
          
          if (inEmailSection) {
            emailLines.push(line);
          }
        }
        
        let managerEmail = { subject: "Email", body: "Please respond to this email." };
        if (emailLines.length > 0) {
          const subject = emailLines.find(line => line.startsWith('Subject:'))?.replace('Subject:', '').trim() || "Email";
          const bodyStartIndex = emailLines.findIndex(line => line.startsWith('Dear') || line.includes('student') || line.includes('applicant'));
          const body = bodyStartIndex >= 0 ? emailLines.slice(bodyStartIndex).join('\n\n') : emailLines.join('\n\n');
          
          managerEmail = { subject, body };
        }
        
        return {
          title,
          managerEmail,
          tasks: [
            { type: "friend", description: "Email to a friend (50 words)" },
            { type: "manager", description: "Email to manager (100-120 words)" }
          ]
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
    console.log('[WritingEmailQuestion] Initializing for question:', question.id);
    
    if (question.answer_data && typeof question.answer_data === 'object') {
      if (question.answer_data.text_answer) {
        console.log('[WritingEmailQuestion] Found existing answer:', question.answer_data.text_answer);
        
        // Parse structured text format: Friend Email:\n<content>\n\nManager Email:\n<content>
        const textAnswer = question.answer_data.text_answer;
        
        let friendEmail = '';
        let managerEmail = '';
        
        if (textAnswer.includes('Friend Email:') && textAnswer.includes('Manager Email:')) {
          // Standard format
          const friendMatch = textAnswer.match(/Friend Email:\n([\s\S]*?)(?:\n\nManager Email:|$)/);
          const managerMatch = textAnswer.match(/Manager Email:\n([\s\S]*?)$/);
          
          friendEmail = friendMatch ? friendMatch[1].trim() : '';
          managerEmail = managerMatch ? managerMatch[1].trim() : '';
        } else {
          // Fallback - treat as friend email if format doesn't match
          friendEmail = textAnswer.trim();
        }
        
        console.log('[WritingEmailQuestion] Parsed emails:', { friendEmail, managerEmail });
        setAnswers({ friendEmail, managerEmail });
      } else {
        console.log('[WritingEmailQuestion] No existing answer, resetting');
        setAnswers({ friendEmail: '', managerEmail: '' });
      }
    } else {
      console.log('[WritingEmailQuestion] No answer_data, resetting');
      setAnswers({ friendEmail: '', managerEmail: '' });
    }
  }, [question.id, question.answer_data]);

  const handleAnswerChange = (emailKey, value) => {
    console.log(`[WritingEmailQuestion] Updating ${emailKey}:`, value);
    
    const newAnswers = {
      ...answers,
      [emailKey]: value
    };
    
    setAnswers(newAnswers);
    
    // Convert to formatted text for consistent storage
    const formattedText = `Friend Email:\n${newAnswers.friendEmail}\n\nManager Email:\n${newAnswers.managerEmail}`;
    
    console.log(`[WritingEmailQuestion] Sending formatted answer:`, formattedText);
    
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

  const friendWordCount = countWords(answers.friendEmail);
  const managerWordCount = countWords(answers.managerEmail);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        {questionData.title}
      </Typography>

      {/* Manager Email - Simplified */}
      <Box sx={{ mb: 4, p: 2.5, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f5f5f5' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Email from Manager</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          From: manager@company.com
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Subject: {questionData.managerEmail.subject}
        </Typography>
        
        <Box sx={{ 
          bgcolor: 'white', 
          p: 2, 
          borderRadius: 0.5,
          border: '1px solid #e0e0e0',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.6,
          fontSize: '0.95rem'
        }}>
          {questionData.managerEmail.body}
        </Box>
      </Box>

      {/* Friend Email - Simplified */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Email to a Friend</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Write a casual email (50 words)</Typography>
        </Box>
        
        <TextField
          multiline
          fullWidth
          rows={4}
          value={answers.friendEmail}
          onChange={(e) => handleAnswerChange('friendEmail', e.target.value)}
          variant="outlined"
          placeholder="Dear Friend,

I wanted to tell you about..."
          sx={{
            mb: 1,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              fontSize: '0.95rem'
            }
          }}
        />
        
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {friendWordCount} words 
          {friendWordCount >= 45 && friendWordCount <= 55 ? ' ✓' : friendWordCount < 45 ? ` (need ${45 - friendWordCount} more)` : ` (${friendWordCount - 55} too many)`}
        </Typography>
      </Box>

      <Box sx={{ my: 3, borderTop: '1px solid #ddd' }} />

      {/* Manager Reply - Simplified */}
      <Box>
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Reply to Manager</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Write a professional email (100-120 words)</Typography>
        </Box>
        
        <TextField
          multiline
          fullWidth
          rows={5}
          value={answers.managerEmail}
          onChange={(e) => handleAnswerChange('managerEmail', e.target.value)}
          variant="outlined"
          placeholder="Dear Manager,

Thank you for your email..."
          sx={{
            mb: 1,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              fontSize: '0.95rem'
            }
          }}
        />
        
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {managerWordCount} words 
          {managerWordCount >= 100 && managerWordCount <= 120 ? ' ✓' : managerWordCount < 100 ? ` (need ${100 - managerWordCount} more)` : ` (${managerWordCount - 120} too many)`}
        </Typography>
      </Box>
    </Box>
  );
}