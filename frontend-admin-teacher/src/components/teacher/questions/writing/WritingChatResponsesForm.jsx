import React from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Chat as ChatIcon
} from '@mui/icons-material';

/**
 * APTIS Writing Task 3: Chat Responses (B1 Level)
 * Seed structure: Simple content string with chat scenario and 3 questions
 * Example: "Chat about your weekend\n\nReply to chat messages...\n\nAlex: Hi! Did you do anything fun last weekend?\nYour reply: _______"
 */
const WritingChatResponsesForm = ({ questionData, onChange, onValidate }) => {
  const parseContent = (content) => {
    if (!content) return '';
    try {
      const parsed = JSON.parse(content);
      return parsed.content || content;
    } catch (e) {
      return content;
    }
  };
  const defaultChatContent = `Chat about your weekend

Reply to chat messages (30-40 words each):

Alex: Hi! Did you do anything fun last weekend?
Your reply: _______

Sam: What's your favorite thing to do on weekends?
Your reply: _______

Jordan: Did you go anywhere during the weekend?
Your reply: _______`;

  const [chatContent, setChatContent] = React.useState(parseContent(questionData?.content || questionData?.chatContent || defaultChatContent));
  const [errors, setErrors] = React.useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Validate chat content
    if (!chatContent.trim()) {
      newErrors.chatContent = 'Chat content is required';
    } else {
      // Check if contains basic chat structure
      const content = chatContent.toLowerCase();
      if (!content.includes('reply') || !content.includes(':')) {
        newErrors.chatContent = 'Nên có cấu trúc chat với câu hỏi và phần reply';
      }
    }
    
    setErrors(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    
    // Send data to parent when valid
    if (isValid && onChange) {
      const formData = {
        content: chatContent.trim(),
        type: 'writing_chat_responses'
      };
      onChange(JSON.stringify(formData));
    }
    
    if (onValidate) {
      onValidate(isValid, newErrors);
    }
    
    return isValid;
  };

  // Remove auto-validation useEffect - causes infinite loops
  // Data will be sent via manual save button only

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Writing Task 3 - Chat Responses (B1)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Hướng dẫn:</Typography>
        <Typography variant="body2">
          • Tạo kịch bản chat với 3 câu hỏi cần trả lời<br/>
          • Mỗi response 30-40 từ<br/>
          • Cấp độ: B1, Scale: 0-5 (AI chấm)
        </Typography>
      </Alert>

      {/* Level and Scale Info */}
      <Box sx={{ mb: 3 }}>
        <Chip label="Level: B1" color="primary" variant="outlined" sx={{ mr: 1 }} />
        <Chip label="Scale: 0-5" color="secondary" variant="outlined" />
      </Box>

      {/* Chat Content */}
      <TextField
        fullWidth
        multiline
        rows={12}
        label="Nội dung chat (đầy đủ scenario + 3 câu hỏi)"
        value={chatContent}
        onChange={(e) => setChatContent(e.target.value)}
        error={!!errors.chatContent}
        helperText={errors.chatContent || 'Nhập đầy đủ: chủ đề chat, context và 3 câu hỏi với phần reply'}
        sx={{ mb: 2 }}
      />

      {/* Preview */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <ChatIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle2">Xem trước (Format như seed):</Typography>
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
          {chatContent || 'Chưa có nội dung...'}
        </Typography>
      </Paper>

      {/* Manual Validation Button */}
      <Button
        onClick={validateForm}
        variant="contained"
        color="info"
        size="small"
        sx={{ mb: 3 }}
      >
        Kiểm tra câu hỏi
      </Button>

      {/* Validation Status */}
      {Object.keys(errors).length === 0 && chatContent && (
        <Alert severity="success" icon={<CheckCircle />}>
          Câu hỏi Writing Chat Responses hợp lệ!
        </Alert>
      )}

      {/* Show validation errors */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Cần hoàn thiện:</Typography>
          {Object.entries(errors).map(([field, message]) => (
            <Typography key={field} variant="body2">• {message}</Typography>
          ))}
        </Alert>
      )}
    </Box>
  );
};

export default WritingChatResponsesForm;