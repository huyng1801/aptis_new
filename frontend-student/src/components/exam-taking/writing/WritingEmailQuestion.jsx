'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Chip,
} from '@mui/material';

export default function WritingEmailQuestion({ question, onAnswerChange }) {
  const [answers, setAnswers] = useState({
    friendEmail: '',
    managerEmail: '',
    formalEmail: ''
  });

  // Parse question content from backend
  const questionData = React.useMemo(() => {
    try {
      if (typeof question.content !== 'string') {
        return null;
      }

      const content = question.content;
      
      // Extract title (first line)
      const firstNewlineIndex = content.indexOf('\n');
      const title = firstNewlineIndex > 0 ? content.substring(0, firstNewlineIndex).trim() : 'Email Writing Task';
      
      // Extract reference email (between "From:" and "---")
      const fromIndex = content.indexOf('From:');
      const endEmailIndex = content.indexOf('---');
      let managerEmail = { subject: "Email", body: "Please respond to this email." };
      
      if (fromIndex !== -1 && endEmailIndex !== -1) {
        const emailSection = content.substring(fromIndex, endEmailIndex).trim();
        const subjectMatch = emailSection.match(/Subject:\s*(.+?)(?:\n|$)/);
        const bodyMatch = emailSection.match(/(?:Dear|Hi)[\s\S]*$/);
        
        managerEmail = {
          subject: subjectMatch ? subjectMatch[1].trim() : "Email",
          body: bodyMatch ? bodyMatch[0].trim() : emailSection
        };
      }

      // Extract email tasks after "---"
      const tasksStartIndex = content.indexOf('---') + 3;
      const tasksContent = content.substring(tasksStartIndex).trim();
      
      // Parse tasks: "1. Email to a friend (50 words)" format
      const taskMatches = tasksContent.match(/(\d+)\.\s*(.+?)\s*\((.+?)\)/g);
      const tasks = [];
      
      if (taskMatches) {
        taskMatches.forEach((match, idx) => {
          const parts = match.match(/(\d+)\.\s*(.+?)\s*\((.+?)\)/);
          if (parts) {
            const taskType = ['friendEmail', 'managerEmail', 'formalEmail'][idx];
            tasks.push({
              type: taskType,
              description: parts[2].trim(),
              wordCount: parts[3].trim(),
              maxPoints: [5, 10, 15][idx]
            });
          }
        });
      }

      return {
        title,
        managerEmail,
        tasks: tasks.length > 0 ? tasks : null
      };
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
        
        const textAnswer = question.answer_data.text_answer;
        
        let friendEmail = '';
        let managerEmail = '';
        let formalEmail = '';
        
        if (textAnswer.includes('Friend Email:') && textAnswer.includes('Manager Email:') && textAnswer.includes('Formal Email:')) {
          const friendMatch = textAnswer.match(/Friend Email:\n([\s\S]*?)(?:\n\nManager Email:|$)/);
          const managerMatch = textAnswer.match(/Manager Email:\n([\s\S]*?)(?:\n\nFormal Email:|$)/);
          const formalMatch = textAnswer.match(/Formal Email:\n([\s\S]*?)$/);
          
          friendEmail = friendMatch ? friendMatch[1].trim() : '';
          managerEmail = managerMatch ? managerMatch[1].trim() : '';
          formalEmail = formalMatch ? formalMatch[1].trim() : '';
        } else {
          friendEmail = textAnswer.trim();
        }
        
        console.log('[WritingEmailQuestion] Parsed emails:', { friendEmail, managerEmail, formalEmail });
        setAnswers({ friendEmail, managerEmail, formalEmail });
      } else {
        console.log('[WritingEmailQuestion] No existing answer, resetting');
        setAnswers({ friendEmail: '', managerEmail: '', formalEmail: '' });
      }
    } else {
      console.log('[WritingEmailQuestion] No answer_data, resetting');
      setAnswers({ friendEmail: '', managerEmail: '', formalEmail: '' });
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
    const formattedText = `Friend Email:\n${newAnswers.friendEmail}\n\nManager Email:\n${newAnswers.managerEmail}\n\nFormal Email:\n${newAnswers.formalEmail}`;
    
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

  if (!questionData || !questionData.tasks) {
    return <Box sx={{ p: 2 }}><Typography color="error">Không thể tải câu hỏi</Typography></Box>;
  }

  const friendWordCount = countWords(answers.friendEmail);
  const managerWordCount = countWords(answers.managerEmail);
  const formalWordCount = countWords(answers.formalEmail);

  // Function to extract word count range as numbers
  const getWordCountRange = (text) => {
    const match = text.match(/(\d+)(?:-(\d+))?/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return { min, max };
    }
    return { min: 50, max: 50 };
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Reference Email from Backend */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Email Reference</Typography>
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

      {/* Render tasks dynamically from backend */}
      {questionData.tasks.map((task, idx) => {
        const wordCountRange = getWordCountRange(task.wordCount);
        const currentCount = task.type === 'friendEmail' ? friendWordCount : 
                           task.type === 'managerEmail' ? managerWordCount : 
                           formalWordCount;
        
        const isInRange = currentCount >= wordCountRange.min && currentCount <= wordCountRange.max;
        const feedbackText = isInRange 
          ? ' ✓'
          : currentCount < wordCountRange.min 
            ? ` (need ${wordCountRange.min - currentCount} more)`
            : ` (${currentCount - wordCountRange.max} too many)`;

        return (
          <Box key={idx} sx={{ mb: idx === questionData.tasks.length - 1 ? 0 : 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {task.description} ({task.wordCount})
            </Typography>
            <TextField
              multiline
              fullWidth
              rows={idx === 0 ? 4 : idx === 1 ? 5 : 6}
              value={answers[task.type]}
              onChange={(e) => handleAnswerChange(task.type, e.target.value)}
              variant="outlined"
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  fontSize: '0.95rem'
                }
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {currentCount} words{feedbackText}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}