'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import dynamic from 'next/dynamic';

// Dynamic imports to prevent SSR issues
const QuestionList = dynamic(() => import('@/components/teacher/questions/QuestionList'), { ssr: false });

export default function QuestionsPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render until client-side to prevent hydration mismatch
  if (!isClient) {
    return (
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Typography variant="h6" color="text.secondary">
          Đang tải...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý câu hỏi
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push('/teacher/questions/new')}
          size="large"
        >
          Tạo câu hỏi
        </Button>
      </Box>

      <QuestionList
        viewMode="table"
        showActions={true}
        showFilters={true}
        readOnlyMode={true}
      />
    </Box>
  );
}