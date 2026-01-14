'use client';

import { Box, Typography } from '@mui/material';
import WritingShortAnswerQuestion from './WritingShortAnswerQuestion';
import WritingFormFillingQuestion from './WritingFormFillingQuestion';
import WritingChatQuestion from './WritingChatQuestion';
import WritingEmailQuestion from './WritingEmailQuestion';

export default function WritingQuestionDisplay({ 
  question, 
  answer, 
  onAnswerChange 
}) {
  
  const handleAnswerChange = (answerData) => {
    console.log('[WritingQuestionDisplay] Forwarding answer change:', answerData);
    onAnswerChange(answerData);
  };
  
  if (!question) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Không tìm thấy câu hỏi</Typography>
      </Box>
    );
  }

  // Reconstruct answer_data from answer object
  const answerData = answer ? {
    answer_type: answer.answer_type,
    selected_option_id: answer.selected_option_id,
    text_answer: answer.text_answer,
    audio_url: answer.audio_url,
    answer_json: answer.answer_json
  } : null;

  // Merge answer data into question for component consumption
  const questionData = {
    ...question,
    answer_data: answerData
  };

  const questionTypeCode = question.questionType?.code || '';

  // Map question types to components - NO HEADER/WRAPPER, just render the component directly
  switch (questionTypeCode) {
    case 'WRITING_SHORT':
      return (
        <WritingShortAnswerQuestion
          question={questionData}
          onAnswerChange={handleAnswerChange}
        />
      );
      
    case 'WRITING_FORM':
      return (
        <WritingFormFillingQuestion
          question={questionData}
          onAnswerChange={handleAnswerChange}
        />
      );
      
    case 'WRITING_LONG':
      return (
        <WritingChatQuestion
          question={questionData}
          onAnswerChange={handleAnswerChange}
        />
      );
      
    case 'WRITING_EMAIL':
      return (
        <WritingEmailQuestion
          question={questionData}
          onAnswerChange={handleAnswerChange}
        />
      );
      
    default:
      // Default to short answer for other writing types
      return (
        <WritingShortAnswerQuestion
          question={questionData}
          onAnswerChange={handleAnswerChange}
        />
      );
  }
}