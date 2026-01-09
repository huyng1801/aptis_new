'use client';

import { Chip } from '@mui/material';
import { AccessTime } from '@mui/icons-material';

export default function ExamTimer({ timeRemaining }) {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return 'error'; // 5 minutes
    if (timeRemaining <= 600) return 'warning'; // 10 minutes
    return 'primary';
  };

  return (
    <Chip
      icon={<AccessTime />}
      label={formatTime(timeRemaining)}
      color={getTimeColor()}
      variant={timeRemaining <= 300 ? 'filled' : 'outlined'}
      sx={{ 
        fontSize: '1rem',
        fontWeight: 'bold',
        minWidth: 100
      }}
    />
  );
}