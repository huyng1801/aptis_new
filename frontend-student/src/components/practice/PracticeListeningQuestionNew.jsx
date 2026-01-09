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
  CardContent,
  LinearProgress
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

  const handlePlay = () => {
    if (audioRef.current && playCount < maxPlays) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        if (currentTime === 0) {
          setPlayCount(prev => prev + 1);
        }
      }
    }
  };

  const handleAudioLoad = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine question type from question data
  const questionType = question.question_type || question.type;

  const renderListeningQuestion = () => {
    switch (questionType) {
      case 'MULTIPLE_CHOICE':
      case 'MCQ':
      case 'mcq':
        return (
          <ListeningMCQQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
      case 'MULTI_MCQ':
      case 'multi_mcq':
        return (
          <ListeningMultiMCQQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
      case 'MATCHING':
      case 'matching':
        return (
          <ListeningMatchingQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
      case 'STATEMENT_MATCHING':
      case 'statement_matching':
        return (
          <ListeningStatementMatchingQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
      default:
        return (
          <ListeningMCQQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
    }
  };

  return (
    <Card>
      <CardContent>
        {/* Audio Controls */}
        {audioUrl && (
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Hearing sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Listening Audio
              </Typography>
              <Chip 
                label={`${playCount}/${maxPlays} plays`}
                color={playCount >= maxPlays ? "error" : "primary"}
                size="small"
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <audio 
                ref={audioRef}
                src={audioUrl}
                onLoadedMetadata={handleAudioLoad}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleAudioEnd}
              />

              <Box display="flex" alignItems="center" gap={2}>
                <IconButton 
                  onClick={handlePlay}
                  disabled={playCount >= maxPlays}
                  color="primary"
                  size="large"
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>

                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={duration ? (currentTime / duration) * 100 : 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      {formatTime(currentTime)}
                    </Typography>
                    <Typography variant="caption">
                      {formatTime(duration)}
                    </Typography>
                  </Box>
                </Box>

                <VolumeUp color="action" />
              </Box>

              {playCount >= maxPlays && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You have reached the maximum number of plays for this audio.
                </Alert>
              )}
            </Box>
          </Paper>
        )}

        {/* Question Content */}
        {renderListeningQuestion()}
      </CardContent>
    </Card>
  );
}