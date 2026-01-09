'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert
} from '@mui/material';
import { Add, Delete, DragIndicator } from '@mui/icons-material';

/**
 * Form component for Reading Ordering questions
 * Based on seed data structure from 05-seed-questions.js
 */
export default function OrderingForm({ content, onChange }) {
  const [title, setTitle] = useState('');
  const [passage, setPassage] = useState('');
  const [sentences, setSentences] = useState(['', '', '', '']);

  // Parse existing content if available
  useEffect(() => {
    if (content) {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        setTitle(parsed.title || '');
        setPassage(parsed.passage || '');
        setSentences(parsed.sentences || ['', '', '', '']);
      } catch (error) {
        // If content is not JSON, treat as passage
        setPassage(content);
      }
    }
  }, [content]);

  // Update parent component when data changes
  useEffect(() => {
    const questionData = {
      title,
      passage,
      sentences: sentences.filter(s => s.trim()),
      correctOrder: sentences
        .map((_, index) => index + 1)
        .filter((_, index) => sentences[index].trim())
    };
    
    const jsonString = JSON.stringify(questionData);
    if (jsonString !== content) {
      onChange(jsonString);
    }
  }, [title, passage, sentences, content]); // Add content to dependencies but NOT onChange

  const handleSentenceChange = (index, text) => {
    const newSentences = [...sentences];
    newSentences[index] = text;
    setSentences(newSentences);
  };

  const addSentence = () => {
    if (sentences.length < 8) {
      setSentences([...sentences, '']);
    }
  };

  const removeSentence = (index) => {
    if (sentences.length > 2) {
      const newSentences = sentences.filter((_, i) => i !== index);
      setSentences(newSentences);
    }
  };

  const loadSampleTemplate = () => {
    setTitle('Tom Harper (Biography Ordering)');
    setPassage('This is the short summary of Tom Harper life.');
    setSentences([
      'When he was young, he began writing short stories for a magazine.',
      'He soon wrote regularly for that magazine, sharing his creative ideas with many readers.',
      'At one point, he almost left his job, but then he decided to create unusual characters.',
      'The characters he imagined became some of the most famous in literature.',
      'This popularity made him rich and successful.'
    ]);
  };

  const moveSentence = (index, direction) => {
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < sentences.length - 1)
    ) {
      const newSentences = [...sentences];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Hoán đổi vị trí
      [newSentences[index], newSentences[targetIndex]] = [newSentences[targetIndex], newSentences[index]];
      setSentences(newSentences);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Reading - Ordering
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tạo câu hỏi sắp xếp câu theo thứ tự đúng
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          size="small"
          onClick={loadSampleTemplate}
        >
          Tải mẫu
        </Button>
      </Box>

      {/* Title */}
      <TextField
        fullWidth
        label="Tiêu đề câu hỏi"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 3 }}
        placeholder="VD: Put the sentences in the correct order"
        helperText="Tiêu đề ngắn gọn mô tả câu hỏi"
      />

      {/* Passage */}
      <TextField
        fullWidth
        multiline
        rows={6}
        label="Đoạn văn bối cảnh (tùy chọn)"
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        sx={{ mb: 3 }}
        placeholder="Nhập đoạn văn bối cảnh nếu cần..."
        helperText="Đoạn văn giúp học sinh hiểu bối cảnh để sắp xếp câu"
      />

      {/* Sentences */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Các câu cần sắp xếp ({sentences.filter(s => s.trim()).length} câu)
          </Typography>
          <Button
            startIcon={<Add />}
            onClick={addSentence}
            variant="outlined"
            size="small"
            disabled={sentences.length >= 8}
          >
            Thêm câu
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Thứ tự hiện tại là thứ tự đúng. Sử dụng nút mũi tên để thay đổi thứ tự.
        </Typography>

      <List>
        {sentences.map((sentence, index) => (
          <ListItem key={index} component={Paper} sx={{ mb: 1, p: 2 }}>
            <DragIndicator sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography sx={{ minWidth: 30, fontWeight: 'bold' }}>
              {index + 1}.
            </Typography>
            <TextField
              fullWidth
              placeholder={`Câu ${index + 1}`}
              value={sentence}
              onChange={(e) => handleSentenceChange(index, e.target.value)}
              size="small"
              sx={{ mx: 2 }}
            />
            <ListItemSecondaryAction>
              <Box display="flex" gap={0.5}>
                <IconButton
                  size="small"
                  onClick={() => moveSentence(index, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUpward />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => moveSentence(index, 'down')}
                  disabled={index === sentences.length - 1}
                >
                  <ArrowDownward />
                </IconButton>
                {sentences.length > 2 && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeSentence(index)}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      </Paper>

      {/* Preview */}
      <Paper elevation={1} sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Xem trước câu hỏi
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>{title}</strong>
        </Typography>
        
        {passage && (
          <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
            {passage.substring(0, 200)}{passage.length > 200 ? '...' : ''}
          </Typography>
        )}
        
        <Typography variant="body2" color="text.secondary">
          • {sentences.filter(s => s.trim()).length} câu cần sắp xếp
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Thứ tự đúng: {sentences.map((s, i) => s.trim() ? i + 1 : null).filter(Boolean).join(' → ')}
        </Typography>
      </Paper>
    </Box>
  );
}