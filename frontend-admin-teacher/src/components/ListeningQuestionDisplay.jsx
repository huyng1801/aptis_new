'use client';

import { Box, Typography, Chip, List, ListItem, ListItemText } from '@mui/material';
import { VolumeUp } from '@mui/icons-material';

/**
 * Component hiển thị câu hỏi Listening
 */
export default function ListeningQuestionDisplay({ question, answer }) {
  const questionTypeCode = question.question_type?.code || '';
  
  const getPartInfo = (typeCode) => {
    switch (typeCode) {
      case 'LISTENING_MCQ':
        return { part: 'Part 1-4', title: 'Multiple Choice', points: '50 điểm', color: 'primary' };
      default:
        return { part: 'Listening', title: 'Listening Task', points: '', color: 'default' };
    }
  };

  const partInfo = getPartInfo(questionTypeCode);

  return (
    <Box>
      {/* Part Header */}
      <Box display="flex" gap={1} mb={2}>
        <Chip 
          label={`${partInfo.part} - ${partInfo.points}`} 
          color={partInfo.color} 
          size="small" 
          icon={<VolumeUp />}
        />
        <Chip 
          label={partInfo.title} 
          variant="outlined" 
          size="small" 
        />
      </Box>

      {/* Audio */}
      {question.audio_url && (
        <Box mb={2}>
          <Typography variant="body2" fontWeight="bold" mb={1}>
            Audio câu hỏi:
          </Typography>
          <audio controls style={{ width: '100%', marginBottom: '16px' }}>
            <source src={question.audio_url} type="audio/mpeg" />
            Trình duyệt không hỗ trợ audio.
          </audio>
        </Box>
      )}

      {/* Question Content */}
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
          {question.content || question.question_text}
        </Typography>
        
        {/* Multiple Choice Options */}
        {questionTypeCode === 'LISTENING_MCQ' && question.question_options && (
          <Box mt={2}>
            <Typography variant="body2" fontWeight="bold" mb={1}>
              Các lựa chọn:
            </Typography>
            <List dense>
              {question.question_options.map((option, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={`${String.fromCharCode(65 + index)}: ${option.option_text}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Image if any */}
        {question.image_url && (
          <Box mt={2}>
            <img 
              src={question.image_url} 
              alt="Listening context" 
              style={{ maxWidth: '100%', borderRadius: 4 }} 
            />
          </Box>
        )}
      </Box>

      {/* Question Items (for multi-part questions) */}
      {question.question_items && question.question_items.length > 0 && (
        <Box mt={2}>
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>
            Các câu hỏi chi tiết:
          </Typography>
          {question.question_items.map((item, index) => (
            <Box key={index} sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
              <Typography variant="body2">
                <strong>{index + 1}.</strong> {item.content}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}