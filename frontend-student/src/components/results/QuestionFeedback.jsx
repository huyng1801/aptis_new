'use client';

import { useState } from 'react';
import { getAssetUrl } from '@/services/api';
import QuestionResultDisplayNew from './QuestionResultDisplay';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
  Alert,
  LinearProgress,
  Paper,
  List,
  Stack,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Cancel,
  HelpOutline,
  FeedbackOutlined,
  Psychology,
  Assessment,
  TrendingUp
} from '@mui/icons-material';

export default function QuestionFeedback({ questionResults, attemptId, showDetailedScoring = true }) {
  const [expandedPanel, setExpandedPanel] = useState(false);

  const handlePanelChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const groupQuestionsBySection = () => {
    const grouped = {};
    const sectionStats = {};
    
    (questionResults || []).forEach((answer) => {
      const question = answer.question;
      if (question) {
        const sectionName = answer.attemptSection?.examSection?.skillType?.skill_type_name || 
                           question.question_type?.skill_type?.skill_type_name || 'Other';
        
        if (!grouped[sectionName]) {
          grouped[sectionName] = [];
          sectionStats[sectionName] = {
            totalQuestions: 0,
            totalScore: 0,
            totalMaxScore: 0,
            correctAnswers: 0
          };
        }
        
        grouped[sectionName].push({
          answer,
          // Use scores directly from the API - no need to calculate
          calculatedScore: {
            score: answer.final_score !== null ? answer.final_score : (answer.score || 0),
            percentage: (() => {
              const actualScore = answer.final_score !== null ? answer.final_score : (answer.score || 0);
              const maxScore = answer.max_score || question.max_score || 1;
              return maxScore > 0 ? (actualScore / maxScore) * 100 : 0;
            })()
          }
        });
        
        // Use actual answer score (final_score if available, else score from AI/auto)
        const actualScore = answer.final_score !== null ? answer.final_score : (answer.score || 0);
        const maxScore = answer.max_score || question.max_score || 1;
        
        sectionStats[sectionName].totalQuestions++;
        sectionStats[sectionName].totalScore += parseFloat(actualScore) || 0;
        sectionStats[sectionName].totalMaxScore += parseFloat(maxScore) || 1;
        
        // Check if correct (score >= 80% of max)
        const scorePercentage = maxScore > 0 ? (actualScore / maxScore) * 100 : 0;
        if (scorePercentage >= 80) {
          sectionStats[sectionName].correctAnswers++;
        }
      }
    });
    
    return { grouped, sectionStats };
  };

  const { grouped: groupedQuestions, sectionStats } = groupQuestionsBySection();

  // Check if questionResults is empty
  if (!questionResults || questionResults.length === 0) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Debug Info:</strong> No questions found for this skill
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'monospace' }}>
            • questionResults: {questionResults ? `Array[${questionResults.length}]` : 'null'}<br/>
            • This might indicate data structure issue or filtering problem
          </Typography>
        </Alert>
        <Alert severity="info">
          Expected: Questions should appear here after filtering by skill. 
          If this persists, check API data structure and filtering logic.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Overall Statistics */}


      {/* Questions by Section */}
      {Object.entries(groupedQuestions).map(([section, answers]) => {
        const sectionInfo = sectionStats[section];
        const sectionPercentage = sectionInfo.totalMaxScore > 0 
          ? Math.round((sectionInfo.totalScore / sectionInfo.totalMaxScore) * 100) 
          : 0;
        
        // Skip sections with no questions
        if (sectionInfo.totalQuestions === 0 || sectionInfo.totalMaxScore === 0) {
          return null;
        }
        
        return (
          <Box key={section} sx={{ mb: 3 }}>
    
            
            <Grid container spacing={2}>
                {answers.map((item, index) => {
                  const answer = item.answer;
                  const calculatedScore = item.calculatedScore;
                  const question = answer.question || {};
                  
                  // Debug: Log AI feedbacks to console
                  if (answer.aiFeedbacks || answer.ai_feedback) {
                    console.log('[QuestionFeedback] Answer with AI feedback:', {
                      answerId: answer.id,
                      questionType: question.question_type?.code,
                      hasFeedbacks: !!answer.aiFeedbacks,
                      feedbackCount: answer.aiFeedbacks?.length || 0,
                      hasOverallFeedback: !!answer.ai_feedback,
                      aiFeedbacks: answer.aiFeedbacks,
                      ai_feedback: answer.ai_feedback
                    });
                  }
                  
                  return (
                    <Grid item xs={12} key={answer.id}>
                      <QuestionResultDisplayNew
                        answer={answer}
                        question={question}
                        calculatedScore={calculatedScore}
                        showCorrectAnswer={true}
                      />
                      
                      {/* AI Feedback Section - Comprehensive scoring with single feedback */}
                      {((answer.aiFeedbacks && answer.aiFeedbacks.length > 0) || answer.ai_feedback) && (
                        <Card variant="outlined" sx={{ mt: 1, bgcolor: 'info.50', border: '2px solid', borderColor: 'info.200' }}>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                              <Psychology color="info" fontSize="small" />
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'info.dark' }}>
                                🤖 AI Comprehensive Assessment
                              </Typography>
                            </Box>

                            {/* Get the most recent feedback */}
                            {answer.aiFeedbacks && answer.aiFeedbacks.length > 0 ? (
                              (() => {
                                const feedback = answer.aiFeedbacks[answer.aiFeedbacks.length - 1]; // Get latest
                                const isParsingError = feedback.comment?.includes('Automated parsing failed');
                                
                                return (
                                  <Box>
                                    {/* Score and CEFR Level */}
                                    <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                                      <Chip
                                        label={`Score: ${feedback.score}/${answer.max_score || 10}`}
                                        variant="filled"
                                        color="primary"
                                        size="medium"
                                      />
                                      {feedback.cefr_level && (
                                        <Chip
                                          label={`CEFR: ${feedback.cefr_level}`}
                                          variant="outlined"
                                          color="primary"
                                          size="medium"
                                        />
                                      )}
                                    </Box>

                                    {/* Overall Comment */}
                                    {feedback.comment && !isParsingError && (
                                      <Box sx={{ mb: 2, p: 2, bgcolor: 'info.100', borderRadius: 1, border: '1px solid', borderColor: 'info.300' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.dark', mb: 1 }}>
                                          📝 Assessment:
                                        </Typography>
                                        <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                          {feedback.comment}
                                        </Typography>
                                      </Box>
                                    )}

                                    {/* Suggestions - Specific Text Corrections */}
                                    {feedback.suggestions && !isParsingError && (
                                      <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark', mb: 1 }}>
                                          💡 Suggestions for Improvement:
                                        </Typography>
                                        
                                        {/* Handle array of suggestion objects */}
                                        {Array.isArray(feedback.suggestions) ? (
                                          <Stack spacing={1.5}>
                                            {feedback.suggestions.map((suggestion, idx) => (
                                              <Box key={idx} sx={{
                                                p: 1.5,
                                                bgcolor: 'warning.50',
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'warning.200',
                                                borderLeft: '4px solid',
                                                borderLeftColor: 'warning.main'
                                              }}>
                                                {typeof suggestion === 'string' ? (
                                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {suggestion}
                                                  </Typography>
                                                ) : (
                                                  <Box>
                                                    {(suggestion.context || suggestion.original || suggestion.incorrect_phrase) && (
                                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                        <strong>Original:</strong> "{suggestion.context || suggestion.original || suggestion.incorrect_phrase}"
                                                      </Typography>
                                                    )}
                                                    {(suggestion.corrected || suggestion.corrected_version) && (
                                                      <Typography variant="body2" sx={{ mb: 0.5, color: 'success.main' }}>
                                                        <strong>✓ Corrected:</strong> "{suggestion.corrected || suggestion.corrected_version}"
                                                      </Typography>
                                                    )}
                                                    {suggestion.explanation && (
                                                      <Typography variant="body2" sx={{ mb: 0.5, fontStyle: 'italic', fontSize: '0.85rem' }}>
                                                        <strong>Why:</strong> {suggestion.explanation}
                                                      </Typography>
                                                    )}
                                                    {suggestion.rationale && (
                                                      <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                                                        <strong>Impact:</strong> {suggestion.rationale}
                                                      </Typography>
                                                    )}
                                                  </Box>
                                                )}
                                              </Box>
                                            ))}
                                          </Stack>
                                        ) : (
                                          <Typography variant="body2" sx={{ 
                                            whiteSpace: 'pre-wrap', 
                                            wordBreak: 'break-word', 
                                            ml: 1,
                                            p: 1.5,
                                            bgcolor: 'warning.50',
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: 'warning.200',
                                            borderLeft: '4px solid',
                                            borderLeftColor: 'warning.main',
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem'
                                          }}>
                                            {feedback.suggestions}
                                          </Typography>
                                        )}
                                      </Box>
                                    )}

                                   
                                    {/* Parsing Error Alert */}
                                    {isParsingError && (
                                      <Alert severity="warning" sx={{ mt: 2 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                          ⚠️ Feedback Processing Note
                                        </Typography>
                                        <Typography variant="body2">
                                          The AI feedback was processed but may have formatting issues. 
                                          Please contact support if you need detailed clarification.
                                        </Typography>
                                      </Alert>
                                    )}
                                  </Box>
                                );
                              })()
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                No AI feedback available for this question yet.
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
        );
      })}
    </Box>
  );
}