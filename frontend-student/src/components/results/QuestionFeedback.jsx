'use client';

import { useState } from 'react';
import { getAssetUrl } from '@/services/api';
import { scoringUtils } from '@/utils/scoringUtils';
import QuestionResultDisplayNew from './QuestionResultDisplayNew';
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
        
        // Calculate accurate score for this question
        const questionScore = scoringUtils.autoScoreQuestion(
          question, 
          answer, 
          answer.max_score || question.max_score || 1
        );
        
        grouped[sectionName].push({
          answer,
          calculatedScore: questionScore
        });
        sectionStats[sectionName].totalQuestions++;
        sectionStats[sectionName].totalScore += questionScore.score;
        sectionStats[sectionName].totalMaxScore += (answer.max_score || question.max_score || 1);
        if (questionScore.percentage >= 80) {
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
        <Alert severity="info">
          Dữ liệu chi tiết câu hỏi sẽ được cập nhật sau. Hiện tại bạn có thể xem điểm tổng quan ở tab "Tổng quan".
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Overall Statistics */}
      {showDetailedScoring && Object.keys(sectionStats).length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Assessment color="primary" />
              <Typography variant="h6" color="primary">
                Detailed Scoring Analysis
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              {Object.entries(sectionStats).map(([skill, stats]) => {
                const percentage = stats.totalMaxScore > 0 
                  ? Math.round((stats.totalScore / stats.totalMaxScore) * 100) 
                  : 0;
                
                return (
                  <Grid item xs={12} sm={6} md={3} key={skill}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        {skill}
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                        {percentage}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {stats.correctAnswers}/{stats.totalQuestions} correct
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={percentage} 
                        color={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'error'}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Questions by Section */}
      {Object.entries(groupedQuestions).map(([section, answers]) => {
        const sectionInfo = sectionStats[section];
        const sectionPercentage = sectionInfo.totalMaxScore > 0 
          ? Math.round((sectionInfo.totalScore / sectionInfo.totalMaxScore) * 100) 
          : 0;
        
        return (
          <Accordion
            key={section}
            expanded={expandedPanel === section}
            onChange={handlePanelChange(section)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              aria-controls={`${section}-content`}
              id={`${section}-header`}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {section}
                </Typography>
                <Chip 
                  label={`${sectionInfo.correctAnswers}/${sectionInfo.totalQuestions} correct`}
                  size="small"
                  color={sectionPercentage >= 70 ? 'success' : sectionPercentage >= 50 ? 'warning' : 'error'}
                />
                <Chip 
                  label={`${sectionPercentage}%`}
                  size="small"
                  variant="filled"
                  color={sectionPercentage >= 70 ? 'success' : sectionPercentage >= 50 ? 'warning' : 'error'}
                />
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              <Grid container spacing={2}>
                {answers.map((item, index) => {
                  const answer = item.answer;
                  const calculatedScore = item.calculatedScore;
                  const question = answer.question || {};
                  
                  return (
                    <Grid item xs={12} key={answer.id}>
                      <QuestionResultDisplayNew
                        answer={answer}
                        question={question}
                        calculatedScore={calculatedScore}
                        showCorrectAnswer={true}
                      />
                      
                      {/* Original AI Feedback Section (if exists) */}
                      {answer.aiFeedbacks && answer.aiFeedbacks.length > 0 && (
                        <Card variant="outlined" sx={{ mt: 1, bgcolor: 'info.50' }}>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                              <Psychology color="info" fontSize="small" />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                AI Assessment Details
                              </Typography>
                            </Box>

                            {/* Overall AI Comment */}
                            {answer.ai_feedback && (
                              <Box sx={{ mb: 2, backgroundColor: 'info.100', p: 2, borderRadius: 1 }}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                  <strong>Overall Assessment:</strong>
                                </Typography>
                                <Typography variant="body2">
                                  {answer.ai_feedback}
                                </Typography>
                              </Box>
                            )}

                            {/* Criteria-based feedback */}
                            <Grid container spacing={1}>
                              {answer.aiFeedbacks.map((feedback, idx) => (
                                <Grid item xs={12} key={feedback.id}>
                                  <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                                    {/* Criterion name and score */}
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {feedback.criteria?.criteria_name || `Criteria ${idx + 1}`}
                                      </Typography>
                                      <Chip
                                        label={`${feedback.score}/${feedback.max_score}`}
                                        size="small"
                                        variant="outlined"
                                        color={feedback.score >= feedback.max_score * 0.8 ? 'success' : 
                                               feedback.score >= feedback.max_score * 0.5 ? 'warning' : 'error'}
                                      />
                                    </Box>

                                    {/* Criterion description */}
                                    {feedback.criteria?.description && (
                                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                        {feedback.criteria.description}
                                      </Typography>
                                    )}

                                    {/* Strengths */}
                                    {feedback.strengths && feedback.strengths !== 'N/A' && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                                          ✓ Strengths:
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ml: 1 }}>
                                          {feedback.strengths}
                                        </Typography>
                                      </Box>
                                    )}

                                    {/* Weaknesses */}
                                    {feedback.weaknesses && feedback.weaknesses !== 'N/A' && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'warning.main' }}>
                                          ✗ Areas for Improvement:
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ml: 1 }}>
                                          {feedback.weaknesses}
                                        </Typography>
                                      </Box>
                                    )}

                                    {/* Suggestions */}
                                    {feedback.suggestions && feedback.suggestions !== 'N/A' && (
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'info.main' }}>
                                          💡 Suggestions:
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ml: 1 }}>
                                          {feedback.suggestions}
                                        </Typography>
                                      </Box>
                                    )}

                                    {/* General comment */}
                                    {feedback.comment && (
                                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #ddd' }}>
                                        <Typography variant="body2" color="textSecondary">
                                          {feedback.comment}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}