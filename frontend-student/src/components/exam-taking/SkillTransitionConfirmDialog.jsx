import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Grid,
  Chip,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

/**
 * SkillTransitionConfirmDialog
 * Shows confirmation when user tries to move to the next skill
 * Displays current skill completion status and confirms intent
 */
const SkillTransitionConfirmDialog = ({
  open,
  currentSkill,
  nextSkill,
  currentQuestionIndex,
  totalQuestionsInSkill,
  onConfirm,
  onCancel,
  skillAnswersSummary
}) => {
  if (!currentSkill || !nextSkill) return null;

  // Use answered count for progress if available
  const answeredCount = skillAnswersSummary?.answered ?? (currentQuestionIndex + 1);
  const completionPercentage = totalQuestionsInSkill > 0 
    ? Math.round((answeredCount / totalQuestionsInSkill) * 100)
    : 0;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
        Chuyển sang kỹ năng tiếp theo?
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
            Bạn đang hoàn thành:
          </Typography>

          {/* Current Skill Status */}
          <Box sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: '#f5f5f5',
            border: '1px solid #e0e0e0',
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.5rem' }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {currentSkill.skill?.skill_name || currentSkill.skill?.name}
              </Typography>
            </Box>

            {/* Progress */}
            <Box sx={{ mt: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Tiến độ:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {answeredCount}/{totalQuestionsInSkill} câu ({completionPercentage}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: '#4caf50',
                  }
                }}
              />
            </Box>

            {/* Answered/Unanswered */}
            {skillAnswersSummary && (
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Chip
                  label={`${skillAnswersSummary.answered} câu trả lời`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={`${skillAnswersSummary.unanswered} câu chưa trả lời`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Box>
            )}
          </Box>




        </Box>

        {/* Warning Message */}
        <Box sx={{
          p: 2,
          borderRadius: 1,
          bgcolor: '#fff3cd',
          border: '1px solid #ffc107',
          mt: 2
        }}>
          <Typography variant="body2" color="#856404">
            <strong>Lưu ý:</strong> Bạn không thể quay lại phần này sau khi chuyển sang kỹ năng tiếp theo.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          color="inherit"
        >
          Quay lại
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
        >
          Tiếp tục
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SkillTransitionConfirmDialog;
