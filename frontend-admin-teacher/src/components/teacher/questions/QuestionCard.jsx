'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  Delete
} from '@mui/icons-material';

export default function QuestionCard({ 
  question,
  onPreview,
  onDelete,
  showActions = true 
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePreview = () => {
    onPreview?.(question);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete?.(question.id);
    handleMenuClose();
  };

  const handleCardClick = () => {
    onPreview?.(question);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': {
          transform: onSelect ? 'translateY(-2px)' : 'none',
          boxShadow: onSelect ? 4 : 1
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ pb: showActions ? 1 : 2 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="div" noWrap title={question.title}>
            {question.title}
          </Typography>
          {showActions && (
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ mt: -0.5 }}
            >
              <MoreVert />
            </IconButton>
          )}
        </Box>

        {/* Question Type and Skill */}
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Chip 
            label={question.question_type?.toUpperCase() || 'N/A'} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
          <Chip 
            label={question.skill?.charAt(0).toUpperCase() + question.skill?.slice(1) || 'N/A'} 
            size="small" 
            color="secondary"
          />
          <Chip 
            label={question.difficulty || 'medium'} 
            size="small" 
            color={getDifficultyColor(question.difficulty)}
          />
        </Box>

        {/* Description */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 2
          }}
        >
          {question.description || question.content || 'Không có mô tả'}
        </Typography>

        {/* APTIS Type and Stats */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip 
            label={question.aptis_type || 'General'} 
            size="small" 
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            Sử dụng: {question.usage_count || 0} lần
          </Typography>
        </Box>

        {/* Last Updated */}
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Cập nhật: {question.updated_at ? 
            new Date(question.updated_at).toLocaleDateString('vi-VN') : 
            'N/A'
          }
        </Typography>
      </CardContent>

      {showActions && (
        <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
          <Box>
            <Tooltip title="Xem trước">
              <IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                handlePreview();
              }}>
                <Visibility />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="caption" color="primary">
            #{question.id}
          </Typography>
        </CardActions>
      )}

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handlePreview}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          Xem trước
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Xóa
        </MenuItem>
      </Menu>
    </Card>
  );
}