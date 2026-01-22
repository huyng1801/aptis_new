'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Settings,
  Person,
  School,
} from '@mui/icons-material';
import { logout } from '@/store/slices/authSlice';
import { setSidebarOpen } from '@/store/slices/uiSlice';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 280;

export default function DashboardLayout({ children }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const [mounted, setMounted] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Always call hooks unconditionally
  const user = useSelector((state) => state?.auth?.user);
  const sidebarOpen = useSelector((state) => state?.ui?.sidebarOpen ?? true);

  // Hydration fix - only run on client side
  useEffect(() => {
    setMounted(true);
    // Set mobile state after mount
    const mediaQuery = window.matchMedia(theme.breakpoints.down('lg').replace('@media ', ''));
    setIsMobile(mediaQuery.matches);
    
    const handleChange = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Ensure sidebar is always open
  useEffect(() => {
    if (mounted && !sidebarOpen) {
      dispatch(setSidebarOpen(true));
    }
  }, [mounted, sidebarOpen, dispatch]);

  const handleUserMenuOpen = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await dispatch(logout());
    router.push('/login');
  };

  const handleProfile = () => {
    handleUserMenuClose();
    router.push('/profile');
  };

  const handleSettings = () => {
    handleUserMenuClose();
    router.push('/settings');
  };

  const getPageTitle = () => {
    const path = pathname.split('/')[1];
    const titles = {
      dashboard: 'Trang chủ',
      questions: 'Quản lý câu hỏi',
      exams: 'Quản lý bài thi',
      users: 'Quản lý người dùng',
      submissions: 'Chấm bài',
      reports: 'Báo cáo & Thống kê',
      criteria: 'Tiêu chí đánh giá',
      profile: 'Hồ sơ cá nhân',
      settings: 'Cài đặt',
    };
    return titles[path] || 'APTIS Admin';
  };

  const drawerContent = (
    <Sidebar
      onClose={() => dispatch(setSidebarOpen(false))}
      currentPath={pathname}
    />
  );

  // Don't render layout variations based on client-side state until mounted
  if (!mounted) {
    return (
      <Box sx={{ display: 'flex' }} suppressHydrationWarning>
        {/* Placeholder layout - server version */}
        <AppBar position="fixed">
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <School sx={{ mr: 1 }} />
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
                APTIS
              </Typography>
            </Box>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, ml: 2 }}>
              APTIS Admin
            </Typography>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }} suppressHydrationWarning>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { lg: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
          ml: { lg: sidebarOpen ? `${DRAWER_WIDTH}px` : 0 },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <School sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              APTIS
            </Typography>
          </Box>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, ml: 2 }}>
            {getPageTitle()}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* User Menu */}
            <Tooltip title="Tài khoản">
              <IconButton
                size="large"
                onClick={handleUserMenuOpen}
                color="inherit"
              >
                {user?.avatar ? (
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={anchorElUser}
        open={Boolean(anchorElUser)}
        onClose={handleUserMenuClose}
        onClick={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email || 'email@example.com'}
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleProfile}>
          <Person sx={{ mr: 2 }} />
          Hồ sơ cá nhân
        </MenuItem>
        <MenuItem onClick={handleSettings}>
          <Settings sx={{ mr: 2 }} />
          Cài đặt
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 2 }} />
          Đăng xuất
        </MenuItem>
      </Menu>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { lg: sidebarOpen ? DRAWER_WIDTH : 0 }, flexShrink: { lg: 0 } }}
      >
        {/* Desktop drawer */}
        <Drawer
          variant="persistent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open={sidebarOpen}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { lg: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}