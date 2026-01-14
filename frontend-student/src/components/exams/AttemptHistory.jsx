'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  PlayArrow,
  CheckCircle,
  Schedule,
  Cancel,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'warning';
    case 'abandoned': return 'error';
    default: return 'default';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'completed': return 'Hoàn thành';
    case 'in_progress': return 'Đang làm';
    case 'abandoned': return 'Đã hủy';
    default: return status;
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed': return <CheckCircle fontSize="small" />;
    case 'in_progress': return <Schedule fontSize="small" />;
    case 'abandoned': return <Cancel fontSize="small" />;
    default: return null;
  }
};

const formatAttemptDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return '-';
  }
};

export default function AttemptHistory({ attempts, examId }) {
  const router = useRouter();

  const handleViewResult = (attemptId) => {
    router.push(`/results/${attemptId}`);
  };

  const handleContinue = (attemptId) => {
    router.push(`/exams/${examId}/take?attemptId=${attemptId}`);
  };

  // Lọc chỉ hiển thị những bài thi đã nộp (submitted)
  const submittedAttempts = attempts.filter(attempt => attempt.status === 'submitted');

  if (!submittedAttempts || submittedAttempts.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="textSecondary">
          Bạn chưa nộp bài thi nào.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Lịch sử làm bài ({submittedAttempts.length} lần)
      </Typography>
      
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Lần thứ</TableCell>
              <TableCell>Ngày làm</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell>Điểm</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submittedAttempts.map((attempt, index) => (
              <TableRow key={attempt.id}>
                <TableCell>{submittedAttempts.length - index}</TableCell>
                <TableCell>
                  {formatAttemptDate(attempt.start_time)}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={attempt.attempt_type === 'full_exam' ? 'Toàn bộ' : 'Một kỹ năng'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {attempt.time_spent ? `${Math.round(attempt.time_spent / 60)} phút` : '-'}
                </TableCell>
                <TableCell>
                  {attempt.total_score !== null ? (
                    <Typography variant="body2" fontWeight="medium">
                      {attempt.total_score}/{attempt.exam?.max_total_score || 100}
                    </Typography>
                  ) : ('-')}
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" justifyContent="center" gap={1}>
                    <Tooltip title="Xem kết quả">
                      <IconButton 
                        size="small"
                        onClick={() => handleViewResult(attempt.id)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}