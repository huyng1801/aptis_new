'use client';

import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import MCQQuestion from './MCQQuestion';
import ReadingMatchingQuestion from './reading/MatchingQuestion';
import ReadingMatchingHeadingsQuestion from './reading/MatchingHeadingsQuestion';
import ReadingGapFillingQuestion from './reading/GapFillingQuestion';
import ReadingOrderingQuestion from './reading/OrderingQuestion';
import ListeningMCQQuestion from './listening/ListeningMCQQuestion';
import ListeningMatchingQuestion from './listening/ListeningMatchingQuestion';
import ListeningStatementMatchingQuestion from './listening/ListeningStatementMatchingQuestion';
import ListeningMultiMCQQuestion from './listening/ListeningMultiMCQQuestion';
import WritingQuestion from './WritingQuestion';
import WritingShortAnswerQuestion from './writing/WritingShortAnswerQuestion';
import WritingFormFillingQuestion from './writing/WritingFormFillingQuestion';
import WritingChatQuestion from './writing/WritingChatQuestion';
import WritingEmailQuestion from './writing/WritingEmailQuestion';
import SpeakingQuestion from './SpeakingQuestion';

export default function QuestionDisplay({ 
  question, 
  answer, 
  onAnswerChange, 
  questionNumber, 
  totalQuestions,
  attemptId,
  onMoveToNextQuestion,
  onHideHeader,
  microphoneTestCompleted,
  onStartMicrophoneTest,
  onCompleteMicrophoneTest
}) {
  // Protect against overwriting audio answers
  const handleAnswerChange = (answerData) => {
    // If this is an audio question and we already have audio_url, don't allow overwrite
    if (question.questionType?.code?.includes('SPEAKING') && 
        answer?.audio_url && 
        answerData?.answer_type !== 'audio') {
      console.warn('[QuestionDisplay] Preventing overwrite of speaking answer:', answerData);
      return;
    }
    
    console.log('[QuestionDisplay] Forwarding answer change:', answerData);
    onAnswerChange(answerData);
  };
  
  if (!question) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Không tìm thấy câu hỏi</Typography>
      </Box>
    );
  }

  const getQuestionTypeLabel = (code) => {
    const typeNameMap = {
      'GV_MCQ': 'Multiple Choice',
      'GV_GAP_FILL': 'Gap Filling',
      'GV_MATCHING': 'Matching',
      'READING_MCQ': 'Multiple Choice',
      'READING_TRUE_FALSE': 'True/False',
      'READING_GAP_FILL': 'Gap Filling',
      'READING_ORDERING': 'Ordering',
      'READING_MATCHING': 'Matching',
      'READING_MATCHING_HEADINGS': 'Matching Headings',

      'LISTENING_MCQ': 'Multiple Choice',
      'LISTENING_MATCHING': 'Speaker Matching',
      'LISTENING_STATEMENT_MATCHING': 'Statement Matching',
      'WRITING_SHORT': 'Short Answers',
      'WRITING_EMAIL': 'Email Writing',
      'WRITING_LONG': 'Chat Responses',
      'WRITING_ESSAY': 'Essay Writing',
      'WRITING_FORM': 'Form Filling',
      'SPEAKING_INTRO': 'Personal Introduction',
      'SPEAKING_DESCRIPTION': 'Picture Description',
      'SPEAKING_COMPARISON': 'Comparison',
      'SPEAKING_DISCUSSION': 'Topic Discussion',
    };
    return typeNameMap[code] || code;
  };

  const renderQuestionContent = () => {
    // Reconstruct answer_data from answer object - answers from Redux store don't have answer_data property
    const answerData = answer ? {
      answer_type: answer.answer_type,
      selected_option_id: answer.selected_option_id,
      text_answer: answer.text_answer,
      audio_url: answer.audio_url,
      answer_json: answer.answer_json
    } : null;

    // Merge answer data into question for component consumption
    // CRITICAL: Preserve all question fields including media_url
    const questionData = {
      ...question,
      answer_data: answerData
    };
    
    console.log('[QuestionDisplay] Rendering question:', questionData.id, 'with answer_data:', questionData.answer_data, 'media_url:', questionData.media_url);

    const questionTypeCode = question.questionType?.code || 'MCQ';

    // Map database codes to component types
    const getQuestionType = (code) => {
      const typeMap = {
        // Grammar & Vocabulary
        'GV_MCQ': 'mcq',
        'GV_GAP_FILL': 'gap_filling',
        'GV_MATCHING': 'matching',
        
        // Reading
        'READING_MCQ': 'mcq',
        'READING_TRUE_FALSE': 'mcq', // use MCQ component for true/false
        'READING_GAP_FILL': 'gap_filling',
        'READING_ORDERING': 'ordering',
        'READING_MATCHING': 'matching',
        'READING_MATCHING_HEADINGS': 'matching_headings',

        
        // Listening - now mapped to listening component
        'LISTENING_MCQ': 'listening_mcq',
        'LISTENING_MATCHING': 'listening_matching',
        'LISTENING_STATEMENT_MATCHING': 'listening_statement_matching',
        
        // Writing - mapped to writing components
        'WRITING_SHORT': 'writing_short_answer',
        'WRITING_EMAIL': 'writing_email', 
        'WRITING_LONG': 'writing_chat',
        'WRITING_ESSAY': 'writing_essay',
        'WRITING_FORM': 'writing_form',
        
        // Speaking
        'SPEAKING_INTRO': 'speaking',
        'SPEAKING_DESCRIPTION': 'speaking',
        'SPEAKING_COMPARISON': 'speaking',
        'SPEAKING_DISCUSSION': 'speaking',
        
        // Legacy/fallback mappings
        'MCQ': 'mcq',
        'MATCHING': 'matching',
        'GAP_FILLING': 'gap_filling',
        'ORDERING': 'ordering',
        'WRITING': 'writing',
        'SPEAKING': 'speaking',
        'LISTENING': 'listening_mcq'
      };
      return typeMap[code] || 'mcq'; // default to mcq
    };

    const mappedType = getQuestionType(questionTypeCode);

    switch (mappedType) {
      case 'mcq':
        return (
          <MCQQuestion
            question={questionData}
            onAnswerChange={onAnswerChange}
          />
        );
      case 'matching':
        return (
          <ReadingMatchingQuestion
            question={questionData}
            onAnswerChange={onAnswerChange}
          />
        );
      case 'matching_headings':
        return (
          <ReadingMatchingHeadingsQuestion
            question={questionData}
            onAnswerChange={onAnswerChange}
          />
        );
      case 'gap_filling':
        return (
          <ReadingGapFillingQuestion
            question={questionData}
            onAnswerChange={onAnswerChange}
          />
        );
      case 'ordering':
        return (
          <ReadingOrderingQuestion
            question={questionData}
            onAnswerChange={onAnswerChange}
          />
        );
      case 'writing_short_answer':
        return (
          <WritingShortAnswerQuestion
            question={questionData}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 'writing_form':
        return (
          <WritingFormFillingQuestion
            question={questionData}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 'writing_chat':
        return (
          <WritingChatQuestion
            question={questionData}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 'writing_email':
        return (
          <WritingEmailQuestion
            question={questionData}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 'writing_essay':
        return (
          <WritingQuestion
            question={questionData}
            onAnswerChange={onAnswerChange}
          />
        );
      case 'writing':
        return (
          <WritingQuestion
            question={questionData}
            onAnswerChange={onAnswerChange}
          />
        );
      case 'speaking':
        return (
          <SpeakingQuestion
            question={questionData}
            onAnswerChange={handleAnswerChange}
            attemptId={attemptId}
            onMoveToNextQuestion={onMoveToNextQuestion}
            onHideHeader={onHideHeader}
            microphoneTestCompleted={microphoneTestCompleted}
            onStartMicrophoneTest={onStartMicrophoneTest}
            onCompleteMicrophoneTest={onCompleteMicrophoneTest}
          />
        );
      case 'listening_mcq':
        // Check if this is a multi-question MCQ (has items array)
        if (questionData.items && questionData.items.length > 0) {
          return (
            <ListeningMultiMCQQuestion
              question={questionData}
              onAnswerChange={handleAnswerChange}
            />
          );
        }
        return (
          <ListeningMCQQuestion
            question={questionData}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 'listening_matching':
        return (
          <ListeningMatchingQuestion
            question={questionData}
            onAnswerChange={handleAnswerChange}
          />
        );
      case 'listening_statement_matching':
        return (
          <ListeningStatementMatchingQuestion
            question={questionData}
            onAnswerChange={handleAnswerChange}
          />
        );
      default:
        return (
          <Typography color="error">
            Loại câu hỏi không được hỗ trợ: {questionTypeCode} (mapped to: {mappedType})
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Question Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Câu {questionNumber}
        </Typography>
        <Box display="flex" gap={1}>
          <Chip 
            label={getQuestionTypeLabel(question.questionType?.code || 'UNKNOWN')} 
            size="small" 
            variant="outlined"
            color="primary"
          />
          <Chip 
            label={`${question.max_score || 1} điểm`} 
            size="small" 
            color="success"
            variant="filled"
          />
        </Box>
      </Box>

      {/* Question Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        maxHeight: '70vh',
        paddingRight: 1,
        '&::-webkit-scrollbar': {
          width: '8px'
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1',
          borderRadius: '4px'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#888',
          borderRadius: '4px'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#555'
        }
      }}>
        {/* Instructions */}
        {question.questionType?.instruction_template && (
          <Card variant="outlined" sx={{ mb: 2, backgroundColor: 'info.light', color: 'info.contrastText' }}>
            <CardContent sx={{ py: 1 }}>
              <Typography variant="body2">
                <strong>Hướng dẫn:</strong> {question.questionType.instruction_template}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Question Text */}
        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
          {question.content}
        </Typography>

        {/* Question Content based on type */}
        {renderQuestionContent()}
      </Box>
    </Box>
  );
}