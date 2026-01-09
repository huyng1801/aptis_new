'use client';

import { Card, CardContent } from '@mui/material';
import SpeakingQuestion from './SpeakingQuestion';

export default function PracticeSpeakingQuestionNew({ question, answer, onAnswerChange }) {
  return (
    <Card>
      <CardContent>
        <SpeakingQuestion
          question={question}
          answer={answer}
          onAnswerChange={onAnswerChange}
          isPractice={true}
        />
      </CardContent>
    </Card>
  );
}