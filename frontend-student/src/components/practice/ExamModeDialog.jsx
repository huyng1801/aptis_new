'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  InputLabel,
  Box,
  Divider,
} from '@mui/material';

export default function ExamModeDialog({ 
  open, 
  onClose, 
  onStartExam, 
  exam,
  availableSkills = [] 
}) {
  const [attemptType, setAttemptType] = useState('full_exam');
  const [selectedSkill, setSelectedSkill] = useState('');

  useEffect(() => {
    if (open) {
      setAttemptType('full_exam');
      setSelectedSkill('');
    }
  }, [open, availableSkills]);

  const handleStart = () => {
    if (attemptType === 'single_skill' && !selectedSkill) {
      return; // Don't start if skill not selected
    }
    onStartExam({
      attemptType,
      selectedSkill: attemptType === 'single_skill' ? selectedSkill : null
    });
  };

  const canStart = attemptType === 'full_exam' || (attemptType === 'single_skill' && selectedSkill);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Bạn muốn làm gì?</Typography>
        <Typography variant="body2" color="textSecondary">
          {exam?.title}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Skills available: {availableSkills?.length || 0}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={attemptType}
            onChange={(e) => setAttemptType(e.target.value)}
          >
            <FormControlLabel
              value="full_exam"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    Làm cả bài thi
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Làm tất cả kỹ năng/sections của bài thi
                  </Typography>
                  <Typography variant="body2" color="primary">
                    Thời gian: {exam?.duration_minutes || 90} phút
                  </Typography>
                </Box>
              }
              sx={{ 
                alignItems: 'flex-start', 
                py: 1,
                border: '1px solid',
                borderColor: attemptType === 'full_exam' ? 'primary.main' : 'divider',
                borderRadius: 2,
                m: '8px 0',
                p: 2,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            />
            
            <FormControlLabel
              value="single_skill"
              control={<Radio />}
              label={
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body1" fontWeight="bold">
                    Luyện tập 1 kỹ năng
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Chọn một kỹ năng cụ thể để luyện tập
                  </Typography>
                  
                  {attemptType === 'single_skill' && (
                    <Box sx={{ mt: 2 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Chọn kỹ năng</InputLabel>
                        <Select
                          value={selectedSkill}
                          onChange={(e) => setSelectedSkill(e.target.value)}
                          label="Chọn kỹ năng"
                        >
                          {availableSkills.map((skill) => (
                            <MenuItem key={skill.id} value={skill.id}>
                              <Box>
                                <Typography variant="body2">
                                  {skill.skill_type_name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {skill.description}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </Box>
              }
              sx={{ 
                alignItems: 'flex-start', 
                py: 1,
                border: '1px solid',
                borderColor: attemptType === 'single_skill' ? 'primary.main' : 'divider',
                borderRadius: 2,
                m: '8px 0',
                p: 2,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ backgroundColor: 'warning.light', p: 2, borderRadius: 1 }}>
          <Typography variant="body2" color="warning.dark">
            <strong>Lưu ý:</strong> Sau khi bắt đầu, bạn không thể thay đổi chế độ thi. 
            Hãy chọn cẩn thận trước khi nhấn "Bắt đầu".
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Hủy
        </Button>
        <Button 
          onClick={handleStart} 
          variant="contained" 
          disabled={!canStart}
          size="large"
        >
          Bắt đầu
        </Button>
      </DialogActions>
    </Dialog>
  );
}