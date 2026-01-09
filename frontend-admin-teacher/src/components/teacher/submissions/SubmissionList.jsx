'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Visibility,
  Edit,
  Refresh,
  Psychology,
  Person,
  Warning,
  Schedule
} from '@mui/icons-material';

export default function SubmissionList({ 
  submissions = [],
  loading = false,
  onRefresh,
  onViewSubmission,
  onGradeSubmission
}) {
  // Bỏ selectedSubmissions và các state không cần thiết

  const getStatusChip = (submission) => {
    const { grading_status, needs_review, has_ai_feedback } = submission;
    
    switch (grading_status) {
      case 'ungraded':
        return <Chip label="Chưa chấm" color="default" size="small" />;
      case 'ai_graded':
        return (
          <Chip 
            label="AI đã chấm" 
            color="info" 
            size="small"
            icon={<Psychology />}
          />
        );
      case 'manually_graded':
        return (
          <Chip 
            label="Đã chấm" 
            color="success" 
            size="small"
            icon={<Person />}
          />
        );
      case 'auto_graded':
        return <Chip label="Tự động" color="secondary" size="small" />;
      default:
        return <Chip label="Không rõ" color="default" size="small" />;
    }
  };

  const getPriorityIcon = (submission) => {
    if (submission.needs_review) {
      return (
        <Tooltip title="Cần xem xét lại">
          <Warning color="warning" />
        </Tooltip>
      );
    }
    return null;
  };

  const getScoreDisplay = (submission) => {
    const { final_score, score, max_score } = submission;
    const displayScore = final_score || score || 0;
    const maxScore = max_score || 10;
    
    return (
      <Box>
        <Typography variant="body2" fontWeight="bold">
          {displayScore}/{maxScore}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={(displayScore / maxScore) * 100}
          sx={{ width: 50, height: 4, mt: 0.5 }}
        />
      </Box>
    );
  };

  return (
    <Paper>
      {/* Header with actions */}
      <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">
          Danh sách bài làm ({submissions.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={onRefresh}
          disabled={loading}
        >
          Làm mới
        </Button>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Học sinh</TableCell>
              <TableCell>Bài thi</TableCell>
              <TableCell>Kỹ năng</TableCell>
              <TableCell>Câu hỏi</TableCell>
              <TableCell>Điểm số</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ưu tiên</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={9} sx={{ p: 3 }}>
                  <LinearProgress />
                  <Typography align="center" sx={{ mt: 2 }}>
                    Đang tải...
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Không có bài làm nào
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && submissions.map((submission) => (
              <TableRow key={submission.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {submission.attempt?.student?.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {submission.attempt?.student?.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {submission.attempt?.exam?.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={submission.attempt?.selectedSkill?.skill_type_name || 'N/A'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {submission.question?.questionType?.question_type_name}
                    </Typography>
                    <Chip 
                      label={submission.question?.difficulty}
                      size="small"
                      color={
                        submission.question?.difficulty === 'easy' ? 'success' :
                        submission.question?.difficulty === 'medium' ? 'warning' : 'error'
                      }
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  {getScoreDisplay(submission)}
                </TableCell>
                <TableCell>
                  {getStatusChip(submission)}
                </TableCell>
                <TableCell>
                  {getPriorityIcon(submission)}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(submission.answered_at).toLocaleDateString('vi-VN')}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" gap={0.5}>
                    <IconButton 
                      size="small"
                      onClick={() => onViewSubmission(submission)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={() => onGradeSubmission(submission)}
                      disabled={!submission.can_regrade}
                    >
                      <Edit />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Đã bỏ dialog chấm lại bằng AI */}
    </Paper>
  );
}