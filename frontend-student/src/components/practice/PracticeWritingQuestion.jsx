'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Edit,
  Email,
  Assignment
} from '@mui/icons-material';

export default function PracticeWritingQuestion({ question, answer, onAnswerChange }) {
  const [answers, setAnswers] = useState({
    friendEmail: '',
    managerEmail: '',
    essay: '',
    form: {},
    shortAnswers: {}
  });

  useEffect(() => {
    if (answer) {
      if (typeof answer === 'string') {
        try {
          const parsedAnswer = JSON.parse(answer);
          setAnswers(parsedAnswer);
        } catch (error) {
          setAnswers({ 
            friendEmail: answer, 
            managerEmail: '', 
            essay: answer, 
            form: {}, 
            shortAnswers: {} 
          });
        }
      } else {
        setAnswers(answer);
      }
    }
  }, [answer, question.question_id]);

  const handleAnswerChange = (key, value) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    onAnswerChange(JSON.stringify(newAnswers));
  };

  const handleFormChange = (fieldKey, value) => {
    const newForm = { ...answers.form, [fieldKey]: value };
    const newAnswers = { ...answers, form: newForm };
    setAnswers(newAnswers);
    onAnswerChange(JSON.stringify(newAnswers));
  };

  const handleShortAnswerChange = (itemId, value) => {
    const newShortAnswers = { ...answers.shortAnswers, [itemId]: value };
    const newAnswers = { ...answers, shortAnswers: newShortAnswers };
    setAnswers(newAnswers);
    onAnswerChange(JSON.stringify(newAnswers));
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getWordCountColor = (wordCount, minWords, maxWords) => {
    if (wordCount < minWords) return 'error';
    if (wordCount > maxWords) return 'warning';
    return 'success';
  };

  const getProgress = (wordCount, maxWords) => {
    return Math.min((wordCount / maxWords) * 100, 100);
  };

  const renderQuestion = () => {
    const questionType = question.question_type_name || question.type || question.question_type;
    
    switch (questionType) {
      case 'email':
      case 'WRITING_EMAIL':
        return renderEmailWriting();
      case 'essay':
      case 'WRITING_ESSAY':
        return renderEssayWriting();
      case 'form_filling':
      case 'WRITING_FORM_FILLING':
        return renderFormFilling();
      case 'short_answer':
      case 'WRITING_SHORT_ANSWER':
        return renderShortAnswer();
      case 'chat':
      case 'WRITING_CHAT':
        return renderChatWriting();
      default:
        return renderEssayWriting();
    }
  };

  const renderEmailWriting = () => {
    const friendWordCount = countWords(answers.friendEmail);
    const managerWordCount = countWords(answers.managerEmail);
    
    const friendMinWords = 50;
    const friendMaxWords = 75;
    const managerMinWords = 120;
    const managerMaxWords = 150;

    return (
      <Box sx={{ mt: 2 }}>
        {/* Email Context */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
          <Typography variant="h6" gutterBottom>
            📧 Email Context
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
            {question.content?.context || question.context || 'You received an email from your manager about organizing an event.'}
          </Typography>
        </Paper>

        {/* Email to Friend */}
        <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'primary.main' }}>
          <Typography variant="h6" gutterBottom color="primary">
            Email 1: To Your Friend ({friendMinWords} words)
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
            placeholder="Hi [Friend's name],&#10;&#10;Did you see the manager's email about...&#10;&#10;What do you think?&#10;&#10;Best,&#10;[Your name]"
            variant="outlined"
            error={friendWordCount > friendMaxWords}
            helperText={
              friendWordCount < friendMinWords ? `Need ${friendMinWords - friendWordCount} more words` :
              friendWordCount > friendMaxWords ? `${friendWordCount - friendMaxWords} words over limit` :
              'Good! Appropriate length'
            }
            sx={{
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }
            }}
          />
        </Paper>

        {/* Email to Manager */}
        <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'secondary.main' }}>
          <Typography variant="h6" gutterBottom color="secondary">
            Email 2: To Your Manager ({managerMinWords}-{managerMaxWords} words)
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
            rows={8}
            value={answers.managerEmail}
            onChange={(e) => handleAnswerChange('managerEmail', e.target.value)}
            placeholder="Dear Manager,&#10;&#10;Thank you for your email about the author event.&#10;&#10;I would like to suggest...&#10;&#10;Best regards,&#10;[Your name]"
            variant="outlined"
            error={managerWordCount > managerMaxWords}
            helperText={
              managerWordCount < managerMinWords ? `Need ${managerMinWords - managerWordCount} more words` :
              managerWordCount > managerMaxWords ? `${managerWordCount - managerMaxWords} words over limit` :
              'Perfect! Within word limit'
            }
            sx={{
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }
            }}
          />
        </Paper>
      </Box>
    );
  };

  const renderEssayWriting = () => {
    const wordCount = countWords(answers.essay);
    const minWords = 150;
    const maxWords = 200;

    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color={getWordCountColor(wordCount, minWords, maxWords)}>
              Words: {wordCount} / {minWords}-{maxWords}
            </Typography>
            <Chip 
              size="small"
              label={`Target: ${minWords}-${maxWords} words`}
              color={wordCount >= minWords && wordCount <= maxWords ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={getProgress(wordCount, maxWords)}
            color={getWordCountColor(wordCount, minWords, maxWords)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        <TextField
          multiline
          fullWidth
          rows={12}
          value={answers.essay}
          onChange={(e) => handleAnswerChange('essay', e.target.value)}
          placeholder="Write your essay here...&#10;&#10;Introduction:&#10;&#10;Body paragraphs:&#10;&#10;Conclusion:"
          variant="outlined"
          error={wordCount > maxWords}
          helperText={
            wordCount < minWords ? `Need ${minWords - wordCount} more words` :
            wordCount > maxWords ? `${wordCount - maxWords} words over limit` :
            'Perfect! Within word limit'
          }
          sx={{
            '& .MuiInputBase-input': {
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              lineHeight: 1.8
            }
          }}
        />
      </Box>
    );
  };

  const renderFormFilling = () => {
    const fields = question.question_items || question.items || [
      { item_id: 'name', item_text: 'Full Name', required: true },
      { item_id: 'email', item_text: 'Email Address', required: true },
      { item_id: 'phone', item_text: 'Phone Number', required: false },
      { item_id: 'address', item_text: 'Address', required: false }
    ];

    return (
      <Box sx={{ mt: 2 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Complete the form below:
          </Typography>
          {fields.map((field) => (
            <Box key={field.item_id} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label={field.item_text + (field.required ? ' *' : '')}
                required={field.required}
                value={answers.form[field.item_id] || ''}
                onChange={(e) => handleFormChange(field.item_id, e.target.value)}
                variant="outlined"
                size="small"
              />
            </Box>
          ))}
        </Paper>
      </Box>
    );
  };

  const renderShortAnswer = () => {
    const items = question.question_items || question.items || [];

    return (
      <Box sx={{ mt: 2 }}>
        {items.map((item, index) => (
          <Box key={item.item_id || index} sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
              Question {index + 1}: {item.item_text || item.question}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={answers.shortAnswers[item.item_id] || ''}
              onChange={(e) => handleShortAnswerChange(item.item_id, e.target.value)}
              placeholder="Write your short answer here..."
              variant="outlined"
              size="small"
            />
          </Box>
        ))}
      </Box>
    );
  };

  const renderChatWriting = () => {
    const wordCount = countWords(answers.essay);
    const maxWords = 100;

    return (
      <Box sx={{ mt: 2 }}>
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
          <Typography variant="body2">
            Continue this conversation naturally:
          </Typography>
        </Paper>
        
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color={wordCount > maxWords ? 'error' : 'primary'}>
              Words: {wordCount} / {maxWords} maximum
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={getProgress(wordCount, maxWords)}
            color={wordCount > maxWords ? 'error' : 'primary'}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        <TextField
          multiline
          fullWidth
          rows={6}
          value={answers.essay}
          onChange={(e) => handleAnswerChange('essay', e.target.value)}
          placeholder="Continue the conversation..."
          variant="outlined"
          error={wordCount > maxWords}
          helperText={
            wordCount > maxWords ? `${wordCount - maxWords} words over limit` :
            `${maxWords - wordCount} words remaining`
          }
        />
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
          bgcolor: 'warning.50',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'warning.200'
        }}>
          <Edit sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 600 }}>
            Writing Question
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <Chip 
              label={question.question_type_name || question.type || 'Writing'} 
              size="small" 
              color="warning"
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
          {question.content?.question_text || question.question_text || 'Complete the writing task below.'}
        </Typography>
      </Box>

      {renderQuestion()}
    </Paper>
  );
}