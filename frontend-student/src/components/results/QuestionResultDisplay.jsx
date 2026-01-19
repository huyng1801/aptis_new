'use client';

import { useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Alert } from '@mui/material';

// Import specialized result components
import MCQQuestionResult from './reading/MCQQuestionResult';
import GapFillingQuestionResult from './reading/GapFillingQuestionResult';
import MatchingQuestionResult from './reading/MatchingQuestionResult';
import MatchingHeadingsQuestionResult from './reading/MatchingHeadingsQuestionResult';
import OrderingQuestionResult from './reading/OrderingQuestionResult';

// Import new APTIS-specific writing result components
import WordLevelWritingResult from './writing/WordLevelWritingResult';
import ShortTextWritingResult from './writing/ShortTextWritingResult';
import ChatResponsesWritingResult from './writing/ChatResponsesWritingResult';
import EmailWritingResult from './writing/EmailWritingResult';

import ListeningMCQQuestionResult from './listening/ListeningMCQQuestionResult';
import ListeningMultiMCQQuestionResult from './listening/ListeningMultiMCQQuestionResult';
import ListeningMatchingQuestionResult from './listening/ListeningMatchingQuestionResult';
import ListeningStatementMatchingQuestionResult from './listening/ListeningStatementMatchingQuestionResult';

import SpeakingQuestionResult from './speaking/SpeakingQuestionResult';

export default function QuestionResultDisplayNew({ answer, question, calculatedScore, showCorrectAnswer = true, feedback = null }) {
  // Use provided calculatedScore or fallback to answer score from API
  const questionScore = calculatedScore || {
    score: answer.final_score !== null ? answer.final_score : (answer.score || 0),
    percentage: (() => {
      const actualScore = answer.final_score !== null ? answer.final_score : (answer.score || 0);
      const maxScore = answer.max_score || question.max_score || 1;
      return maxScore > 0 ? (actualScore / maxScore) * 100 : 0;
    })()
  };

  const questionType = question?.question_type?.question_type_name || question?.questionType?.question_type_name;
  const questionCode = question?.question_type?.code || question?.questionType?.code;
  const skillType = question?.questionType?.skillType?.skill_type_name;

  // Get feedback for this specific question if available
  const questionFeedback = feedback?.find?.(f => f.question_id === question.id) || feedback;

  // Render different question types using specialized components
  const renderQuestionByType = () => {
    const commonProps = {
      answer,
      question,
      showCorrectAnswer,
      feedback: questionFeedback
    };

    switch (questionCode) {
      // Reading question types
      case 'READING_MCQ':
      case 'READING_TRUE_FALSE':
        return <MCQQuestionResult {...commonProps} />;
      
      case 'READING_GAP_FILLING':
      case 'READING_GAP_FILL':
        return <GapFillingQuestionResult {...commonProps} />;
      
      case 'READING_MATCHING':
        return <MatchingQuestionResult {...commonProps} />;
      
      case 'READING_MATCHING_HEADINGS':
        return <MatchingHeadingsQuestionResult {...commonProps} />;
      
      case 'READING_ORDERING':
        return <OrderingQuestionResult {...commonProps} />;

      // Listening question types  
      case 'LISTENING_MCQ':
        // Check if this is a multi-question MCQ (has items array with multiple items)
        if (question?.items && question.items.length > 1) {
          return <ListeningMultiMCQQuestionResult {...commonProps} />;
        }
        return <ListeningMCQQuestionResult {...commonProps} />;
      
      case 'LISTENING_MATCHING':
        return <ListeningMatchingQuestionResult {...commonProps} />;
      
      case 'LISTENING_STATEMENT_MATCHING':
        return <ListeningStatementMatchingQuestionResult {...commonProps} />;

      // Writing question types - APTIS specific routing
      case 'WRITING_SHORT':
        return <WordLevelWritingResult {...commonProps} />;
      
      case 'WRITING_FORM':
        return <ShortTextWritingResult {...commonProps} />;
      
      case 'WRITING_LONG':
        return <ChatResponsesWritingResult {...commonProps} />;
      
      case 'WRITING_EMAIL':
        return <EmailWritingResult {...commonProps} />;

      // Speaking question types
      case 'SPEAKING_INTRO':
      case 'SPEAKING_DESCRIPTION':
      case 'SPEAKING_COMPARISON':
      case 'SPEAKING_DISCUSSION':
        return <SpeakingQuestionResult {...commonProps} />;

      default:
        return renderGenericQuestion();
    }
  };

  const renderGenericQuestion = () => {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Question type "{questionCode}" not yet supported in results display. 
        <br />
        Question: {question.content}
        <br />
        Answer: {answer.text_answer || answer.selected_option_id || JSON.stringify(answer.answer_json)}
      </Alert>
    );
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        {/* Question Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Question: {question.code || questionType}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={questionType} size="small" variant="outlined" />
              <Chip 
                label={`${questionScore.score}/${answer.max_score || question.max_score || 1}`} 
                size="small" 
                color="primary"
              />
              <Chip 
                label={`${questionScore.percentage}%`} 
                size="small" 
                color={questionScore.percentage >= 70 ? 'success' : questionScore.percentage >= 50 ? 'warning' : 'error'}
              />
            </Box>
          </Box>
        </Box>

        {/* Question Content using specialized components */}
        {renderQuestionByType()}

        {/* Score Details */}
        {questionScore.details && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Score breakdown:</Typography>
            <Typography variant="body2">
              {typeof questionScore.details === 'string' ? questionScore.details : JSON.stringify(questionScore.details)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}