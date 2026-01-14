'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  Alert,
  FormControl,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Repeat,
} from '@mui/icons-material';

/**
 * Listening Statement Matching Component
 * One main audio (conversation), multiple statements to match with options (e.g., people)
 */
export default function ListeningStatementMatchingQuestion({ 
  question, 
  onAnswerChange
}) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  // Reset audio state when question changes
  useEffect(() => {
    console.log('[ListeningStatementMatchingQuestion] Question changed, resetting for Q' + question.id);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setPlayCount(0);
  }, [question.id]);

  // Initialize answer from question.answer_data
  useEffect(() => {
    if (question.answer_data && typeof question.answer_data === 'object') {
      // If answer_data has answer_json (from database), parse it
      if (question.answer_data.answer_json) {
        try {
          const parsedAnswers = JSON.parse(question.answer_data.answer_json);
          // Remove meta fields that got saved accidentally
          const cleanAnswers = {};
          Object.keys(parsedAnswers).forEach(key => {
            if (key !== 'answer_type' && key !== 'answer_json' && key !== 'selected_option_id' && key !== 'text_answer' && key !== 'audio_url') {
              cleanAnswers[key] = parsedAnswers[key];
            }
          });
          setSelectedAnswers(cleanAnswers);
        } catch (error) {
          console.error('[ListeningStatementMatchingQuestion] Failed to parse answer_json:', error);
          setSelectedAnswers({});
        }
      } else {
        // Direct object (for backward compatibility)
        setSelectedAnswers(question.answer_data);
      }
    } else {
      setSelectedAnswers({});
    }
  }, [question.id, question.answer_data]);

  // Get main audio URL
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
      console.log('[ListeningStatementMatchingQuestion] Q' + question.id + ' Audio URL:', finalUrl);
    } else {
      console.warn('[ListeningStatementMatchingQuestion] No audio URL found for Q' + question.id);
    }
  }, [question.media_url, question.question_content?.audio_url, question.question_content?.media_url, question.id]);

  const handleAnswerSelect = (itemId, optionId) => {
    const newAnswers = {
      ...selectedAnswers,
      [itemId]: optionId
    };
    
    setSelectedAnswers(newAnswers);
    
    if (onAnswerChange) {
      // Send as JSON string for backend
      onAnswerChange({
        answer_type: 'json',
        answer_json: JSON.stringify(newAnswers)
      });
    }
  };

  const canPlay = playCount < 2;

  const handlePlayPause = () => {
    if (!canPlay) return;
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        if (audioRef.current.currentTime === 0) {
          setPlayCount(prev => prev + 1);
        }
      }
    }
  };

  const handleReplay = () => {
    if (!canPlay) return;
    
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

  // Parse question content
  const instruction = question.content || question.question_content?.instruction || 
    'Listen to the conversation and match each statement with the correct person.';

  const items = question.items || [];
  const options = question.options || [];
  const hasAudio = !!audioUrlRef.current;

  return (
    <Box>
      {/* Main Audio Player */}
      {hasAudio ? (
        <Paper 
          elevation={3}
          sx={{ 
            p: 3, 
            mb: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 2,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: 300,
              height: 300,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              transform: 'translate(50%, -50%)'
            }
          }}
        >
          <Typography variant="subtitle2" gutterBottom sx={{ position: 'relative', zIndex: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
            Main Conversation
          </Typography>
          
          <Box display="flex" alignItems="center" gap={2} position="relative" zIndex={1}>
            <IconButton
              onClick={handlePlayPause}
              disabled={!canPlay}
              sx={{
                backgroundColor: canPlay ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                '&:hover': {
                  backgroundColor: canPlay ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                },
                '&:disabled': {
                  color: 'rgba(255, 255, 255, 0.5)',
                },
                width: 56,
                height: 56,
                flexShrink: 0
              }}
            >
              {isPlaying ? <Pause sx={{ fontSize: '2rem' }} /> : <PlayArrow sx={{ fontSize: '2rem' }} />}
            </IconButton>

            <Box sx={{ flex: 1 }}>
              <Box
                onClick={canPlay ? handleProgressClick : undefined}
                sx={{
                  width: '100%',
                  height: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  cursor: canPlay ? 'pointer' : 'not-allowed',
                  position: 'relative',
                  mb: 1,
                  overflow: 'hidden',
                  opacity: canPlay ? 1 : 0.6
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                    transition: isPlaying ? 'none' : 'width 0.1s'
                  }}
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight="bold" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {formatTime(currentTime)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {formatTime(duration)}
                </Typography>
              </Box>
            </Box>

            <IconButton 
              onClick={handleReplay} 
              disabled={!canPlay}
              sx={{ 
                flexShrink: 0,
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                '&:hover': {
                  backgroundColor: canPlay ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                },
                '&:disabled': {
                  color: 'rgba(255, 255, 255, 0.5)',
                }
              }}
            >
              <Repeat />
            </IconButton>
          </Box>

          {playCount > 0 && (
            <Box mt={2} display="flex" alignItems="center" gap={2} position="relative" zIndex={1}>
              <Chip 
                label={`${playCount}/2 Số lần phát đã dùng`}
                size="small"
                sx={{
                  backgroundColor: playCount < 2 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 100, 100, 0.4)',
                  color: 'white',
                  fontWeight: 'bold',
                  border: '1px solid rgba(255, 255, 255, 0.5)'
                }}
              />
              {playCount >= 2 && (
                <Typography variant="caption" sx={{ color: '#ffcccc', fontWeight: 'bold' }}>
                  ⚠ Đã đạt số lượt phát tối đa
                </Typography>
              )}
            </Box>
          )}

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

      {/* Instruction */}
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        {instruction}
      </Typography>

      {/* Statements to match */}
      <Grid container spacing={2}>
        {items.map((item, index) => (
          <Grid item xs={12} key={item.id || index}>
            <Paper 
              elevation={1}
              sx={{ 
                p: 2,
                backgroundColor: selectedAnswers[item.id] ? 'action.selected' : 'background.paper'
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body1" sx={{ flex: 1 }}>
                  <strong>{index + 1}.</strong> {item.content || item.item_text}
                </Typography>

                <FormControl sx={{ minWidth: 200 }}>
                  <Select
                    value={selectedAnswers[item.id] || ''}
                    onChange={(e) => handleAnswerSelect(item.id, e.target.value)}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="" disabled>
                      <em>Select...</em>
                    </MenuItem>
                    {options.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.option_text}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {items.length === 0 && (
        <Alert severity="info">
          No statements available for this question.
        </Alert>
      )}
    </Box>
  );
}
