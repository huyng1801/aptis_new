'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Repeat,
} from '@mui/icons-material';

/**
 * Listening Multi-Question MCQ Component
 * One shared audio with multiple sub-questions
 */
export default function ListeningMultiMCQQuestion({ 
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
    console.log('[ListeningMultiMCQQuestion] Question changed, resetting for Q' + question.id);
    
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
          console.error('[ListeningMultiMCQQuestion] Failed to parse answer_json:', error);
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

  // Get audio URL
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
      console.log('[ListeningMultiMCQQuestion] Q' + question.id + ' Audio URL:', finalUrl);
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
  const items = question.items || [];
  const options = question.options || [];
  
  // Main instruction
  const instruction = question.content || question.question_content?.instruction || '';

  // Group options by item (each item has 3 options typically)
  const getOptionsForItem = (itemIndex) => {
    const optionsPerItem = Math.floor(options.length / items.length);
    const startIdx = itemIndex * optionsPerItem;
    return options.slice(startIdx, startIdx + optionsPerItem);
  };

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
          {instruction && (
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
              {instruction}
            </Typography>
          )}
          
          <Box display="flex" alignItems="center" gap={2}>
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
              {isPlaying ? <Pause sx={{ fontSize: '2rem' }} /> : <PlayArrow sx={{ fontSize: '2rem' }} />}
            </IconButton>

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

            <IconButton onClick={handleReplay} color="primary" sx={{ flexShrink: 0 }}>
              <Repeat />
            </IconButton>
          </Box>

          {playCount > 0 && (
            <Box mt={2}>
              <Chip 
                label={`Played ${playCount} time${playCount > 1 ? 's' : ''}`}
                size="small"
                color="primary"
              />
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

      {/* Sub-questions */}
      <Box>
        {items.map((item, itemIndex) => {
          const itemOptions = getOptionsForItem(itemIndex);
          
          return (
            <Paper 
              key={item.id || itemIndex}
              elevation={1}
              sx={{ 
                p: 3, 
                mb: 3,
                backgroundColor: selectedAnswers[item.id] ? 'action.selected' : 'background.paper'
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Question {itemIndex + 1}: {item.item_text || item.content}
              </Typography>

              <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
                <RadioGroup
                  value={selectedAnswers[item.id] || ''}
                  onChange={(e) => handleAnswerSelect(item.id, parseInt(e.target.value))}
                >
                  {itemOptions.map((option, optIdx) => (
                    <FormControlLabel
                      key={option.id}
                      value={option.id}
                      control={<Radio />}
                      label={
                        <Typography variant="body1">
                          <strong>{String.fromCharCode(65 + optIdx)}.</strong> {option.option_text}
                        </Typography>
                      }
                      sx={{
                        mb: 1,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: selectedAnswers[item.id] === option.id ? 'primary.main' : 'divider',
                        backgroundColor: selectedAnswers[item.id] === option.id ? 'primary.lighter' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>
          );
        })}

        {items.length === 0 && (
          <Alert severity="info">
            No sub-questions available for this question.
          </Alert>
        )}
      </Box>
    </Box>
  );
}
