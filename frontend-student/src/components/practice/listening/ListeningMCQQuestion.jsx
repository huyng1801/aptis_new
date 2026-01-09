'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Repeat,
} from '@mui/icons-material';
import MCQQuestion from '../MCQQuestion';

/**
 * Listening MCQ Question Component
 * Handles multiple choice questions with audio playback
 */
export default function ListeningMCQQuestion({ 
  question, 
  answer,
  onAnswerChange,
  isPractice = false
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  // Reset audio state when question changes
  useEffect(() => {
    console.log('[ListeningMCQQuestion] Question changed, resetting audio state for Q' + question.id);
    
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Reset states
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setPlayCount(0);
  }, [question.id]);

  // Get audio URL from question data
  useEffect(() => {
    const audioUrl = question.media_url || 
                     question.question_content?.audio_url || 
                     question.question_content?.media_url;
    
    if (audioUrl) {
      let finalUrl = audioUrl;
      if (!audioUrl.startsWith('http://') && !audioUrl.startsWith('https://')) {
        const serverUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';
        finalUrl = audioUrl.startsWith('/') ? `${serverUrl}${audioUrl}` : `${serverUrl}/${audioUrl}`;
      }
      
      audioUrlRef.current = finalUrl;
      console.log('[ListeningMCQQuestion] Q' + question.id + ' Audio URL:', finalUrl);
    } else {
      console.warn('[ListeningMCQQuestion] No audio URL found for Q' + question.id);
    }
  }, [question.media_url, question.question_content?.audio_url, question.question_content?.media_url, question.id]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        setPlayCount(prev => prev + 1);
      }
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
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

  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget;
    const clickX = e.clientX - progressBar.getBoundingClientRect().left;
    const percentage = clickX / progressBar.offsetWidth;
    const newTime = percentage * duration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasAudio = !!audioUrlRef.current;

  return (
    <Box>
      {/* Audio Player Section */}
      {hasAudio ? (
        <Paper 
          elevation={3}
          sx={{ 
            p: 3, 
            mb: 3, 
            backgroundColor: 'primary.light',
            borderLeft: '4px solid',
            borderLeftColor: 'primary.main'
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            {/* Play/Pause Button */}
            <IconButton
              onClick={handlePlayPause}
              color="primary"
              sx={{
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                width: 56,
                height: 56,
                flexShrink: 0
              }}
            >
              {isPlaying ? (
                <Pause sx={{ fontSize: '2rem' }} />
              ) : (
                <PlayArrow sx={{ fontSize: '2rem' }} />
              )}
            </IconButton>

            {/* Progress Bar */}
            <Box sx={{ flex: 1 }}>
              <Box
                onClick={handleProgressClick}
                sx={{
                  width: '100%',
                  height: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: 3,
                  cursor: 'pointer',
                  position: 'relative',
                  mb: 1,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    backgroundColor: 'primary.main',
                    width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                    transition: isPlaying ? 'none' : 'width 0.1s'
                  }}
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight="bold">
                  {formatTime(currentTime)}
                </Typography>
                <Typography variant="caption">
                  {formatTime(duration)}
                </Typography>
              </Box>
            </Box>

            {/* Replay Button */}
            <IconButton
              onClick={handleReplay}
              color="primary"
              sx={{
                flexShrink: 0
              }}
            >
              <Repeat />
            </IconButton>
          </Box>

          {/* Play Counter */}
          {playCount > 0 && (
            <Box mt={2} display="flex" alignItems="center" gap={1}>
              <Chip 
                label={`Played ${playCount} time${playCount > 1 ? 's' : ''}`}
                size="small"
                color="primary"
              />
            </Box>
          )}

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={audioUrlRef.current}
            onEnded={handleAudioEnded}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            preload="metadata"
          />
        </Paper>
      ) : (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No audio file available for this question.
        </Alert>
      )}

      {/* Question Content */}
      <MCQQuestion
        question={{
          ...question,
          answer_data: question.answer_data || null
        }}
        answer={answer}
        onAnswerChange={onAnswerChange}
        isPractice={isPractice}
      />
    </Box>
  );
}
