'use client';

import { Box, Typography, Chip, Alert } from '@mui/material';
import { Mic } from '@mui/icons-material';

/**
 * Component hiển thị câu hỏi Speaking
 */
export default function SpeakingQuestionDisplay({ question, answer }) {
  const questionTypeCode = question.question_type?.code || '';
  
  const getTaskInfo = (typeCode) => {
    switch (typeCode) {
      case 'SPEAKING_INTRO':
        return { task: 'Task 1', level: 'A2', title: 'Personal Introduction', color: 'success' };
      case 'SPEAKING_DESCRIBE':
        return { task: 'Task 2', level: 'B1', title: 'Picture/Topic Description', color: 'info' };
      case 'SPEAKING_COMPARE':
        return { task: 'Task 3', level: 'B1', title: 'Comparison', color: 'primary' };
      case 'SPEAKING_DISCUSS':
        return { task: 'Task 4', level: 'B2+', title: 'Topic Discussion', color: 'warning' };
      default:
        return { task: 'Speaking', level: '', title: 'Speaking Task', color: 'default' };
    }
  };

  const taskInfo = getTaskInfo(questionTypeCode);

  return (
    <Box>
      {/* Task Header */}
      <Box display="flex" gap={1} mb={2}>
        <Chip 
          label={`${taskInfo.task} - ${taskInfo.level}`} 
          color={taskInfo.color} 
          size="small" 
          icon={<Mic />}
        />
        <Chip 
          label={taskInfo.title} 
          variant="outlined" 
          size="small" 
        />
      </Box>

      {/* Question Content */}
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
          {question.content || question.question_text}
        </Typography>
        
        {/* Image if any (especially for describe/compare tasks) */}
        {question.image_url && (
          <Box mt={2}>
            <Typography variant="body2" fontWeight="bold" mb={1}>
              Hình ảnh mô tả:
            </Typography>
            <img 
              src={question.image_url} 
              alt="Speaking prompt" 
              style={{ maxWidth: '100%', borderRadius: 4 }} 
            />
          </Box>
        )}

        {/* Scoring criteria for different tasks */}
        {questionTypeCode === 'SPEAKING_INTRO' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tiêu chí chấm (0-5 điểm):</strong> Giới thiệu bản thân tự nhiên, rõ ràng
            </Typography>
          </Alert>
        )}

        {questionTypeCode === 'SPEAKING_DESCRIBE' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tiêu chí chấm (0-5 điểm):</strong> Mô tả hình ảnh/chủ đề chi tiết, mạch lạc
            </Typography>
          </Alert>
        )}

        {questionTypeCode === 'SPEAKING_COMPARE' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tiêu chí chấm (0-5 điểm):</strong> So sánh hai đối tượng rõ ràng, logic
            </Typography>
          </Alert>
        )}

        {questionTypeCode === 'SPEAKING_DISCUSS' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tiêu chí chấm (0-6 điểm + C1/C2):</strong> Thảo luận chủ đề sâu sắc, lập luận
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Question Items if any (for multi-part questions) */}
      {question.question_items && question.question_items.length > 0 && (
        <Box mt={2}>
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>
            Các phần chi tiết:
          </Typography>
          {question.question_items.map((item, index) => (
            <Box key={index} sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
              <Typography variant="body2">
                <strong>Phần {index + 1}:</strong> {item.content}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}