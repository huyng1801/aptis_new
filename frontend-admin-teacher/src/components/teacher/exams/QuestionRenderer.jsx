'use client';

import { Box, Typography, Paper, Chip, List, ListItem, ListItemText, Divider, Alert } from '@mui/material';
import { AudioFile, Image as ImageIcon, Description, QuestionAnswer } from '@mui/icons-material';

export default function QuestionRenderer({ question, compact = false }) {
  if (!question) {
    return <Typography variant="body2" color="text.secondary">Không có dữ liệu câu hỏi</Typography>;
  }

  const questionType = question.questionType?.code || question.question_type;
  
  // Parse content if it's JSON string
  const parseContent = (content) => {
    if (!content) return null;
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch (e) {
        return content;
      }
    }
    return content;
  };

  const content = parseContent(question.content);
  const items = question.items || [];

  // Common styling
  const sectionStyle = {
    bgcolor: 'grey.50',
    p: 1.5,
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'grey.200'
  };

  const renderReadingGapFill = () => {
    let passage, options, prompt;
    
    // Parse content - could be JSON or string
    if (typeof content === 'string') {
      // Check if it's structured with prompt + passage
      const lines = content.split('\n\n');
      if (lines.length >= 2) {
        prompt = lines[0];
        passage = lines.slice(1).join('\n\n');
      } else {
        passage = content;
      }
    } else {
      passage = content?.passage || question.content;
      options = content?.options || [];
      prompt = content?.prompt;
    }

    // Get options from question.options if available
    if (!options || options.length === 0) {
      options = question.options?.map(opt => opt.option_text) || [];
    }

    if (!passage) return <Typography color="error">Không có nội dung</Typography>;

    return (
      <Box>
        <Typography variant="body2" fontWeight={500} color="primary" mb={1}>
          📝 Reading - Gap Filling
        </Typography>
        {prompt && (
          <Typography variant="caption" color="text.secondary" mb={1} display="block">
            {prompt}
          </Typography>
        )}
        <Paper variant="outlined" sx={sectionStyle}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {passage.replace(/\[GAP\d+\]/g, '___')}
          </Typography>
        </Paper>
        {options.length > 0 && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
              Từ khóa ({options.length}):
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {options.map((option, index) => (
                <Chip key={index} label={option} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderReadingOrdering = () => {
    const sentences = content?.sentences || [];
    const title = content?.title || 'Ordering Exercise';
    
    return (
      <Box>
        <Typography variant="body2" fontWeight={500} color="primary" mb={1}>
          🔢 Reading - Sentence Ordering
        </Typography>
        {title !== 'Ordering Exercise' && (
          <Typography variant="subtitle2" mb={1}>{title}</Typography>
        )}
        <Paper variant="outlined" sx={sectionStyle}>
          <Typography variant="caption" color="text.secondary" mb={1} display="block">
            Sắp xếp các câu sau theo thứ tự đúng:
          </Typography>
          <List dense disablePadding>
            {sentences.map((sentence, index) => (
              <ListItem key={index} dense sx={{ py: 0.5 }}>
                <ListItemText 
                  primary={`${index + 1}. ${sentence}`}
                  sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem' } }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    );
  };

  const renderReadingMatching = () => {
    const passage = typeof content === 'string' ? content : content?.passage || question.content;
    
    return (
      <Box>
        <Typography variant="body2" fontWeight={500} color="primary" mb={1}>
          🔗 Reading - Matching
        </Typography>
        <Paper variant="outlined" sx={sectionStyle}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {compact && passage.length > 300 
              ? passage.substring(0, 300) + '...'
              : passage
            }
          </Typography>
        </Paper>
        {items.length > 0 && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
              Câu hỏi ghép ({items.length} items):
            </Typography>
            <List dense disablePadding>
              {items.slice(0, compact ? 3 : items.length).map((item, index) => (
                <ListItem key={index} dense sx={{ py: 0.25 }}>
                  <ListItemText 
                    primary={`${index + 1}. ${item.content || item.text || 'N/A'}`}
                    sx={{ '& .MuiListItemText-primary': { fontSize: '0.8rem' } }}
                  />
                </ListItem>
              ))}
              {compact && items.length > 3 && (
                <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                  ... và {items.length - 3} câu khác
                </Typography>
              )}
            </List>
          </Box>
        )}
      </Box>
    );
  };

  const renderReadingMatchingHeadings = () => {
    const passage = typeof content === 'string' ? content : content?.passage || question.content;
    
    return (
      <Box>
        <Typography variant="body2" fontWeight={500} color="primary" mb={1}>
          🏷️ Reading - Matching Headings
        </Typography>
        <Paper variant="outlined" sx={sectionStyle}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {compact && passage.length > 200 
              ? passage.substring(0, 200) + '...'
              : passage
            }
          </Typography>
        </Paper>
        {items.length > 0 && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
              Đoạn văn cần ghép tiêu đề ({items.length} đoạn)
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderListeningMCQ = () => {
    let script, prompt;
    
    if (typeof content === 'string') {
      script = content;
    } else {
      script = content?.script || question.content;
    }

    // Get options from items if available
    const mcqOptions = items.length > 0 ? items : question.options || [];
    
    return (
      <Box>
        <Typography variant="body2" fontWeight={500} color="primary" mb={1}>
          🎧 Listening - Multiple Choice
        </Typography>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <AudioFile fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Câu hỏi có audio
          </Typography>
          {question.media_url && (
            <Chip label="Có file âm thanh" size="small" color="info" variant="outlined" />
          )}
        </Box>
        <Paper variant="outlined" sx={sectionStyle}>
          <Typography variant="body2">
            {script || 'Nội dung audio...'}
          </Typography>
        </Paper>
        {mcqOptions.length > 0 && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
              Lựa chọn:
            </Typography>
            <List dense disablePadding>
              {mcqOptions.map((item, index) => (
                <ListItem key={index} dense sx={{ py: 0.25 }}>
                  <ListItemText 
                    primary={`${String.fromCharCode(65 + index)}. ${item.content || item.option_text || item.text || 'N/A'}`}
                    sx={{ '& .MuiListItemText-primary': { fontSize: '0.8rem' } }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    );
  };

  const renderListeningMatching = () => {
    const instruction = typeof content === 'string' ? content : question.content;
    
    return (
      <Box>
        <Typography variant="body2" fontWeight={500} color="primary" mb={1}>
          🎯 Listening - Speaker Matching
        </Typography>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <AudioFile fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Ghép người nói với ý kiến
          </Typography>
        </Box>
        <Paper variant="outlined" sx={sectionStyle}>
          <Typography variant="body2">
            {instruction}
          </Typography>
        </Paper>
        {items.length > 0 && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
              Speakers ({items.length}):
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderWritingShort = () => {
    const prompt = typeof content === 'string' ? content : content?.prompt || question.content;
    
    return (
      <Box>
        <Typography variant="body2" fontWeight={500} color="primary" mb={1}>
          ✍️ Writing - Short Response
        </Typography>
        <Paper variant="outlined" sx={sectionStyle}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {prompt}
          </Typography>
        </Paper>
        {items.length > 0 && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              {items.length} writing tasks
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderSpeakingQuestion = (type) => {
    const prompt = typeof content === 'string' ? content : content?.prompt || question.content;
    
    const speakingTypes = {
      'SPEAKING_PERSONAL': '🗣️ Speaking - Personal Introduction',
      'SPEAKING_DESCRIPTION': '📸 Speaking - Description',  
      'SPEAKING_COMPARISON': '⚖️ Speaking - Comparison',
      'SPEAKING_DISCUSSION': '💭 Speaking - Discussion'
    };

    return (
      <Box>
        <Typography variant="body2" fontWeight={500} color="primary" mb={1}>
          {speakingTypes[type] || '🗣️ Speaking'}
        </Typography>
        <Paper variant="outlined" sx={sectionStyle}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {prompt}
          </Typography>
        </Paper>
        {question.media_url && (
          <Box mt={1}>
            <Chip label="Có hình ảnh/audio hướng dẫn" size="small" color="info" variant="outlined" />
          </Box>
        )}
      </Box>
    );
  };

  const renderDefault = () => {
    const displayContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    
    return (
      <Box>
        <Typography variant="body2" fontWeight={500} color="primary" mb={1}>
          ❓ {questionType || 'Unknown Type'}
        </Typography>
        <Paper variant="outlined" sx={sectionStyle}>
          <Typography variant="body2" component="pre" sx={{ 
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxHeight: compact ? '100px' : 'none'
          }}>
            {compact && displayContent.length > 200 
              ? displayContent.substring(0, 200) + '...'
              : displayContent
            }
          </Typography>
        </Paper>
        {items.length > 0 && (
          <Typography variant="caption" color="text.secondary" mt={1} display="block">
            {items.length} items/options
          </Typography>
        )}
      </Box>
    );
  };

  // Render based on question type
  switch (questionType) {
    case 'READING_GAP_FILL':
      return renderReadingGapFill();
    case 'READING_ORDERING':
      return renderReadingOrdering();
    case 'READING_MATCHING':
      return renderReadingMatching();
    case 'READING_MATCHING_HEADINGS':
      return renderReadingMatchingHeadings();
    case 'LISTENING_MCQ':
      return renderListeningMCQ();
    case 'LISTENING_MATCHING':
    case 'LISTENING_STATEMENT_MATCHING':
      return renderListeningMatching();
    case 'WRITING_SHORT':
    case 'WRITING_LONG':
    case 'WRITING_FORM':
      return renderWritingShort();
    case 'SPEAKING_PERSONAL':
    case 'SPEAKING_DESCRIPTION':
    case 'SPEAKING_COMPARISON':
    case 'SPEAKING_DISCUSSION':
      return renderSpeakingQuestion(questionType);
    default:
      return renderDefault();
  }
}