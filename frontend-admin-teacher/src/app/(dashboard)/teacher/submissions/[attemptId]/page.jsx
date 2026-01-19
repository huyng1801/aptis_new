'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Chip,
  Alert,
  Snackbar,
  TextField,
  Rating,
  Grid,
  Divider,
  LinearProgress,
  Avatar,
  Paper
} from '@mui/material';
import { 
  ArrowBack, 
  Save, 
  Grade, 
  VolumeUp,
  Description,
  Person,
  Assignment,
  Star
} from '@mui/icons-material';
import { submissionApi } from '@/services/submissionService';
import QuestionDisplay from '@/components/QuestionDisplay';

export default function SubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const attemptId = params.attemptId;
  const mode = searchParams.get('mode') || 'view';
  
  const [submissionDetail, setSubmissionDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (attemptId) {
      loadSubmissionDetail();
    }
  }, [attemptId]);

  useEffect(() => {
    if (submissionDetail?.answers?.[0]) {
      const answer = submissionDetail.answers[0];
      setScore(answer.final_score || answer.score || 0);
      setFeedback(answer.manual_feedback || '');
    }
  }, [submissionDetail]);

  const loadSubmissionDetail = async () => {
    setLoading(true);
    try {
      const response = await submissionApi.getSubmissionDetail(attemptId);
      setSubmissionDetail(response.data);
    } catch (error) {
      console.error('Error loading submission detail:', error);
      showNotification('Lỗi khi tải chi tiết bài làm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!submissionDetail || !submissionDetail.answers || submissionDetail.answers.length === 0) {
      showNotification('Không có dữ liệu bài làm', 'error');
      return;
    }

    setSaving(true);
    try {
      const answerId = submissionDetail.answers[0].id;
      const currentUser = 1; // TODO: Get from auth context
      
      await submissionApi.submitAnswerReview(answerId, {
        final_score: score,
        manual_feedback: feedback,
        needs_review: false,
        reviewed_by: currentUser,
        reviewed_at: new Date().toISOString()
      });
      
      showNotification('Đã lưu đánh giá thành công', 'success');
      await loadSubmissionDetail();
      
      setTimeout(() => {
        if (mode === 'grade') {
          router.push('/teacher/submissions');
        }
      }, 1500);
    } catch (error) {
      console.error('Error submitting review:', error);
      showNotification('Lỗi khi lưu đánh giá', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'primary';
    if (percentage >= 40) return 'info';
    if (percentage >= 20) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'Xuất sắc';
    if (percentage >= 60) return 'Tốt';
    if (percentage >= 40) return 'Đạt yêu cầu';
    if (percentage >= 20) return 'Cần cải thiện';
    return 'Chưa đạt';
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      'manually_graded': { label: 'Đã chấm thủ công', color: 'success' },
      'ai_graded': { label: 'AI đã chấm', color: 'primary' },
      'auto_graded': { label: 'Tự động chấm', color: 'info' },
      'ungraded': { label: 'Chưa chấm', color: 'warning' }
    };
    
    const config = statusConfig[status] || { label: 'Không xác định', color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  if (loading || !submissionDetail) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const { skill, student, exam, answers } = submissionDetail;
  const answer = answers && answers.length > 0 ? answers[0] : null;
  const question = answer?.question || {};
  const maxScore = answer?.max_score || 100;
  const scorePercentage = maxScore ? (score / maxScore) * 100 : 0;
  
  // Determine grading status based on answer data
  const gradingStatus = answer?.grading_status || 
    (answer?.final_score !== null && answer?.final_score !== undefined ? 'manually_graded' : 'ungraded');

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/teacher/submissions')}
            sx={{ mr: 2 }}
          >
            Quay lại danh sách
          </Button>
          <Box>
       
            <Typography variant="subtitle1" color="text.secondary">
              {student?.full_name} - {exam?.title}
            </Typography>
            <Box display="flex" gap={1} mt={1}>
              <Chip label={skill || 'Không xác định'} color="primary" size="small" />
              {getStatusChip(gradingStatus)}
              {mode === 'view' && (
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => router.push(`/teacher/submissions/${attemptId}?mode=grade`)}
                  startIcon={<Grade />}
                >
                  Chuyển sang chấm
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>


      
      {mode === 'grade' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Chế độ chấm:</strong> Bạn có thể chấm điểm và đưa ra phản hồi. 
          Nhớ nhấn "Lưu đánh giá" sau khi hoàn thành.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Student Answer Display */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
              <Avatar 
                src={student?.avatar} 
                sx={{ width: 32, height: 32, mr: 2 }}
              >
                {student?.full_name?.charAt(0)}
              </Avatar>
              {student?.full_name}
            </Typography>
            
            {/* Question Content */}
            {question && (
              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                  Câu hỏi:
                </Typography>
                <QuestionDisplay question={question} answer={answer} />
              </Box>
            )}

            {/* Answer Content */}
            {answer && (
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" color="secondary">
                  Câu trả lời của học sinh:
                </Typography>
                
                {/* Answer Type Badge */}
                <Box mb={2}>
                  <Chip 
                    label={`Loại: ${answer.answer_type === 'text' ? 'Văn bản' : 
                           answer.answer_type === 'audio' ? 'Thu âm' : 
                           answer.answer_type === 'option' ? 'Trắc nghiệm' : 
                           answer.answer_type === 'json' ? 'Cấu trúc' : 'Khác'}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                {/* Text Answer */}
                {answer.text_answer && (
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mt: 1 }}>
                    <Typography variant="body2" fontWeight="bold" color="text.secondary" mb={1}>
                      Văn bản:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {answer.text_answer}
                    </Typography>
                  </Box>
                )}

                {/* Selected Option Answer */}
                {answer.selected_option_id && (
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mt: 1 }}>
                    <Typography variant="body2" fontWeight="bold" color="text.secondary" mb={1}>
                      Lựa chọn đã chọn:
                    </Typography>
                    <Typography variant="body1">
                      Option ID: {answer.selected_option_id}
                    </Typography>
                  </Box>
                )}

                {/* JSON Answer (for complex question types) */}
                {answer.answer_json && (
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mt: 1 }}>
                    <Typography variant="body2" fontWeight="bold" color="text.secondary" mb={1}>
                      Dữ liệu câu trả lời:
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {answer.answer_json}
                    </Typography>
                  </Box>
                )}

                {/* Audio Answer */}
                {answer.audio_url && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="bold" mb={1}>
                      Bài thu âm:
                    </Typography>
                    <audio controls style={{ width: '100%' }}>
                      <source src={answer.audio_url} type="audio/mpeg" />
                      Trình duyệt không hỗ trợ audio.
                    </audio>
                    
                    {/* Transcribed Text if available */}
                    {answer.transcribed_text && (
                      <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1, mt: 1 }}>
                        <Typography variant="body2" fontWeight="bold" color="info.main" mb={1}>
                          Văn bản đã chuyển đổi:
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {answer.transcribed_text}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* AI Feedback */}
                {answer.ai_feedback && (
                  <Box mt={2}>
                    <Typography variant="body2" fontWeight="bold" color="info.main">
                      Phản hồi AI:
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1, mt: 1 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {answer.ai_feedback}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Existing Manual Feedback */}
                {answer.manual_feedback && (
                  <Box mt={2}>
                    <Typography variant="body2" fontWeight="bold" color="warning.main">
                      Nhận xét trước đó:
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1, mt: 1 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {answer.manual_feedback}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Grading Form */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Form chấm điểm
            </Typography>
            
            {/* Current Score Display */}
            {answer && (
              <Box mb={3} p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="body2" color="text.secondary">Điểm hiện tại:</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h5" fontWeight="bold" color={getScoreColor(answer.score || 0, answer.max_score)}>
                    {answer.score || 0}/{answer.max_score}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(answer.score || 0) / (answer.max_score || 1) * 100}
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    color={getScoreColor(answer.score || 0, answer.max_score)}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {Math.round((answer.score || 0) / (answer.max_score || 1) * 100)}%
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Score Input */}
            <Box mb={3}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Điểm số mới:
              </Typography>
              <TextField
                type="number"
                label="Điểm"
                value={score}
                onChange={(e) => setScore(Math.max(0, Math.min(maxScore, parseInt(e.target.value) || 0)))}
                InputProps={{
                  endAdornment: <Typography color="text.secondary">/{maxScore}</Typography>
                }}
                fullWidth
                disabled={mode === 'view'}
                inputProps={{ min: 0, max: maxScore }}
                error={score > maxScore}
                helperText={score > maxScore ? `Điểm không được vượt quá ${maxScore}` : ''}
              />
              
              {/* Score Rating Visual */}
              <Box mt={1}>
                <Rating
                  value={score / maxScore * 5}
                  readOnly
                  precision={0.5}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary" ml={1}>
                  {getScoreLabel(score, maxScore)}
                </Typography>
              </Box>
            </Box>

            {/* Progress Bar */}
            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tiến độ điểm:
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={scorePercentage}
                sx={{ height: 8, borderRadius: 4 }}
                color={getScoreColor(score, maxScore)}
              />
              <Typography variant="caption" color="text.secondary">
                {score}/{maxScore} điểm ({Math.round(scorePercentage)}%)
              </Typography>
            </Box>

            {/* Feedback Input */}
            <Box mb={3}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Nhận xét chi tiết:
              </Typography>
              <TextField
                multiline
                rows={6}
                label="Viết nhận xét cho học sinh..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                fullWidth
                disabled={mode === 'view'}
                placeholder="Ví dụ: Bài làm tốt, cần cải thiện ngữ pháp ở phần..."
              />
            </Box>

            {/* Action Buttons */}
            {mode === 'grade' && (
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmitReview}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} /> : <Grade />}
                  fullWidth
                >
                  {saving ? 'Đang lưu...' : 'Lưu đánh giá'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/teacher/submissions')}
                  disabled={saving}
                  sx={{ minWidth: 100 }}
                >
                  Hủy
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

