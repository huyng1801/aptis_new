'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Divider,
  LinearProgress,
} from '@mui/material';

export default function ShortTextWritingResult({ answer, question, feedback = null }) {
  const userAnswer = answer.text_answer || '';
  const hasAnswer = userAnswer.trim() !== '';
  
  // Word count analysis
  const wordCount = userAnswer.trim().split(/\s+/).filter(word => word.length > 0).length;
  const targetWordCount = { min: 20, max: 30 };
  const isWithinWordCount = wordCount >= targetWordCount.min && wordCount <= targetWordCount.max;
  
  // Extract score and feedback
  const score = feedback?.score || answer.final_score || answer.score || 0;
  const maxScore = answer.max_score || question.max_score || 10; // Use actual max_score from answer/question
  const cefrLevel = feedback?.cefr_level || 'Not assessed';
  const comment = feedback?.comment || '';
  const suggestions = feedback?.suggestions || '';

  // Color coding based on score
  const getScoreColor = (score) => {
    if (score >= 4) return 'success';
    if (score >= 3) return 'info';
    if (score >= 2) return 'warning';
    return 'error';
  };

  // CEFR level mapping for Task 2
  const getCefrDisplay = (level) => {
    const mapping = {
      'A0': 'A0 (No meaningful language)',
      'A1.1': 'A1.1 (Limited words/phrases)',
      'A1.2': 'A1.2 (Not fully on topic)',
      'A2.1': 'A2.1 (On topic, list of sentences)',
      'A2.2': 'A2.2 (On topic, some connectors)',
      'B1+': 'B1+ (Above A2 level)'
    };
    return mapping[level] || level;
  };

  // Word count progress
  const wordCountProgress = Math.min((wordCount / targetWordCount.max) * 100, 100);

  return (
    <Box>
      {/* Task Instructions */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'blue.50', border: '1px solid #e3f2fd' }}>
        <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, fontWeight: 'bold' }}>
          APTIS Writing Task 2 - Short Text Writing
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Write a response of 20-30 words. Assessment covers: task fulfillment, grammar, punctuation, vocabulary, and cohesion.
        </Typography>
      </Paper>

      {/* Score Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip 
            label={`Score: ${score}/${maxScore}`}
            color={getScoreColor(score)}
            size="large"
            sx={{ fontWeight: 'bold' }}
          />
          <Chip 
            label={getCefrDisplay(cefrLevel)}
            variant="outlined"
            color="primary"
          />
          <Chip 
            label={`${wordCount} words`}
            variant="outlined"
            color={isWithinWordCount ? 'success' : 'warning'}
          />
          <Chip 
            label={hasAnswer ? 'Answered' : 'Not Answered'}
            variant="outlined"
            color={hasAnswer ? 'info' : 'error'}
          />
        </Stack>
        
        {comment && (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            {comment}
          </Typography>
        )}
      </Paper>

      {/* Question */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
          Question
        </Typography>
        <Typography variant="body1" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {question.content}
        </Typography>
      </Paper>

      {/* Student Response */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
          Your Response
        </Typography>
        
        {/* Word Count Progress */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Word Count: {wordCount}/{targetWordCount.max} (target: {targetWordCount.min}-{targetWordCount.max})
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: isWithinWordCount ? 'success.main' : 'warning.main',
                fontWeight: 'bold'
              }}
            >
              {isWithinWordCount ? '✓ Within target' : wordCount < targetWordCount.min ? 'Too short' : 'Too long'}
            </Typography>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={wordCountProgress}
            color={isWithinWordCount ? 'success' : 'warning'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Box sx={{ 
          p: 3, 
          bgcolor: hasAnswer ? 'white' : 'grey.100',
          border: `2px solid ${hasAnswer ? (isWithinWordCount ? '#4caf50' : '#ff9800') : '#ccc'}`,
          borderRadius: 2,
          minHeight: 100
        }}>
          <Typography 
            variant="body1" 
            sx={{ 
              color: hasAnswer ? 'text.primary' : 'text.secondary',
              fontStyle: hasAnswer ? 'normal' : 'italic',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}
          >
            {userAnswer || 'No response provided'}
          </Typography>
        </Box>
      </Paper>

      {/* AI Feedback */}
      {feedback?.suggestions && feedback.suggestions.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'orange.50', border: '1px solid #fff3e0' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'orange.800' }}>
            🤖 AI Comprehensive Assessment
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', color: 'orange.900', fontWeight: 'bold' }}>
            Suggestions for Improvement
          </Typography>
          
          {Array.isArray(feedback.suggestions) ? (
            <Stack spacing={2}>
              {feedback.suggestions.map((suggestion, idx) => (
                <Box key={idx} sx={{ 
                  p: 2, 
                  bgcolor: 'white', 
                  border: '1px solid #ffe0b2',
                  borderRadius: 1
                }}>
                  {typeof suggestion === 'string' ? (
                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                      {suggestion}
                    </Typography>
                  ) : (
                    <Box>
                      {(suggestion.context || suggestion.original || suggestion.incorrect_phrase) && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Original:</strong> "{suggestion.context || suggestion.original || suggestion.incorrect_phrase}"
                        </Typography>
                      )}
                      {(suggestion.corrected || suggestion.corrected_version) && (
                        <Typography variant="body2" sx={{ mb: 1, color: 'success.main' }}>
                          <strong>✓ Corrected:</strong> "{suggestion.corrected || suggestion.corrected_version}"
                        </Typography>
                      )}
                      {suggestion.explanation && (
                        <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                          <strong>Why:</strong> {suggestion.explanation}
                        </Typography>
                      )}
                      {suggestion.rationale && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          <strong>Impact:</strong> {suggestion.rationale}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {feedback.suggestions}
            </Typography>
          )}
        </Paper>
      )}

      {/* Task Requirements */}
      <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          <strong>APTIS Task 2 Scoring (0-5 scale):</strong><br/>
          5 (B1+) = Above A2 level<br/>
          4 (A2.2) = On topic, simple structures, errors don't impede understanding<br/>
          3 (A2.1) = On topic, errors impede understanding in parts<br/>
          2 (A1.2) = Not fully on topic, limited grammar<br/>
          1 (A1.1) = Few words/phrases, unintelligible<br/>
          0 (A0) = No meaningful language
        </Typography>
      </Paper>
    </Box>
  );
}