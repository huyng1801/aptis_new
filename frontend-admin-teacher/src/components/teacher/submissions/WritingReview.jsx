'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Rating,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import {
  Save,
  Edit,
  Undo,
  Redo,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  HighlightAlt,
  Comment,
  Spellcheck
} from '@mui/icons-material';

export default function WritingReview({ 
  answer,
  question,
  reviewData,
  onSubmitReview,
  readonly = false,
  saving = false
}) {
  const maxScore = answer?.max_score || 5;
  const [score, setScore] = useState(reviewData?.final_score || answer?.final_score || answer?.score || 0);
  const [feedback, setFeedback] = useState(reviewData?.feedback || answer?.manual_feedback || answer?.ai_feedback || '');
  const [highlights, setHighlights] = useState([]);
  const textRef = useRef();

  // Update state when props change
  useEffect(() => {
    setScore(reviewData?.final_score || answer?.final_score || answer?.score || 0);
    setFeedback(reviewData?.feedback || answer?.manual_feedback || answer?.ai_feedback || '');
  }, [reviewData, answer]);

  const handleScoreChange = (newScore) => {
    setScore(newScore);
  };

  const handleFeedbackChange = (event) => {
    const newFeedback = event.target.value;
    setFeedback(newFeedback);
  };

  const handleSave = () => {
    if (onSubmitReview && answer?.id) {
      onSubmitReview(answer.id, {
        final_score: score,
        feedback: feedback,
        // Match backend expectations
        manual_feedback: feedback
      });
    }
  };

  const getScoreColor = (score) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'primary';
    if (percentage >= 40) return 'info';
    if (percentage >= 20) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'Xuất sắc';
    if (percentage >= 60) return 'Tốt';
    if (percentage >= 40) return 'Đạt yêu cầu';
    if (percentage >= 20) return 'Cần cải thiện';
    return 'Chưa đạt';
  };

  const progress = (score / maxScore) * 100;

  return (
    <Box>
      {/* Header with overall score */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Chấm điểm bài Writing
          </Typography>
          <Box textAlign="center">
            <Typography variant="h4" color={getScoreColor(score)}>
              {score.toFixed(1)}/{maxScore}
            </Typography>
            <Chip 
              label={getScoreLabel(score)}
              color={getScoreColor(score)}
              size="small"
            />
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              color={getScoreColor(score)}
              sx={{ width: 120, height: 8, borderRadius: 4, mt: 1 }}
            />
          </Box>
        </Box>
      </Paper>

      <Box display="flex" gap={3}>
        {/* Question and Student's Writing */}
        <Paper sx={{ flex: 1, p: 3 }}>
          {/* Question Display */}
          <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Câu hỏi: {question?.title || 'Không có tiêu đề'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {question?.content || question?.question_text || 'Không có nội dung câu hỏi'}
              </Typography>
              {question?.additional_info && (
                <Typography variant="body2" color="text.secondary">
                  {question.additional_info}
                </Typography>
              )}
              <Box mt={2} display="flex" gap={1}>
                <Chip label={`Điểm tối đa: ${answer?.max_score || 5}`} size="small" />
                <Chip label={`Thời gian: ${question?.time_limit || 'N/A'} phút`} size="small" />
                {question?.word_limit && (
                  <Chip label={`Giới hạn: ${question.word_limit} từ`} size="small" />
                )}
              </Box>
            </CardContent>
          </Card>
          
          {/* Student's Answer */}
          <Typography variant="h6" gutterBottom>
            Bài viết của học sinh
          </Typography>
          
          <Box
            ref={textRef}
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              minHeight: 300,
              bgcolor: 'grey.50',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              userSelect: readonly ? 'none' : 'text'
            }}
          >
            {answer?.text_answer || 'Không có nội dung bài viết'}
          </Box>

          {/* Answer Statistics */}
          <Box mt={2} p={2} bgcolor="info.50" borderRadius={1}>
            <Typography variant="caption" color="text.secondary">
              <strong>Thống kê bài làm:</strong><br />
              Số từ: {answer?.text_answer?.split(' ').length || 0} từ<br />
              Thời gian làm: {answer?.answered_at ? new Date(answer.answered_at).toLocaleString('vi-VN') : 'N/A'}
            </Typography>
          </Box>
        </Paper>

        {/* Scoring Panel */}
        <Paper sx={{ width: 400, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Chấm điểm
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Đánh giá tổng thể bài viết và cho điểm từ 0-5
          </Alert>

          {/* Score Input */}
          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Điểm số (0-5)
            </Typography>
            
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Rating
                value={score}
                onChange={(e, value) => handleScoreChange(value || 0)}
                max={Math.ceil(maxScore)}
                precision={0.5}
                readOnly={readonly}
                size="large"
              />
              <TextField
                type="number"
                value={score}
                onChange={(e) => handleScoreChange(Math.min(parseFloat(e.target.value) || 0, maxScore))}
                inputProps={{ min: 0, max: maxScore, step: 0.5 }}
                size="small"
                sx={{ width: 80 }}
                disabled={readonly}
              />
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              {getScoreLabel(score)} - Điểm hiện tại: {score.toFixed(1)}/{maxScore}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Feedback */}
          <Typography variant="h6" gutterBottom>
            Phản hồi và nhận xét
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={12}
            value={feedback}
            onChange={handleFeedbackChange}
            placeholder="Nhập phản hồi chi tiết cho học sinh về điểm mạnh, điểm cần cải thiện và gợi ý..."
            variant="outlined"
            InputProps={{
              readOnly: readonly
            }}
          />

          {!readonly && (
            <Box mt={3}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                fullWidth
                size="large"
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu điểm và phản hồi'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}