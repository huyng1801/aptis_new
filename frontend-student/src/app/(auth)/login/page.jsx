'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Divider,
  CircularProgress,
} from '@mui/material';
import { School, Email, Lock } from '@mui/icons-material';
import { loginUser } from '@/store/slices/authSlice';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Show demo credentials
  useEffect(() => {
    console.log('Student: student1@aptis.local / password123');
  }, []);

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[LoginPage] User authenticated, redirecting to /home');
      router.replace('/home');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Vui lòng nhập địa chỉ email hợp lệ';
    }

    if (!formData.password.trim()) {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      console.log('[LoginPage] Submitting login form:', { email: formData.email });

      const result = await dispatch(loginUser({
        email: formData.email,
        password: formData.password,
      })).unwrap();

      console.log('[LoginPage] Login successful');
      // Redirect will happen via useEffect when isAuthenticated changes
    } catch (err) {
      console.error('[LoginPage] Login failed:', err);
      // Error is handled by Redux slice and displayed in Alert
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <School sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Chào mừng trở lại
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Đăng nhập vào tài khoản học viên APTIS của bạn
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} data-testid="error-message">
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Địa chỉ Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
                InputProps={{
                  startAdornment: <Email sx={{ color: 'action.active', mr: 1 }} />,
                }}
                inputProps={{ 'data-testid': 'email-input' }}
                sx={{ mb: 2 }}
                disabled={isLoading}
                required
                autoComplete="email"
                autoFocus
              />

              {/* Email validation error */}
              {validationErrors.email && (
                <Typography variant="body2" color="error" data-testid="email-error">
                  {validationErrors.email}
                </Typography>
              )}

              <TextField
                fullWidth
                id="password"
                name="password"
                label="Mật khẩu"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!validationErrors.password}
                helperText={validationErrors.password}
                InputProps={{
                  startAdornment: <Lock sx={{ color: 'action.active', mr: 1 }} />,
                }}
                inputProps={{ 'data-testid': 'password-input' }}
                sx={{ mb: 3 }}
                disabled={isLoading}
                required
                autoComplete="current-password"
              />

              {/* Password validation error */}
              {validationErrors.password && (
                <Typography variant="body2" color="error" data-testid="password-error">
                  {validationErrors.password}
                </Typography>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mb: 2, py: 1.5 }}
                data-testid="login-button"
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link
                  href="/forgot-password"
                  variant="body2"
                  sx={{ textDecoration: 'none' }}
                >
                  Quên mật khẩu?
                </Link>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Demo Credentials */}
            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Tài khoản Demo:
              </Typography>
              <Typography variant="body2">
                Email: <strong>student1@aptis.local</strong>
              </Typography>
              <Typography variant="body2">
                Mật khẩu: <strong>password123</strong>
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Chưa có tài khoản?{' '}
                <Link href="/register" variant="body2" sx={{ textDecoration: 'none', fontWeight: 500 }}>
                  Tạo tài khoản tại đây
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}