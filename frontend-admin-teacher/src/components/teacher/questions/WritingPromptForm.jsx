'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  FormControlLabel,
  Switch,
  Link
} from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';

export default function WritingPromptForm({ content = {}, onChange }) {
  const [prompt, setPrompt] = useState(content.prompt || '');
  const [minWords, setMinWords] = useState(content.min_words || 150);
  const [maxWords, setMaxWords] = useState(content.max_words || 300);
  const [guidelines, setGuidelines] = useState(content.guidelines || '');
  const [criteriaId, setCriteriaId] = useState(content.criteria_id || '');
  const [hasTimeLimit, setHasTimeLimit] = useState(!!content.time_limit);
  const [timeLimit, setTimeLimit] = useState(content.time_limit || 30);

  useEffect(() => {
    onChange({
      prompt,
      min_words: parseInt(minWords) || 0,
      max_words: parseInt(maxWords) || 0,
      guidelines,
      criteria_id: criteriaId,
      time_limit: hasTimeLimit ? parseInt(timeLimit) || 0 : null
    });
  }, [prompt, minWords, maxWords, guidelines, criteriaId, hasTimeLimit, timeLimit]); // Remove onChange from dependencies

  return (
    <Box>
      <TextField
        fullWidth
        label="Yêu cầu bài viết (Prompt)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        multiline
        rows={4}
        sx={{ mb: 3 }}
        placeholder="Viết một bài luận về..."
        required
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Số từ tối thiểu"
            type="number"
            value={minWords}
            onChange={(e) => setMinWords(e.target.value)}
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Số từ tối đa"
            type="number"
            value={maxWords}
            onChange={(e) => setMaxWords(e.target.value)}
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Switch
                checked={hasTimeLimit}
                onChange={(e) => setHasTimeLimit(e.target.checked)}
              />
            }
            label="Giới hạn thời gian"
          />
          {hasTimeLimit && (
            <TextField
              fullWidth
              label="Thời gian (phút)"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              inputProps={{ min: 1 }}
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Grid>
      </Grid>

      <TextField
        fullWidth
        label="Gợi ý và hướng dẫn"
        value={guidelines}
        onChange={(e) => setGuidelines(e.target.value)}
        multiline
        rows={3}
        sx={{ mb: 3 }}
        placeholder="Các gợi ý để học viên viết bài tốt hơn..."
      />

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Tiêu chí chấm điểm
        </Typography>
        <TextField
          fullWidth
          label="ID Tiêu chí (tùy chọn)"
          value={criteriaId}
          onChange={(e) => setCriteriaId(e.target.value)}
          placeholder="Nhập ID tiêu chí hoặc để trống để sử dụng mặc định"
          size="small"
          helperText={
            <Link href="/teacher/criteria" target="_blank" display="flex" alignItems="center" gap={0.5}>
              <LinkIcon fontSize="small" />
              Quản lý tiêu chí chấm điểm
            </Link>
          }
        />
      </Box>
    </Box>
  );
}