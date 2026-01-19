'use client';

import { Box, Typography, Paper } from '@mui/material';
import WritingQuestionDisplay from './WritingQuestionDisplay';
import ReadingQuestionDisplay from './ReadingQuestionDisplay';
import ListeningQuestionDisplay from './ListeningQuestionDisplay';
import SpeakingQuestionDisplay from './SpeakingQuestionDisplay';

/**
 * Component hiển thị câu hỏi theo từng loại
 */
export default function QuestionDisplay({ question, answer }) {
  if (!question) {
    return (
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body1" color="text.secondary">
          Không có nội dung câu hỏi
        </Typography>
      </Box>
    );
  }

  // Xác định loại câu hỏi từ question type code
  const questionTypeCode = question.question_type?.code || '';
  
  // Writing Questions
  if (questionTypeCode.startsWith('WRITING_')) {
    return <WritingQuestionDisplay question={question} answer={answer} />;
  }
  
  // Reading Questions
  if (questionTypeCode.startsWith('READING_')) {
    return <ReadingQuestionDisplay question={question} answer={answer} />;
  }
  
  // Listening Questions
  if (questionTypeCode.startsWith('LISTENING_')) {
    return <ListeningQuestionDisplay question={question} answer={answer} />;
  }
  
  // Speaking Questions
  if (questionTypeCode.startsWith('SPEAKING_')) {
    return <SpeakingQuestionDisplay question={question} answer={answer} />;
  }

  // Default fallback
  return (
    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
      <Typography variant="body1">
        {question.content || question.question_text || 'Không có nội dung câu hỏi'}
      </Typography>
      {question.image_url && (
        <Box mt={2}>
          <img 
            src={question.image_url} 
            alt="Question" 
            style={{ maxWidth: '100%', borderRadius: 4 }} 
          />
        </Box>
      )}
      {question.audio_url && (
        <Box mt={2}>
          <Typography variant="body2" fontWeight="bold" mb={1}>
            Audio câu hỏi:
          </Typography>
          <audio controls style={{ width: '100%' }}>
            <source src={question.audio_url} type="audio/mpeg" />
            Trình duyệt không hỗ trợ audio.
          </audio>
        </Box>
      )}
    </Box>
  );
}