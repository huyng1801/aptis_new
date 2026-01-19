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
  CardContent,
  Slider
} from '@mui/material';
import {
  Save,
  PlayArrow,
  Pause,
  Stop,
  VolumeUp,
  VolumeOff,
  Replay,
  SkipNext,
  SkipPrevious,
  Comment,
  Timer
} from '@mui/icons-material';
import AudioPlayer from './AudioPlayer';

const timeMarkers = [];

export default function SpeakingReview({ 
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
  const [timeComments, setTimeComments] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

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

  const addTimeComment = () => {
    if (!newComment.trim() || readonly) return;
    
    const comment = {
      id: Date.now(),
      time: currentTime,
      text: newComment.trim(),
      timestamp: new Date().toISOString()
    };
    
    setTimeComments([...timeComments, comment]);
    setNewComment('');
  };

  const removeTimeComment = (commentId) => {
    setTimeComments(timeComments.filter(c => c.id !== commentId));
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
            Chấm điểm bài Speaking
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
        {/* Question, Audio Player and Comments */}
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
                <Chip label={`Thời gian chuẩn bị: ${question?.preparation_time || 30}s`} size="small" />
                <Chip label={`Thời gian nói: ${question?.speaking_time || 60}s`} size="small" />
              </Box>
            </CardContent>
          </Card>
          
          <Typography variant="h6" gutterBottom>
            Bài nói của học sinh
          </Typography>
          
          {/* Audio Player */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <AudioPlayer
                src={answer?.audio_url}
                onTimeUpdate={setCurrentTime}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              
              <Box mt={2} display="flex" alignItems="center" gap={2}>
                <Timer fontSize="small" />
                <Typography variant="body2">
                  Thời gian hiện tại: {formatTime(currentTime)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Transcribed Text if available */}
          {answer?.transcribed_text && (
            <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Nội dung đã chuyển đổi (Speech-to-Text)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', lineHeight: 1.6 }}>
                  {answer.transcribed_text}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Add Time Comment */}
          {!readonly && (
            <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Thêm nhận xét tại thời điểm {formatTime(currentTime)}
                </Typography>
                <Box display="flex" gap={2}>
                  <TextField
                    fullWidth
                    size="small"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Nhập nhận xét cho thời điểm này..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addTimeComment();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Comment />}
                    onClick={addTimeComment}
                    disabled={!newComment.trim()}
                  >
                    Thêm
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Time Comments List */}
          {timeComments.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Nhận xét theo thời gian
              </Typography>
              {timeComments
                .sort((a, b) => a.time - b.time)
                .map((comment) => (
                  <Card key={comment.id} sx={{ mb: 1 }}>
                    <CardContent sx={{ py: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Chip 
                            label={formatTime(comment.time)} 
                            size="small" 
                            color="primary" 
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2">
                            {comment.text}
                          </Typography>
                        </Box>
                        {!readonly && (
                          <IconButton 
                            size="small"
                            onClick={() => removeTimeComment(comment.id)}
                          >
                            ×
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
            </Box>
          )}
        </Paper>

        {/* Scoring Panel */}
        <Paper sx={{ width: 400, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Chấm điểm
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Nghe bài nói của học sinh và đánh giá tổng thể từ 0-5 điểm
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
            Phản hồi tổng quát
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={8}
            value={feedback}
            onChange={handleFeedbackChange}
            placeholder="Nhập phản hồi tổng quát về bài nói của học sinh..."
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