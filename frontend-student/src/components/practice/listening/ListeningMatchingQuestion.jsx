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
  VolumeUp,
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
          
          return (
            <Grid item xs={12} key={item.id || index}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: 2,
                  backgroundColor: selectedAnswers[item.id] ? 'action.selected' : 'background.paper'
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {/* Audio Player Button */}
                  {audioUrl ? (
                    <>
                      <IconButton
                        onClick={() => handlePlayAudio(index, audioUrl)}
                        color="primary"
                        sx={{
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                          width: 48,
                          height: 48,
                        }}
                      >
                        {playingIndex === index ? (
                          <Pause />
                        ) : (
                          <PlayArrow />
                        )}
                      </IconButton>
                      <audio
                        ref={el => audioRefs.current[index] = el}
                        src={audioUrl}
                        onEnded={handleAudioEnded}
                        preload="metadata"
                      />
                    </>
                  ) : (
                    <VolumeUp color="disabled" />
                  )}

                  <Typography variant="subtitle1" fontWeight="bold" sx={{ flex: 1 }}>
                    {speakerLabel}
                  </Typography>

                  {/* Answer Selection */}
                  <FormControl sx={{ minWidth: 300 }}>
                    <Select
                      value={selectedAnswers[item.id] || ''}
                      onChange={(e) => handleAnswerSelect(item.id, e.target.value)}
                      displayEmpty
                      size="small"
                    >
                      <MenuItem value="" disabled>
                        <em>Select an option...</em>
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
                </Box>

                {/* Show selected answer */}
                {selectedAnswers[item.id] && (
                  <Box ml={7}>
                    <Chip 
                      label={options.find(opt => opt.id === selectedAnswers[item.id])?.option_text || 'Selected'}
                      size="small"
                      color="primary"
                      variant="outlined"
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
