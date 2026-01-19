'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Grid,
  Divider,
} from '@mui/material';

export default function ChatResponsesWritingResult({ answer, question, feedback = null }) {
  const userAnswer = answer.text_answer || '';
  
  // Parse chat responses - handle "Reply 1:", "Reply 2:", "Reply 3:" format
  let responses = [];
  if (userAnswer.includes('Reply 1:')) {
    const replyParts = userAnswer.split(/Reply \d+:/);
    responses = replyParts.slice(1).map(r => r.trim()).filter(r => r);
  } else {
    // Fallback: try other separators
    responses = userAnswer.split(/(?:\n\n|\n---\n|\n\d+\.\s)/).filter(r => r.trim()).slice(1) || [];
  }
  
  const hasAllResponses = responses.length >= 3;
  
  // Extract score and feedback
  const score = feedback?.score || answer.final_score || answer.score || 0;
  const maxScore = answer.max_score || question.max_score || 10; // Use actual max_score from answer/question
  const cefrLevel = feedback?.cefr_level || 'Not assessed';
  const comment = feedback?.comment || '';
  const suggestions = feedback?.suggestions || '';

  // Parse questions from content - look for chat messages
  const chatQuestions = [];
  const contentLines = question.content.split('\n');
  
  for (const line of contentLines) {
    if (line.includes(':') && (line.includes('Alex:') || line.includes('Sam:') || line.includes('Jordan:'))) {
      const questionText = line.split(':')[1]?.trim();
      if (questionText) {
        chatQuestions.push(questionText);
      }
    }
  }

  // Color coding based on score
  const getScoreColor = (score) => {
    if (score >= 4) return 'success';
    if (score >= 3) return 'info'; 
    if (score >= 2) return 'warning';
    return 'error';
  };

  // CEFR level mapping for Task 3
  const getCefrDisplay = (level) => {
    const mapping = {
      'B2+': 'B2+ (Above B1 level)',
      'B1.2': 'B1.2 (All 3 questions on topic)',
      'B1.1': 'B1.1 (2 questions on topic)',
      'A2.2': 'A2.2 (At least 2 questions on topic)',
      'A2.1': 'A2.1 (1 question on topic)',
      'A0': 'Below A2 (Poor performance)'
    };
    return mapping[level] || level;
  };

  // Word count for each response
  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <Box>
      {/* Task Instructions */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'blue.50', border: '1px solid #e3f2fd' }}>
        <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, fontWeight: 'bold' }}>
          APTIS Writing Task 3 - Chat Responses
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Respond to 3 chat messages with 30-40 words each. Assessment covers: task fulfillment, grammar, punctuation, vocabulary, and cohesion.
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
            label={`Responses: ${responses.length}/3`}
            variant="outlined"
            color={hasAllResponses ? 'success' : 'warning'}
          />
        </Stack>
        
        {comment && (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            {comment}
          </Typography>
        )}
      </Paper>

      {/* Chat Questions and Responses */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, color: 'text.primary' }}>
          Chat Conversation
        </Typography>

        <Grid container spacing={3}>
          {chatQuestions.map((chatQuestion, index) => {
            const response = responses[index] || '';
            const wordCount = getWordCount(response);
            const isGoodLength = wordCount >= 30 && wordCount <= 40;
            
            return (
              <Grid item xs={12} key={index}>
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2,
                  overflow: 'hidden'
                }}>
                  {/* Friend's Message */}
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'blue.50',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {chatQuestion}
                    </Typography>
                  </Box>
                  
                  {/* User's Response */}
                  <Box sx={{ p: 2, bgcolor: response ? 'success.50' : 'grey.100' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Your reply:
                      </Typography>
                      <Chip 
                        size="small"
                        label={`${wordCount} words`}
                        color={isGoodLength ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Stack>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: response ? 'text.primary' : 'text.secondary',
                        fontStyle: response ? 'normal' : 'italic',
                        lineHeight: 1.6,
                        p: 2,
                        bgcolor: 'white',
                        borderRadius: 1,
                        border: '1px solid #ddd',
                        minHeight: 50
                      }}
                    >
                      {response || 'No response provided'}
                    </Typography>
                    {response && (
                      <Typography variant="caption" sx={{ 
                        color: isGoodLength ? 'success.main' : 'warning.main',
                        fontWeight: 'bold',
                        mt: 1,
                        display: 'block'
                      }}>
                        {isGoodLength ? '✓ Good word count (30-40 words)' : 
                         wordCount < 30 ? '⚠ Too short (target: 30-40 words)' : 
                         '⚠ Too long (target: 30-40 words)'}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {index < chatQuestions.length - 1 && <Divider sx={{ my: 2 }} />}
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Raw Response (if format is unclear) */}
      {responses.length < 3 && userAnswer && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.50' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'warning.dark' }}>
            Complete Response Text
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
            Your full response (system may have had trouble parsing individual replies):
          </Typography>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}>
            {userAnswer}
          </Box>
        </Paper>
      )}

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
                      {suggestion.response && (
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                          {suggestion.response}
                        </Typography>
                      )}
                      {(suggestion.context || suggestion.original_phrase || suggestion.phrase || suggestion.specific_phrase) && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Original:</strong> "{suggestion.context || suggestion.original_phrase || suggestion.phrase || suggestion.specific_phrase}"
                        </Typography>
                      )}
                      {(suggestion.corrected || suggestion.corrected_version) && (
                        <Typography variant="body2" sx={{ mb: 1, color: 'success.main' }}>
                          <strong>✓ Corrected:</strong> "{suggestion.corrected || suggestion.corrected_version}"
                        </Typography>
                      )}
                      {(suggestion.explanation || suggestion.reason) && (
                        <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                          <strong>Why:</strong> {suggestion.explanation || suggestion.reason}
                        </Typography>
                      )}
                      {(suggestion.rationale || suggestion.improvement_goal || suggestion.addressing_question) && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          <strong>Impact:</strong> {suggestion.rationale || suggestion.improvement_goal || suggestion.addressing_question}
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
          <strong>APTIS Task 3 Scoring (0-5 scale):</strong><br/>
          5 (B2+) = Above B1 level<br/>
          4 (B1.2) = All 3 questions on topic with B1 language control<br/>
          3 (B1.1) = 2 questions on topic with B1 features<br/>
          2 (A2.2) = At least 2 questions on topic with A2 features<br/>
          1 (A2.1) = 1 question on topic with A2 features<br/>
          0 = Below A2 or off-topic
        </Typography>
      </Paper>
    </Box>
  );
}