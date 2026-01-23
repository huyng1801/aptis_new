'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  FormHelperText,
  Alert,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { usePublicData } from '@/hooks/usePublicData';

// Validation schema
const validationSchema = yup.object({
  title: yup.string().required('Tên bài thi là bắt buộc').min(3, 'Tên bài thi phải có ít nhất 3 ký tự'),
  description: yup.string(),
  aptis_type_id: yup.number().required('Loại APTIS là bắt buộc'),
});

const ExamForm = ({ examData, onSubmit, loading = false, isEditing = false }) => {
  const { aptisTypes, loading: publicDataLoading, error: publicDataError } = usePublicData();

  const formik = useFormik({
    initialValues: {
      title: examData?.title || '',
      description: examData?.description || '',
      aptis_type_id: examData?.aptis_type_id || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const submitData = {
          ...values,
          aptis_type_id: parseInt(values.aptis_type_id),
        };
        
        await onSubmit(submitData);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
  });

  const handleFieldChange = (fieldName, value) => {
    formik.setFieldValue(fieldName, value);
    
    // Auto-save functionality (optional)
    if (isEditing) {
      const updatedData = {
        ...formik.values,
        [fieldName]: value
      };
      // Could implement debounced auto-save here
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {isEditing ? 'Chỉnh sửa thông tin bài thi' : 'Thông tin cơ bản'}
        </Typography>
        
        {isEditing && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Thay đổi sẽ được lưu khi bạn nhấn nút "Lưu".
          </Alert>
        )}

        {publicDataError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Không thể tải dữ liệu cấu hình: {publicDataError}
          </Alert>
        )}

        {publicDataLoading && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 1 }}>Đang tải dữ liệu...</Typography>
          </Box>
        )}
        
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="title"
                label="Tên bài thi *"
                value={formik.values.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
                disabled={loading}
                placeholder="Nhập tên bài thi..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                name="description"
                label="Mô tả bài thi"
                value={formik.values.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
                disabled={loading}
                placeholder="Mô tả ngắn gọn về bài thi..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                error={formik.touched.aptis_type_id && Boolean(formik.errors.aptis_type_id)}
                disabled={loading || publicDataLoading}
              >
                <InputLabel>Loại APTIS *</InputLabel>
                <Select
                  name="aptis_type_id"
                  value={formik.values.aptis_type_id}
                  onChange={(e) => handleFieldChange('aptis_type_id', e.target.value)}
                  onBlur={formik.handleBlur}
                  label="Loại APTIS *"
                >
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
                {formik.touched.aptis_type_id && formik.errors.aptis_type_id && (
                  <FormHelperText>{formik.errors.aptis_type_id}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Duration field is hidden - auto-calculated from sections on backend */}

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !formik.isValid || (!formik.dirty && !isEditing)}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  size="large"
                >
                  {loading ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo bài thi')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExamForm;