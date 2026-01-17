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
      'Reading': {
        title: 'Phần Đọc Hiểu (Reading)',
        description: 'Đánh giá khả năng đọc hiểu và xử lý thông tin từ các loại văn bản khác nhau',
        icon: '📖',
        duration: '35 phút',
        totalPoints: '50 điểm',
        structure: [
          'Part 1: Gap Filling - 1 câu',
          'Part 2: Ordering - 2 câu',
          'Part 3: Matching - 1 câu',
          'Part 4: Matching Headings - 1 câu'
        ],
        instructions: [
          'Đọc lướt toàn bộ văn bản để hiểu ý chính',
          'Đọc kỹ câu hỏi để hiểu yêu cầu cụ thể',
          'Quay lại tìm các chi tiết hỗ trợ cho câu trả lời',
          'Quản lý thời gian - dành ~8 phút cho mỗi phần'
        ],
        tips: '⏱️ Không dành quá nhiều thời gian cho một phần. Bỏ qua câu khó và quay lại sau nếu còn thời gian.',
        warnings: []
      },
      'Listening': {
        title: 'Phần Nghe Hiểu (Listening)',
        description: 'Đánh giá khả năng hiểu nội dung từ các tài liệu nghe tiếng Anh đa dạng',
        icon: '🎧',
        duration: '40 phút',
        totalPoints: '50 điểm',
        structure: [
          'Part 1: Multiple Choice - 13 câu',
          'Part 2: Speaker Matching - 4 câu',
          'Part 3: Statement Matching - 4 câu',
          'Part 4: Extended MCQ - 2 câu'
        ],
        instructions: [
          'Đọc câu hỏi kỹ lưỡng trước khi nghe',
          'Tập trung cao độ - audio chỉ phát một lần',
          'Ghi chú những từ khóa và thông tin quan trọng',
          'Đừng lo nếu bỏ lỡ một phần - hãy tập trung vào câu tiếp theo'
        ],
        tips: '🎵 Audio chỉ phát được 2 lần. Hãy chuẩn bị tinh thần và tập trung hoàn toàn trước khi bắt đầu.',
        warnings: [
          '⚠️ Kiểm tra loa hoặc tai nghe của bạn trước khi bắt đầu',
          '⚠️ Tìm môi trường yên tĩnh để nghe rõ nhất'
        ]
      },
      'Writing': {
        title: 'Phần Viết (Writing)',
        description: 'Đánh giá khả năng viết các loại text khác nhau với ngữ pháp, từ vựng và tổ chức ý tưởng hợp lý',
        icon: '✍️',
        duration: '50 phút',
        totalPoints: '50 điểm',
        structure: [
          'Task 1: Form Filling - 1 câu',
          'Task 2: Short Response - 1 câu',
          'Task 3: Chat Responses - 1 câu',
          'Task 4: Email Writing - 1 câu'
        ],
        instructions: [
          'Đọc kỹ hướng dẫn và yêu cầu của từng task',
          'Lập dàn ý trước - không viết liền liền',
          'Kiểm tra chính tả và ngữ pháp sau khi hoàn thành',
          'Tuân thủ độ dài yêu cầu (nếu có)'
        ],
        tips: '📝 Bắt đầu với các task dễ hơn (Task 1-2) để xây dựng tự tin trước khi làm Task 3-4 phức tạp hơn.',
        warnings: [
          '⚠️ Task 4 dành nhiều thời gian nhất - đây là phần quan trọng',
          '⚠️ Chất lượng viết (ngữ pháp, từ vựng) ảnh hưởng đến điểm'
        ]
      },
      'Speaking': {
        title: 'Phần Nói (Speaking)',
        description: 'Đánh giá khả năng nói tiếng Anh từ những tình huống giao tiếp đơn giản đến phức tạp',
        icon: '🎤',
        duration: '10 phút',
        totalPoints: '50 điểm',
        structure: [
          'Part 1: Personal Introduction - 3 câu',
          'Part 2: Picture Description - 3 câu',
          'Part 3: Comparison - 3 câu',
          'Part 4: Topic Discussion - 1 câu'
        ],
        instructions: [
          'Nói rõ ràng, với tốc độ vừa phải - không quá nhanh hay quá chậm',
          'Suy nghĩ trong 10-15 giây trước khi trả lời',
          'Trả lời đầy đủ - không chỉ "yes" hoặc "no"',
          'Part 4 dài nhất - chuẩn bị ý tưởng chi tiết'
        ],
        tips: '🎙️ Part 4 quan trọng nhất với 14 điểm. Đảm bảo bạn nói rõ ràng, logic và phát triển ý tưởng của mình.',
        warnings: [
          '⚠️ Kiểm tra microphone hoạt động tốt TRƯỚC khi bắt đầu',
          '⚠️ Tìm môi trường yên tĩnh, tránh tiếng ồn nền',
          '⚠️ Mỗi câu hỏi chỉ ghi âm một lần - không thể quay lại',
          '⚠️ Không được tạm dừng hoặc sửa lại sau khi bắt đầu nói'
        ]
      }
    };

    return skillMap[skillName] || {
      title: 'Phần Thi',
      description: 'Kỹ năng tiếng Anh',
      icon: '📝',
      duration: 'N/A',
      totalPoints: 'N/A',
      structure: [],
      instructions: ['Làm theo hướng dẫn'],
      tips: '💪 Hãy cố gắng hết sức của bạn!',
      warnings: []
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
      onClose={(event, reason) => {
        // Chỉ cho phép đóng dialog nếu lý do không phải là click backdrop
        if (reason && reason === 'backdropClick') return;
        if (onClose) onClose(event, reason);
      }}
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
              {skillInfo.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {skillInfo.totalPoints} • {skillInfo.duration}
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
                Mô tả
              </Typography>
            </Box>
            <Typography variant="body1">
              {skillInfo.description}
            </Typography>
          </Paper>

          {/* Structure */}
          {skillInfo.structure.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                📋 Cấu trúc phần thi
              </Typography>
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                {skillInfo.structure.map((item, index) => (
                  <ListItem key={index} sx={{ py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                        {index + 1}.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText 
                      primary={item}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Instructions */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              Hướng dẫn làm bài
            </Typography>
            <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
              {skillInfo.instructions.map((instruction, index) => (
                <ListItem key={index} sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                      {index + 1}.
                    </Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary={instruction}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Tips */}
          <Paper sx={{ p: 2.5, backgroundColor: '#f5f5f5', border: 1, borderColor: 'divider' }}>
            <Typography variant="body2">
              {skillInfo.tips}
            </Typography>
          </Paper>

          {/* Warnings */}
          {skillInfo.warnings.length > 0 && (
            <Paper sx={{ p: 2.5, backgroundColor: 'warning.light', border: 1, borderColor: 'warning.main' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {skillInfo.warnings.map((warning, index) => (
                  <Typography key={index} variant="body2">
                    {warning}
                  </Typography>
                ))}
              </Box>
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