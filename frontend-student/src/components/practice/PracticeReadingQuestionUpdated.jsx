'use client';

import {
  Alert,
  Card,
  CardContent
} from '@mui/material';
import MCQQuestion from './MCQQuestion';
import GapFillingQuestion from './reading/GapFillingQuestion';
import MatchingQuestion from './reading/MatchingQuestion';
import MatchingHeadingsQuestion from './reading/MatchingHeadingsQuestion';
import OrderingQuestion from './reading/OrderingQuestion';

export default function PracticeReadingQuestionUpdated({ question, answer, onAnswerChange }) {
  // Determine question type from question data
  const questionType = question.question_type || question.type;

  const renderReadingQuestion = () => {
    switch (questionType) {
      case 'MULTIPLE_CHOICE':
      case 'MCQ':
      case 'mcq':
        return (
          <MCQQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
      case 'GAP_FILLING':
      case 'gap_filling':
        return (
          <GapFillingQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
      case 'MATCHING':
      case 'matching':
        return (
          <MatchingQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
      case 'MATCHING_HEADINGS':
      case 'heading_matching':
        return (
          <MatchingHeadingsQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
      case 'ORDERING':
      case 'ordering':
        return (
          <OrderingQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isPractice={true}
          />
        );
      default:
        return (
          <MCQQuestion
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
        {renderReadingQuestion()}
      </CardContent>
    </Card>
  );
}