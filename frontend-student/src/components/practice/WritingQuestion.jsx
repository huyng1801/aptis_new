'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material';

export default function WritingQuestion({ question, onAnswerChange }) {
  const [text, setText] = useState('');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (question.answer_data?.text_answer) {
      setText(question.answer_data.text_answer);
      console.log('[WritingQuestion] Initialized with existing text:', question.answer_data.text_answer.substring(0, 50));
    } else {
      setText('');
      console.log('[WritingQuestion] No existing text, reset to empty');
    }
  }, [question.id, question.answer_data?.text_answer]); // Track specific value

  useEffect(() => {
    // Count words
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [text]);

  const handleTextChange = (event) => {
    const newText = event.target.value;
    setText(newText);
    
    onAnswerChange({
      answer_type: 'text',
      text_answer: newText
    });
  };

  const requirements = question.question_content?.requirements || {};
  const minWords = requirements.min_words || 0;
  const maxWords = requirements.max_words || 1000;
  const timeLimit = requirements.time_limit; // in minutes
  
  // Check if this is a short answer question (from reading)
  const isShortAnswer = question.questionType?.code === 'READING_SHORT_ANSWER';
  const defaultMinWords = isShortAnswer ? 5 : minWords;
  const defaultMaxWords = isShortAnswer ? 50 : maxWords;

  const getWordCountColor = () => {
    const minWordsToUse = defaultMinWords || minWords;
    const maxWordsToUse = defaultMaxWords || maxWords;
    
    if (minWordsToUse > 0 && wordCount < minWordsToUse) return 'error';
    if (maxWordsToUse > 0 && wordCount > maxWordsToUse) return 'warning';
    return 'success';
  };

  const getWordCountProgress = () => {
    const maxWordsToUse = defaultMaxWords > 0 ? defaultMaxWords : maxWords;
    if (maxWordsToUse > 0) {
      return Math.min((wordCount / maxWordsToUse) * 100, 100);
    }
    return 0;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {isShortAnswer ? 'Trả lời ngắn:' : 'Viết bài luận:'}
      </Typography>
      
      {/* Writing requirements */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: 'info.light' }}>
        <Typography variant="subtitle2" gutterBottom>
          Yêu cầu:
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {(defaultMinWords > 0 || minWords > 0) && (
            <Chip
              size="small"
              label={`Tối thiểu: ${defaultMinWords || minWords} từ`}
              color={wordCount >= (defaultMinWords || minWords) ? 'success' : 'error'}
              variant="outlined"
            />
          )}
          {(defaultMaxWords > 0 || maxWords > 0) && (
            <Chip
              size="small"
              label={`Tối đa: ${defaultMaxWords || maxWords} từ`}
              color={wordCount <= (defaultMaxWords || maxWords) ? 'success' : 'warning'}
              variant="outlined"
            />
          )}
          {timeLimit && (
            <Chip
              size="small"
              label={`Thời gian: ${timeLimit} phút`}
              variant="outlined"
            />
          )}
        </Box>
        
        {requirements.topic && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Chủ đề:</strong> {requirements.topic}
          </Typography>
        )}
      </Paper>

      {/* Word count indicator */}
      <Box sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color={getWordCountColor()}>
            Số từ: {wordCount}
            {(defaultMinWords > 0 || minWords > 0) && ` / ${defaultMinWords || minWords} tối thiểu`}
            {(defaultMaxWords > 0 || maxWords > 0) && ` / ${defaultMaxWords || maxWords} tối đa`}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {((text.length / 5000) * 100).toFixed(1)}% ký tự
          </Typography>
        </Box>
        
        {(defaultMaxWords > 0 || maxWords > 0) && (
          <LinearProgress
            variant="determinate"
            value={getWordCountProgress()}
            color={getWordCountColor()}
            sx={{ height: 6, borderRadius: 3 }}
          />
        )}
      </Box>

      {/* Text editor */}
      <TextField
        multiline
        fullWidth
        rows={isShortAnswer ? 4 : 10}
        value={text}
        onChange={handleTextChange}
        placeholder={isShortAnswer ? "Viết câu trả lời ngắn gọn ở đây..." : "Viết bài luận của bạn ở đây..."}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '1rem',
            lineHeight: 1.6,
            fontFamily: 'monospace'
          }
        }}
      />
      
      {/* Writing tips */}
      <Paper sx={{ p: 2, mt: 2, backgroundColor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          Gợi ý viết bài:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
          <li>Đọc kỹ đề bài và lên dàn ý trước khi viết</li>
          <li>Chia bài thành các đoạn rõ ràng với ý chính</li>
          <li>Sử dụng từ nối để tạo sự liên kết giữa các câu, đoạn</li>
          <li>Kiểm tra lại ngữ pháp và chính tả trước khi hoàn thành</li>
          <li>Đảm bảo đạt yêu cầu về số từ tối thiểu</li>
        </Typography>
      </Paper>
    </Box>
  );
}