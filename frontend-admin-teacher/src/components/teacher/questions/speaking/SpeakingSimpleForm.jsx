'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Alert
} from '@mui/material';

/**
 * Component đơn giản cho SPEAKING_INTRO và SPEAKING_DISCUSSION
 * Chỉ cần: content input
 * Nút submit ở component cha QuestionForm
 */
export default function SpeakingSimpleForm({ questionType, initialData, onChange }) {
  const isSpeakingIntro = questionType?.code === 'SPEAKING_INTRO';
  const [content, setContent] = useState(initialData?.content || '');

  const handleChange = (e) => {
    const value = e.target.value;
    setContent(value);
    onChange(value);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>
            {isSpeakingIntro ? 'Personal Introduction (Task 1)' : 'Topic Discussion (Task 4)'}:
          </strong>
          {' '}
          {isSpeakingIntro 
            ? 'Câu hỏi này yêu cầu học sinh giới thiệu bản thân.' 
            : 'Câu hỏi này yêu cầu học sinh thảo luận về một chủ đề.'}
        </Typography>
      </Alert>

      {/* Question Content */}
      <TextField
        label={isSpeakingIntro ? '👤 Câu hỏi giới thiệu cá nhân' : '💬 Câu hỏi thảo luận chủ đề'}
        multiline
        rows={5}
        value={content}
        onChange={handleChange}
        fullWidth
        placeholder={
          isSpeakingIntro
            ? "Ví dụ: Tell me about yourself.\n\nYou should say:\n- Your name and where you are from\n- What you do (work or study)\n- What you like to do in your free time\n- And explain why you enjoy these activities"
            : "Ví dụ: I'd like to talk about a hobby or sport you enjoy.\n\nPlease tell me:\n- What is your hobby/sport?\n- When did you start doing it?\n- How often do you do it?\n- And explain why you think it's interesting or important"
        }
      />
    </Box>
  );
}
