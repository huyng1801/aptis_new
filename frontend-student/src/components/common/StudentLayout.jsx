'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import {
  Home,
  Assessment,
  History,
  TrendingUp,
  Person,
  Menu as MenuIcon,
  Logout,
  Settings,
  School,
} from '@mui/icons-material';
import { clearAuth } from '@/store/slices/authSlice';
import LoadingSpinner from './LoadingSpinner';
import Footer from './Footer';
import PageTransition from './PageTransition';
import { useNavigation } from '@/hooks/useNavigation';

const bottomNavItems = [
  { label: 'Trang chủ', icon: <Home />, path: '/home' },
  { label: 'Đề thi', icon: <Assessment />, path: '/exams' },
  { label: 'Ôn tập', icon: <TrendingUp />, path: '/practice' },
  { label: 'Kết quả', icon: <History />, path: '/results' },
];

const drawerItems = [
  { label: 'Trang chủ', icon: <Home />, path: '/home' },
  { label: 'Đề thi', icon: <Assessment />, path: '/exams' },
  { label: 'Ôn tập', icon: <TrendingUp />, path: '/practice' },
  { label: 'Kết quả', icon: <History />, path: '/results' },
];

export default function StudentLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { navigate, isNavigating } = useNavigation();
  
  const { user } = useSelector((state) => state.auth);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    handleProfileMenuClose();
    router.push('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const getCurrentBottomNavValue = () => {
    const currentItem = bottomNavItems.find(item => pathname.startsWith(item.path));
    return currentItem ? bottomNavItems.indexOf(currentItem) : 0;
  };

  const isMenuOpen = Boolean(anchorEl);

  const renderProfileMenu = (
    <Menu
      anchorEl={anchorEl}
      open={isMenuOpen}
      onClose={handleProfileMenuClose}
      onClick={handleProfileMenuClose}
      PaperProps={{
        elevation: 0,
        sx: {
          overflow: 'visible',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          mt: 1.5,
          border: '1px solid #E8E8E8',
          borderRadius: '8px',
          '& .MuiAvatar-root': {
            width: 36,
            height: 36,
            ml: -0.5,
            mr: 1.5,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={() => handleNavigation('/profile')} sx={{ py: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 600 }}>
          {user?.full_name?.charAt(0)?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
            {user?.full_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
      </MenuItem>
      <Divider sx={{ my: 0.5 }} />
      <MenuItem onClick={() => handleNavigation('/profile')} sx={{ py: 1 }}>
        <ListItemIcon>
          <Person fontSize="small" sx={{ color: '#6B7280' }} />
        </ListItemIcon>
        <Typography variant="body2">Trang cá nhân</Typography>
      </MenuItem>

      <MenuItem onClick={handleLogout} sx={{ py: 1 }} data-testid="logout-button">
        <ListItemIcon>
          <Logout fontSize="small" sx={{ color: '#6B7280' }} />
        </ListItemIcon>
        <Typography variant="body2">Đăng xuất</Typography>
      </MenuItem>
    </Menu>
  );

  const renderDrawer = (
    <Drawer
      variant="temporary"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        '& .MuiDrawer-paper': { 
          boxSizing: 'border-box', 
          width: 280,
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #E8E8E8' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            backgroundColor: '#1976d2',
            borderRadius: '8px',
            color: 'white',
          }}>
            <School sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 700 }}>
            APTIS Master
          </Typography>
        </Box>
      </Box>
      <List>
        {drawerItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={pathname.startsWith(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#EFF6FF',
                  color: '#1976d2',
                  '& .MuiListItemIcon-root': {
                    color: '#1976d2',
                  }
                },
                '&:hover': {
                  backgroundColor: '#F3F4F6',
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'background.default',
      position: 'relative'
    }}>
      {/* Navigation Loading Overlay */}
      {isNavigating && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <LoadingSpinner message="Đang chuyển trang..." />
        </Box>
      )}
      
      {/* Top App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E8E8E8',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
          <Box sx={{ maxWidth: '1200px', mx: 'auto', width: '100%', px: { xs: 3 } }}>
            <Toolbar disableGutters sx={{ py: 1, minHeight: { xs: 56, sm: 64 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2, color: '#1F2937' }}
            >
              <MenuIcon />
            </IconButton>
          )}
          

          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* Logo & Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 160 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                backgroundColor: '#1976d2',
                borderRadius: '8px',
                color: 'white',
              }}>
                <School sx={{ fontSize: 24 }} />
              </Box>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 700,
                  color: '#1F2937',
                  fontSize: '1.1rem',
                  letterSpacing: '-0.5px'
                }}
              >
                APTIS Master
              </Typography>
            </Box>

            {/* Desktop Navigation Links - Centered */}
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 0, flex: 1, justifyContent: 'center' }}>
                {drawerItems.map((item) => (
                  <Button
                    key={item.path}
                    color="inherit"
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      color: pathname.startsWith(item.path) ? '#1976d2' : '#6B7280',
                      fontWeight: pathname.startsWith(item.path) ? 600 : 500,
                      px: 2,
                      py: 1,
                      borderRadius: 0,
                      borderBottom: pathname.startsWith(item.path) ? '3px solid #1976d2' : 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: '#1976d2',
                        backgroundColor: 'transparent',
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Right side actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120, justifyContent: 'flex-end' }}>



              {/* User Profile */}
              <IconButton
                onClick={handleProfileMenuOpen}
                color="inherit"
                data-testid="user-menu"
                sx={{
                  p: 0.5,
                  '&:hover': {
                    backgroundColor: '#F3F4F6',
                  }
                }}
              >
                <Avatar sx={{ bgcolor: '#1976d2', width: 36, height: 36, fontSize: '0.9rem' }}>
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                </Avatar>
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
          </Box>
      </AppBar>

      {renderProfileMenu}
      {isMobile && renderDrawer}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh)',
          pt: 8,
          pb: isMobile ? 7 : 0,
        }}
      >
        <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
          <PageTransition>
            {children}
          </PageTransition>
        </Box>
      </Box>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <BottomNavigation
          value={getCurrentBottomNavValue()}
          onChange={(event, newValue) => {
            navigate(bottomNavItems[newValue].path);
          }}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: '1px solid #E8E8E8',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04)',
            '& .MuiBottomNavigationAction-root': {
              color: '#6B7280',
              fontSize: '0.75rem',
              '&.Mui-selected': {
                color: '#1976d2',
              }
            }
          }}
        >
          {bottomNavItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      )}

      {/* Footer - Always at bottom */}
      <Box component="footer" sx={{ marginTop: 'auto', flexShrink: 0 }}>
        <Footer />
      </Box>
    </Box>
  );
}