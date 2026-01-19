'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  PlayArrow, 
  Pause, 
  VolumeUp 
} from '@mui/icons-material';

export default function ListeningMCQQuestionResult({ answer, question, showCorrectAnswer = true }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const options = question.options || [];
  const userAnswerId = answer.selected_option_id;
  const userAnswer = options.find(opt => opt.id === userAnswerId);
  const correctAnswer = options.find(opt => opt.is_correct);
  const isCorrect = userAnswerId === correctAnswer?.id;
  
  // Fix audio URL path
  const audioUrl = question.media_url || question.audio_url;
  const fullAudioUrl = audioUrl?.startsWith('http') 
    ? audioUrl 
    : `http://localhost:3001${audioUrl}`;
  
  console.log('[ListeningMCQResult] Audio URL:', audioUrl, '-> Full URL:', fullAudioUrl);

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
      console.log('[ListeningMCQResult] Audio loaded successfully, duration:', audioRef.current.duration);
    }
  };

  const handleError = (e) => {
    console.error('[ListeningMCQResult] Audio load error:', e, 'URL:', fullAudioUrl);
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
              onEnded={handleEnded}
              onError={handleError}
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

      {/* Question content */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {question.content}
        </Typography>
      </Paper>

      {/* Answer options */}
      <List>
        {options.map((option, index) => {
          const isUserAnswer = option.id === userAnswerId;
          const isCorrectOption = option.is_correct;
          let backgroundColor, borderColor, icon;

          if (isUserAnswer && isCorrectOption) {
            backgroundColor = 'success.50';
            borderColor = 'success.main';
            icon = <CheckCircle color="success" />;
          } else if (isUserAnswer && !isCorrectOption) {
            backgroundColor = 'error.50';
            borderColor = 'error.main';
            icon = <Cancel color="error" />;
          } else if (!isUserAnswer && isCorrectOption && showCorrectAnswer) {
            backgroundColor = 'success.100';
            borderColor = 'success.dark';
            icon = <CheckCircle color="success" />;
          } else {
            backgroundColor = 'grey.50';
            borderColor = 'grey.300';
            icon = null;
          }

          return (
            <ListItem
              key={option.id}
              sx={{
                mb: 1,
                borderRadius: 1,
                border: '2px solid',
                borderColor,
                bgcolor: backgroundColor,
                position: 'relative'
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  minWidth: '32px',
                  mr: 2,
                  fontWeight: 'bold',
                  color: isUserAnswer ? (isCorrectOption ? 'success.dark' : 'error.dark') : 'text.primary'
                }}
              >
                {String.fromCharCode(65 + index)}.
              </Typography>
              <ListItemText
                primary={option.option_text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: isUserAnswer ? 'bold' : 'normal'
                  }
                }}
              />
              {icon && (
                <ListItemIcon sx={{ minWidth: 'auto' }}>
                  {icon}
                </ListItemIcon>
              )}
            </ListItem>
          );
        })}
      </List>

      {/* Result summary */}
      <Paper sx={{ 
        p: 2, 
        mt: 2, 
        bgcolor: isCorrect ? 'success.50' : 'error.50',
        border: '1px solid',
        borderColor: isCorrect ? 'success.main' : 'error.main'
      }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Result: {isCorrect ? 'Correct' : 'Incorrect'}
        </Typography>
        {userAnswer ? (
          <Typography variant="body2">
            Your answer: <strong>{String.fromCharCode(65 + options.findIndex(o => o.id === userAnswerId))}. {userAnswer.option_text}</strong>
          </Typography>
        ) : (
          <Typography variant="body2" color="error.dark">
            No answer selected
          </Typography>
        )}
        {showCorrectAnswer && correctAnswer && !isCorrect && (
          <Typography variant="body2" color="success.dark">
            Correct answer: <strong>{String.fromCharCode(65 + options.findIndex(o => o.id === correctAnswer.id))}. {correctAnswer.option_text}</strong>
          </Typography>
        )}
      </Paper>
    </Box>
  );
}