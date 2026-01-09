'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Paper,
  IconButton,
  Grid,
  Alert
} from '@mui/material';
import { 
  Close, 
  School, 
  Assignment, 
  Star, 
  Edit,
  Info,
  TrendingUp,
  Rule
} from '@mui/icons-material';
import useCriteriaFilters from '@/hooks/useCriteriaFilters';

export default function CriteriaPreview({ open, onClose, criteria, onEdit }) {
  const {
    getAptisTypeLabel,
    getQuestionTypeLabel, 
    getSkillByQuestionType
  } = useCriteriaFilters();
  
  if (!criteria) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: 'auto' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Assignment color="primary" />
            <Typography variant="h6">
              Chi tiết tiêu chí chấm điểm
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Basic Information */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              {criteria.criteria_name}
            </Typography>
            
            {criteria.description && (
              <Typography variant="body2" color="text.secondary" paragraph>
                {criteria.description}
              </Typography>
            )}
            
            {/* Classification Tags */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Phân loại:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              <Chip 
                icon={<School />} 
                label={getAptisTypeLabel(criteria.aptis_type_id)} 
                color="primary" 
                variant="outlined" 
                size="small"
              />
              <Chip 
                label={getSkillByQuestionType(criteria.question_type_id)} 
                color="secondary" 
                variant="outlined"
                size="small"
              />
              <Chip 
                label={getQuestionTypeLabel(criteria.question_type_id)} 
                color="info" 
                variant="outlined"
                size="small"
              />
            </Box>

            {/* Scoring Parameters */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Thông số chấm điểm:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              <Chip 
                icon={<Star />} 
                label={`Điểm tối đa: ${criteria.max_score}`} 
                color="warning" 
                variant="filled"
                size="small"
              />
              <Chip 
                icon={<TrendingUp />} 
                label={`Trọng số: ${criteria.weight}`} 
                color="success" 
                variant="filled"
                size="small"
              />
            </Box>

            {/* Creation Date */}
            <Typography variant="caption" color="text.secondary">
              <strong>Ngày tạo:</strong> {new Date(criteria.created_at).toLocaleDateString('vi-VN')}
            </Typography>
          </CardContent>
        </Card>

        {/* Rubric Prompt */}
        {criteria.rubric_prompt && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rule sx={{ fontSize: 20 }} />
                Hướng dẫn AI
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }} icon={<Info sx={{ fontSize: 16 }} />}>
                <Typography variant="body2">
                  Prompt được sử dụng để hướng dẫn AI đánh giá
                </Typography>
              </Alert>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {criteria.rubric_prompt}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          size="small"
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}