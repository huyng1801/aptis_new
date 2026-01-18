'use client';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider,
  Grid,
  Paper,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  TrendingUp,
  Lightbulb,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useState } from 'react';

export default function WritingFeedbackDetail({ answer }) {
  const [expanded, setExpanded] = useState(false);

  if (!answer) return null;

  const {
    text_answer,
    score,
    max_score,
    ai_feedback,
    ai_graded_at,
    needs_review,
    final_score,
    manual_feedback,
    reviewed_at,
    reviewed_by,
    aiFeedbacks = [],
  } = answer;

  // Get the comprehensive feedback (now single record instead of array)
  const comprehensiveFeedback = aiFeedbacks && aiFeedbacks.length > 0 ? aiFeedbacks[0] : null;

  // Calculate percentage
  const displayScore = final_score !== null ? final_score : score;
  const percentage = max_score > 0 ? Math.round((displayScore / max_score) * 100) : 0;

  // Get score color
  const getScoreColor = () => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'primary';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  // Count words
  const wordCount = text_answer ? text_answer.trim().split(/\s+/).length : 0;

  return (
    <Box>
      {/* Overall Score Card */}
      <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${getScoreColor()}.light 0%, ${getScoreColor()}.main 100%)` }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h2" fontWeight="bold" color="white">
                  {displayScore}
                </Typography>
                <Typography variant="h6" color="white" sx={{ opacity: 0.9 }}>
                  / {max_score} điểm
                </Typography>
                <Chip 
                  label={`${percentage}%`}
                  sx={{ 
                    mt: 1,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <Typography variant="body1" color="white" sx={{ mb: 1 }}>
                <strong>Số từ:</strong> {wordCount}
              </Typography>
              <Typography variant="body1" color="white" sx={{ mb: 1 }}>
                <strong>Chấm bởi AI:</strong> {ai_graded_at ? new Date(ai_graded_at).toLocaleString('vi-VN') : 'Đang chờ'}
              </Typography>
              {reviewed_at && (
                <Typography variant="body1" color="white">
                  <strong>Xem xét bởi giáo viên:</strong> {new Date(reviewed_at).toLocaleString('vi-VN')}
                </Typography>
              )}
              {needs_review && (
                <Chip 
                  icon={<WarningIcon />}
                  label="Đang chờ xem xét giáo viên"
                  color="warning"
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Student's Answer */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📝 Bài viết của bạn
          </Typography>
          <Paper 
            sx={{ 
              p: 2, 
              backgroundColor: 'grey.50',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              maxHeight: 400,
              overflow: 'auto'
            }}
          >
            {text_answer || 'Không có nội dung'}
          </Paper>
        </CardContent>
      </Card>

      {/* AI Comprehensive Feedback */}
      {comprehensiveFeedback && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" color="primary">
                🤖 Đánh giá chi tiết của AI
              </Typography>
              {comprehensiveFeedback.cefr_level && (
                <Chip
                  label={`CEFR: ${comprehensiveFeedback.cefr_level}`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </Box>

            {/* Overall Comment */}
            {comprehensiveFeedback.comment && (
              <Box mb={3}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  💬 Nhận xét tổng quan:
                </Typography>
                <Typography variant="body2" paragraph sx={{ 
                  backgroundColor: 'grey.50', 
                  p: 2, 
                  borderRadius: 2,
                  whiteSpace: 'pre-line'
                }}>
                  {comprehensiveFeedback.comment}
                </Typography>
              </Box>
            )}

            <Grid container spacing={2}>
              {comprehensiveFeedback.suggestions && comprehensiveFeedback.suggestions !== 'No suggestions' && comprehensiveFeedback.suggestions !== 'Please review the raw AI response for detailed feedback' && (
                <Grid item xs={12}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Lightbulb color="warning" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold" color="warning.main">
                        Suggestions for Improvement
                      </Typography>
                    </Box>
                    <Paper sx={{ p: 2, backgroundColor: 'warning.50' }}>
                      <Typography 
                        variant="body2"
                        component="div"
                        sx={{ 
                          whiteSpace: 'pre-line',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          lineHeight: 1.8
                        }}
                      >
                        {comprehensiveFeedback.suggestions}
                      </Typography>
                    </Paper>
                  </Box>
                </Grid>
              )}

              {/* CEFR Level */}
              {comprehensiveFeedback.cefr_level && (
                <Grid item xs={12}>
                  <Chip
                    label={`CEFR Level: ${comprehensiveFeedback.cefr_level}`}
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Overall AI Feedback */}
      {ai_feedback && (
        <Alert severity="info" icon={<TrendingUp />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Tổng quan:
          </Typography>
          <Typography variant="body2">
            {ai_feedback}
          </Typography>
        </Alert>
      )}

      {/* Teacher Feedback (if reviewed) */}
      {reviewed_at && manual_feedback && (
        <Card sx={{ mb: 3, border: 2, borderColor: 'primary.main' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <CheckCircle color="primary" />
              <Typography variant="h6" color="primary">
                👨‍🏫 Phản hồi từ giáo viên
              </Typography>
            </Box>
            
            {final_score !== null && final_score !== score && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Điểm được điều chỉnh:</strong> {final_score}/{max_score} 
                  {` (${final_score > score ? '+' : ''}${(final_score - score).toFixed(2)} điểm)`}
                </Typography>
              </Alert>
            )}

            <Typography variant="body1" paragraph>
              {manual_feedback}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Xem xét lúc: {new Date(reviewed_at).toLocaleString('vi-VN')}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Pending Review Notice */}
      {needs_review && !reviewed_at && (
        <Alert severity="warning" icon={<WarningIcon />}>
          <Typography variant="body2">
            Bài viết này đang chờ giáo viên xem xét. Điểm số và phản hồi có thể được cập nhật sau.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
