'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Repeat,
  VolumeUp,
  Hearing
} from '@mui/icons-material';
import ListeningMCQQuestion from './listening/ListeningMCQQuestion';
import ListeningMultiMCQQuestion from './listening/ListeningMultiMCQQuestion';
import ListeningMatchingQuestion from './listening/ListeningMatchingQuestion';
import ListeningStatementMatchingQuestion from './listening/ListeningStatementMatchingQuestion';

export default function PracticeListeningQuestion({ question, answer, onAnswerChange }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef(null);
  const maxPlays = 3;

  // Get audio URL from question data  
  const audioUrl = question.media_url || 
                   question.content?.audio_url || 
                   question.content?.media_url;

  useEffect(() => {
    // Reset audio state when question changes
    setIsPlaying(false);
    setPlayCount(0);
    setCurrentTime(0);
    setDuration(0);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [question.question_id]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (playCount < maxPlays) {
        audioRef.current.play();
        setIsPlaying(true);
        setPlayCount(prev => prev + 1);
      }
    }
  };

  const handleReplay = () => {
    if (audioRef.current && playCount < maxPlays) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      setPlayCount(prev => prev + 1);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
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

  const renderQuestion = () => {
    const questionType = question.question_type_name || question.type || question.question_type;
    
    switch (questionType) {
      case 'multiple_choice':
      case 'LISTENING_MCQ':
        return renderMCQ();
      case 'gap_filling':
      case 'LISTENING_GAP_FILL':
        return renderGapFilling();
      case 'matching':
      case 'LISTENING_MATCHING':
        return renderMatching();
      case 'statement_matching':
        return renderStatementMatching();
      default:
        return renderMCQ();
    }
  };

  const renderMCQ = () => {
    const options = question.question_options || question.options || [];
    
    return (
      <RadioGroup
        value={answer || ''}
        onChange={(e) => onAnswerChange(e.target.value)}
        sx={{ mt: 2 }}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.option_id || option.id}
            value={option.option_id?.toString() || option.id?.toString()}
            control={<Radio />}
            label={option.option_text || option.text}
            sx={{
              mb: 1,
              '& .MuiFormControlLabel-label': {
                fontSize: '1rem',
                lineHeight: 1.6
              }
            }}
          />
        ))}
      </RadioGroup>
    );
  };

  const renderGapFilling = () => {
    const items = question.question_items || question.items || [];
    const correctAnswers = answer || {};

    return (
      <Box sx={{ mt: 2 }}>
        {items.map((item, index) => (
          <Box key={item.item_id || index} sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Question {index + 1}:
            </Typography>
            <TextField
              fullWidth
              value={correctAnswers[item.item_id] || ''}
              onChange={(e) => {
                const newAnswers = { ...correctAnswers };
                newAnswers[item.item_id] = e.target.value;
                onAnswerChange(newAnswers);
              }}
              placeholder={`Answer for question ${index + 1}`}
              variant="outlined"
              size="small"
            />
          </Box>
        ))}
      </Box>
    );
  };

  const renderMatching = () => {
    const items = question.question_items || question.items || [];
    const options = question.question_options || question.options || [];
    const currentAnswers = answer || {};

    return (
      <Box sx={{ mt: 2 }}>
        {items.map((item, index) => (
          <Box key={item.item_id || index} sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              {item.item_text || `Item ${index + 1}`}
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Choose answer</InputLabel>
              <Select
                value={currentAnswers[item.item_id] || ''}
                onChange={(e) => {
                  const newAnswers = { ...currentAnswers };
                  newAnswers[item.item_id] = e.target.value;
                  onAnswerChange(newAnswers);
                }}
                label="Choose answer"
              >
                <MenuItem value="">
                  <em>Select an option</em>
                </MenuItem>
                {options.map((option) => (
                  <MenuItem 
                    key={option.option_id || option.id} 
                    value={option.option_id || option.id}
                  >
                    {option.option_text || option.text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ))}
      </Box>
    );
  };

  const renderStatementMatching = () => {
    const items = question.question_items || question.items || [];
    const currentAnswers = answer || {};
    const options = ['True', 'False', 'Not Given'];

    return (
      <Box sx={{ mt: 2 }}>
        {items.map((item, index) => (
          <Box key={item.item_id || index} sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
              {item.item_text || `Statement ${index + 1}`}
            </Typography>
            <RadioGroup
              value={currentAnswers[item.item_id] || ''}
              onChange={(e) => {
                const newAnswers = { ...currentAnswers };
                newAnswers[item.item_id] = e.target.value;
                onAnswerChange(newAnswers);
              }}
              row
            >
              {options.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio size="small" />}
                  label={option}
                  sx={{ mr: 3 }}
                />
              ))}
            </RadioGroup>
          </Box>
        ))}
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
          bgcolor: 'primary.50',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'primary.200'
        }}>
          <Hearing sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Listening Question
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={`Plays: ${playCount}/${maxPlays}`} 
              size="small" 
              color={playCount >= maxPlays ? 'error' : 'primary'}
            />
            {audioUrl && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  onClick={handlePlayPause}
                  disabled={playCount >= maxPlays}
                  color="primary"
                  sx={{ 
                    bgcolor: 'white',
                    '&:hover': { bgcolor: 'grey.100' },
                    '&:disabled': { bgcolor: 'grey.200' }
                  }}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton 
                  onClick={handleReplay}
                  disabled={playCount >= maxPlays}
                  color="primary"
                  sx={{ 
                    bgcolor: 'white',
                    '&:hover': { bgcolor: 'grey.100' },
                    '&:disabled': { bgcolor: 'grey.200' }
                  }}
                >
                  <Repeat />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>

        {playCount >= maxPlays && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You have reached the maximum number of plays ({maxPlays}). Please answer the questions below.
          </Alert>
        )}

        {audioUrl && (
          <audio
            ref={audioRef}
            onEnded={handleAudioEnded}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            preload="metadata"
          >
            <source src={audioUrl} type="audio/mpeg" />
            <source src={audioUrl} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
          {question.content?.question_text || question.question_text || 'Listen to the audio and answer the questions below.'}
        </Typography>
      </Box>

      {renderQuestion()}
    </Paper>
  );
}