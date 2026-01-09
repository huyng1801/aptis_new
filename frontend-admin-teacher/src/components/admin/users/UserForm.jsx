'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  IconButton,
  Alert
} from '@mui/material';
import { Close, PersonAdd, Edit } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { createUser, updateUser } from '@/store/slices/userSlice';

const validationSchema = yup.object({
  full_name: yup
    .string()
    .required('Tên đầy đủ không được để trống')
    .min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: yup
    .string()
    .email('Email không hợp lệ')
    .required('Email không được để trống'),
  password: yup
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: yup
    .string()
    .required('Vai trò không được để trống'),
  phone: yup
    .string()
    .matches(/^[0-9+\-\s()]*$/, 'Số điện thoại không hợp lệ'),
});

const roles = [
  { value: 'admin', label: 'Quản trị viên', color: 'error' },
  { value: 'teacher', label: 'Giáo viên', color: 'warning' },
  { value: 'student', label: 'Học viên', color: 'primary' }
];

export default function UserForm({ 
  open, 
  onClose, 
  user = null
}) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(state => state.users);
  const isEdit = !!user;
  const [submitError, setSubmitError] = useState(null);

  const formik = useFormik({
    initialValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      password: '',
      confirmPassword: '',
      role: user?.role || '',
      phone: user?.phone || '',
      status: user?.status || 'active',
      isEdit
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSubmitError(null);
      
      // Validate password requirement for new users
      if (!isEdit && !values.password) {
        setSubmitError('Mật khẩu không được để trống khi tạo người dùng mới');
        return;
      }
      
      try {
        const submitData = { ...values };
        delete submitData.confirmPassword;
        delete submitData.isEdit;
        
        // Don't send empty password for edit mode
        if (isEdit && !values.password) {
          delete submitData.password;
        }
        
        console.log('[UserForm] Submitting data:', { isEdit, user: user?.id, submitData });
        
        if (isEdit) {
          console.log('[UserForm] Calling updateUser with:', { id: user.id, userData: submitData });
          await dispatch(updateUser({ 
            id: user.id, 
            userData: submitData 
          })).unwrap();
          console.log('[UserForm] Update successful');
        } else {
          console.log('[UserForm] Calling createUser with:', submitData);
          await dispatch(createUser(submitData)).unwrap();
          console.log('[UserForm] Create successful');
        }
        
        handleClose();
      } catch (error) {
        console.error('Submit error:', error);
        const errorMsg = error?.message || error?.payload || error || 'Có lỗi xảy ra khi lưu thông tin người dùng';
        setSubmitError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
    },
  });

  const [passwordMismatch, setPasswordMismatch] = useState(false);

  useEffect(() => {
    if (formik.values.password && formik.values.confirmPassword) {
      setPasswordMismatch(formik.values.password !== formik.values.confirmPassword);
    } else {
      setPasswordMismatch(false);
    }
  }, [formik.values.password, formik.values.confirmPassword]);

  const handleClose = () => {
    formik.resetForm();
    setPasswordMismatch(false);
    setSubmitError(null);
    onClose();
  };

  const selectedRole = roles.find(r => r.value === formik.values.role);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { minHeight: '400px' } }}
    >
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              {isEdit ? <Edit color="primary" /> : <PersonAdd color="primary" />}
              <Typography variant="h5">
                {isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Display submission error */}
            {submitError && (
              <Alert severity="error">
                {submitError}
              </Alert>
            )}

            {/* Basic Information */}
            <Typography variant="h6" color="primary">
              Thông tin cơ bản
            </Typography>

            <TextField
              fullWidth
              name="full_name"
              label="Họ và tên"
              value={formik.values.full_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.full_name && Boolean(formik.errors.full_name)}
              helperText={formik.touched.full_name && formik.errors.full_name}
              required
            />

            <TextField
              fullWidth
              name="email"
              label="Email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              required
            />

            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                name="password"
                label={isEdit ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                required={!isEdit}
              />

              {formik.values.password && (
                <TextField
                  fullWidth
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  type="password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  error={passwordMismatch}
                  helperText={passwordMismatch ? "Mật khẩu không khớp" : ""}
                  required
                />
              )}
            </Box>

            {passwordMismatch && (
              <Alert severity="error">
                Mật khẩu xác nhận không khớp với mật khẩu đã nhập
              </Alert>
            )}

            {/* Role and Status */}
            <Box display="flex" gap={2} alignItems="center">
              <FormControl fullWidth required>
                <InputLabel>Vai trò</InputLabel>
                <Select
                  name="role"
                  value={formik.values.role}
                  label="Vai trò"
                  onChange={formik.handleChange}
                  error={formik.touched.role && Boolean(formik.errors.role)}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={role.label}
                          color={role.color}
                          size="small"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  name="status"
                  value={formik.values.status}
                  label="Trạng thái"
                  onChange={formik.handleChange}
                >
                  <MenuItem value="active">Hoạt động</MenuItem>
                  <MenuItem value="inactive">Tạm khóa</MenuItem>
                  <MenuItem value="banned">Bị cấm</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Additional Information */}
            <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
              Thông tin bổ sung
            </Typography>

            <TextField
              fullWidth
              name="phone"
              label="Số điện thoại"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
            />

            {/* Preview selected role */}
            {selectedRole && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Vai trò được chọn:
                </Typography>
                <Chip 
                  label={selectedRole.label}
                  color={selectedRole.color}
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || passwordMismatch || !formik.isValid}
          >
            {isLoading ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Thêm mới')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}