'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Edit, Close } from '@mui/icons-material';

export default function QuestionPreview({ 
  question, 
  open = true, 
  onClose, 
  onEdit, 
  showActions = true,
  aptisData = null,
  skillData = null,
  questionTypeData = null
}) {
  if (!question) return null;

  // Debug log to see data structure
  console.log('QuestionPreview received:', {
    question,
    aptisData,
    skillData,
    questionTypeData
  });

  // Mapping from question_type string to code
  const getQuestionTypeCodeFromString = (questionTypeString) => {
    const typeMapping = {
      'Gap Filling': 'READING_GAP_FILL', // Default to reading, but check context
      'Gap fill': 'READING_GAP_FILL',
      'Matching': 'READING_MATCHING',
      'Ordering': 'READING_ORDERING',
      'MCQ': 'LISTENING_MCQ',
      'Multiple Choice': 'LISTENING_MCQ',
      'Short': 'WRITING_SHORT',
      'Form': 'WRITING_FORM',
      'Long': 'WRITING_LONG',
      'Email': 'WRITING_EMAIL',
      'Essay': 'WRITING_ESSAY',
      'Introduction': 'SPEAKING_INTRO',
      'Description': 'SPEAKING_DESCRIPTION',
      'Comparison': 'SPEAKING_COMPARISON',
      'Discussion': 'SPEAKING_DISCUSSION',
    };
    return typeMapping[questionTypeString] || null;
  };

  // Mapping from question_type_id to code - based on seed data sequence
  const getQuestionTypeCodeFromId = (questionTypeId, skillType) => {
    // Mapping dựa trên thứ tự tạo trong 02-seed-types.js
    // Thứ tự: Listening (1-4), Reading (5-8), Speaking (9-12), Writing (13-17)
    const exactIdMapping = {
      // Listening types (1-4)
      1: 'LISTENING_MCQ',           // Multiple Choice
      2: 'LISTENING_GAP_FILL',      // Gap Filling  
      3: 'LISTENING_MATCHING',      // Speaker Matching
      4: 'LISTENING_STATEMENT_MATCHING', // Statement Matching
      
      // Reading types (5-8) 
      5: 'READING_GAP_FILL',        // Gap Filling
      6: 'READING_ORDERING',        // Ordering
      7: 'READING_MATCHING',        // Matching
      8: 'READING_MATCHING_HEADINGS', // Matching Headings
      
      // Speaking types (9-12)
      9: 'SPEAKING_INTRO',          // Personal Introduction
      10: 'SPEAKING_DESCRIPTION',   // Picture Description
      11: 'SPEAKING_COMPARISON',    // Comparison
      12: 'SPEAKING_DISCUSSION',    // Topic Discussion
      
      // Writing types (13-17)
      13: 'WRITING_SHORT',          // Short Answers (1-5 words)
      14: 'WRITING_FORM',           // Form Filling (20-30 words)
      15: 'WRITING_LONG',           // Chat Responses (30-40 words)
      16: 'WRITING_EMAIL',          // Email Writing (50 & 120-150 words)
      17: 'WRITING_ESSAY',          // Essay Writing
    };
    
    const mappedCode = exactIdMapping[questionTypeId];
    
    if (mappedCode) {
      console.log(`Mapped question_type_id ${questionTypeId} -> ${mappedCode}`);
      return mappedCode;
    }
    
    // Fallback với skill context nếu không tìm thấy mapping chính xác
    if (skillType) {
      const skillLower = skillType.toLowerCase();
      console.log(`Using skill-based fallback for ID ${questionTypeId}, skill: ${skillType}`);
      
      if (skillLower.includes('listening')) return 'LISTENING_MCQ';
      if (skillLower.includes('reading')) return 'READING_GAP_FILL'; 
      if (skillLower.includes('speaking')) return 'SPEAKING_INTRO';
      if (skillLower.includes('writing')) return 'WRITING_SHORT';
    }
    
    console.warn(`Could not map question_type_id ${questionTypeId} with skill ${skillType}`);
    return null;
  };

  const renderQuestionContent = () => {
    const { content, questionType } = question;
    
    // Parse content - handle both JSON and plain text from database
    let parsedContent;
    try {
      // Try to parse as JSON first
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error) {
      console.log('Content is not JSON, treating as plain text:', content);
      // If not JSON, create a structure for plain text content
      parsedContent = {
        passage: content || '',
        prompt: 'Xem nội dung câu hỏi',
        isPlainText: true
      };
    }
    
    console.log('📝 Content processing result:', {
      originalType: typeof content,
      isJSON: !parsedContent.isPlainText,
      parsedContent: parsedContent
    });

    // Get question type code - try multiple sources with better priority
    let questionTypeCode = null;
    let debugSource = '';
    
    // Priority 1: From nested questionType object returned by API (MAIN SOURCE)
    if (question?.questionType?.code) {
      questionTypeCode = question.questionType.code;
      debugSource = 'question.questionType.code (API response)';
      console.log('✅ Got questionTypeCode from API:', questionTypeCode);
    }
    
    // Priority 2: Direct code from questionTypeData props
    else if (questionTypeData?.code) {
      questionTypeCode = questionTypeData?.code;
      debugSource = 'questionTypeData.code (props)';
      console.log('✅ Got questionTypeCode from props:', questionTypeCode);
    }
    
    // Priority 3: From question_type_code property 
    else if (question?.question_type_code) {
      questionTypeCode = question.question_type_code;
      debugSource = 'question.question_type_code (direct)';
      console.log('✅ Got questionTypeCode from direct property:', questionTypeCode);
    }
    
    // Priority 4: Map from question_type_id using exact database mapping
    else if (question?.question_type_id) {
      const skillType = question?.questionType?.skillType?.skill_type_name 
        || question?.skill 
        || question?.questionType?.skillType?.code;
      
      questionTypeCode = getQuestionTypeCodeFromId(question.question_type_id, skillType);
      debugSource = `ID mapping (${question.question_type_id} + ${skillType})`;
      console.log('✅ Mapped from ID:', question.question_type_id, 'skill:', skillType, '-> code:', questionTypeCode);
    }
    
    // Priority 5: Map from question_type string (name) - fallback
    else if (question?.question_type) {
      questionTypeCode = getQuestionTypeCodeFromString(question.question_type);
      debugSource = `string mapping (${question.question_type})`;
      console.log('✅ Mapped from string:', question.question_type, '-> code:', questionTypeCode);
    }
    
    console.log(`🎯 FINAL RESULT: questionTypeCode = "${questionTypeCode}" from ${debugSource}`);
    console.log('📊 Question data structure:', {
      questionId: question?.id,
      questionTypeId: question?.question_type_id,
      questionTypeName: question?.questionType?.question_type_name,
      skillTypeName: question?.questionType?.skillType?.skill_type_name,
      hasContent: !!question?.content
    });

    // If we still don't have a code, return detailed error
    if (!questionTypeCode) {
      return (
        <Box>
          <Typography variant="body2" color="error" gutterBottom>
            ❌ Lỗi: Không thể xác định loại câu hỏi
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Question ID: {question?.id}, Type ID: {question?.question_type_id}
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              🔍 Debug Information:
            </Typography>
            <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '400px' }}>
              {JSON.stringify({ 
                question_id: question?.id,
                question_type_id: question?.question_type_id,
                question_type_name: question?.questionType?.question_type_name,
                skill_type: question?.questionType?.skillType?.skill_type_name,
                api_returned_code: question?.questionType?.code,
                props_code: questionTypeData?.code,
                available_properties: Object.keys(question || {}),
                questionType_properties: Object.keys(question?.questionType || {}),
              }, null, 2)}
            </pre>
          </Box>
        </Box>
      );
    }

    // Handle different question types based on code
    switch (questionTypeCode) {
      case 'READING_GAP_FILL':
      case 'LISTENING_GAP_FILL':
        return renderGapFillingContent(parsedContent);
        
      case 'READING_MATCHING':
      case 'READING_MATCHING_HEADINGS':
      case 'LISTENING_MATCHING':
      case 'LISTENING_STATEMENT_MATCHING':
        return renderMatchingContent(parsedContent);
        
      case 'READING_ORDERING':
        return renderOrderingContent(parsedContent);
        
      case 'LISTENING_MCQ':
        return renderMCQContent(parsedContent);
        
      case 'WRITING_SHORT':
      case 'WRITING_FORM':
      case 'WRITING_LONG':
      case 'WRITING_EMAIL':
      case 'WRITING_ESSAY':
        return renderWritingContent(parsedContent);
        
      case 'SPEAKING_INTRO':
      case 'SPEAKING_DESCRIPTION':
      case 'SPEAKING_COMPARISON':
      case 'SPEAKING_DISCUSSION':
        return renderSpeakingContent(parsedContent);
        
      default:
        console.warn('Unsupported question type:', questionTypeCode);
        
        // Fallback: render plain content for unknown types
        if (parsedContent.isPlainText || typeof parsedContent === 'string') {
          return (
            <Box>
              <Typography variant="body2" color="primary" gutterBottom>
                Nội dung câu hỏi:
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {typeof parsedContent === 'string' ? parsedContent : parsedContent.passage}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Loại câu hỏi: {questionTypeCode} (chưa hỗ trợ hiển thị chi tiết)
              </Typography>
            </Box>
          );
        }
        
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Không thể hiển thị nội dung cho loại câu hỏi: {questionTypeCode}
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                🔍 Debug - Raw Content:
              </Typography>
              <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '300px' }}>
                {JSON.stringify(parsedContent, null, 2)}
              </pre>
            </Box>
          </Box>
        );
    }
  };

  const renderGapFillingContent = (content) => {
    // Handle plain text content from database
    if (content.isPlainText || typeof content === 'string') {
      const textContent = typeof content === 'string' ? content : content.passage;
      return (
        <Box>
          <Typography variant="body2" color="primary" gutterBottom>
            Nội dung câu hỏi:
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {textContent}
            </Typography>
          </Box>
        </Box>
      );
    }

    // Handle structured content (from form creation)
    return (
      <Box>
        <Typography variant="body2" color="primary" gutterBottom>
          Hướng dẫn:
        </Typography>
        <Typography variant="body1" paragraph>
          {content.prompt || 'Choose one word from the list for each gap.'}
        </Typography>
        
        <Typography variant="body2" color="primary" gutterBottom>
          Đoạn văn:
        </Typography>
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {content.passage || 'Chưa có nội dung'}
          </Typography>
        </Box>
        
        {content.options && content.options.length > 0 && (
          <>
            <Typography variant="body2" color="primary" gutterBottom>
              Danh sách từ để chọn:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {content.options.map((option, index) => (
                <Chip key={index} label={option} size="small" />
              ))}
            </Box>
          </>
        )}
        
        {content.correctAnswers && content.correctAnswers.length > 0 && (
          <>
            <Typography variant="body2" color="success.main" gutterBottom>
              Đáp án đúng:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {content.correctAnswers.map((answer, index) => (
                <Chip 
                  key={index} 
                  label={`GAP${index + 1}: ${answer}`} 
                  size="small" 
                  color="success"
                  variant="outlined"
                />
              ))}
            </Box>
          </>
        )}
      </Box>
    );
  };

  const renderMatchingContent = (content) => {
    return (
      <Box>
        <Typography variant="body1" paragraph>
          {content.instruction || content.prompt || 'Ghép các mục tương ứng'}
        </Typography>
        
        {content.leftItems && content.rightItems ? (
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Cột trái</Typography>
              <List dense>
                {content.leftItems.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`${index + 1}. ${item.text || item}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Cột phải</Typography>
              <List dense>
                {content.rightItems.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`${String.fromCharCode(65 + index)}. ${item.text || item}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Nội dung ghép đôi chưa được cấu hình
          </Typography>
        )}
      </Box>
    );
  };

  const renderOrderingContent = (content) => {
    return (
      <Box>
        <Typography variant="body1" paragraph>
          {content.instruction || content.prompt || 'Sắp xếp các câu theo thứ tự đúng'}
        </Typography>
        
        {content.sentences && content.sentences.length > 0 ? (
          <List>
            {content.sentences.map((sentence, index) => (
              <ListItem key={index}>
                <ListItemText primary={`${index + 1}. ${sentence}`} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Danh sách câu chưa được thiết lập
          </Typography>
        )}
      </Box>
    );
  };

  const renderMCQContent = (content) => {
    return (
      <Box>
        <Typography variant="body1" paragraph>
          {content.question || content.prompt || 'Câu hỏi trắc nghiệm'}
        </Typography>
        
        {content.options && content.options.length > 0 ? (
          <RadioGroup value={content.correct_answer}>
            {content.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option.id || index}
                control={<Radio disabled />}
                label={`${String.fromCharCode(65 + index)}. ${option.text || option}`}
                sx={{ 
                  backgroundColor: (option.id || index) === content.correct_answer ? 'success.light' : 'transparent',
                  borderRadius: 1,
                  px: 1
                }}
              />
            ))}
          </RadioGroup>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Các lựa chọn chưa được thiết lập
          </Typography>
        )}
      </Box>
    );
  };

  const renderWritingContent = (content) => {
    return (
      <Box>
        <Typography variant="body1" paragraph>
          {content.prompt || content.task || 'Nhiệm vụ viết'}
        </Typography>
        
        <Box display="flex" gap={2} mb={2}>
          {content.min_words && (
            <Chip label={`Tối thiểu: ${content.min_words} từ`} size="small" />
          )}
          {content.max_words && (
            <Chip label={`Tối đa: ${content.max_words} từ`} size="small" />
          )}
          {content.timeLimit && (
            <Chip label={`Thời gian: ${content.timeLimit} phút`} size="small" />
          )}
        </Box>
        
        {content.guidelines && (
          <Box>
            <Typography variant="subtitle2" color="primary">Gợi ý:</Typography>
            <Typography variant="body2">{content.guidelines}</Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderSpeakingContent = (content) => {
    return (
      <Box>
        <Typography variant="body1" paragraph>
          {content.task || content.prompt || 'Nhiệm vụ nói'}
        </Typography>
        
        {content.preparationTime && (
          <Chip label={`Chuẩn bị: ${content.preparationTime} giây`} size="small" sx={{ mr: 1, mb: 2 }} />
        )}
        {content.recordingTime && (
          <Chip label={`Ghi âm: ${content.recordingTime} giây`} size="small" sx={{ mb: 2 }} />
        )}
        
        {content.instructions && (
          <Box>
            <Typography variant="subtitle2" color="primary">Hướng dẫn:</Typography>
            <Typography variant="body2">{content.instructions}</Typography>
          </Box>
        )}
      </Box>
    );
  };

  const getQuestionTypeLabel = () => {
    // Try to get from props first
    if (questionTypeData?.question_type_name) {
      return questionTypeData.question_type_name;
    }
    
    // Try from nested questionType in question object
    if (question?.questionType?.question_type_name) {
      return question.questionType.question_type_name;
    }
    
    // Fall back to mapping
    const typeMap = {
      'READING_GAP_FILL': 'Reading - Điền từ',
      'READING_MATCHING': 'Reading - Ghép đôi người',
      'READING_MATCHING_HEADINGS': 'Reading - Ghép tiêu đề',
      'READING_ORDERING': 'Reading - Sắp xếp',
      'LISTENING_GAP_FILL': 'Listening - Điền từ',
      'LISTENING_MCQ': 'Listening - Trắc nghiệm',
      'LISTENING_MATCHING': 'Listening - Ghép người nói',
      'LISTENING_STATEMENT_MATCHING': 'Listening - Ghép tuyên bố',
      'WRITING_SHORT': 'Writing - Văn bản ngắn',
      'WRITING_FORM': 'Writing - Điền form',
      'WRITING_LONG': 'Writing - Văn bản dài',
      'WRITING_EMAIL': 'Writing - Email',
      'WRITING_ESSAY': 'Writing - Luận văn',
      'SPEAKING_INTRO': 'Speaking - Giới thiệu',
      'SPEAKING_DESCRIPTION': 'Speaking - Mô tả',
      'SPEAKING_COMPARISON': 'Speaking - So sánh',
      'SPEAKING_DISCUSSION': 'Speaking - Thảo luận'
    };
    
    let code = questionTypeData?.code 
      || question?.questionType?.code 
      || question?.question_type_code;
    
    // Try mapping from question_type_id with better skill context
    if (!code && question?.question_type_id) {
      const skillType = question?.questionType?.skillType?.skill_type_name 
        || question?.skill;
      code = getQuestionTypeCodeFromId(question.question_type_id, skillType);
    }
    
    // Try mapping from question_type string (name) if code still not found
    if (!code && question?.question_type) {
      code = getQuestionTypeCodeFromString(question.question_type);
    }
    
    return typeMap[code] || code || 'Không xác định';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  // If not in dialog mode (when open is false or undefined), render as regular component
  if (!open && showActions === false) {
    return (
      <Box>
        <Box display="flex" gap={1} mb={3} flexWrap="wrap">
          <Chip 
            label={getQuestionTypeLabel()} 
            color="primary" 
            size="small" 
          />
          <Chip 
            label={skillData?.skill_type_name || 'Kỹ năng'} 
            color="secondary" 
            size="small" 
          />
          <Chip 
            label={aptisData?.aptis_type_name || 'APTIS'} 
            variant="outlined" 
            size="small" 
          />
          <Chip 
            label={question.difficulty || 'medium'} 
            color={getDifficultyColor(question.difficulty)} 
            size="small" 
          />
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {renderQuestionContent()}
      </Box>
    );
  }
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6">
          {question.title || 'Xem trước câu hỏi'}
        </Typography>
        {question.description && (
          <Typography variant="body2" color="text.secondary">
            {question.description}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" gap={1} mb={3} flexWrap="wrap">
          <Chip 
            label={getQuestionTypeLabel()} 
            color="primary" 
            size="small" 
          />
          <Chip 
            label={skillData?.skill_type_name || 'Kỹ năng'} 
            color="secondary" 
            size="small" 
          />
          <Chip 
            label={aptisData?.aptis_type_name || 'APTIS'} 
            variant="outlined" 
            size="small" 
          />
          <Chip 
            label={question.difficulty || 'medium'} 
            color={getDifficultyColor(question.difficulty)} 
            size="small" 
          />
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {renderQuestionContent()}
      </DialogContent>
      
      {showActions && (
        <DialogActions>
          <Button onClick={onClose} startIcon={<Close />}>
            Đóng
          </Button>
          {onEdit && (
            <Button onClick={onEdit} variant="contained" startIcon={<Edit />}>
              Chỉnh sửa
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}