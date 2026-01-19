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

export default function EmailWritingResult({ answer, question, feedback = null }) {
  const userAnswer = answer.text_answer || '';
  
  // Parse emails - look for "Friend Email:", "Manager Email:", "Formal Email:" patterns
  let emails = [];
  if (userAnswer.includes('Friend Email:')) {
    const sections = userAnswer.split(/(Friend Email:|Manager Email:|Formal Email:)/i);
    for (let i = 1; i < sections.length; i += 2) {
      if (sections[i + 1]) {
        emails.push(sections[i + 1].trim());
      }
    }
  } else {
    // Fallback: split by common separators
    emails = userAnswer.split(/(?:\n\n\d+\.|---|\n#{2,}|\nEmail \d+:|\n\d+\.\s)/i).filter(e => e.trim());
  }
  
  const hasInformalEmail = emails.length >= 1;
  const hasFormalEmail = emails.length >= 2;
  
  // Extract score and feedback  
  const score = feedback?.score || answer.final_score || answer.score || 0;
  const maxScore = answer.max_score || question.max_score || 10; // Use actual max_score from answer/question
  const cefrLevel = feedback?.cefr_level || 'Not assessed';
  const comment = feedback?.comment || '';
  const suggestions = feedback?.suggestions || '';

  // Color coding based on score
  const getScoreColor = (score) => {
    if (score >= 5) return 'success';
    if (score >= 4) return 'info';
    if (score >= 3) return 'warning';
    return 'error';
  };

  // CEFR level mapping for Task 4
  const getCefrDisplay = (level) => {
    const mapping = {
      'C2': 'C2 (Above C1 level)',
      'C1': 'C1 (Features as B2.2 but higher)',
      'B2.2': 'B2.2 (Two clearly different registers)',
      'B2.1': 'B2.1 (Appropriate register in ONE response)',
      'B1.2': 'B1.2 (Register not used consistently)',
      'B1.1': 'B1.1 (No evidence of register awareness)',
      'A1/A2': 'A1/A2 (Below B1 level)'
    };
    return mapping[level] || level;
  };

  // Word count analysis
  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const informalEmail = emails[0] || '';
  const managerEmail = emails[1] || '';
  const formalEmail = emails[2] || '';
  const informalWordCount = getWordCount(informalEmail);
  const managerWordCount = getWordCount(managerEmail);
  const formalWordCount = getWordCount(formalEmail);
  
  // Target word counts for 3 email types
  const informalTarget = { min: 40, max: 60 };
  const managerTarget = { min: 80, max: 100 };
  const formalTarget = { min: 120, max: 150 };
  
  const isInformalGoodLength = informalWordCount >= informalTarget.min && informalWordCount <= informalTarget.max;
  const isManagerGoodLength = managerWordCount >= managerTarget.min && managerWordCount <= managerTarget.max;
  const isFormalGoodLength = formalWordCount >= formalTarget.min && formalWordCount <= formalTarget.max;

  return (
    <Box>
      {/* Task Instructions */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'blue.50', border: '1px solid #e3f2fd' }}>
        <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, fontWeight: 'bold' }}>
          APTIS Writing Task 4 - Formal and Informal Writing
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Write two emails: informal (40-50 words) and formal (120-150 words). Key assessment: register control, grammar, vocabulary, and cohesion.
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
            label={`Emails: ${emails.length}/3`}
            variant="outlined"
            color={emails.length >= 3 ? 'success' : 'warning'}
          />
        </Stack>
        
        {comment && (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            {comment}
          </Typography>
        )}
      </Paper>

      {/* Email Task Context */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
          Email Context
        </Typography>
        <Typography variant="body1" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {question.content}
        </Typography>
      </Paper>

      {/* Email Responses */}
      <Grid container spacing={2}>
        {/* Friend Email */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            height: '100%',
            border: hasInformalEmail ? '2px solid #4caf50' : '2px solid #ccc'
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'primary.main' }}>
                1. Friend Email
              </Typography>
              <Chip 
                size="small"
                label={`${informalWordCount} words`}
                color={isInformalGoodLength ? 'success' : 'warning'}
                variant="outlined"
              />
            </Stack>
            
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Target: {informalTarget.min}-{informalTarget.max} words • Register: Casual, friendly
            </Typography>
            
            <Box sx={{ 
              p: 2,
              bgcolor: hasInformalEmail ? 'white' : 'grey.100',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              minHeight: 150
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: hasInformalEmail ? 'text.primary' : 'text.secondary',
                  fontStyle: hasInformalEmail ? 'normal' : 'italic',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {informalEmail || 'No friend email provided'}
              </Typography>
            </Box>
            
            {hasInformalEmail && (
              <Typography variant="caption" sx={{ 
                color: isInformalGoodLength ? 'success.main' : 'warning.main',
                fontWeight: 'bold',
                mt: 1,
                display: 'block'
              }}>
                {isInformalGoodLength ? '✓ Good word count' : 
                 informalWordCount < informalTarget.min ? '⚠ Too short' : '⚠ Too long'}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Manager Email */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            height: '100%',
            border: emails.length >= 2 ? '2px solid #ff9800' : '2px solid #ccc'
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'primary.main' }}>
                2. Manager Email
              </Typography>
              <Chip 
                size="small"
                label={`${managerWordCount} words`}
                color={isManagerGoodLength ? 'success' : 'warning'}
                variant="outlined"
              />
            </Stack>
            
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Target: {managerTarget.min}-{managerTarget.max} words • Register: Professional
            </Typography>
            
            <Box sx={{ 
              p: 2,
              bgcolor: emails.length >= 2 ? 'white' : 'grey.100',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              minHeight: 150
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: emails.length >= 2 ? 'text.primary' : 'text.secondary',
                  fontStyle: emails.length >= 2 ? 'normal' : 'italic',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {managerEmail || 'No manager email provided'}
              </Typography>
            </Box>
            
            {emails.length >= 2 && (
              <Typography variant="caption" sx={{ 
                color: isManagerGoodLength ? 'success.main' : 'warning.main',
                fontWeight: 'bold',
                mt: 1,
                display: 'block'
              }}>
                {isManagerGoodLength ? '✓ Good word count' : 
                 managerWordCount < managerTarget.min ? '⚠ Too short' : '⚠ Too long'}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Formal Email */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            height: '100%',
            border: emails.length >= 3 ? '2px solid #2196f3' : '2px solid #ccc'
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'primary.main' }}>
                3. Formal Email
              </Typography>
              <Chip 
                size="small"
                label={`${formalWordCount} words`}
                color={isFormalGoodLength ? 'success' : 'warning'}
                variant="outlined"
              />
            </Stack>
            
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Target: {formalTarget.min}-{formalTarget.max} words • Register: Very formal
            </Typography>
            
            <Box sx={{ 
              p: 2,
              bgcolor: emails.length >= 3 ? 'white' : 'grey.100',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              minHeight: 180
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: emails.length >= 3 ? 'text.primary' : 'text.secondary',
                  fontStyle: emails.length >= 3 ? 'normal' : 'italic',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {formalEmail || 'No formal email provided'}
              </Typography>
            </Box>
            
            {emails.length >= 3 && (
              <Typography variant="caption" sx={{ 
                color: isFormalGoodLength ? 'success.main' : 'warning.main',
                fontWeight: 'bold',
                mt: 1,
                display: 'block'
              }}>
                {isFormalGoodLength ? '✓ Good word count' : 
                 formalWordCount < formalTarget.min ? '⚠ Too short' : '⚠ Too long'}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Raw Response (if parsing failed) */}
      {emails.length < 3 && userAnswer && (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'warning.50' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'warning.dark' }}>
            Complete Response Text
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
            Your full response (system may have had trouble separating the emails):
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
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'orange.50', border: '1px solid #fff3e0' }}>
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
                      {(suggestion.email_section || suggestion.section) && (
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                          📧 {suggestion.email_section || suggestion.section}
                        </Typography>
                      )}
                      {(suggestion.context || suggestion.original_text || suggestion.original_sentence || suggestion.original) && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Original:</strong> "{suggestion.context || suggestion.original_text || suggestion.original_sentence || suggestion.original}"
                        </Typography>
                      )}
                      {(suggestion.corrected || suggestion.corrected_text || suggestion.corrected_sentence || suggestion.correction) && (
                        <Typography variant="body2" sx={{ mb: 1, color: 'success.main' }}>
                          <strong>✓ Corrected:</strong> "{suggestion.corrected || suggestion.corrected_text || suggestion.corrected_sentence || suggestion.correction}"
                        </Typography>
                      )}
                      {suggestion.explanation && (
                        <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                          <strong>Why:</strong> {suggestion.explanation}
                        </Typography>
                      )}
                      {(suggestion.rationale || suggestion.improvement_area) && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          <strong>Impact:</strong> {suggestion.rationale || suggestion.improvement_area}
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
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.100' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          <strong>APTIS Task 4 Scoring (0-6 scale):</strong><br/>
          6 (C2) = Above C1 level<br/>
          5 (C1) = Features as B2.2 but higher proficiency<br/>
          4 (B2.2) = Two clearly different registers, complex grammar, range of vocabulary<br/>
          3 (B2.1) = Appropriate register in ONE response<br/>
          2 (B1.2) = Register not used consistently<br/>
          1 (B1.1) = No evidence of register awareness<br/>
          0 (A1/A2) = Below B1 level
        </Typography>
      </Paper>
    </Box>
  );
}