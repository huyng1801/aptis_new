'use client';

import {
  Card,
  CardContent
} from '@mui/material';
import WritingEmailQuestion from './writing/WritingEmailQuestion';
import WritingChatQuestion from './writing/WritingChatQuestion';
import WritingFormFillingQuestion from './writing/WritingFormFillingQuestion';
import WritingShortAnswerQuestion from './writing/WritingShortAnswerQuestion';

export default function PracticeWritingQuestionNew({ question, answer, onAnswerChange }) {
  // Determine question type from question data
  const questionType = question.question_type || question.type;
  
  const renderWritingQuestion = () => {
    switch (questionType) {
      case 'EMAIL_WRITING':
      case 'email':
        return (
          <WritingEmailQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
      case 'CHAT_WRITING':
      case 'chat':
        return (
          <WritingChatQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
      case 'FORM_FILLING':
      case 'form':
        return (
          <WritingFormFillingQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
      case 'SHORT_ANSWER':
      case 'short_answer':
      default:
        return (
          <WritingShortAnswerQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
    }
  };

  return (
    <Card>
      <CardContent>
        {renderWritingQuestion()}
      </CardContent>
    </Card>
  );
}