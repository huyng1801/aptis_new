'use client';

import { useState, useEffect } from 'react';
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
  InputAdornment,
  Chip
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
  const [skillTypes, setSkillTypes] = useState([]);

  // Load skill types from public API
  useEffect(() => {
    const fetchSkillTypes = async () => {
      try {
        const response = await fetch('/api/public/skill-types');
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        const data = await response.json();
        
        console.log('[DEBUG] Skill types API response:', data);
        
        // Filter to only show WRITING and SPEAKING
        const filteredSkills = data.data?.filter(skill => 
          skill.code === 'WRITING' || skill.code === 'SPEAKING'
        ) || [];
        
        console.log('[DEBUG] Filtered skills:', filteredSkills);
        setSkillTypes(filteredSkills);
      } catch (error) {
        console.error('Error loading skill types:', error);
        // Fallback to hardcoded values
        const fallbackSkills = [
          { code: 'WRITING', name: 'Writing', skill_type_name: 'Writing' },
          { code: 'SPEAKING', name: 'Speaking', skill_type_name: 'Speaking' }
        ];
        console.log('[DEBUG] Using fallback skills:', fallbackSkills);
        setSkillTypes(fallbackSkills);
      }
    };

    fetchSkillTypes();
  }, []);

  const handleFilterChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.skill_type) count++;
    if (filters.grading_status) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box mb={2}>

        <Grid container spacing={2} alignItems="center">
          {/* Kỹ năng - load từ API */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Kỹ năng</InputLabel>
              <Select
                value={filters.skill_type || ''}
                label="Kỹ năng"
                onChange={(e) => handleFilterChange('skill_type', e.target.value)}
                sx={{ py: 0.5 }}
              >
                <MenuItem value="">Tất cả kỹ năng</MenuItem>
                {skillTypes.map((skill) => (
                  <MenuItem key={skill.code} value={skill.code}>
                    {skill.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Trạng thái chấm điểm - chỉ giữ những trạng thái chính */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái chấm</InputLabel>
              <Select
                value={filters.grading_status || ''}
                label="Trạng thái chấm"
                onChange={(e) => handleFilterChange('grading_status', e.target.value)}
                sx={{ py: 0.5 }}
              >
                <MenuItem value="">Tất cả trạng thái</MenuItem>
                <MenuItem value="ungraded">Chưa chấm</MenuItem>
                <MenuItem value="ai_graded">AI đã chấm (cần kiểm tra)</MenuItem>
                <MenuItem value="manually_graded">Giáo viên đã chấm</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Clear Filters Button */}
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                startIcon={<Clear />}
                onClick={onClearFilters}
                disabled={activeFiltersCount === 0}
                variant="outlined"
                color={activeFiltersCount > 0 ? 'error' : 'inherit'}
              >
                Xóa bộ lọc
              </Button>
              {activeFiltersCount > 0 && (
                <Chip 
                  label={`${activeFiltersCount} bộ lọc đang áp dụng`}
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}