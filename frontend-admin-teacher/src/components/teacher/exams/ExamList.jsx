'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Publish,
  UnpublishedOutlined
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { fetchExams, deleteExam, publishExam, unpublishExam } from '@/store/slices/examSlice';
import { showNotification } from '@/store/slices/uiSlice';
import { usePublicData } from '@/hooks/usePublicData';
import DataTable from '@/components/shared/DataTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import DeleteExamDialog from './DeleteExamDialog';

export default function ExamList({
  showActions = true,
  showFilters = true,
  onExamSelect
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { exams, isLoading: loading, pagination } = useSelector(state => state.exams);
  const { aptisTypes, skillTypes, loading: publicDataLoading, error: publicDataError } = usePublicData();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    console.log('[ExamList] APTIS Types received:', aptisTypes);
    console.log('[ExamList] Skill Types received:', skillTypes);
    console.log('[ExamList] Public data loading:', publicDataLoading);
    console.log('[ExamList] Public data error:', publicDataError);
  }, [aptisTypes, skillTypes, publicDataLoading, publicDataError]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    aptis_type: '',
    skill: '',
    status: ''
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [publishingExam, setPublishingExam] = useState(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      handleFetchExams();
    }
  }, [isClient, searchTerm, filters]);

  useEffect(() => {
    console.log('[ExamList] Filter changed:', {
      aptis_type: filters.aptis_type,
      skill: filters.skill,
      status: filters.status
    });
  }, [filters]);

  const handleFetchExams = (page = 1) => {
    // Build filter params - convert to proper types and remove empty values
    const filterParams = {};
    
    if (filters.aptis_type) {
      filterParams.aptis_type = String(filters.aptis_type);
    }
    if (filters.skill) {
      filterParams.skill = String(filters.skill);
    }
    if (filters.status) {
      filterParams.status = String(filters.status);
    }
    
    console.log('[ExamList] handleFetchExams - page:', page, 'filters:', filterParams, 'search:', searchTerm);
    
    dispatch(fetchExams({
      page,
      limit: 10,
      filters: {
        ...filterParams,
        search: searchTerm
      }
    }));
  };

  const handleEdit = (examId) => {
    if (onExamSelect) {
      onExamSelect(examId);
    } else {
      router.push(`/teacher/exams/${examId}`);
    }
  };

  const handlePublish = async (exam) => {
    setPublishingExam(exam);
    try {
      let result;
      if (exam.is_published) {
        result = await dispatch(unpublishExam(exam.id));
        if (unpublishExam.fulfilled.match(result)) {
          dispatch(showNotification({
            message: 'Hủy công khai bài thi thành công',
            type: 'success'
          }));
        }
      } else {
        result = await dispatch(publishExam(exam.id));
        if (publishExam.fulfilled.match(result)) {
          dispatch(showNotification({
            message: 'Công khai bài thi thành công',
            type: 'success'
          }));
        }
      }
      handleFetchExams();
    } catch (error) {
      dispatch(showNotification({
        message: 'Có lỗi xảy ra khi thay đổi trạng thái bài thi',
        type: 'error'
      }));
    } finally {
      setPublishingExam(null);
    }
  };

  const handleDelete = (exam) => {
    setConfirmDelete(exam);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({
      aptis_type: '',
      skill: '',
      status: ''
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.aptis_type) count++;
    if (filters.skill) count++;
    if (filters.status) count++;
    return count;
  };

  const confirmDeleteExam = async () => {
    if (confirmDelete) {
      try {
        const result = await dispatch(deleteExam(confirmDelete.id));
        if (deleteExam.fulfilled.match(result)) {
          dispatch(showNotification({
            message: 'Xóa bài thi thành công',
            type: 'success'
          }));
          handleFetchExams();
        }
      } catch (error) {
        dispatch(showNotification({
          message: 'Có lỗi xảy ra khi xóa bài thi',
          type: 'error'
        }));
      } finally {
        setConfirmDelete(null);
      }
    }
  };

  const columns = [
    {
      id: 'title',
      label: 'Tên bài thi',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {row.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.description || 'Không có mô tả'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'aptis_type',
      label: 'Loại APTIS',
      render: (row) => (
        <Chip 
          label={row.aptis_type || 'Unknown'} 
          size="small" 
          variant="outlined"
          color="primary"
        />
      )
    },
    {
      id: 'total_sections',
      label: 'Số phần',
      align: 'center'
    },
    {
      id: 'is_published',
      label: 'Trạng thái',
      render: (row) => (
        <Chip 
          label={row.is_published ? 'Đã công khai' : 'Bản nháp'} 
          size="small"
          color={row.is_published ? 'success' : 'default'}
          variant={row.is_published ? 'filled' : 'outlined'}
          sx={row.is_published
            ? { '& .MuiChip-label': { color: '#fff' } }
            : { '& .MuiChip-label': { color: '#333' }, borderColor: '#bdbdbd' }
          }
        />
      )
    },
    {
      id: 'actions',
      label: 'Hành động',
      align: 'center',
      render: (row) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleEdit(row.id)}
            color="primary"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handlePublish(row)}
            color={row.is_published ? "warning" : "success"}
            disabled={publishingExam?.id === row.id}
          >
            {row.is_published ? <UnpublishedOutlined /> : <Publish />}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(row)}
            color="error"
            disabled={row.is_published || row.attempt_count > 0}
            title={row.attempt_count > 0 ? `${row.attempt_count} học sinh đã làm bài thi này` : row.is_published ? 'Không thể xóa bài thi đã công khai' : ''}
          >
            <Delete />
          </IconButton>
        </Box>
      )
    }
  ];

  // Don't render until client-side to prevent hydration mismatch
  if (!isClient) {
    return (
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '300px' 
      }}>
        <Typography variant="h6" color="text.secondary">
          Đang tải danh sách bài thi...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filter */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <TextField
                placeholder="Tìm kiếm bài thi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Loại APTIS</InputLabel>
                <Select
                  value={filters.aptis_type}
                  label="Loại APTIS"
                  onChange={(e) => setFilters(prev => ({ ...prev, aptis_type: e.target.value }))}
                  disabled={publicDataLoading}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {aptisTypes && aptisTypes.length > 0 ? (
                    aptisTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.aptis_type_name || type.name || 'Unknown'}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      {publicDataLoading ? 'Đang tải...' : 'Không có dữ liệu'}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Kỹ năng</InputLabel>
                <Select
                  value={filters.skill}
                  label="Kỹ năng"
                  onChange={(e) => setFilters(prev => ({ ...prev, skill: e.target.value }))}
                  disabled={publicDataLoading}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {skillTypes && skillTypes.length > 0 ? (
                    skillTypes.map((skill) => (
                      <MenuItem key={skill.id} value={skill.id}>
                        {skill.skill_type_name || skill.name || 'Unknown'}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      {publicDataLoading ? 'Đang tải...' : 'Không có dữ liệu'}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filters.status}
                  label="Trạng thái"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="published">Đã công khai</MenuItem>
                  <MenuItem value="draft">Bản nháp</MenuItem>
                </Select>
              </FormControl>

              {getActiveFiltersCount() > 0 && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleClearFilters}
                    sx={{ color: 'error.main', borderColor: 'error.main', minWidth: 0, px: 2 }}
                  >
                    Xóa bộ lọc
                  </Button>
                  <Chip
                    label={`${getActiveFiltersCount()} bộ lọc đang áp dụng`}
                    size="small"
                    variant="outlined"
                    sx={{ color: 'error.main', borderColor: 'error.main', fontWeight: 400 }}
                  />
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={exams || []}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={handleFetchExams}
        emptyMessage="Không tìm thấy bài thi nào"
      />

      {isClient && (
        <DeleteExamDialog
          open={!!confirmDelete}
          exam={confirmDelete}
          onConfirm={confirmDeleteExam}
          onClose={() => setConfirmDelete(null)}
          loading={false}
        />
      )}
    </Box>
  );
}
