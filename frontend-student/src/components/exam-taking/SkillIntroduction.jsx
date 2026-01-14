import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle,
  Timer,
  Info,
  PlayArrow
} from '@mui/icons-material';

const SkillIntroduction = ({ open, skill, onClose, onStartSkill, questionsLoaded = true }) => {
  console.log('[SkillIntroduction] Render with:', { open, skill, hasSkill: !!skill, questionsLoaded });
  
  const getSkillInfo = (skillName) => {
    const skillMap = {
      'Grammar & Vocabulary': {
        description: 'Kiểm tra khả năng ngữ pháp và từ vựng của bạn',
        icon: '�',
        instructions: [
          'Đọc kỹ từng câu hỏi trước khi chọn đáp án',
          'Chú ý đến ngữ cảnh của câu',
          'Không được sử dụng từ điển hoặc tài liệu tham khảo'
        ],
        timePerQuestion: '1-2 phút',
        tips: 'Hãy tin vào kiến thức đầu tiên của bạn, đừng thay đổi đáp án quá nhiều lần.'
      },
      'Reading': {
        description: 'Đánh giá khả năng đọc hiểu văn bản tiếng Anh',
        icon: '📖',
        instructions: [
          'Đọc lướt toàn bộ văn bản trước',
          'Đọc kỹ câu hỏi để hiểu yêu cầu',
          'Quay lại văn bản để tìm thông tin cụ thể'
        ],
        timePerQuestion: '2-3 phút',
        tips: 'Quản lý thời gian hiệu quả - không dành quá nhiều thời gian cho một câu hỏi.'
      },
      'Listening': {
        description: 'Kiểm tra khả năng nghe hiểu tiếng Anh',
        icon: '🎧',
        instructions: [
          'Đọc câu hỏi trước khi nghe',
          'Tập trung hoàn toàn trong suốt quá trình nghe',
          'Ghi chú những từ khóa quan trọng'
        ],
        timePerQuestion: 'Theo audio',
        tips: 'Audio chỉ phát một lần duy nhất, hãy tập trung cao độ.'
      },
      'Writing': {
        description: 'Đánh giá kỹ năng viết và diễn đạt bằng tiếng Anh',
        icon: '✍️',
        instructions: [
          'Đọc kỹ yêu cầu của từng bài viết',
          'Lập dàn ý trước khi bắt đầu viết',
          'Kiểm tra lại ngữ pháp và chính tả'
        ],
        timePerQuestion: '10-15 phút',
        tips: 'Viết rõ ràng, mạch lạc và phù hợp với yêu cầu đề bài.'
      },
      'Speaking': {
        description: 'Kiểm tra khả năng nói và phát âm tiếng Anh',
        icon: '🎤',
        instructions: [
          'Kiểm tra micro trước khi bắt đầu',
          'Nói rõ ràng và với tốc độ vừa phải',
          'Suy nghĩ trong vài giây trước khi trả lời'
        ],
        timePerQuestion: '30-60 giây',
        tips: 'Đừng lo lắng về phát âm hoàn hảo, hãy tập trung vào việc truyền đạt ý tưởng.'
      }
    };

    return skillMap[skillName] || {
      description: 'Kỹ năng tiếng Anh',
      icon: '📝',
      instructions: ['Làm theo hướng dẫn'],
      timePerQuestion: 'Không giới hạn',
      tips: 'Hãy cố gắng hết sức!'
    };
  };

  if (!skill) {
    console.log('[SkillIntroduction] No skill provided, not rendering');
    return null;
  }

  const skillInfo = getSkillInfo(skill.skill_type_name);
  
  console.log('[SkillIntroduction] Rendering dialog with:', { open, skillName: skill.skill_type_name });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '500px'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontSize: '2rem' }}>
            {skillInfo.icon}
          </Typography>
          <Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              {skill.skill_type_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chuẩn bị bắt đầu phần thi
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Description */}
          <Paper sx={{ p: 3, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Info />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Giới thiệu
              </Typography>
            </Box>
            <Typography variant="body1">
              {skillInfo.description}
            </Typography>
          </Paper>

          {/* Instructions */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              Hướng dẫn làm bài
            </Typography>
            <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
              {skillInfo.instructions.map((instruction, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Typography variant="h6" color="primary">
                      {index + 1}.
                    </Typography>
                  </ListItemIcon>
                  <ListItemText primary={instruction} />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Time and Tips */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
              <Timer color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Thời gian mỗi câu
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {skillInfo.timePerQuestion}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                💡 Mẹo nhỏ:
              </Typography>
              <Typography variant="body2">
                {skillInfo.tips}
              </Typography>
            </Paper>
          </Box>

          {/* Warning for Speaking */}
          {skill.skill_type_name === 'Speaking' && (
            <Paper sx={{ p: 2, backgroundColor: 'warning.light', border: 1, borderColor: 'warning.main' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                ⚠️ Lưu ý quan trọng cho phần Speaking:
              </Typography>
              <Typography variant="body2">
                • Đảm bảo microphone hoạt động tốt<br/>
                • Tìm môi trường yên tĩnh<br/>
                • Không được tạm dừng khi đã bắt đầu ghi âm<br/>
                • Mỗi câu hỏi chỉ có một lần ghi âm
              </Typography>
            </Paper>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
  
        <Button
          onClick={onStartSkill}
          variant="contained"
          size="large"
          startIcon={<PlayArrow />}
          disabled={!questionsLoaded}
          sx={{ minWidth: 150 }}
        >
          {questionsLoaded ? 'Bắt đầu làm bài' : 'Đang tải câu hỏi...'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SkillIntroduction;