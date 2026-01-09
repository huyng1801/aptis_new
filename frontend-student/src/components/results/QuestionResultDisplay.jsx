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
  ListItemIcon
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HelpOutline,
  PlayArrow,
  VolumeUp,
  Hearing,
  MenuBook,
  Edit,
  RecordVoiceOver
} from '@mui/icons-material';

export default function QuestionResultDisplay({ answer, question, showCorrectAnswer = true }) {
  const score = answer.final_score !== null ? answer.final_score : answer.score || 0;
  const maxScore = answer.max_score || question.max_score || 1;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const isCorrect = percentage >= 80; // Consider 80% and above as correct
  const isPartiallyCorrect = percentage >= 50 && percentage < 80;

  const getScoreColor = () => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const getScoreIcon = () => {
    if (percentage >= 80) return <CheckCircle color="success" />;
    if (percentage >= 50) return <HelpOutline color="warning" />;
    return <Cancel color="error" />;
  };

  const getSkillIcon = () => {
    const skillCode = question.question_type?.skill_type?.code || answer.attemptSection?.examSection?.skillType?.code;
    switch (skillCode) {
      case 'LISTENING': return <Hearing color="primary" />;
      case 'READING': return <MenuBook color="success" />;
      case 'WRITING': return <Edit color="warning" />;
      case 'SPEAKING': return <RecordVoiceOver color="error" />;
      default: return <HelpOutline />;
    }
  };

  const renderUserAnswer = () => {
    const questionType = question.question_type?.code || question.code;
    
    switch (questionType) {
      case 'LISTENING_MCQ':
      case 'READING_MCQ':
        return renderMCQAnswer();
      case 'LISTENING_GAP_FILL':
      case 'READING_GAP_FILL':
        return renderGapFillingAnswer();
      case 'LISTENING_MATCHING':
      case 'READING_MATCHING':
        return renderMatchingAnswer();
      case 'LISTENING_STATEMENT_MATCHING':
        return renderStatementMatchingAnswer();
      case 'READING_ORDERING':
        return renderOrderingAnswer();
      case 'READING_MATCHING_HEADINGS':
        return renderHeadingMatchingAnswer();
      case 'WRITING_SHORT':
      case 'WRITING_FORM':
      case 'WRITING_LONG':
      case 'WRITING_EMAIL':
      case 'WRITING_ESSAY':
        return renderWritingAnswer();
      case 'SPEAKING_INTRO':
      case 'SPEAKING_DESCRIPTION':
      case 'SPEAKING_COMPARISON':
      case 'SPEAKING_DISCUSSION':
        return renderSpeakingAnswer();
      default:
        return renderTextAnswer();
    }
  };

  const renderMCQAnswer = () => {
    let userAnswer, correctAnswer;
    
    try {
      const answerData = answer.answer_json ? JSON.parse(answer.answer_json) : null;
      userAnswer = answerData || answer.text_answer;
      
      // Get correct answer from question options
      if (question.question_options) {
        const correctOption = question.question_options.find(opt => opt.is_correct);
        correctAnswer = correctOption?.option_text || correctOption?.option_id;
      }
    } catch (error) {
      userAnswer = answer.text_answer;
    }

    return (
      <Box>
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Your Answer:
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {userAnswer || 'No answer provided'}
          </Typography>
        </Box>
        
        {showCorrectAnswer && correctAnswer && (
          <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'success.main' }}>
              Correct Answer:
            </Typography>
            <Typography variant="body1" color="success.dark">
              {correctAnswer}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderGapFillingAnswer = () => {
    let userAnswers, correctAnswers;
    
    try {
      const answerData = answer.answer_json ? JSON.parse(answer.answer_json) : {};
      userAnswers = answerData.gaps || answerData;
      
      // Get correct answers from question items
      correctAnswers = {};
      if (question.question_items) {
        question.question_items.forEach(item => {
          if (item.sample_answers && item.sample_answers.length > 0) {
            correctAnswers[item.id] = item.sample_answers[0].answer_text;
          }
        });
      }
    } catch (error) {
      userAnswers = {};
    }

    return (
      <Box>
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
            Your Answers:
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(userAnswers || {}).map(([itemId, userAnswer], index) => (
              <Grid item xs={12} sm={6} key={itemId}>
                <Paper variant="outlined" sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Gap {index + 1}: 
                    <span style={{ 
                      marginLeft: 8,
                      color: correctAnswers[itemId] && 
                             userAnswer.toLowerCase().trim() === correctAnswers[itemId].toLowerCase().trim() 
                             ? '#2e7d32' : '#d32f2f',
                      fontWeight: 600
                    }}>
                      {userAnswer || '(empty)'}
                    </span>
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {showCorrectAnswer && Object.keys(correctAnswers).length > 0 && (
          <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
              Correct Answers:
            </Typography>
            <Grid container spacing={1}>
              {Object.entries(correctAnswers).map(([itemId, correctAnswer], index) => (
                <Grid item xs={12} sm={6} key={itemId}>
                  <Paper variant="outlined" sx={{ p: 1, bgcolor: 'success.100' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.dark' }}>
                      Gap {index + 1}: {correctAnswer}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    );
  };

  const renderMatchingAnswer = () => {
    let userMatches, correctMatches;
    
    try {
      const answerData = answer.answer_json ? JSON.parse(answer.answer_json) : {};
      userMatches = answerData.matches || answerData;
      
      // Get correct matches from question items
      correctMatches = {};
      if (question.question_items) {
        question.question_items.forEach(item => {
          if (item.sample_answers && item.sample_answers.length > 0) {
            correctMatches[item.id] = item.sample_answers[0].answer_text;
          }
        });
      }
    } catch (error) {
      userMatches = {};
    }

    return (
      <Box>
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
            Your Matches:
          </Typography>
          <List dense>
            {Object.entries(userMatches || {}).map(([itemId, userMatch], index) => {
              const item = question.question_items?.find(q => q.id.toString() === itemId.toString());
              const isMatchCorrect = correctMatches[itemId] && 
                                   userMatch === correctMatches[itemId];
              
              return (
                <ListItem key={itemId} sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    {isMatchCorrect ? 
                      <CheckCircle color="success" fontSize="small" /> : 
                      <Cancel color="error" fontSize="small" />
                    }
                  </ListItemIcon>
                  <ListItemText
                    primary={`${item?.item_text || `Item ${index + 1}`}: ${userMatch || '(not matched)'}`}
                    primaryTypographyProps={{
                      sx: { 
                        color: isMatchCorrect ? 'success.main' : 'error.main',
                        fontSize: '0.9rem'
                      }
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
        
        {showCorrectAnswer && Object.keys(correctMatches).length > 0 && (
          <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
              Correct Matches:
            </Typography>
            <List dense>
              {Object.entries(correctMatches).map(([itemId, correctMatch], index) => {
                const item = question.question_items?.find(q => q.id.toString() === itemId.toString());
                
                return (
                  <ListItem key={itemId} sx={{ py: 0.5 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${item?.item_text || `Item ${index + 1}`}: ${correctMatch}`}
                      primaryTypographyProps={{
                        sx: { color: 'success.dark', fontSize: '0.9rem' }
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
      </Box>
    );
  };

  const renderStatementMatchingAnswer = () => {
    let userAnswers;
    
    try {
      const answerData = answer.answer_json ? JSON.parse(answer.answer_json) : {};
      userAnswers = answerData.statements || answerData;
    } catch (error) {
      userAnswers = {};
    }

    return (
      <Box>
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
            Your Answers:
          </Typography>
          <List dense>
            {Object.entries(userAnswers || {}).map(([statementId, userAnswer], index) => {
              const item = question.question_items?.find(q => q.id.toString() === statementId.toString());
              
              return (
                <ListItem key={statementId} sx={{ py: 1, bgcolor: 'white', mb: 1, borderRadius: 1 }}>
                  <ListItemText
                    primary={item?.item_text || `Statement ${index + 1}`}
                    secondary={`Answer: ${userAnswer || 'No answer'}`}
                    primaryTypographyProps={{ sx: { fontWeight: 500, fontSize: '0.9rem' } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Box>
    );
  };

  const renderOrderingAnswer = () => {
    let userOrder;
    
    try {
      const answerData = answer.answer_json ? JSON.parse(answer.answer_json) : {};
      userOrder = answerData.order || answerData;
    } catch (error) {
      userOrder = {};
    }

    return (
      <Box>
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
            Your Order:
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(userOrder || {}).map(([itemId, order], index) => {
              const item = question.question_items?.find(q => q.id.toString() === itemId.toString());
              
              return (
                <Grid item xs={12} key={itemId}>
                  <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip label={order || '?'} size="small" color="primary" />
                    <Typography variant="body2">
                      {item?.item_text || `Item ${index + 1}`}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Box>
    );
  };

  const renderHeadingMatchingAnswer = () => {
    return renderMatchingAnswer(); // Similar structure to matching
  };

  const renderWritingAnswer = () => {
    const wordCount = answer.text_answer ? answer.text_answer.trim().split(/\s+/).length : 0;

    return (
      <Box>
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Your Writing:
            </Typography>
            <Chip 
              label={`${wordCount} words`} 
              size="small" 
              color={wordCount > 0 ? 'primary' : 'default'}
            />
          </Box>
          <Typography variant="body1" sx={{ 
            whiteSpace: 'pre-wrap', 
            lineHeight: 1.6,
            fontFamily: 'monospace',
            fontSize: '0.95rem'
          }}>
            {answer.text_answer || 'No answer provided'}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderSpeakingAnswer = () => {
    return (
      <Box>
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Your Speaking Response:
          </Typography>
          
          {answer.audio_url && (
            <Box sx={{ mb: 2 }}>
              <audio controls style={{ width: '100%' }}>
                <source src={answer.audio_url} />
                Your browser does not support the audio element.
              </audio>
            </Box>
          )}
          
          {answer.transcribed_text && (
            <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1, border: '1px solid #ddd' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Transcription:
              </Typography>
              <Typography variant="body1" sx={{ 
                whiteSpace: 'pre-wrap',
                fontStyle: 'italic' 
              }}>
                {answer.transcribed_text}
              </Typography>
            </Box>
          )}
          
          {!answer.audio_url && !answer.transcribed_text && (
            <Alert severity="info">
              No audio response recorded
            </Alert>
          )}
        </Box>
      </Box>
    );
  };

  const renderTextAnswer = () => {
    return (
      <Box>
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Your Answer:
          </Typography>
          <Typography variant="body1">
            {answer.text_answer || answer.answer_json || 'No answer provided'}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        {/* Question Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getSkillIcon()}
            {getScoreIcon()}
          </Box>
          
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {question.content || question.question_text || 'Question'}
              </Typography>
              <Chip
                label={`${score}/${maxScore} pts`}
                size="small"
                variant="outlined"
                color="primary"
              />
              <Chip
                label={`${percentage}%`}
                size="small"
                variant="filled"
                color={getScoreColor()}
              />
            </Box>
            
            {question.question_type && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Type: {question.question_type.question_type_name || question.question_type.code}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Answer Display */}
        {renderUserAnswer()}

        {/* Score Summary */}
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: isCorrect ? 'success.50' : isPartiallyCorrect ? 'warning.50' : 'error.50',
          borderRadius: 1,
          border: '1px solid',
          borderColor: isCorrect ? 'success.200' : isPartiallyCorrect ? 'warning.200' : 'error.200'
        }}>
          <Typography variant="body2" sx={{ 
            fontWeight: 600,
            color: isCorrect ? 'success.main' : isPartiallyCorrect ? 'warning.main' : 'error.main'
          }}>
            Score: {score}/{maxScore} points ({percentage}%)
            {isCorrect && ' - Correct!'}
            {isPartiallyCorrect && ' - Partially Correct'}
            {!isCorrect && !isPartiallyCorrect && ' - Incorrect'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}