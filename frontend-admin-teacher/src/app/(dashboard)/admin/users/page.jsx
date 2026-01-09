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
  Chip,
  Avatar,
  Grid,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  PersonAdd,
  Block,
  CheckCircle,
  LockReset,
  Download,
  Refresh
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { fetchUsers, deleteUser, updateUserStatus, resetUserPassword, createUser, updateUser } from '@/store/slices/userSlice';
import DataTable from '@/components/shared/DataTable';
import UserForm from '@/components/admin/users/UserForm';
import ConfirmDialog from '@/components/common/ConfirmDialog';

export default function UsersPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { users, isLoading: loading, pagination, error } = useSelector(state => state.users);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: ''
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReset, setConfirmReset] = useState(null);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Fetch users on component mount and when filters change
  useEffect(() => {
    handleFetchUsers();
  }, [searchTerm, filters]);

  const handleFetchUsers = (page = 1, limit = 20) => {
    const filterParams = {
      page,
      limit,
      search: searchTerm || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined
    };
    dispatch(fetchUsers(filterParams));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'teacher': return 'warning';
      case 'student': return 'primary';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Quản trị';
      case 'teacher': return 'Giáo viên';
      case 'student': return 'Học viên';
      default: return role;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'banned': return 'error';
      default: return 'default';
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setUserFormOpen(true);
  };

  const handleDelete = (user) => {
    if (user.role === 'admin') return;
    setConfirmDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (confirmDelete) {
      try {
        await dispatch(deleteUser(confirmDelete.id));
        setConfirmDelete(null);
        handleFetchUsers(pagination.page);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await dispatch(updateUser({ 
        id: user.id, 
        userData: { status: newStatus }
      }));
      handleFetchUsers(pagination.page);
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const handleResetPassword = (user) => {
    setConfirmReset(user);
  };

  const confirmResetPassword = async () => {
    if (confirmReset) {
      try {
        await dispatch(resetUserPassword(confirmReset.id));
        setConfirmReset(null);
        alert('Password reset successfully. New password sent to user email.');
      } catch (error) {
        console.error('Password reset failed:', error);
      }
    }
  };

  const handleUserFormClose = () => {
    setUserFormOpen(false);
    setEditingUser(null);
    handleFetchUsers(pagination.page);
  };



  const columns = [
    {
      id: 'user',
      label: 'Người dùng',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar 
            src={row.avatar_url}
            sx={{ width: 40, height: 40 }}
          >
            {row.full_name?.charAt(0) || row.email?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {row.full_name || 'Chưa có tên'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography>
            {row.phone && (
              <Typography variant="caption" display="block" color="text.secondary">
                {row.phone}
              </Typography>
            )}
          </Box>
        </Box>
      )
    },
    {
      id: 'role',
      label: 'Vai trò',
      render: (row) => (
        <Chip 
          label={getRoleLabel(row.role)} 
          size="small" 
          color={getRoleColor(row.role)}
          variant="filled"
        />
      )
    },
    {
      id: 'created_at',
      label: 'Ngày tạo',
      render: (row) => new Date(row.created_at).toLocaleDateString('vi-VN')
    },
    {
      id: 'last_login',
      label: 'Đăng nhập cuối',
      render: (row) => row.last_login ? new Date(row.last_login).toLocaleDateString('vi-VN') : 'Chưa từng'
    },
    {
      id: 'status',
      label: 'Trạng thái',
      render: (row) => (
        <Chip 
          label={row.status === 'active' ? 'Hoạt động' : row.status === 'inactive' ? 'Tạm khóa' : 'Bị cấm'} 
          size="small"
          color={getStatusColor(row.status)}
          icon={row.status === 'active' ? <CheckCircle /> : <Block />}
        />
      )
    },
    {
      id: 'actions',
      label: 'Hành động',
      align: 'center',
      render: (row) => (
        <Box display="flex" gap={0.5}>
          <IconButton
            size="small"
            onClick={() => handleEdit(row)}
            color="primary"
            title="Chỉnh sửa"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleResetPassword(row)}
            color="warning"
            title="Đặt lại mật khẩu"
          >
            <LockReset />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleToggleStatus(row)}
            color={row.status === 'active' ? "warning" : "success"}
            title={row.status === 'active' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
          >
            {row.status === 'active' ? <Block /> : <CheckCircle />}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(row)}
            color="error"
            disabled={row.role === 'admin'}
            title="Xóa người dùng"
          >
            <Delete />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý người dùng
        </Typography>
        <Box display="flex" gap={1}>

          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setUserFormOpen(true)}
            size="large"
          >
            Thêm người dùng
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              placeholder="Tìm kiếm email, tên..."
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
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={filters.role}
                label="Vai trò"
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="admin">Quản trị</MenuItem>
                <MenuItem value="teacher">Giáo viên</MenuItem>
                <MenuItem value="student">Học viên</MenuItem>
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
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Tạm khóa</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={handleFetchUsers}
      />

      <UserForm
        open={userFormOpen}
        user={editingUser}
        onClose={handleUserFormClose}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xóa người dùng"
        content={`Bạn có chắc muốn xóa người dùng "${confirmDelete?.email}"? Hành động này không thể hoàn tác.`}
        onConfirm={confirmDeleteUser}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        open={!!confirmReset}
        title="Đặt lại mật khẩu"
        content={`Bạn có chắc muốn đặt lại mật khẩu cho người dùng "${confirmReset?.email}"? Mật khẩu mới sẽ được gửi qua email.`}
        onConfirm={confirmResetPassword}
        onCancel={() => setConfirmReset(null)}
      />
    </Box>
  );
}