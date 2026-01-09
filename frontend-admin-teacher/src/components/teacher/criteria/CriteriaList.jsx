'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Grid,
  Tooltip
} from '@mui/material';
import {
  Search,
  Visibility,
  Clear
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { fetchCriteria } from '@/store/slices/criteriaSlice';
import DataTable from '@/components/shared/DataTable';
import CriteriaPreview from './CriteriaPreview';

export default function CriteriaList() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { criteria, loading, pagination } = useSelector(state => state.criteria);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCriteria, setSelectedCriteria] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Track if component is mounted (for hydration safety)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      handleFetchCriteria(1);
    }
  }, [isMounted]);

  const handleFetchCriteria = (page = 1) => {
    const params = {
      page,
      limit: 50 // Get more items for frontend filtering
    };

    dispatch(fetchCriteria(params));
  };

  // Frontend search filtering
  const filteredCriteria = criteria.filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      item.criteria_name?.toLowerCase().includes(searchLower) ||
      item.rubric_prompt?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.questionType?.question_type_name?.toLowerCase().includes(searchLower) ||
      item.aptisType?.aptis_type_name?.toLowerCase().includes(searchLower)
    );
  });

  const handlePreview = (criteria) => {
    setSelectedCriteria(criteria);
    setPreviewOpen(true);
  };

  if (!isMounted) {
    return null;
  }

  const columns = [
    {
      id: 'criteria_name',
      label: 'Tên tiêu chí',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {row.criteria_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.description ? `${row.description.substring(0, 60)}...` : 'Không có mô tả'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'details',
      label: 'Chi tiết',
      render: (row) => (
        <Box>
          <Box display="flex" gap={0.5} mb={0.5}>
            <Chip
              label={row.questionType?.question_type_name || 'N/A'} 
              size="small" 
              variant="outlined"
              color="primary"
            />
            <Chip 
              label={row.aptisType?.aptis_type_name || 'N/A'} 
              size="small"
              variant="outlined"
              color="secondary"
            />
          </Box>
        </Box>
      )
    },
    {
      id: 'scoring',
      label: 'Chấm điểm',
      align: 'center',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            Max: {row.max_score || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Trọng số: {row.weight || 1}
          </Typography>
        </Box>
      )
    },
    {
      id: 'rubric_info',
      label: 'Rubric',
      render: (row) => (
        <Box>
          <Typography variant="caption" color="text.secondary">
            {row.rubric_prompt ? `${row.rubric_prompt.substring(0, 40)}...` : 'Chưa có rubric'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'created_info',
      label: 'Thông tin tạo',
      render: (row) => (
        <Box>
          <Typography variant="caption" color="text.secondary">
            {new Date(row.created_at).toLocaleDateString('vi-VN')}
          </Typography>
        </Box>
      )
    },
    {
      id: 'actions',
      label: 'Thao tác',
      align: 'center',
      render: (row) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Xem chi tiết">
            <IconButton
              size="small"
              onClick={() => handlePreview(row)}
              color="info"
            >
              <Visibility />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box>
      {/* Simple search bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm tiêu chí chấm điểm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            {searchTerm && (
              <Grid item>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSearchTerm('')}
                  startIcon={<Clear />}
                  color="error"
                >
                  Xóa tìm kiếm
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <DataTable
        data={filteredCriteria}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          total: filteredCriteria.length
        }}
        onPageChange={handleFetchCriteria}
      />

      {previewOpen && selectedCriteria && (
        <CriteriaPreview
          criteria={selectedCriteria}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </Box>
  );
}

