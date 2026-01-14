'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  LinearProgress,
  Grid,
  Divider,
  Alert,
} from '@mui/material';

export default function WritingQuestion({ question, onAnswerChange }) {
  const [answers, setAnswers] = useState({});
  const [singleText, setSingleText] = useState('');
  
  // Parse question content to determine question type
  const questionData = React.useMemo(() => {
    try {
      if (typeof question.content === 'string') {
        return JSON.parse(question.content);
      }
      return question.content || {};
    } catch (error) {
      console.error('Failed to parse question content:', error);
      return {};
    }
  }, [question.content]);

  // Determine writing question type based on question content structure
  const getWritingQuestionType = () => {
    if (questionData.messages && Array.isArray(questionData.messages)) {
      // Check if it's short answer (messages is array of strings)
      if (typeof questionData.messages[0] === 'string') {
        return 'short_answer';
      }
      // Check if it's chat (messages has person and message structure)
      if (questionData.messages[0]?.person && questionData.messages[0]?.message) {
        return 'chat';
      }
    }
    
    if (questionData.question && questionData.placeholder) {
      return 'form_filling';
    }
    
    if (questionData.managerEmail && questionData.tasks) {
      return 'email';
    }
    
    // Default to general writing
    return 'general';
  };

  const writingType = getWritingQuestionType();

  // Initialize answers from question.answer_data
  useEffect(() => {
    if (question.answer_data && typeof question.answer_data === 'object') {
      if (question.answer_data.answer_json) {
        try {
          const parsedAnswers = JSON.parse(question.answer_data.answer_json);
          setAnswers(parsedAnswers || {});
        } catch (error) {
          console.error('[WritingQuestion] Failed to parse answer_json:', error);
          setAnswers({});
        }
      } else if (question.answer_data.text_answer) {
        if (writingType === 'general') {
          setSingleText(question.answer_data.text_answer);
        } else {
          try {
            const parsedAnswers = JSON.parse(question.answer_data.text_answer || '{}');
            setAnswers(parsedAnswers);
          } catch (error) {
            setAnswers({});
          }
        }
      } else {
        setAnswers({});
        setSingleText('');
      }
    } else {
      setAnswers({});
      setSingleText('');
    }
  }, [question.id, question.answer_data, writingType]);

  // Handle answer change for structured writing types
  const handleStructuredAnswerChange = (key, value) => {
    const newAnswers = {
      ...answers,
      [key]: value
    };
    
    setAnswers(newAnswers);
    
    // Send update to parent
    onAnswerChange({
      answer_type: 'json',
      answer_json: JSON.stringify(newAnswers)
    });
  };

  // Handle answer change for general writing
  const handleTextChange = (event) => {
    const newText = event.target.value;
    setSingleText(newText);
    
    onAnswerChange({
      answer_type: 'text',
      text_answer: newText
    });
  };

  // Word counting utility
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getWordCountColor = (wordCount, minWords, maxWords) => {
    if (minWords > 0 && wordCount < minWords) return 'error';
    if (maxWords > 0 && wordCount > maxWords) return 'warning';
    return 'success';
  };

  const getWordCountProgress = (wordCount, maxWords) => {
    if (maxWords > 0) {
      return Math.min((wordCount / maxWords) * 100, 100);
    }
    return 0;
  };

  // Render Short Answer Questions (1-5 words)
  if (writingType === 'short_answer') {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {questionData.title || 'Short Answers'}
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Mô tả:</strong> {questionData.description || 'Write short answers (1-5 words) to each message.'}
          </Typography>
        </Alert>

        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom color="primary">
            Yêu cầu: Trả lời ngắn (1-5 từ) cho mỗi câu hỏi
          </Typography>
        </Paper>

        {questionData.messages?.map((message, index) => {
          const currentAnswer = answers[(index + 1).toString()] || '';
          const wordCount = countWords(currentAnswer);
          
          return (
            <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
              <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>
                Câu hỏi {index + 1}: {message}
              </Typography>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color={getWordCountColor(wordCount, 1, 5)}>
                  Số từ: {wordCount}/5 từ tối đa
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={getWordCountProgress(wordCount, 5)}
                  color={getWordCountColor(wordCount, 1, 5)}
                  sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                />
              </Box>
              
              <TextField
                fullWidth
                value={currentAnswer}
                onChange={(e) => handleStructuredAnswerChange((index + 1).toString(), e.target.value)}
                placeholder="Trả lời ngắn (1-5 từ)..."
                variant="outlined"
                size="small"
                error={wordCount > 5}
                helperText={wordCount > 5 ? 'Vượt quá 5 từ cho phép' : ''}
              />
            </Paper>
          );
        })}
      </Box>
    );
  }

  // Render Form Filling Questions (20-30 words)  
  if (writingType === 'form_filling') {
    const currentAnswer = answers.formAnswer || '';
    const wordCount = countWords(currentAnswer);
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {questionData.title || 'Form Filling'}
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Mô tả:</strong> {questionData.description || 'Fill in the form. Write in sentences. Use 20-30 words.'}
          </Typography>
        </Alert>

        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'warning.light', borderLeft: '4px solid #ff9800' }}>
          <Typography variant="subtitle2" gutterBottom color="warning.dark">
            Yêu cầu: Viết câu trả lời hoàn chỉnh (20-30 từ)
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
          <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>
            {questionData.question}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color={getWordCountColor(wordCount, 20, 30)}>
              Số từ: {wordCount}/20-30 từ
            </Typography>
            <LinearProgress
              variant="determinate"
              value={getWordCountProgress(wordCount, 30)}
              color={getWordCountColor(wordCount, 20, 30)}
              sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
            />
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            value={currentAnswer}
            onChange={(e) => handleStructuredAnswerChange('formAnswer', e.target.value)}
            placeholder={questionData.placeholder || 'Please describe in complete sentences.'}
            variant="outlined"
            error={wordCount < 20 || wordCount > 30}
            helperText={
              wordCount < 20 ? `Cần thêm ${20 - wordCount} từ` :
              wordCount > 30 ? `Vượt quá ${wordCount - 30} từ` :
              'Đạt yêu cầu số từ'
            }
          />
        </Paper>
      </Box>
    );
  }

  // Render Chat Response Questions (30-40 words)
  if (writingType === 'chat') {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {questionData.title || 'Chat Responses'}
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Mô tả:</strong> {questionData.description || 'Talk to them using sentences. Use 30-40 words per answer.'}
          </Typography>
        </Alert>

        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'success.light', borderLeft: '4px solid #4caf50' }}>
          <Typography variant="subtitle2" gutterBottom color="success.dark">
            Yêu cầu: Trả lời bằng câu hoàn chỉnh (30-40 từ mỗi câu)
          </Typography>
        </Paper>

        {questionData.messages?.map((messageObj, index) => {
          const currentAnswer = answers[index] || '';
          const wordCount = countWords(currentAnswer);
          
          return (
            <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
              <Box sx={{ mb: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="primary">
                  {messageObj.person}:
                </Typography>
                <Typography variant="body2">
                  {messageObj.message}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color={getWordCountColor(wordCount, 30, 40)}>
                  Số từ: {wordCount}/30-40 từ
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={getWordCountProgress(wordCount, 40)}
                  color={getWordCountColor(wordCount, 30, 40)}
                  sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                />
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                value={currentAnswer}
                onChange={(e) => handleStructuredAnswerChange(index, e.target.value)}
                placeholder="Trả lời bằng câu hoàn chỉnh (30-40 từ)..."
                variant="outlined"
                error={wordCount < 30 || wordCount > 40}
                helperText={
                  wordCount < 30 ? `Cần thêm ${30 - wordCount} từ` :
                  wordCount > 40 ? `Vượt quá ${wordCount - 40} từ` :
                  'Đạt yêu cầu số từ'
                }
              />
            </Paper>
          );
        })}
      </Box>
    );
  }

  // Render Email Writing Questions (50 & 120-150 words)
  if (writingType === 'email') {
    const friendEmail = answers.friendEmail || '';
    const managerEmail = answers.managerEmail || '';
    const friendWordCount = countWords(friendEmail);
    const managerWordCount = countWords(managerEmail);
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {questionData.title || 'Email Writing'}
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Mô tả:</strong> {questionData.description || 'You are a member of the book club. You received this email from the club\'s manager.'}
          </Typography>
        </Alert>

        {/* Manager's Email */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#fff3e0', border: '1px solid #ffcc02' }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            📧 Email từ Manager:
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            <strong>Subject:</strong> {questionData.managerEmail?.subject}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', backgroundColor: '#fff', p: 2, borderRadius: 1 }}>
            {questionData.managerEmail?.body}
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          {/* Friend Email */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" gutterBottom color="primary">
                📝 Email cho bạn (50 từ)
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color={getWordCountColor(friendWordCount, 45, 55)}>
                  Số từ: {friendWordCount}/50 từ
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={getWordCountProgress(friendWordCount, 55)}
                  color={getWordCountColor(friendWordCount, 45, 55)}
                  sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                />
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={6}
                value={friendEmail}
                onChange={(e) => handleStructuredAnswerChange('friendEmail', e.target.value)}
                placeholder="Viết email cho bạn của bạn (50 từ)..."
                variant="outlined"
                error={friendWordCount < 45 || friendWordCount > 55}
                helperText={
                  friendWordCount < 45 ? `Cần thêm ${45 - friendWordCount} từ` :
                  friendWordCount > 55 ? `Vượt quá ${friendWordCount - 55} từ` :
                  'Đạt yêu cầu số từ'
                }
              />
            </Paper>
          </Grid>

          {/* Manager Email */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" gutterBottom color="secondary">
                📝 Email cho Manager (120-150 từ)
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color={getWordCountColor(managerWordCount, 120, 150)}>
                  Số từ: {managerWordCount}/120-150 từ
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={getWordCountProgress(managerWordCount, 150)}
                  color={getWordCountColor(managerWordCount, 120, 150)}
                  sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                />
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={8}
                value={managerEmail}
                onChange={(e) => handleStructuredAnswerChange('managerEmail', e.target.value)}
                placeholder="Viết email cho manager (120-150 từ)..."
                variant="outlined"
                error={managerWordCount < 120 || managerWordCount > 150}
                helperText={
                  managerWordCount < 120 ? `Cần thêm ${120 - managerWordCount} từ` :
                  managerWordCount > 150 ? `Vượt quá ${managerWordCount - 150} từ` :
                  'Đạt yêu cầu số từ'
                }
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Render General Writing (default)
  const requirements = question.question_content?.requirements || {};
  const minWords = requirements.min_words || 0;
  const maxWords = requirements.max_words || 1000;
  const timeLimit = requirements.time_limit;
  const wordCount = countWords(singleText);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Viết bài luận
      </Typography>
      
      {/* Writing requirements */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: 'info.light' }}>
        <Typography variant="subtitle2" gutterBottom>
          Yêu cầu:
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {minWords > 0 && (
            <Chip
              size="small"
              label={`Tối thiểu: ${minWords} từ`}
              color={wordCount >= minWords ? 'success' : 'error'}
              variant="outlined"
            />
          )}
          {maxWords > 0 && (
            <Chip
              size="small"
              label={`Tối đa: ${maxWords} từ`}
              color={wordCount <= maxWords ? 'success' : 'warning'}
              variant="outlined"
            />
          )}
          {timeLimit && (
            <Chip
              size="small"
              label={`Thời gian: ${timeLimit} phút`}
              variant="outlined"
            />
          )}
        </Box>
        
        {requirements.topic && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Chủ đề:</strong> {requirements.topic}
          </Typography>
        )}
      </Paper>

      {/* Word count indicator */}
      <Box sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color={getWordCountColor(wordCount, minWords, maxWords)}>
            Số từ: {wordCount}
            {minWords > 0 && ` / ${minWords} tối thiểu`}
            {maxWords > 0 && ` / ${maxWords} tối đa`}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {((singleText.length / 5000) * 100).toFixed(1)}% ký tự
          </Typography>
        </Box>
        
        {maxWords > 0 && (
          <LinearProgress
            variant="determinate"
            value={getWordCountProgress(wordCount, maxWords)}
            color={getWordCountColor(wordCount, minWords, maxWords)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        )}
      </Box>

      {/* Text editor */}
      <TextField
        multiline
        fullWidth
        rows={10}
        value={singleText}
        onChange={handleTextChange}
        placeholder="Viết bài luận của bạn ở đây..."
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '1rem',
            lineHeight: 1.6,
            fontFamily: 'monospace'
          }
        }}
      />
      
      {/* Writing tips */}
      <Paper sx={{ p: 2, mt: 2, backgroundColor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          Gợi ý viết bài:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
          <li>Đọc kỹ đề bài và lên dàn ý trước khi viết</li>
          <li>Chia bài thành các đoạn rõ ràng với ý chính</li>
          <li>Sử dụng từ nối để tạo sự liên kết giữa các câu, đoạn</li>
          <li>Kiểm tra lại ngữ pháp và chính tả trước khi hoàn thành</li>
          <li>Đảm bảo đạt yêu cầu về số từ tối thiểu</li>
        </Typography>
      </Paper>
    </Box>
  );
}