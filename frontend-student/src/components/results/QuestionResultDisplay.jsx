'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HelpOutline,
  PlayArrow,
  VolumeUp,
  Check,
  Close
} from '@mui/icons-material';
import { scoringUtils } from '@/utils/scoringUtils';
import { getAssetUrl } from '@/services/api';

export default function QuestionResultDisplayNew({ answer, question, calculatedScore, showCorrectAnswer = true }) {
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Use provided calculatedScore or calculate it
  const questionScore = calculatedScore || scoringUtils.autoScoreQuestion(
    question, 
    answer, 
    answer.max_score || question.max_score || 1
  );

  const questionType = question?.question_type?.question_type_name || question?.questionType?.question_type_name;
  const questionCode = question?.question_type?.code || question?.questionType?.code;

  // Render different question types similar to exam-taking components
  const renderQuestionByType = () => {
    switch (questionCode) {
      case 'LISTENING_MCQ':
      case 'READING_MCQ':
      case 'READING_TRUE_FALSE':
        return renderMCQQuestion();
      case 'READING_GAP_FILLING':
        return renderGapFillingQuestion();
      case 'READING_MATCHING':
      case 'LISTENING_MATCHING':
        return renderMatchingQuestion();
      case 'READING_STATEMENT_MATCHING':
      case 'LISTENING_STATEMENT_MATCHING':
        return renderStatementMatchingQuestion();
      case 'READING_ORDERING':
        return renderOrderingQuestion();
      case 'WRITING_SHORT':
      case 'WRITING_FORM':
      case 'WRITING_LONG':
      case 'WRITING_EMAIL':
      case 'WRITING_ESSAY':
        return renderWritingQuestion();
      case 'SPEAKING_INTRO':
      case 'SPEAKING_DESCRIPTION':
      case 'SPEAKING_COMPARISON':
      case 'SPEAKING_DISCUSSION':
        return renderSpeakingQuestion();
      default:
        return renderGenericQuestion();
    }
  };

  // MCQ Question Renderer (similar to MCQQuestion.jsx)
  const renderMCQQuestion = () => {
    const options = question.options || [];
    const userAnswerId = answer.selected_option_id || (answer.answer_data ? JSON.parse(answer.answer_data)?.selected_option_id : null);
    const correctOption = options.find(opt => opt.is_correct);

    return (
      <Box>
        {/* Question Content */}
        <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {question.content}
          </Typography>
        </Paper>

        {/* Options */}
        <FormControl component="fieldset" fullWidth disabled>
          <RadioGroup>
            {options.map((option, index) => {
              const isUserSelected = userAnswerId === option.id;
              const isCorrect = option.is_correct;
              
              return (
                <FormControlLabel
                  key={option.id}
                  value={option.id}
                  control={<Radio checked={isUserSelected} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {String.fromCharCode(65 + index)}. {option.option_text}
                      </Typography>
                      {isCorrect && showCorrectAnswer && (
                        <Chip 
                          icon={<Check />} 
                          label="Correct" 
                          size="small" 
                          color="success" 
                        />
                      )}
                      {isUserSelected && !isCorrect && (
                        <Chip 
                          icon={<Close />} 
                          label="Your choice" 
                          size="small" 
                          color="error" 
                        />
                      )}
                      {isUserSelected && isCorrect && (
                        <Chip 
                          icon={<Check />} 
                          label="Your choice ✓" 
                          size="small" 
                          color="success" 
                        />
                      )}
                    </Box>
                  }
                  sx={{
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: isUserSelected 
                      ? (isCorrect ? 'success.50' : 'error.50')
                      : (isCorrect && showCorrectAnswer ? 'success.100' : 'transparent'),
                    border: '1px solid',
                    borderColor: isUserSelected 
                      ? (isCorrect ? 'success.main' : 'error.main')
                      : (isCorrect && showCorrectAnswer ? 'success.light' : 'grey.300')
                  }}
                />
              );
            })}
          </RadioGroup>
        </FormControl>
      </Box>
    );
  };

  // Gap Filling Question Renderer (similar to GapFillingQuestion.jsx)
  const renderGapFillingQuestion = () => {
    const gaps = answer.answer_data ? JSON.parse(answer.answer_data)?.gaps || {} : {};
    const options = question.options || [];
    const items = question.items || [];

    const renderContentWithGaps = () => {
      let content = question.content;
      const parts = [];
      let lastIndex = 0;

      // Sort items by item_number
      const sortedItems = [...items].sort((a, b) => (a.item_number || 0) - (b.item_number || 0));

      sortedItems.forEach((item, index) => {
        const gapPattern = new RegExp(`\\[GAP${item.item_number || (index + 1)}\\]`, 'i');
        const match = content.match(gapPattern);
        
        if (match) {
          const matchIndex = content.indexOf(match[0]);
          
          // Add text before gap
          if (matchIndex > lastIndex) {
            parts.push(
              <span key={`text-${index}`}>
                {content.substring(lastIndex, matchIndex)}
              </span>
            );
          }

          // Add gap dropdown
          const userAnswer = gaps[item.id];
          const correctAnswer = item.correct_option_text || item.correct_answer;
          const isCorrect = userAnswer === correctAnswer;

          parts.push(
            <Box 
              key={`gap-${item.id}`} 
              component="span" 
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                mx: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: isCorrect ? 'success.100' : 'error.100',
                border: '1px solid',
                borderColor: isCorrect ? 'success.main' : 'error.main'
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: isCorrect ? 'success.dark' : 'error.dark'
                }}
              >
                {userAnswer || '_____'}
              </Typography>
              {showCorrectAnswer && !isCorrect && (
                <Typography variant="body2" sx={{ ml: 1, color: 'success.dark' }}>
                  (→ {correctAnswer})
                </Typography>
              )}
            </Box>
          );

          lastIndex = matchIndex + match[0].length;
          content = content.substring(lastIndex);
          lastIndex = 0;
        }
      });

      // Add remaining text
      if (content.length > lastIndex) {
        parts.push(<span key="text-final">{content.substring(lastIndex)}</span>);
      }

      return parts;
    };

    return (
      <Box>
        <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            {renderContentWithGaps()}
          </Typography>
        </Paper>

        {/* Available options */}
        <Typography variant="subtitle2" gutterBottom>Available options:</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {options.map(option => (
            <Chip 
              key={option.id} 
              label={option.option_text} 
              variant="outlined" 
              size="small"
            />
          ))}
        </Box>
      </Box>
    );
  };

  // Matching Question Renderer (similar to MatchingQuestion.jsx)
  const renderMatchingQuestion = () => {
    const matches = answer.answer_data ? JSON.parse(answer.answer_data)?.matches || {} : {};
    const options = question.options || [];
    const items = question.items || [];

    return (
      <Box>
        {/* Instructions */}
        <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {question.content}
          </Typography>
        </Paper>

        {/* Matching pairs */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Items to match:</Typography>
            <List>
              {items.map((item) => {
                const userMatch = matches[item.id];
                const correctMatch = item.correct_option_text || item.correct_answer;
                const isCorrect = userMatch === correctMatch;

                return (
                  <ListItem 
                    key={item.id}
                    sx={{
                      bgcolor: isCorrect ? 'success.50' : (userMatch ? 'error.50' : 'grey.50'),
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: isCorrect ? 'success.main' : (userMatch ? 'error.main' : 'grey.300')
                    }}
                  >
                    <ListItemText
                      primary={item.item_text}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Your answer: <strong>{userMatch || 'Not answered'}</strong>
                          </Typography>
                          {showCorrectAnswer && !isCorrect && (
                            <Typography variant="body2" color="success.dark">
                              Correct answer: <strong>{correctMatch}</strong>
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemIcon>
                      {isCorrect ? <CheckCircle color="success" /> : <Cancel color="error" />}
                    </ListItemIcon>
                  </ListItem>
                );
              })}
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Available options:</Typography>
            <List>
              {options.map(option => (
                <ListItem key={option.id} sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}>
                  <ListItemText primary={option.option_text} />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Statement Matching Question Renderer
  const renderStatementMatchingQuestion = () => {
    const statements = answer.answer_data ? JSON.parse(answer.answer_data)?.statements || {} : {};
    const items = question.items || [];

    return (
      <Box>
        <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {question.content}
          </Typography>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Statement</TableCell>
                <TableCell align="center">Your Answer</TableCell>
                {showCorrectAnswer && <TableCell align="center">Correct Answer</TableCell>}
                <TableCell align="center">Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const userAnswer = statements[item.id];
                const correctAnswer = item.correct_answer;
                const isCorrect = userAnswer === correctAnswer;

                return (
                  <TableRow 
                    key={item.id}
                    sx={{ bgcolor: isCorrect ? 'success.50' : (userAnswer ? 'error.50' : 'grey.50') }}
                  >
                    <TableCell>{item.item_text}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={userAnswer || 'Not answered'} 
                        size="small" 
                        color={isCorrect ? 'success' : 'error'}
                      />
                    </TableCell>
                    {showCorrectAnswer && (
                      <TableCell align="center">
                        <Chip label={correctAnswer} size="small" color="success" />
                      </TableCell>
                    )}
                    <TableCell align="center">
                      {isCorrect ? <CheckCircle color="success" /> : <Cancel color="error" />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // Ordering Question Renderer
  const renderOrderingQuestion = () => {
    const userOrder = answer.answer_data ? JSON.parse(answer.answer_data)?.order || [] : [];
    const items = question.items || [];
    const correctOrder = items
      .sort((a, b) => (a.correct_position || 0) - (b.correct_position || 0))
      .map(item => item.id);

    return (
      <Box>
        <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {question.content}
          </Typography>
        </Paper>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>Your order:</Typography>
            <List>
              {userOrder.map((itemId, index) => {
                const item = items.find(i => i.id === itemId);
                const correctPosition = item?.correct_position || 0;
                const isCorrect = correctPosition === (index + 1);

                return (
                  <ListItem 
                    key={itemId}
                    sx={{
                      bgcolor: isCorrect ? 'success.50' : 'error.50',
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: isCorrect ? 'success.main' : 'error.main'
                    }}
                  >
                    <ListItemText
                      primary={`${index + 1}. ${item?.item_text || 'Unknown item'}`}
                    />
                    <ListItemIcon>
                      {isCorrect ? <CheckCircle color="success" /> : <Cancel color="error" />}
                    </ListItemIcon>
                  </ListItem>
                );
              })}
            </List>
          </Grid>

          {showCorrectAnswer && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Correct order:</Typography>
              <List>
                {correctOrder.map((itemId, index) => {
                  const item = items.find(i => i.id === itemId);
                  return (
                    <ListItem key={itemId} sx={{ bgcolor: 'success.100', mb: 1, borderRadius: 1 }}>
                      <ListItemText primary={`${index + 1}. ${item?.item_text || 'Unknown item'}`} />
                    </ListItem>
                  );
                })}
              </List>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  // Writing Question Renderer (similar to WritingQuestion.jsx)
  const renderWritingQuestion = () => {
    // Determine writing type from question type code
    const getWritingType = () => {
      const typeCode = question?.question_type?.code || question?.code;
      if (typeCode === 'WRITING_SHORT' || typeCode === 'WRITING_SHORT_ANSWER') return 'short_answer';
      if (typeCode === 'WRITING_FORM' || typeCode === 'WRITING_FORM_FILLING') return 'form_filling';
      if (typeCode === 'WRITING_LONG' || typeCode === 'WRITING_CHAT') return 'chat';
      if (typeCode === 'WRITING_EMAIL') return 'email';
      if (typeCode === 'WRITING_ESSAY') return 'general';
      return 'general';
    };

    const writingType = getWritingType();

    // Route based on writing type
    if (writingType === 'short_answer') {
      return renderShortAnswers();
    } else if (writingType === 'form_filling') {
      return renderFormFilling();
    } else if (writingType === 'chat') {
      return renderChatResponses();
    } else if (writingType === 'email') {
      return renderEmailWriting();
    } else {
      return renderGeneralWriting();
    }
  };

  const renderShortAnswers = () => {
    if (!answer.answer_json) {
      return <Typography color="textSecondary">No structured answers provided</Typography>;
    }

    try {
      const answers = JSON.parse(answer.answer_json);
      const questionContent = typeof question.content === 'string' 
        ? JSON.parse(question.content) 
        : question.content;

      return (
        <Box>
          <Typography variant="h6" gutterBottom>Short Answer Responses (1-5 words each)</Typography>
          {questionContent.messages?.map((msg, idx) => {
            const answerKey = (idx + 1).toString();
            const answerText = answers[answerKey] || '';
            
            return (
              <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Question {idx + 1}:
                </Typography>
                <Typography variant="body1" gutterBottom sx={{ fontStyle: 'italic' }}>
                  {msg}
                </Typography>
                <Typography variant="body1" sx={{ 
                  mt: 1, 
                  p: 1, 
                  backgroundColor: answerText ? 'primary.light' : 'grey.100',
                  color: answerText ? 'primary.contrastText' : 'textSecondary',
                  borderRadius: 1,
                  fontWeight: answerText ? 500 : 400
                }}>
                  {answerText || 'No answer provided'}
                </Typography>
              </Box>
            );
          })}
        </Box>
      );
    } catch (error) {
      console.error('Error rendering short answers:', error);
      return <Typography color="error">Error displaying answers</Typography>;
    }
  };

  const renderFormFilling = () => {
    const userText = answer.text_answer || '';
    const wordCount = userText.trim().split(/\s+/).filter(word => word.length > 0).length;

    try {
      const questionContent = typeof question.content === 'string' 
        ? JSON.parse(question.content) 
        : question.content;

      return (
        <Box>
          <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>{questionContent.title || 'Form Filling'}</Typography>
            <Typography variant="body1" gutterBottom sx={{ fontStyle: 'italic' }}>
              {questionContent.question || 'Complete the form'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {questionContent.placeholder || 'Please provide your response in 20-30 words'}
            </Typography>
          </Paper>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2">
                Word count: <strong>{wordCount}</strong> words
              </Typography>
              <Chip 
                label="20-30 words required" 
                size="small" 
                color={wordCount >= 20 && wordCount <= 30 ? 'success' : 'warning'}
                variant="outlined"
              />
            </Box>
          </Box>

          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" gutterBottom>Your answer:</Typography>
            <TextField
              multiline
              fullWidth
              value={userText}
              disabled
              minRows={4}
              sx={{ 
                '& .MuiInputBase-input': { 
                  fontSize: '14px',
                  lineHeight: 1.6
                } 
              }}
            />
          </Paper>
        </Box>
      );
    } catch (error) {
      console.error('Error rendering form filling:', error);
      return renderGeneralWriting();
    }
  };

  const renderChatResponses = () => {
    if (!answer.answer_json) {
      return <Typography color="textSecondary">No chat responses provided</Typography>;
    }

    try {
      const answers = JSON.parse(answer.answer_json);
      const questionContent = typeof question.content === 'string' 
        ? JSON.parse(question.content) 
        : question.content;

      return (
        <Box>
          <Typography variant="h6" gutterBottom>Chat Room Responses (30-40 words each)</Typography>
          
          {questionContent.messages?.map((msg, idx) => {
            const answerKey = idx === 0 ? 'personA' : 'personB';
            const answerText = answers[answerKey] || '';
            const wordCount = answerText.trim().split(/\s+/).filter(word => word.length > 0).length;
            
            return (
              <Box key={idx} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  {msg.person}: {msg.message}
                </Typography>
                
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="textSecondary">
                    Word count: {wordCount}
                  </Typography>
                  <Chip 
                    label="30-40 words" 
                    size="small" 
                    color={wordCount >= 30 && wordCount <= 40 ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" sx={{ 
                  p: 1, 
                  backgroundColor: 'grey.50',
                  borderRadius: 1,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6
                }}>
                  {answerText || 'No response provided'}
                </Typography>
              </Box>
            );
          })}
        </Box>
      );
    } catch (error) {
      console.error('Error rendering chat responses:', error);
      return <Typography color="error">Error displaying chat responses</Typography>;
    }
  };

  const renderEmailWriting = () => {
    if (!answer.answer_json) {
      return <Typography color="textSecondary">No email responses provided</Typography>;
    }

    try {
      const answers = JSON.parse(answer.answer_json);
      const questionContent = typeof question.content === 'string' 
        ? JSON.parse(question.content) 
        : question.content;

      return (
        <Box>
          <Typography variant="h6" gutterBottom>Email Writing</Typography>
          
          {/* Friend Email */}
          <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              📧 Email to Friend (50 words)
            </Typography>
            {answers.friendEmail && (
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="textSecondary">
                  Word count: {answers.friendEmail.trim().split(/\s+/).filter(w => w.length > 0).length}
                </Typography>
                <Chip 
                  label="~50 words" 
                  size="small" 
                  variant="outlined"
                />
              </Box>
            )}
            <Typography variant="body2" sx={{ 
              p: 2, 
              backgroundColor: 'grey.50',
              borderRadius: 1,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6
            }}>
              {answers.friendEmail || 'No email provided'}
            </Typography>
          </Box>

          {/* Manager Email */}
          <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="secondary" gutterBottom>
              📨 Email to Manager (120-150 words)
            </Typography>
            {answers.managerEmail && (
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="textSecondary">
                  Word count: {answers.managerEmail.trim().split(/\s+/).filter(w => w.length > 0).length}
                </Typography>
                <Chip 
                  label="120-150 words" 
                  size="small" 
                  variant="outlined"
                />
              </Box>
            )}
            <Typography variant="body2" sx={{ 
              p: 2, 
              backgroundColor: 'grey.50',
              borderRadius: 1,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6
            }}>
              {answers.managerEmail || 'No email provided'}
            </Typography>
          </Box>
        </Box>
      );
    } catch (error) {
      console.error('Error rendering email writing:', error);
      return <Typography color="error">Error displaying email responses</Typography>;
    }
  };

  const renderGeneralWriting = () => {
    const userText = answer.text_answer || '';
    const wordCount = userText.trim().split(/\s+/).filter(word => word.length > 0).length;
    const requirements = question.question_content?.requirements || {};
    const minWords = requirements.min_words || 0;
    const maxWords = requirements.max_words || 1000;

    return (
      <Box>
        <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {question.content}
          </Typography>
        </Paper>

        {/* Word count indicator */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2">
              Word count: <strong>{wordCount}</strong> words
            </Typography>
            <Chip 
              label={`${minWords}-${maxWords} words required`} 
              size="small" 
              variant="outlined"
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min((wordCount / maxWords) * 100, 100)}
            color={wordCount >= minWords ? 'success' : 'error'}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* User's answer */}
        <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" gutterBottom>Your answer:</Typography>
          <TextField
            multiline
            fullWidth
            value={userText}
            disabled
            minRows={6}
            sx={{ 
              '& .MuiInputBase-input': { 
                fontSize: '14px',
                lineHeight: 1.6
              } 
            }}
          />
        </Paper>
      </Box>
    );
  };

  // Speaking Question Renderer (similar to SpeakingQuestion.jsx)
  const renderSpeakingQuestion = () => {
    console.log('[QuestionResultDisplay] renderSpeakingQuestion:', {
      answer_type: answer.answer_type,
      audio_url: answer.audio_url,
      transcribed_text: answer.transcribed_text,
      hasAudioUrl: !!answer.audio_url,
      fullAnswer: answer
    });
    
    return (
      <Box>
        <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {question.content}
          </Typography>
        </Paper>

        {answer.audio_url && (
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" gutterBottom>Your recording:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <VolumeUp color="primary" />
              <audio controls style={{ flexGrow: 1 }} preload="metadata">
                <source src={getAssetUrl(answer.audio_url)} type="audio/webm" />
                <source src={getAssetUrl(answer.audio_url)} type="audio/ogg" />
                <source src={getAssetUrl(answer.audio_url)} type="audio/mp4" />
                <source src={getAssetUrl(answer.audio_url)} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </Box>
            
            {answer.transcribed_text && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Transcription:</Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {answer.transcribed_text}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        )}

        {!answer.audio_url && (
          <Alert severity="warning">
            <Typography variant="body2">
              No audio recording found. Audio URL: {JSON.stringify(answer.audio_url)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontSize: '0.8em' }}>
              Answer type: {answer.answer_type}
            </Typography>
          </Alert>
        )}
      </Box>
    );
  };

  // Generic Question Renderer (fallback)
  const renderGenericQuestion = () => {
    return (
      <Box>
        <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {question.content}
          </Typography>
        </Paper>

        {answer.text_answer && (
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" gutterBottom>Your answer:</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {answer.text_answer}
            </Typography>
          </Paper>
        )}

        {answer.audio_url && (
          <Paper sx={{ p: 2, bgcolor: 'background.paper', mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Audio answer:</Typography>
            <audio controls style={{ width: '100%' }}>
              <source src={getAssetUrl(answer.audio_url)} />
            </audio>
          </Paper>
        )}
      </Box>
    );
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        {/* Question Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Question: {question.code || questionType}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={questionType} size="small" variant="outlined" />
              <Chip 
                label={`${questionScore.score}/${answer.max_score || question.max_score || 1}`} 
                size="small" 
                color="primary"
              />
              <Chip 
                label={`${questionScore.percentage}%`} 
                size="small" 
                color={questionScore.percentage >= 70 ? 'success' : questionScore.percentage >= 50 ? 'warning' : 'error'}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Question Content */}
        {renderQuestionByType()}

        {/* Score Details */}
        {questionScore.details && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Score breakdown:</Typography>
            <Typography variant="body2">
              {typeof questionScore.details === 'string' ? questionScore.details : JSON.stringify(questionScore.details)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}