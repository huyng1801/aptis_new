'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  PlayArrow, 
  Pause, 
  VolumeUp 
} from '@mui/icons-material';

export default function ListeningMultiMCQQuestionResult({ answer, question, showCorrectAnswer = true }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Parse user answers from answer_json
  // For Multi MCQ, answer_json structure is: { [itemId]: optionId }
  const userAnswers = answer.answer_json ? JSON.parse(answer.answer_json) : {};
  const items = question.items || [];
  const options = question.options || [];
  
  // Fix audio URL path
  const audioUrl = question.media_url || question.audio_url;
  const fullAudioUrl = audioUrl?.startsWith('http') 
    ? audioUrl 
    : `http://localhost:3001${audioUrl}`;
  
  console.log('[ListeningMultiMCQResult] Audio URL:', audioUrl, '-> Full URL:', fullAudioUrl);

  // Create option map for quick lookup
  const optionMap = {};
  options.forEach(option => {
    optionMap[option.id] = option.option_text;
  });

  // Group options by item (each item typically has 3 options)
  const getOptionsForItem = (itemIndex) => {
    const optionsPerItem = Math.floor(options.length / items.length);
    const startIdx = itemIndex * optionsPerItem;
    return options.slice(startIdx, startIdx + optionsPerItem);
  };

  // Find correct answer for an item
  const getCorrectOptionForItem = (itemIndex) => {
    const itemOptions = getOptionsForItem(itemIndex);
    return itemOptions.find(opt => opt.is_correct);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      console.log('[ListeningMultiMCQResult] Audio loaded successfully, duration:', audioRef.current.duration);
    }
  };

  const handleError = (e) => {
    console.error('[ListeningMultiMCQResult] Audio load error:', e, 'URL:', fullAudioUrl);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Sort items by item_order
  const sortedItems = [...items].sort((a, b) => (a.item_order || 0) - (b.item_order || 0));

  return (
    <Box>
      {/* Audio player */}
      {fullAudioUrl && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <VolumeUp sx={{ mr: 1, verticalAlign: 'middle' }} />
              Listen to the audio
            </Typography>
            
            <audio
              ref={audioRef}
              src={fullAudioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleError}
              onEnded={handleEnded}
              style={{ display: 'none' }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={handlePlayPause}
                color="primary"
                size="large"
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption">{formatTime(currentTime)}</Typography>
                  <Typography variant="caption">{formatTime(duration)}</Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Main instruction */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
          {question.content}
        </Typography>
      </Paper>

      {/* Sub-questions results */}
      {sortedItems.map((item, itemIndex) => {
        const userAnswerOptionId = userAnswers[item.id];
        const userAnswerOption = options.find(opt => opt.id === userAnswerOptionId);
        const correctOption = getCorrectOptionForItem(itemIndex);
        const isCorrect = userAnswerOptionId === correctOption?.id;
        const itemOptions = getOptionsForItem(itemIndex);

        return (
          <Box key={`multi-mcq-item-${item.id}`} sx={{ mb: 3 }}>
            <Paper sx={{
              p: 3,
              bgcolor: isCorrect ? 'success.50' : (userAnswerOption ? 'error.50' : 'grey.50'),
              border: '1px solid',
              borderColor: isCorrect ? 'success.main' : (userAnswerOption ? 'error.main' : 'grey.300')
            }}>
              {/* Question header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ flex: 1 }}>
                  Question {itemIndex + 1}: {item.item_text}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isCorrect ? (
                    <CheckCircle color="success" sx={{ fontSize: '2rem' }} />
                  ) : (
                    <Cancel color="error" sx={{ fontSize: '2rem' }} />
                  )}
                </Box>
              </Box>

              {/* Options list */}
              <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {itemOptions.map((option, optIndex) => {
                  const isUserSelected = userAnswerOptionId === option.id;
                  const isCorrectOption = option.is_correct;
                  
                  return (
                    <ListItem key={option.id} sx={{
                      bgcolor: isUserSelected 
                        ? (isCorrectOption ? 'success.lighter' : 'error.lighter')
                        : (isCorrectOption && showCorrectAnswer ? 'success.lighter' : 'transparent'),
                      border: '1px solid',
                      borderColor: isUserSelected
                        ? (isCorrectOption ? 'success.main' : 'error.main') 
                        : (isCorrectOption && showCorrectAnswer ? 'success.main' : 'divider'),
                      borderRadius: 1,
                      mb: 1
                    }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {isUserSelected ? (
                          isCorrectOption ? (
                            <CheckCircle color="success" />
                          ) : (
                            <Cancel color="error" />
                          )
                        ) : (
                          isCorrectOption && showCorrectAnswer ? (
                            <CheckCircle color="success" />
                          ) : null
                        )}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: isUserSelected || (isCorrectOption && showCorrectAnswer) ? 600 : 400 
                            }}
                          >
                            <strong>{String.fromCharCode(65 + optIndex)}.</strong> {option.option_text}
                          </Typography>
                        }
                        secondary={
                          isUserSelected ? (
                            <Typography variant="caption" color={isCorrectOption ? 'success.main' : 'error.main'}>
                              Your answer {isCorrectOption ? '(Correct)' : '(Incorrect)'}
                            </Typography>
                          ) : (
                            isCorrectOption && showCorrectAnswer ? (
                              <Typography variant="caption" color="success.main">
                                Correct answer
                              </Typography>
                            ) : null
                          )
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>

              {/* Result summary */}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Your answer:</strong> {
                    userAnswerOption 
                      ? `${String.fromCharCode(65 + itemOptions.findIndex(opt => opt.id === userAnswerOptionId))}. ${userAnswerOption.option_text}`
                      : 'Not answered'
                  }
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color={isCorrect ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 600 }}
                >
                  Result: {isCorrect ? 'Correct' : 'Incorrect'}
                </Typography>
              </Box>
            </Paper>
          </Box>
        );
      })}

      {/* Overall progress */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Completed {sortedItems.filter(item => {
          const userAnswerOptionId = userAnswers[item.id];
          const itemIndex = sortedItems.findIndex(i => i.id === item.id);
          const correctOption = getCorrectOptionForItem(itemIndex);
          return userAnswerOptionId === correctOption?.id;
        }).length}/{sortedItems.length} sub-questions correctly
      </Typography>
    </Box>
  );
}