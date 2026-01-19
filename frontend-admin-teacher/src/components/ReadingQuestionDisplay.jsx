'use client';

import { Box, Typography, Chip, Alert, List, ListItem, ListItemText } from '@mui/material';

/**
 * Component hiển thị câu hỏi Reading
 */
export default function ReadingQuestionDisplay({ question, answer }) {
  const questionTypeCode = question.question_type?.code || '';
  
  const getPartInfo = (typeCode) => {
    switch (typeCode) {
      case 'READING_GAP_FILL':
        return { part: 'Part 1', title: 'Gap Filling', points: '10 điểm', color: 'success' };
      case 'READING_ORDERING':
        return { part: 'Part 2', title: 'Ordering', points: '5 điểm', color: 'info' };
      case 'READING_MATCHING':
        return { part: 'Part 3/5', title: 'Matching', points: '5-14 điểm', color: 'primary' };
      case 'READING_MATCHING_HEADINGS':
        return { part: 'Part 4', title: 'Matching Headings', points: '16 điểm', color: 'warning' };
      default:
        return { part: 'Reading', title: 'Reading Task', points: '', color: 'default' };
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
        />
        <Chip 
          label={partInfo.title} 
          variant="outlined" 
          size="small" 
        />
      </Box>

      {/* Question Content */}
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
          {question.content || question.question_text}
        </Typography>
        
        {/* Gap Fill - Show word list */}
        {questionTypeCode === 'READING_GAP_FILL' && question.question_options && (
          <Box mt={2}>
            <Typography variant="body2" fontWeight="bold" mb={1}>
              Từ vựng có sẵn:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {question.question_options.map((option, index) => (
                <Chip 
                  key={index}
                  label={option.option_text} 
                  variant="outlined" 
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Matching - Show options */}
        {(questionTypeCode === 'READING_MATCHING' || questionTypeCode === 'READING_MATCHING_HEADINGS') && 
         question.question_options && (
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
              alt="Reading passage" 
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