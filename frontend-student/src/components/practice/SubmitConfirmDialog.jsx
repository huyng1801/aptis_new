'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Warning,
  Info,
} from '@mui/icons-material';

export default function SubmitConfirmDialog({ 
  open, 
  onClose, 
  onConfirm,
  questions,
  answers,
  attemptType 
}) {
  const answeredQuestions = questions.filter(q => {
    const answer = answers.find(a => a.question_id === q.id);
    if (!answer || !answer.answer_data) return false;
    
    // Check if answer has actual content
    const hasContent = 
      (answer.answer_data.selected_option) ||
      (answer.answer_data.matches && Object.keys(answer.answer_data.matches).length > 0) ||
      (answer.answer_data.gap_answers && answer.answer_data.gap_answers.some(a => a && a.trim())) ||
      (answer.answer_data.text && answer.answer_data.text.trim()) ||
      (answer.answer_data.audio_url) ||
      (answer.answer_data.ordered_items);
    
    return hasContent;
  });

  const unansweredQuestions = questions.filter(q => 
    !answeredQuestions.find(aq => aq.id === q.id)
  );

  const completionPercentage = questions.length > 0 
    ? Math.round((answeredQuestions.length / questions.length) * 100)
    : 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Warning color="warning" />
          <Typography variant="h6">Xác nhận nộp bài</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Warning Message */}
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            Sau khi nộp bài, bạn không thể thay đổi câu trả lời!
          </Typography>
        </Alert>

        {/* Statistics */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Thống kê bài làm
            </Typography>
            <Chip 
              label={`${completionPercentage}% hoàn thành`}
              color={completionPercentage === 100 ? 'success' : completionPercentage >= 80 ? 'primary' : 'warning'}
              size="small"
            />
          </Box>

          <Box display="flex" gap={2} mb={2}>
            <Box 
              sx={{ 
                flex: 1, 
                p: 2, 
                borderRadius: 1, 
                backgroundColor: 'success.light',
                textAlign: 'center'
              }}
            >
              <Typography variant="h4" color="success.dark" fontWeight="bold">
                {answeredQuestions.length}
              </Typography>
              <Typography variant="body2" color="success.dark">
                Đã trả lời
              </Typography>
            </Box>
            
            <Box 
              sx={{ 
                flex: 1, 
                p: 2, 
                borderRadius: 1, 
                backgroundColor: 'error.light',
                textAlign: 'center'
              }}
            >
              <Typography variant="h4" color="error.dark" fontWeight="bold">
                {unansweredQuestions.length}
              </Typography>
              <Typography variant="body2" color="error.dark">
                Chưa trả lời
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Unanswered Questions List */}
        {unansweredQuestions.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="error" gutterBottom fontWeight="bold">
              ⚠️ Các câu chưa trả lời:
            </Typography>
            <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
              {unansweredQuestions.map((q, index) => (
                <ListItem key={q.id}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <RadioButtonUnchecked fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Câu ${questions.indexOf(q) + 1}`}
                    secondary={q.questionType?.question_type_name || 'Unknown type'}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* AI Scoring Notice */}
        <Alert severity="info" icon={<Info />} sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Lưu ý về chấm điểm:
          </Typography>
          <Typography variant="caption" component="div">
            • <strong>Trắc nghiệm</strong>: Chấm điểm tức thì<br/>
            • <strong>Writing & Speaking</strong>: AI chấm trong 30-90 giây<br/>
            • Bạn có thể xem kết quả ngay sau khi nộp bài
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          size="large"
        >
          Xem lại
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color="primary"
          size="large"
          startIcon={<CheckCircle />}
        >
          Nộp bài ngay
        </Button>
      </DialogActions>
    </Dialog>
  );
}
