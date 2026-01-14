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
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  Warning,
  Repeat,
} from '@mui/icons-material';

/**
 * Listening Speaker Matching Component
 * Each speaker has their own audio file (stored in QuestionItem.media_url)
 * Students match speakers with options
 */
export default function ListeningMatchingQuestion({ 
  question, 
  onAnswerChange
}) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [playingIndex, setPlayingIndex] = useState(null);
  const [playCount, setPlayCount] = useState({});
  const audioRefs = useRef({});

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
          console.error('[ListeningMatchingQuestion] Failed to parse answer_json:', error);
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

  const handlePlayAudio = (index, audioUrl) => {
    // Check if already at max plays (2)
    const currentCount = playCount[index] || 0;
    if (currentCount >= 2 && playingIndex !== index) {
      return; // Don't allow playing if max plays reached
    }

    // Stop all other audio first
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    const audio = audioRefs.current[index];
    if (audio) {
      if (playingIndex === index) {
        audio.pause();
        setPlayingIndex(null);
      } else {
        audio.play();
        setPlayingIndex(index);
        // Increment play count
        setPlayCount(prev => ({
          ...prev,
          [index]: (prev[index] || 0) + 1
        }));
      }
    }
  };

  const handleAudioEnded = () => {
    setPlayingIndex(null);
  };

  // Parse question content to extract instruction
  const instruction = question.content || question.question_content?.instruction || 
    'Listen to each speaker and match them with the correct option.';

  // Get items (speakers) and options from question
  const items = question.items || [];
  const options = question.options || [];

  const getAudioUrl = (item) => {
    const audioUrl = item.media_url || item.audio_url;
    if (!audioUrl) return null;

    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      return audioUrl;
    }

    const serverUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';
    return audioUrl.startsWith('/') ? `${serverUrl}${audioUrl}` : `${serverUrl}/${audioUrl}`;
  };

  return (
    <Box>
      {/* Instruction */}
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        {instruction}
      </Typography>

      {/* Speakers with individual audio players */}
      <Grid container spacing={3}>
        {items.map((item, index) => {
          const audioUrl = getAudioUrl(item);
          const speakerLabel = item.content || `Speaker ${index + 1}`;
          const currentPlayCount = playCount[index] || 0;
          const canPlay = currentPlayCount < 2;

          // Local state for progress
          const [duration, setDuration] = useState(0);
          const [currentTime, setCurrentTime] = useState(0);

          // Progress bar click handler
          const handleProgressClick = (e) => {
            const progressBar = e.currentTarget;
            const clickX = e.clientX - progressBar.getBoundingClientRect().left;
            const percentage = clickX / progressBar.offsetWidth;
            const newTime = percentage * duration;
            const audio = audioRefs.current[index];
            if (audio && canPlay) {
              audio.currentTime = newTime;
              setCurrentTime(newTime);
            }
          };

          // Audio time update
          const handleTimeUpdate = () => {
            const audio = audioRefs.current[index];
            if (audio) setCurrentTime(audio.currentTime);
          };
          const handleLoadedMetadata = () => {
            const audio = audioRefs.current[index];
            if (audio) setDuration(audio.duration);
          };

          // Format time helper
          const formatTime = (seconds) => {
            if (!seconds || isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
          };

          return (
            <Grid item xs={12} key={item.id || index}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  mb: 2,
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
                    width: 200,
                    height: 200,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    transform: 'translate(50%, -50%)',
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={2} position="relative" zIndex={1}>
                  {/* Speaker Number Badge */}
                  <Box
                    sx={{
                      minWidth: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '18px',
                    }}
                  >
                    {index + 1}
                  </Box>

                  {/* Speaker Label */}
                  <Typography
                    variant="subtitle1"
                    sx={{
                      flex: 1,
                      color: 'white',
                      fontWeight: 600,
                    }}
                  >
                    {speakerLabel}
                  </Typography>

                  {/* Play Count Chip */}
                  <Chip
                    label={`${currentPlayCount}/2 Số lần phát đã dùng`}
                    size="small"
                    sx={{
                      backgroundColor: currentPlayCount < 2 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 100, 100, 0.4)',
                      color: 'white',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255, 255, 255, 0.5)'
                    }}
                  />
                </Box>

                {/* Audio Controls */}
                <Box display="flex" alignItems="center" gap={2} position="relative" zIndex={1} mt={2}>
                  {/* Play/Pause Button */}
                  <IconButton
                    onClick={() => handlePlayAudio(index, audioUrl)}
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
                    {playingIndex === index ? (
                      <Pause sx={{ fontSize: '2rem' }} />
                    ) : (
                      <PlayArrow sx={{ fontSize: '2rem' }} />
                    )}
                  </IconButton>

                  {/* Progress Bar */}
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
                          transition: playingIndex === index ? 'none' : 'width 0.1s'
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

                  {/* Replay Button */}
                  <IconButton
                    onClick={() => {
                      if (!canPlay) return;
                      const audio = audioRefs.current[index];
                      if (audio) {
                        audio.currentTime = 0;
                        audio.play();
                        setPlayingIndex(index);
                        setPlayCount(prev => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
                      }
                    }}
                    disabled={!canPlay}
                    sx={{
                      color: 'white',
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                      '&:hover': {
                        backgroundColor: canPlay ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      },
                      '&:disabled': {
                        color: 'rgba(255, 255, 255, 0.5)',
                      },
                      flexShrink: 0
                    }}
                  >
                    <Repeat />
                  </IconButton>

                  {/* Hidden Audio Element */}
                  <audio
                    ref={el => audioRefs.current[index] = el}
                    src={audioUrl}
                    onEnded={handleAudioEnded}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    preload="metadata"
                  />
                </Box>

                {/* Play Limit Warning */}
                {currentPlayCount >= 2 && (
                  <Box mt={2} display="flex" alignItems="center" gap={2} position="relative" zIndex={1}>
                    <Typography variant="caption" sx={{ color: '#ffcccc', fontWeight: 'bold' }}>
                      ⚠ Đã đạt số lượt phát tối đa
                    </Typography>
                  </Box>
                )}

                {/* Answer Selection */}
                <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                  <Select
                    value={selectedAnswers[item.id] || ''}
                    onChange={(e) => handleAnswerSelect(item.id, e.target.value)}
                    displayEmpty
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Chọn một tùy chọn...</em>
                    </MenuItem>
                    {options.map((option) => (
                      <MenuItem
                        key={option.id}
                        value={option.id}
                      >
                        {option.option_text}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Show selected answer */}
                {selectedAnswers[item.id] && (
                  <Box mt={1.5}>
                    <Chip
                      label={options.find(opt => opt.id === selectedAnswers[item.id])?.option_text || 'Selected'}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(76, 175, 80, 0.3)',
                        color: 'white',
                        border: '1px solid rgba(76, 175, 80, 0.7)',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Help text */}
      {items.length === 0 && (
        <Alert severity="info">
          No speakers available for this question.
        </Alert>
      )}
    </Box>
  );
}
