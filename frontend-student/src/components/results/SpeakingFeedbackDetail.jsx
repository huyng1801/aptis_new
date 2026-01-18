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
  IconButton,
} from '@mui/material';
import { getAssetUrl } from '@/services/api';
import {
  ExpandMore,
  CheckCircle,
  TrendingUp,
  Lightbulb,
  Warning as WarningIcon,
  PlayArrow,
  Pause,
  VolumeUp,
} from '@mui/icons-material';
import { useState, useRef } from 'react';

export default function SpeakingFeedbackDetail({ answer }) {
  const [expanded, setExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  if (!answer) return null;

  const {
    audio_url,
    transcribed_text,
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
    answer_type,
  } = answer;

  // Get the comprehensive feedback (now single record instead of array)
  const comprehensiveFeedback = aiFeedbacks && aiFeedbacks.length > 0 ? aiFeedbacks[0] : null;

  // Verify this is an audio answer
  const isAudioAnswer = answer_type === 'audio' || audio_url;

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

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

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
                <strong>Chuyển đổi văn bản:</strong> {transcribed_text ? 'Hoàn tất' : 'Đang xử lý...'}
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

      {/* Audio Player */}
      {isAudioAnswer && audio_url && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🎤 Ghi âm của bạn
            </Typography>
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              sx={{ 
                p: 3, 
                backgroundColor: 'grey.50',
                borderRadius: 2
              }}
            >
              <IconButton
                onClick={isPlaying ? pauseAudio : playAudio}
                color="primary"
                size="large"
                sx={{ mr: 2 }}
              >
                {isPlaying ? <Pause sx={{ fontSize: 48 }} /> : <PlayArrow sx={{ fontSize: 48 }} />}
              </IconButton>
              <Box flex={1}>
                <audio
                  ref={audioRef}
                  src={getAssetUrl(audio_url)}
                  onEnded={() => setIsPlaying(false)}
                  style={{ width: '100%' }}
                  controls
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Show warning if not an audio answer */}
      {!isAudioAnswer && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            ⚠️ Đây không phải là câu trả lời speaking (answer_type: {answer_type}). Có thể có lỗi trong việc lưu câu trả lời.
          </Typography>
        </Alert>
      )}

      {/* Transcription */}
      {transcribed_text && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📝 Phiên âm (Speech-to-Text)
            </Typography>
            <Paper 
              sx={{ 
                p: 2, 
                backgroundColor: 'info.50',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap'
              }}
            >
              {transcribed_text === '[Transcription failed]' ? (
                <Alert severity="error">
                  Không thể chuyển đổi giọng nói thành văn bản. Vui lòng liên hệ giáo viên để chấm thủ công.
                </Alert>
              ) : (
                transcribed_text
              )}
            </Paper>
          </CardContent>
        </Card>
      )}

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
                        Areas to Improve
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
            Bài nói này đang chờ giáo viên xem xét. Điểm số và phản hồi có thể được cập nhật sau.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
