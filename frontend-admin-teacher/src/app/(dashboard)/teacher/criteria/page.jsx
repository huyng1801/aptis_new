'use client';

import { Box, Typography } from '@mui/material';
import CriteriaList from '@/components/teacher/criteria/CriteriaList';

export default function CriteriaPage() {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Xem tiêu chí chấm điểm
        </Typography>
      </Box>

      <CriteriaList />
    </Box>
  );
}