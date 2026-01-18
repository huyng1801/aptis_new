'use client';

import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';

const pathLabels = {
  dashboard: 'Trang chủ',
  home: 'Trang chủ',
  exams: 'Danh sách bài thi',
  results: 'Kết quả',
  progress: 'Tiến độ học',
  profile: 'Hồ sơ',
  settings: 'Cài đặt',
  practice: 'Luyện tập',
};

export default function Breadcrumb() {
  const pathname = usePathname();
  
  // Tách path thành mảng segments
  const segments = pathname.split('/').filter(segment => segment && segment !== '(dashboard)');
  
  // Nếu đang ở trang chủ hoặc home, không hiển thị breadcrumb
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'home')) {
    return null;
  }

  const buildPath = (index) => {
    return '/' + segments.slice(0, index + 1).join('/');
  };

  return (
    <Box mb={3}>
      <Breadcrumbs
        separator={<NavigateNext fontSize="small" />}
        aria-label="breadcrumb"
      >
        <Link
          component={NextLink}
          href="/home"
          underline="hover"
          color="inherit"
          display="flex"
          alignItems="center"
          gap={0.5}
        >
          Trang chủ
        </Link>
        
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const path = buildPath(index);
          const label = pathLabels[segment] || segment;
          
          if (isLast) {
            return (
              <Typography key={segment} color="text.primary" sx={{ fontWeight: 500 }}>
                {label}
              </Typography>
            );
          }
          
          return (
            <Link
              key={segment}
              component={NextLink}
              href={path}
              underline="hover"
              color="inherit"
            >
              {label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
