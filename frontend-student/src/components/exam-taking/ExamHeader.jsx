'use client';

import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  GridView,
  NavigateBefore,
  NavigateNext,
  Flag,
} from '@mui/icons-material';
import ExamTimer from '@/components/exam-taking/ExamTimer';

export default function ExamHeader({
  currentAttempt,
  attemptType,
  getCurrentSkillInfo,
  currentQuestionIndex,
  questionsLength,
  autoSaveStatus,
  timeRemaining,
  timerInitialized,
  isNavigationDisabled,
  setDrawerOpen,
  setSubmitDialogOpen,
  submitDialogOpen,
  onSubmit,
  onPrevious,
  onNext,
  hideHeader,
  currentSkillIndex,
  totalSkills,
  showSkillIntro = false
}) {
  if (hideHeader) return null;

  return (
    <>
      {/* Top AppBar - Always show during exam */}
      <AppBar position="static" color="default" elevation={1} className="exam-header">
        <Toolbar>
          <IconButton 
            edge="start" 
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <GridView />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" noWrap>
              {currentAttempt.exam.title}
            </Typography>
            
            {/* Show current skill for full exam */}
            {attemptType === 'full_exam' && getCurrentSkillInfo() && (
              <>
                <Chip
                  label={`📚 ${getCurrentSkillInfo().skill_type_name}`}
                  size="small"
                  color="primary"
                  variant="filled"
                />
                {currentSkillIndex && totalSkills && (
                  <Chip
                    label={`Skill ${currentSkillIndex}/${totalSkills}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </>
            )}
            
            <Chip 
              label={`Câu ${currentQuestionIndex + 1}/${questionsLength}`} 
              size="small" 
              variant="outlined"
            />
            
            {/* Save status indicator */}
            {autoSaveStatus === 'saving' && (
              <Chip 
                label="Đang lưu..." 
                size="small" 
                color="info"
                variant="outlined"
              />
            )}
            {autoSaveStatus === 'saved' && (
              <Chip 
                label="Đã lưu" 
                size="small" 
                color="success"
                variant="outlined"
              />
            )}
            {autoSaveStatus === 'error' && (
              <Chip 
                label="Lỗi lưu" 
                size="small" 
                color="error"
                variant="outlined"
              />
            )}
          </Box>
          
          {/* Timer - Hidden when skill intro is showing */}
          {!showSkillIntro && (
            <ExamTimer 
              timeRemaining={timeRemaining}
              totalTime={currentAttempt.exam.duration_minutes * 60}
              isRunning={timerInitialized}
            />
          )}
          
          {/* Submit button - Hidden when skill intro is showing */}
          {!showSkillIntro && (
            <Button
              color="error"
              variant="outlined"
              onClick={() => setSubmitDialogOpen(true)}
              sx={{ ml: 2 }}
            >
              Nộp bài
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Bottom Navigation */}
      <AppBar position="static" color="default" elevation={1} sx={{ top: 'auto', bottom: 0 }}>
        <Toolbar>
          <Button
            startIcon={<NavigateBefore />}
            onClick={onPrevious}
            disabled={currentQuestionIndex === 0 || isNavigationDisabled}
          >
            Câu trước
          </Button>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button
            endIcon={<NavigateNext />}
            onClick={onNext}
            disabled={currentQuestionIndex === questionsLength - 1 || isNavigationDisabled}
          >
            Câu sau
          </Button>
          
          <Button
            startIcon={<Flag />}
            variant="outlined"
            color="error"
            onClick={() => setSubmitDialogOpen(true)}
            sx={{ ml: 2 }}
          >
            Nộp bài
          </Button>
        </Toolbar>
      </AppBar>

      {/* Submit Confirmation Dialog */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Xác nhận nộp bài</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn nộp bài không? Sau khi nộp bài, bạn không thể chỉnh sửa câu trả lời nữa.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Thời gian còn lại: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Hủy</Button>
          <Button onClick={onSubmit} variant="contained" color="primary">
            Nộp bài
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}