'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';

export default function WritingEmailQuestion({ question, onAnswerChange }) {
  const [answers, setAnswers] = useState({
    friendEmail: '',
    managerEmail: ''
  });

  // Parse question content
  const questionData = React.useMemo(() => {
    try {
      return typeof question.content === 'string' ? JSON.parse(question.content) : question.content;
    } catch (error) {
      console.error('Failed to parse question content:', error);
      return {
        title: "Book Club Author Event",
        description: "You are a member of the book club. You received this email from the club's manager.",
        managerEmail: {
          subject: "Author Event Planning",
          body: "Dear member,\n\nOur club wants to organize an event for the public by inviting a famous author as a speaker. What kind of author do you suggest? What topic should the speaker speak on?\n\nI am writing to ask all members for their suggestions. Please send me your ideas in an email.\n\nThe manager."
        },
        tasks: [
          {
            type: "friend",
            description: "Write an email to your friend, who is also a member of the group. (50 words)",
            wordLimit: 50
          },
          {
            type: "manager", 
            description: "Write an email to the manager of the club. Tell the manager about your opinion. (120-150 words)",
            wordLimit: {min: 120, max: 150}
          }
        ]
      };
    }
  }, [question.content]);

  // Initialize answers from question.answer_data
  useEffect(() => {
    if (question.answer_data && typeof question.answer_data === 'object') {
      if (question.answer_data.answer_json) {
        try {
          const parsedAnswers = JSON.parse(question.answer_data.answer_json);
          setAnswers(parsedAnswers || { friendEmail: '', managerEmail: '' });
        } catch (error) {
          console.error('[WritingEmailQuestion] Failed to parse answer_json:', error);
          setAnswers({ friendEmail: '', managerEmail: '' });
        }
      } else {
        setAnswers({ friendEmail: '', managerEmail: '' });
      }
    } else {
      setAnswers({ friendEmail: '', managerEmail: '' });
    }
  }, [question.id, question.answer_data]);

  const handleAnswerChange = (emailKey, value) => {
    const newAnswers = {
      ...answers,
      [emailKey]: value
    };
    
    setAnswers(newAnswers);
    
    // Send update to parent
    onAnswerChange({
      answer_type: 'json',
      answer_json: JSON.stringify(newAnswers)
    });
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const friendWordCount = countWords(answers.friendEmail);
  const managerWordCount = countWords(answers.managerEmail);

  const friendMinWords = 50;
  const friendMaxWords = 75;
  const managerMinWords = 120;
  const managerMaxWords = 150;

  const getWordCountColor = (wordCount, minWords, maxWords) => {
    if (wordCount < minWords) return 'error';
    if (wordCount > maxWords) return 'warning';
    return 'success';
  };

  const getProgress = (wordCount, maxWords) => {
    return Math.min((wordCount / maxWords) * 100, 100);
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'warning.light', color: 'warning.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          Writing Part 4: Email Writing
        </Typography>
        <Typography variant="body2">
          {questionData.description}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
          Recommended time: 30 minutes.
        </Typography>
      </Paper>

      {/* Email Context */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'info.light', border: '1px solid', borderColor: 'info.main' }}>
        <Typography variant="h6" gutterBottom>
          📧 Email from Manager
        </Typography>
        <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #ccc' }}>
          <Typography variant="body1" paragraph>
            {questionData.managerEmail.body.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < questionData.managerEmail.body.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </Typography>
        </Box>
      </Paper>

      {/* Requirements */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.100' }}>
        <Typography variant="subtitle2" gutterBottom>
          Your Task:
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          <Chip size="small" label="Write 2 emails" color="primary" variant="outlined" />
          <Chip size="small" label="Different word counts" color="info" variant="outlined" />
          <Chip size="small" label="Different tones" color="secondary" variant="outlined" />
          <Chip size="small" label="30 minutes total" color="warning" variant="outlined" />
        </Box>
      </Paper>

      {/* Email to Friend */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'primary.main' }}>
        <Typography variant="h6" gutterBottom color="primary">
          Email 1: To Your Friend
        </Typography>
        <Typography variant="body2" gutterBottom>
          {questionData.tasks[0]?.description}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color={getWordCountColor(friendWordCount, friendMinWords, friendMaxWords)}>
              Words: {friendWordCount} / {friendMinWords} minimum
            </Typography>
            <Chip 
              size="small"
              label={`Target: ${friendMinWords} words`}
              color={friendWordCount >= friendMinWords ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={getProgress(friendWordCount, friendMaxWords)}
            color={getWordCountColor(friendWordCount, friendMinWords, friendMaxWords)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        <TextField
          multiline
          fullWidth
          rows={6}
          value={answers.friendEmail}
          onChange={(e) => handleAnswerChange('friendEmail', e.target.value)}
          placeholder="Hi [Friend's name],

Did you see the manager's email about the author event? I think we should suggest...

What do you think?

Best,
[Your name]"
          variant="outlined"
          error={friendWordCount > friendMaxWords}
          helperText={
            friendWordCount < friendMinWords ? `Need ${friendMinWords - friendWordCount} more words` :
            friendWordCount > friendMaxWords ? `${friendWordCount - friendMaxWords} words over limit` :
            'Good! Appropriate length'
          }
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.95rem',
              lineHeight: 1.5,
              fontFamily: 'inherit'
            }
          }}
        />
      </Paper>

      <Divider sx={{ my: 3 }}>
        <Chip label="Second Email" />
      </Divider>

      {/* Email to Manager */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" gutterBottom color="secondary">
          Email 2: To The Manager
        </Typography>
        <Typography variant="body2" gutterBottom>
          {questionData.tasks[1]?.description}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color={getWordCountColor(managerWordCount, managerMinWords, managerMaxWords)}>
              Words: {managerWordCount} / {managerMinWords}-{managerMaxWords}
            </Typography>
            <Chip 
              size="small"
              label={`Target: ${managerMinWords}-${managerMaxWords} words`}
              color={
                managerWordCount >= managerMinWords && managerWordCount <= managerMaxWords 
                  ? 'success' 
                  : 'error'
              }
              variant="outlined"
            />
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={getProgress(managerWordCount, managerMaxWords)}
            color={getWordCountColor(managerWordCount, managerMinWords, managerMaxWords)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        <TextField
          multiline
          fullWidth
          rows={10}
          value={answers.managerEmail}
          onChange={(e) => handleAnswerChange('managerEmail', e.target.value)}
          placeholder="Dear Manager,

Thank you for your email about organizing an author event for the public.

I would like to suggest...

The topic should be... because...

I believe this would attract many people and benefit our club...

I look forward to hearing your thoughts.

Best regards,
[Your name]"
          variant="outlined"
          error={managerWordCount < managerMinWords || managerWordCount > managerMaxWords}
          helperText={
            managerWordCount < managerMinWords ? `Need ${managerMinWords - managerWordCount} more words` :
            managerWordCount > managerMaxWords ? `${managerWordCount - managerMaxWords} words over limit` :
            'Perfect! Within word limit'
          }
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.95rem',
              lineHeight: 1.5,
              fontFamily: 'inherit'
            }
          }}
        />
      </Paper>

      {/* Tips */}
      <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          Tips for Part 4:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
          <li><strong>Friend email:</strong> Use informal language, contractions, casual greeting</li>
          <li><strong>Manager email:</strong> Use formal language, proper structure, polite tone</li>
          <li>Include greeting, main content, and closing in both emails</li>
          <li>Answer both questions: what kind of author and what topic</li>
          <li>Give reasons for your suggestions</li>
          <li>Check word counts carefully - they're different for each email</li>
        </Typography>
      </Paper>
    </Box>
  );
}