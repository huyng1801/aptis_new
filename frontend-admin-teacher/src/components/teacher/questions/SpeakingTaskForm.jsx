'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  Link
} from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';

export default function SpeakingTaskForm({ content = {}, onChange }) {
  const [task, setTask] = useState(content.task || '');
  const [instructions, setInstructions] = useState(content.instructions || '');
  const [recordingTime, setRecordingTime] = useState(content.recording_time || 60);
  const [preparationTime, setPreparationTime] = useState(content.preparation_time || 30);
  const [criteriaId, setCriteriaId] = useState(content.criteria_id || '');

  useEffect(() => {
    onChange({
      task,
      instructions,
      recording_time: parseInt(recordingTime) || 0,
      preparation_time: parseInt(preparationTime) || 0,
      criteria_id: criteriaId
    });
  }, [task, instructions, recordingTime, preparationTime, criteriaId]); // Remove onChange from dependencies

  return (
    <Box>
      <TextField
        fullWidth
        label="Yêu cầu bài nói (Task)"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        multiline
        rows={4}
        sx={{ mb: 3 }}
        placeholder="Nhập yêu cầu cho bài nói..."
        required
      />

      <TextField
        fullWidth
        label="Hướng dẫn thực hiện"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        multiline
        rows={3}
        sx={{ mb: 3 }}
        placeholder="Hướng dẫn cụ thể cho học viên..."
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Thời gian chuẩn bị (giây)"
            type="number"
            value={preparationTime}
            onChange={(e) => setPreparationTime(e.target.value)}
            inputProps={{ min: 0 }}
            helperText="Thời gian học viên được chuẩn bị trước khi ghi âm"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Thời gian ghi âm (giây)"
            type="number"
            value={recordingTime}
            onChange={(e) => setRecordingTime(e.target.value)}
            inputProps={{ min: 1 }}
            helperText="Thời gian tối đa cho việc ghi âm"
            required
          />
        </Grid>
      </Grid>

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