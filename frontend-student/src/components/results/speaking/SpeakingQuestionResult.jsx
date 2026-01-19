'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  LinearProgress,
  Chip,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  VolumeUp, 
  Download,
  Mic,
  Timer
} from '@mui/icons-material';

export default function SpeakingQuestionResult({ answer, question, feedback = null }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Build full URL for audio file
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';
  const audioUrl = answer.audio_url 
    ? (answer.audio_url.startsWith('http') 
        ? answer.audio_url 
        : `${backendUrl}${answer.audio_url}`)
    : null;
    
  const transcription = answer.transcribed_text || answer.transcription || '';
  
  // Get question type specific info
  const questionType = question.questionType?.type_name || '';
  const preparationTime = getPreparationTime(questionType);
  const recordingTime = getRecordingTime(questionType);

  function getPreparationTime(type) {
    const times = {
      'SPEAKING_INTRO': 10,
      'SPEAKING_DESCRIPTION': 15, 
      'SPEAKING_COMPARISON': 20,
      'SPEAKING_DISCUSSION': 60
    };
    return times[type] || 0;
  }

  function getRecordingTime(type) {
    const times = {
      'SPEAKING_INTRO': 45,
      'SPEAKING_DESCRIPTION': 60,
      'SPEAKING_COMPARISON': 90, 
      'SPEAKING_DISCUSSION': 120
    };
    return times[type] || 60;
  }

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

  return (
    <Box>
      {/* Question prompt */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {question.content}
        </Typography>
        
        {/* Question type and timing info */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Chip 
            icon={<Timer />}
            label={`Prep: ${preparationTime}s`}
            size="small"
            variant="outlined"
          />
          <Chip 
            icon={<Mic />}
            label={`Record: ${recordingTime}s`}
            size="small"
            variant="outlined"
          />
          <Chip 
            label={questionType.replace('SPEAKING_', '').toLowerCase()}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Stack>
      </Paper>


      {/* Audio player */}
      {audioUrl && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <VolumeUp sx={{ mr: 1, verticalAlign: 'middle' }} />
              Your Recording
            </Typography>
            
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              style={{ display: 'none' }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
              
              <IconButton 
                component="a" 
                href={audioUrl} 
                download
                color="primary"
              >
                <Download />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* No audio message */}
      {!audioUrl && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.main' }}>
          <Typography variant="body1" color="warning.dark">
            No audio recording found for this question.
          </Typography>
        </Paper>
      )}

      {/* Transcription */}
      {transcription && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Transcription:</Typography>
          <Paper sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {transcription}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* AI Feedback */}
      {feedback?.feedback && (
        <Box>
          <Typography variant="h6" gutterBottom>AI Feedback:</Typography>
          <Paper sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {feedback.feedback}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
}