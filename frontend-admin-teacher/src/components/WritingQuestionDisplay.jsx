'use client';

import { Box, Typography, Chip, Alert } from '@mui/material';

/**
 * Component hiển thị câu hỏi Writing
 */
export default function WritingQuestionDisplay({ question, answer }) {
  const questionTypeCode = question.question_type?.code || '';
  
  const getTaskInfo = (typeCode) => {
    switch (typeCode) {
      case 'WRITING_FORM_FILL':
        return { task: 'Task 1', level: 'A1', title: 'Form Filling', color: 'success' };
      case 'WRITING_SHORT_RESPONSE':
        return { task: 'Task 2', level: 'A2', title: 'Short Response', color: 'info' };
      case 'WRITING_CHAT':
        return { task: 'Task 3', level: 'B1', title: 'Chat Responses', color: 'primary' };
      case 'WRITING_EMAIL':
        return { task: 'Task 4', level: 'B2+', title: 'Email Writing', color: 'warning' };
      default:
        return { task: 'Writing', level: '', title: 'Writing Task', color: 'default' };
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
        />
        <Chip 
          label={taskInfo.title} 
          variant="outlined" 
          size="small" 
        />
      </Box>

      {/* Question Content */}
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {question.content || question.question_text}
        </Typography>
        
        {/* Image if any */}
        {question.image_url && (
          <Box mt={2}>
            <img 
              src={question.image_url} 
              alt="Writing prompt" 
              style={{ maxWidth: '100%', borderRadius: 4 }} 
            />
          </Box>
        )}

        {/* Scoring criteria for different tasks */}
        {questionTypeCode === 'WRITING_FORM_FILL' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tiêu chí chấm (0-4 điểm):</strong> Điền thông tin cá nhân cơ bản chính xác
            </Typography>
          </Alert>
        )}

        {questionTypeCode === 'WRITING_SHORT_RESPONSE' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tiêu chí chấm (0-5 điểm):</strong> Trả lời ngắn 20-30 từ, nội dung phù hợp
            </Typography>
          </Alert>
        )}

        {questionTypeCode === 'WRITING_CHAT' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tiêu chí chấm (0-5 điểm):</strong> Phản hồi chat 30-40 từ mỗi phần, tự nhiên
            </Typography>
          </Alert>
        )}

        {questionTypeCode === 'WRITING_EMAIL' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tiêu chí chấm (0-6 điểm + C1/C2):</strong> Viết email cho bạn và người có thẩm quyền
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