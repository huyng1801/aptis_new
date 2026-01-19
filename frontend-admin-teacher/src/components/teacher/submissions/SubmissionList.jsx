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
  const getSubmissionStats = () => {
    const ungradedCount = submissions.filter(s => 
      s.grading_status === 'ungraded' || s.needs_review
    ).length;
    
    const aiGradedCount = submissions.filter(s => 
      s.grading_status === 'ai_graded'
    ).length;
    
    return { ungradedCount, aiGradedCount };
  };

  const { ungradedCount, aiGradedCount } = getSubmissionStats();

  const getStatusChip = (submission) => {
    const { grading_status, needs_review, has_ai_feedback } = submission;
    
    switch (grading_status) {
      case 'ungraded':
        return (
          <Chip 
            label="Chưa chấm" 
            color="error" 
            size="small" 
            variant={submission.needs_review ? 'filled' : 'outlined'}
          />
        );
      case 'ai_graded':
        return (
          <Chip 
            label="AI đã chấm" 
            color="warning" 
            size="small"
            icon={<Psychology />}
            variant="filled"
          />
        );
      case 'manually_graded':
        return (
          <Chip 
            label="Đã chấm" 
            color="success" 
            size="small"
            icon={<Person />}
            variant="filled"
          />
        );
      case 'needs_review':
        return (
          <Chip 
            label="Cần xem xét" 
            color="error" 
            size="small"
            icon={<Warning />}
            variant="filled"
          />
        );
      default:
        return <Chip label="Không rõ" color="default" size="small" />;
    }
  };

  const getSkillTypeChip = (skillType) => {
    const skillConfig = {
      'WRITING': { label: 'Writing', color: 'primary', icon: '✍️' },
      'SPEAKING': { label: 'Speaking', color: 'secondary', icon: '🗣️' },
      'LISTENING': { label: 'Listening', color: 'info', icon: '👂' },
      'READING': { label: 'Reading', color: 'warning', icon: '📖' }
    };
    
    const config = skillConfig[skillType] || { label: skillType, color: 'default', icon: '' };
    
    return (
      <Chip 
        label={`${config.icon} ${config.label}`}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const getPriorityIcon = (submission) => {
    // Ưu tiên cao: chưa chấm và cần xem xét
    if (submission.grading_status === 'ungraded' || submission.needs_review) {
      return (
        <Tooltip title="Ưu tiên cao - cần chấm ngay">
          <Warning color="error" />
        </Tooltip>
      );
    }
    
    // Ưu tiên trung bình: AI đã chấm nhưng cần kiểm tra
    if (submission.grading_status === 'ai_graded') {
      return (
        <Tooltip title="Cần kiểm tra lại điểm AI">
          <Schedule color="warning" />
        </Tooltip>
      );
    }
    
    return null;
  };

  const getScoreDisplay = (submission) => {
    const { final_score, score, max_score, grading_status } = submission;
    const displayScore = Number(final_score || score || 0);
    const maxScore = Number(max_score || 10);
    
    if (grading_status === 'ungraded') {
      return (
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Chưa có điểm
          </Typography>
        </Box>
      );
    }
    
    const percentage = (displayScore / maxScore) * 100;
    const scoreColor = percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : 'error';
    
    return (
      <Box textAlign="center">
        <Typography variant="body2" fontWeight="bold" color={`${scoreColor}.main`}>
          {displayScore.toFixed(1)}/{maxScore}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={percentage}
          color={scoreColor}
          sx={{ width: 60, height: 4, mt: 0.5, mx: 'auto' }}
        />
        <Typography variant="caption" color="text.secondary">
          {percentage.toFixed(0)}%
        </Typography>
      </Box>
    );
  };

  return (
    <Paper>
      {/* Header with actions */}
      <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h6">
            Danh sách bài làm ({submissions.length})
          </Typography>
          <Box display="flex" gap={1} mt={1}>
            {ungradedCount > 0 && (
              <Chip 
                label={`${ungradedCount} cần chấm ngay`} 
                color="error" 
                size="small"
                icon={<Warning />}
              />
            )}
            {aiGradedCount > 0 && (
              <Chip 
                label={`${aiGradedCount} cần kiểm tra AI`} 
                color="warning" 
                size="small"
                icon={<Psychology />}
              />
            )}
          </Box>
        </Box>
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
                  {getSkillTypeChip(submission.attempt?.selectedSkill?.skill_type_name)}
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {submission.question?.questionType?.question_type_name || 'N/A'}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <Chip 
                        label={submission.question?.difficulty || 'N/A'}
                        size="small"
                        color={
                          submission.question?.difficulty === 'easy' ? 'success' :
                          submission.question?.difficulty === 'medium' ? 'warning' : 'error'
                        }
                        variant="outlined"
                      />
                      {submission.answer_type === 'audio' && (
                        <Typography variant="caption" color="text.secondary">
                          🎤 Âm thanh
                        </Typography>
                      )}
                      {submission.answer_type === 'text' && (
                        <Typography variant="caption" color="text.secondary">
                          ✍️ Văn bản
                        </Typography>
                      )}
                    </Box>
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
                  <Box display="flex" gap={0.5} justifyContent="center">
       
                    <Tooltip title="Chấm điểm">
                      <IconButton 
                        size="small"
                        onClick={() => onGradeSubmission(submission)}
                        color="secondary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
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