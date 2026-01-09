'use client';

import { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  InputAdornment
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList
} from '@mui/icons-material';

export default function SubmissionFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  availableExams = []
}) {
  const handleFilterChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.skill_type) count++;
    if (filters.exam_id) count++;
    if (filters.grading_status) count++;
    if (filters.has_ai_feedback) count++;
    if (filters.answer_type) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box mb={2}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterList />
          Bộ lọc tìm kiếm
          {activeFiltersCount > 0 && (
            <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
              ({activeFiltersCount} bộ lọc)
            </Typography>
          )}
        </Typography>

        <Grid container spacing={2}>
          {/* Kỹ năng - chỉ giữ Writing/Speaking */}
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Kỹ năng</InputLabel>
              <Select
                value={filters.skill_type || ''}
                label="Kỹ năng"
                onChange={(e) => handleFilterChange('skill_type', e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="WRITING">Writing</MenuItem>
                <MenuItem value="SPEAKING">Speaking</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Loại đáp án */}
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Loại đáp án</InputLabel>
              <Select
                value={filters.answer_type || ''}
                label="Loại đáp án"
                onChange={(e) => handleFilterChange('answer_type', e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="text">Văn bản</MenuItem>
                <MenuItem value="audio">Âm thanh</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Trạng thái chấm điểm */}
          <Grid item xs={6} sm={4} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={filters.grading_status || ''}
                label="Trạng thái"
                onChange={(e) => handleFilterChange('grading_status', e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="ungraded">Chưa chấm</MenuItem>
                <MenuItem value="ai_graded">AI đã chấm</MenuItem>
                <MenuItem value="manually_graded">GV đã chấm</MenuItem>
                <MenuItem value="needs_review">Cần xem xét</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* AI Feedback */}
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>AI Feedback</InputLabel>
              <Select
                value={filters.has_ai_feedback || ''}
                label="AI Feedback"
                onChange={(e) => handleFilterChange('has_ai_feedback', e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="true">Có</MenuItem>
                <MenuItem value="false">Không</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Bài kiểm tra */}
          <Grid item xs={8} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Bài kiểm tra</InputLabel>
              <Select
                value={filters.exam_id || ''}
                label="Bài kiểm tra"
                onChange={(e) => handleFilterChange('exam_id', e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {availableExams.map((exam) => (
                  <MenuItem key={exam.id} value={exam.id}>
                    {exam.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Clear Filters Button */}
          <Grid item xs={4} sm={2} md={1}>
            <Button
              fullWidth
              size="small"
              startIcon={<Clear />}
              onClick={onClearFilters}
              disabled={activeFiltersCount === 0}
              variant="outlined"
              color="secondary"
            >
              Xóa
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}