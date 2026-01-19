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
  Grid,
  Divider,
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  PlayArrow, 
  Pause, 
  VolumeUp 
} from '@mui/icons-material';

export default function ListeningStatementMatchingQuestionResult({ answer, question, showCorrectAnswer = true }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Parse user answers from answer_json
  const userAnswers = answer.answer_json ? JSON.parse(answer.answer_json) || {} : {};
  const items = question.items || [];
  const options = question.options || [];
  
  // Fix audio URL path
  const audioUrl = question.media_url || question.audio_url;
  const fullAudioUrl = audioUrl?.startsWith('http') 
    ? audioUrl 
    : `http://localhost:3001${audioUrl}`;

  // Create a map for quick option lookup
  const optionMap = {};
  options.forEach(option => {
    optionMap[option.id] = option.option_text;
  });

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
    }
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

  // Parse content to extract instruction
  const contentLines = question.content.split('\n').filter(line => line.trim() !== '');
  const instructionText = contentLines[0] || question.content;

  // Sort items by item_order
  const sortedItems = [...items].sort((a, b) => (a.item_order || 0) - (b.item_order || 0));

  // Statement matching options (man, woman, both)
  const statementOptions = ['Man', 'Woman', 'Both'];

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

      {/* Instructions */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
          {instructionText}
        </Typography>
      </Paper>

      {/* Available options */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem', fontWeight: 600 }}>
          Options:
        </Typography>
        <Grid container spacing={1}>
          {options.map((option, index) => (
            <Grid item key={option.id}>
              <Typography variant="body2">
                {option.option_text}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Statement Matching Results */}
      {sortedItems.map((item, index) => {
        const userAnswerOptionId = userAnswers[item.id];
        const userAnswerText = userAnswerOptionId ? optionMap[userAnswerOptionId] : null;
        
        // Get correct answer from item.correct_option_id (maps to option_text)
        const correctAnswerText = item.correct_option_id ? optionMap[item.correct_option_id] : null;
        
        // Compare numeric IDs directly
        const isCorrect = userAnswerOptionId && item.correct_option_id
          ? parseInt(userAnswerOptionId) === parseInt(item.correct_option_id)
          : false;

        return (
          <Box key={`statement-${item.id}`} sx={{ mb: 2 }}>
            <Paper sx={{
              p: 2,
              bgcolor: isCorrect ? 'success.50' : (userAnswerText ? 'error.50' : 'grey.50'),
              border: '1px solid',
              borderColor: isCorrect ? 'success.main' : (userAnswerText ? 'error.main' : 'grey.300')
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body1" sx={{ flex: 1, minWidth: 300 }}>
                  <strong>{index + 1}.</strong> {item.item_text}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
                  <Typography variant="body2" sx={{ 
                    px: 2, 
                    py: 0.5, 
                    borderRadius: 1, 
                    bgcolor: 'white',
                    border: '1px solid #ddd',
                    fontWeight: 600
                  }}>
                    {userAnswerText || 'Not answered'}
                  </Typography>
                  {isCorrect ? (
                    <CheckCircle color="success" />
                  ) : (
                    <Cancel color="error" />
                  )}
                </Box>
              </Box>

              {showCorrectAnswer && !isCorrect && (
                <Typography variant="body2" color="success.dark">
                  <strong>Correct answer:</strong> {correctAnswerText}
                </Typography>
              )}
            </Paper>
          </Box>
        );
      })}

      {/* Progress indicator */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Hoàn thành {sortedItems.filter(item => {
          const userAnswerOptionId = userAnswers[item.id];
          return userAnswerOptionId && item.correct_option_id
            ? parseInt(userAnswerOptionId) === parseInt(item.correct_option_id)
            : false;
        }).length}/{sortedItems.length} statements
      </Typography>
    </Box>
  );
}