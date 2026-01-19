'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper
} from '@mui/material';
import { Add, Delete, DragIndicator, CheckCircle, Warning } from '@mui/icons-material';

/**
 * Reading Ordering Form - Part 2 của Reading skill  
 * Dựa trên seed data: 5 câu, 5 điểm (1 điểm/câu)
 * Sắp xếp các câu theo thứ tự đúng
 */
export default function ReadingOrderingForm({ content, onChange }) {
  const [title, setTitle] = useState('');
  const [passage, setPassage] = useState('');
  const [sentences, setSentences] = useState(['']);
  const [correctOrder, setCorrectOrder] = useState([1]);
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [isValidated, setIsValidated] = useState(false);

  // Parse existing content if available
  useEffect(() => {
    if (content) {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        setTitle(parsed.title || '');
        setPassage(parsed.passage || '');
        setSentences(parsed.sentences || ['']);
        setCorrectOrder(parsed.correctOrder || [1]);
      } catch (error) {
        // If content is not JSON, treat as title
        setTitle(content || '');
      }
    }
  }, [content]);

  // Validation function
  const validateData = useCallback(() => {
    const newErrors = {};
    
    // Check title
    if (!title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }
    
    // Check passage
    if (!passage.trim()) {
      newErrors.passage = 'Mô tả ngắn gọn không được để trống';
    }
    
    // Check sentences
    const validSentences = sentences.filter(sent => sent.trim());
    if (validSentences.length < 2) {
      newErrors.sentences = 'Phải có ít nhất 2 câu để sắp xếp';
    }
    
    // Check correct order
    const validOrderLength = correctOrder.filter(order => order > 0).length;
    if (validOrderLength !== validSentences.length) {
      newErrors.correctOrder = `Thứ tự phải có ${validSentences.length} số từ 1 đến ${validSentences.length}`;
    } else {
      // Check if all numbers from 1 to length exist
      const sortedOrder = [...correctOrder].sort();
      const expectedOrder = Array.from({length: validSentences.length}, (_, i) => i + 1);
      if (JSON.stringify(sortedOrder) !== JSON.stringify(expectedOrder)) {
        newErrors.correctOrder = 'Thứ tự phải chứa tất cả số từ 1 đến ' + validSentences.length;
      }
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    
    // Send data to parent when valid
    if (isValid && onChange) {
      const validSentences = sentences.filter(sent => sent.trim());
      const formData = {
        title: title.trim(),
        passage: passage.trim(),
        sentences: validSentences,
        correctOrder: correctOrder,
        type: 'reading_ordering'
      };
      onChange(JSON.stringify(formData));
    }
    
    return isValid;
  }, [title, passage, sentences, correctOrder, onChange]);

  // Remove auto-validation useEffect - causes infinite loops
  // Data is sent to parent on every change (via onChange)
  // Validation is only called on demand via button click

  // Remove auto-update useEffect - causes infinite loops
  // Data will be sent via manual save button only

  // Handle adding new sentence
  const handleAddSentence = () => {
    setSentences([...sentences, '']);
    setCorrectOrder([...correctOrder, correctOrder.length + 1]);
  };

  // Handle removing sentence
  const handleRemoveSentence = (index) => {
    const newSentences = sentences.filter((_, i) => i !== index);
    setSentences(newSentences);
    
    // Adjust correct order
    const newOrder = correctOrder.filter((_, i) => i !== index)
      .map(order => order > (index + 1) ? order - 1 : order);
    setCorrectOrder(newOrder);
  };

  // Handle sentence change
  const handleSentenceChange = (index, value) => {
    const newSentences = [...sentences];
    newSentences[index] = value;
    setSentences(newSentences);
  };

  // Handle correct order change
  const handleOrderChange = (index, value) => {
    const newOrder = [...correctOrder];
    newOrder[index] = parseInt(value) || 1;
    setCorrectOrder(newOrder);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Reading - Ordering (Part 2)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Hướng dẫn:</Typography>
        <Typography variant="body2">
          • Tạo 5 câu cần sắp xếp theo thứ tự logic<br/>
          • Mỗi câu sẽ được hiển thị ngẫu nhiên cho học viên<br/>
          • Điểm: 1 điểm/câu đúng, tối đa 5 câu (5 điểm)
        </Typography>
      </Alert>

      {/* Title */}
      <TextField
        fullWidth
        label="Tiêu đề (chủ đề sắp xếp)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={!!errors.title}
        helperText={errors.title}
        sx={{ mb: 3 }}
        placeholder="Tom Harper (Biography Ordering)"
      />

      {/* Passage (Short description) */}
      <TextField
        fullWidth
        label="Mô tả ngắn gọn"
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        error={!!errors.passage}
        helperText={errors.passage}
        sx={{ mb: 3 }}
        placeholder="This is the short summary of Tom Harper life."
      />

      {/* Sentences */}
      <Typography variant="subtitle1" gutterBottom>
        Các câu cần sắp xếp:
      </Typography>
      
      {sentences.map((sentence, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="body2" sx={{ minWidth: '80px', mr: 1 }}>
              Câu {index + 1}:
            </Typography>
            <TextField
              fullWidth
              value={sentence}
              onChange={(e) => handleSentenceChange(index, e.target.value)}
              size="small"
              sx={{ mr: 1 }}
              placeholder="Nhập nội dung câu..."
            />
            <TextField
              label="Thứ tự"
              type="number"
              value={correctOrder[index] || 1}
              onChange={(e) => handleOrderChange(index, e.target.value)}
              size="small"
              sx={{ width: '80px', mr: 1 }}
              inputProps={{ min: 1, max: sentences.filter(s => s.trim()).length }}
            />
            <IconButton
              onClick={() => handleRemoveSentence(index)}
              disabled={sentences.length <= 1}
              color="error"
              size="small"
            >
              <Delete />
            </IconButton>
          </Box>
        </Box>
      ))}
      
      <Button
        onClick={handleAddSentence}
        startIcon={<Add />}
        variant="outlined"
        size="small"
        sx={{ mb: 3 }}
        disabled={sentences.length >= 10}
      >
        Thêm câu
      </Button>

      {/* Manual Validation Button */}
      <Button
        onClick={validateData}
        variant="contained"
        color="info"
        size="small"
        sx={{ mb: 3, ml: 1 }}
      >
        Kiểm tra câu hỏi
      </Button>

      {/* Preview correct order */}
      {sentences.filter(s => s.trim()).length > 1 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom>
            Thứ tự đúng:
          </Typography>
          <List dense>
            {correctOrder
              .map((order, originalIndex) => ({ order, originalIndex }))
              .sort((a, b) => a.order - b.order)
              .map(({ order, originalIndex }, displayIndex) => {
                const sentence = sentences[originalIndex];
                if (!sentence.trim()) return null;
                return (
                  <ListItem key={originalIndex} divider>
                    <ListItemText
                      primary={`${displayIndex + 1}. ${sentence}`}
                      secondary={`(Câu gốc số ${originalIndex + 1})`}
                    />
                  </ListItem>
                );
              })}
          </List>
        </Paper>
      )}

      {/* Validation Status */}
      {isValidated && (
        <Alert severity="success" icon={<CheckCircle />}>
          Câu hỏi Ordering hợp lệ!
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
}