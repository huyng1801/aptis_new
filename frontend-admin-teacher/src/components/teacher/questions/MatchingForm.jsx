'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Button,
  IconButton,
  Grid,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

/**
 * MatchingForm component for different types of matching questions
 * Based on seed data structure from 05-seed-questions.js
 */
export default function MatchingForm({ 
  content, 
  onChange, 
  personMatching = false,
  headingMatching = false,
  speakerMatching = false,
  statementMatching = false
}) {
  // State based on matching type
  const [title, setTitle] = useState('');
  const [passage, setPassage] = useState('');
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState([]);
  
  // Initialize structure based on matching type
  useEffect(() => {
    if (content) {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        setTitle(parsed.title || '');
        setPassage(parsed.content || parsed.passage || '');
        setItems(parsed.items || parsed.questions || parsed.paragraphs || []);
        setOptions(parsed.options || parsed.headingOptions || []);
      } catch (error) {
        initializeDefaultStructure();
      }
    } else {
      initializeDefaultStructure();
    }
  }, [content]);

  const initializeDefaultStructure = () => {
    if (headingMatching) {
      // Reading Matching Headings structure
      setTitle('Vegetarian Food');
      setPassage('Read the passage quickly. Choose a heading for each numbered paragraph (1-5) from the drop-down box.');
      setItems([
        { num: 1, text: 'PARAGRAPH 1: No longer seeing food as simply protein from animals...', correct: 3 },
        { num: 2, text: 'PARAGRAPH 2: Understanding the different reasons individuals are making them...', correct: 8 }
      ]);
      setOptions([
        'Understanding the possible global food crisis and its causes',
        'Recipes for popular vegetarian dishes',
        'Diverse types of vegetarian meals',
        'The ethical and environmental implications of factory farming',
        'Numerous health benefits of plant-based diets',
        'Shared global responsibility towards sustainable eating',
        'Respect for life: embracing compassion for all living beings',
        'Various explanations behind dietary choices and preferences'
      ]);
    } else if (personMatching) {
      // Reading Person Matching structure  
      setTitle('Four people share their feelings about reading books');
      setPassage('Four people share their feelings about reading books. Read their answers and answer the questions below.');
      setItems([
        { text: 'Who thinks reading factual books is boring?', correct: 'A' },
        { text: 'Who reads more than another family member?', correct: 'B' },
        { text: 'Who has limited time for reading?', correct: 'A' },
        { text: 'Who has difficulty in finishing a book?', correct: 'D' },
        { text: 'Who reads many books at once?', correct: 'C' }
      ]);
      setOptions(['Person A', 'Person B', 'Person C', 'Person D']);
    } else if (speakerMatching) {
      // Listening Speaker Matching structure
      setTitle('Speaker Matching');
      setPassage('Listen to each speaker and match them with the correct option.');
      setItems([
        { speaker: 'Speaker 1', text: 'First speaker talking about...', correct: 'A' },
        { speaker: 'Speaker 2', text: 'Second speaker talking about...', correct: 'B' }
      ]);
      setOptions(['Option A', 'Option B', 'Option C', 'Option D']);
    } else if (statementMatching) {
      // Listening Statement Matching structure
      setTitle('Statement Matching');
      setPassage('Listen to the conversation and match each statement with the correct person.');
      setItems([
        { statement: 'Statement 1', text: 'First statement content...', correct: 'Person A' },
        { statement: 'Statement 2', text: 'Second statement content...', correct: 'Person B' }
      ]);
      setOptions(['Person A', 'Person B', 'Person C']);
    } else {
      // Default structure
      setItems([{ text: '', correct: 'A' }]);
      setOptions(['Option A', 'Option B', 'Option C', 'Option D']);
    }
  };

  // Update parent when data changes
  useEffect(() => {
    const questionData = {
      title,
      content: passage,
      items,
      options
    };
    const jsonString = JSON.stringify(questionData);
    if (jsonString !== content) {
      onChange(jsonString);
    }
  }, [title, passage, items, options, content]); // Add content to dependencies but NOT onChange

  const getFormTitle = () => {
    if (headingMatching) return 'Reading - Matching Headings';
    if (personMatching) return 'Reading - Person Matching';
    if (speakerMatching) return 'Listening - Speaker Matching';
    if (statementMatching) return 'Listening - Statement Matching';
    return 'Matching Question';
  };

  const getFormDescription = () => {
    if (headingMatching) return 'Tạo câu hỏi ghép tiêu đề với đoạn văn';
    if (personMatching) return 'Tạo câu hỏi ghép câu hỏi với người nói';
    if (speakerMatching) return 'Tạo câu hỏi ghép người nói với tình huống';
    if (statementMatching) return 'Tạo câu hỏi ghép phát biểu với người nói';
    return 'Tạo câu hỏi ghép đôi';
  };

  const addItem = () => {
    const newItem = headingMatching 
      ? { num: items.length + 1, text: '', correct: 1 }
      : personMatching 
      ? { text: '', correct: 'A' }
      : speakerMatching
      ? { speaker: `Speaker ${items.length + 1}`, text: '', correct: 'A' }
      : { statement: `Statement ${items.length + 1}`, text: '', correct: 'Person A' };
    setItems([...items, newItem]);
  };

  const loadSampleTemplate = () => {
    if (headingMatching) {
      setTitle('Vegetarian Food');
      setPassage('Read the passage quickly. Choose a heading for each numbered paragraph (1-5) from the drop-down box.\n\nAvailable Headings:\n- Understanding the possible global food crisis and its causes\n- Recipes for popular vegetarian dishes\n- Diverse types of vegetarian meals\n- The ethical and environmental implications of factory farming\n- Numerous health benefits of plant-based diets\n- Shared global responsibility towards sustainable eating\n- Respect for life: embracing compassion for all living beings\n- Various explanations behind dietary choices and preferences\n\nPARAGRAPH 1:\nNo longer seeing food as simply protein from animals, there are innumerable options for those opting not to eat meat. From vibrant salads loaded with fresh vegetables to hearty plant-based entrees and numerous delicious desserts, the possibilities are endless.\n\nPARAGRAPH 2:\nUnderstanding the different reasons individuals are making them. Many people opt for a vegetarian diet for health considerations. Some may be motivated by cultural traditions or personal beliefs.');
      setItems([
        { num: 1, text: 'PARAGRAPH 1: No longer seeing food as simply protein from animals, there are innumerable options for those opting not to eat meat. From vibrant salads loaded with fresh vegetables to hearty plant-based entrees and numerous delicious desserts, the possibilities are endless.', correct: 3 },
        { num: 2, text: 'PARAGRAPH 2: Understanding the different reasons individuals are making them. Many people opt for a vegetarian diet for health considerations. Some may be motivated by cultural traditions or personal beliefs, while others seek new culinary experiences.', correct: 8 }
      ]);
      setOptions([
        'Understanding the possible global food crisis and its causes',
        'Recipes for popular vegetarian dishes',
        'Diverse types of vegetarian meals',
        'The ethical and environmental implications of factory farming',
        'Numerous health benefits of plant-based diets',
        'Shared global responsibility towards sustainable eating',
        'Respect for life: embracing compassion for all living beings',
        'Various explanations behind dietary choices and preferences'
      ]);
    } else if (personMatching) {
      setTitle('Four people share their feelings about reading books');
      setPassage('Four people share their feelings about reading books. Read their answers and answer the questions below.\n\nPerson A: I have to read a lot for my job, and I find that reading factual books is often boring. The material tends to be dry and lacks excitement. After a long day at work, I usually feel too exhausted to read much, which means I have limited time for reading anything enjoyable.\n\nPerson B: My wife is always complaining that she can\'t read many books. I don\'t have that problem because I plan the reading schedule carefully. I set aside specific times each week for reading, which helps me stay on track.\n\nPerson C: When I was a child, I struggled to finish one book at a time. It felt overwhelming to stay focused on a single story. However, now that I\'m older, I enjoy exploring many genres and even read multiple books at once.\n\nPerson D: I keep a novel on the bedside table because I want to read before sleeping. However, I often find myself getting sleepy as soon as I start reading, which makes it difficult to concentrate.');
      setItems([
        { text: 'Who thinks reading factual books is boring?', correct: 'A' },
        { text: 'Who reads more than another family member?', correct: 'B' },
        { text: 'Who has limited time for reading?', correct: 'A' },
        { text: 'Who has difficulty in finishing a book?', correct: 'D' },
        { text: 'Who reads many books at once?', correct: 'C' }
      ]);
      setOptions(['Person A', 'Person B', 'Person C', 'Person D']);
    }
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addOption = () => {
    if (headingMatching) {
      setOptions([...options, '']);
    } else if (personMatching || statementMatching) {
      const nextLetter = String.fromCharCode(65 + options.length);
      setOptions([...options, `Person ${nextLetter}`]);
    } else {
      const nextLetter = String.fromCharCode(65 + options.length);
      setOptions([...options, `Option ${nextLetter}`]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" gutterBottom>
            {getFormTitle()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getFormDescription()}
          </Typography>
        </Box>
        {(headingMatching || personMatching) && (
          <Button 
            variant="outlined" 
            size="small"
            onClick={loadSampleTemplate}
          >
            Tải mẫu
          </Button>
        )}
      </Box>

      {/* Title */}
      <TextField
        fullWidth
        label="Tiêu đề câu hỏi"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="VD: Four people share their feelings about reading books"
        sx={{ mb: 3 }}
        helperText="Tiêu đề ngắn gọn mô tả nội dung câu hỏi"
      />

      {/* Passage/Content */}
      <TextField
        fullWidth
        multiline
        rows={8}
        label={headingMatching ? "Đoạn văn chính với các paragraph" : "Nội dung/Audio script"}
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        placeholder={headingMatching 
          ? "PARAGRAPH 1:\nNo longer seeing food as simply protein from animals..."
          : personMatching
          ? "Person A: I have to read a lot for my job..."
          : "Nhập nội dung audio script hoặc mô tả tình huống..."
        }
        sx={{ mb: 3 }}
        helperText={headingMatching ? "Đoạn văn với các paragraph được đánh số" : "Nội dung mô tả tình huống hoặc thông tin cần matching"}
      />

      {/* Options/Choices */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {headingMatching ? 'Danh sách tiêu đề' : personMatching ? 'Danh sách người' : speakerMatching ? 'Các lựa chọn' : 'Người nói'}
            ({options.length})
          </Typography>
          <Button
            startIcon={<Add />}
            onClick={addOption}
            variant="outlined"
            size="small"
          >
            Thêm {headingMatching ? 'tiêu đề' : personMatching ? 'người' : 'lựa chọn'}
          </Button>
        </Box>
        
        {options.map((option, index) => (
          <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="body2" sx={{ minWidth: 30 }}>
              {headingMatching ? `${index + 1}.` : personMatching || statementMatching ? `${String.fromCharCode(65 + index)}.` : `${String.fromCharCode(65 + index)}.`}
            </Typography>
            <TextField
              fullWidth
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={headingMatching 
                ? `Tiêu đề ${index + 1}...` 
                : personMatching 
                ? `Người ${String.fromCharCode(65 + index)}...`
                : `Lựa chọn ${String.fromCharCode(65 + index)}...`
              }
              size="small"
            />
            <IconButton
              size="small"
              color="error"
              onClick={() => removeOption(index)}
              disabled={options.length <= 2}
            >
              <Delete />
            </IconButton>
          </Box>
        ))}
      </Paper>

      {/* Items to be matched */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {headingMatching ? 'Đoạn văn cần ghép tiêu đề' : personMatching ? 'Câu hỏi cần ghép' : speakerMatching ? 'Speakers' : 'Statements'} 
            ({items.length})
          </Typography>
          <Button
            startIcon={<Add />}
            onClick={addItem}
            variant="outlined"
            size="small"
          >
            Thêm {headingMatching ? 'đoạn văn' : personMatching ? 'câu hỏi' : speakerMatching ? 'speaker' : 'statement'}
          </Button>
        </Box>
        
        {items.map((item, index) => (
          <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            {headingMatching && (
              <TextField
                fullWidth
                label={`Paragraph ${item.num || index + 1}`}
                value={item.text || ''}
                onChange={(e) => updateItem(index, 'text', e.target.value)}
                multiline
                rows={3}
                placeholder={`PARAGRAPH ${index + 1}: Nhập nội dung đoạn văn...`}
                sx={{ mb: 2 }}
              />
            )}
            
            {personMatching && (
              <TextField
                fullWidth
                label={`Câu hỏi ${index + 1}`}
                value={item.text || ''}
                onChange={(e) => updateItem(index, 'text', e.target.value)}
                placeholder="VD: Who thinks reading factual books is boring?"
                sx={{ mb: 2 }}
              />
            )}
            
            {speakerMatching && (
              <TextField
                fullWidth
                label={`${item.speaker || `Speaker ${index + 1}`}`}
                value={item.text || ''}
                onChange={(e) => updateItem(index, 'text', e.target.value)}
                multiline
                rows={2}
                placeholder="Mô tả nội dung speaker nói..."
                sx={{ mb: 2 }}
              />
            )}
            
            {statementMatching && (
              <TextField
                fullWidth
                label={`${item.statement || `Statement ${index + 1}`}`}
                value={item.text || ''}
                onChange={(e) => updateItem(index, 'text', e.target.value)}
                multiline
                rows={2}
                placeholder="Nội dung statement..."
                sx={{ mb: 2 }}
              />
            )}
            
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2">Đáp án đúng:</Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={item.correct || ''}
                  onChange={(e) => updateItem(index, 'correct', e.target.value)}
                >
                  {options.map((option, optIndex) => (
                    <MenuItem key={optIndex} value={headingMatching ? optIndex + 1 : personMatching || statementMatching ? String.fromCharCode(65 + optIndex) : String.fromCharCode(65 + optIndex)}>
                      {headingMatching 
                        ? `Tiêu đề ${optIndex + 1}` 
                        : personMatching || statementMatching
                        ? `${String.fromCharCode(65 + optIndex)} - ${option.substring(0, 20)}...`
                        : `${String.fromCharCode(65 + optIndex)} - ${option.substring(0, 20)}...`
                      }
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <IconButton
                size="small"
                color="error"
                onClick={() => removeItem(index)}
                disabled={items.length <= 1}
              >
                <Delete />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Paper>

      {/* Preview */}
      <Paper elevation={1} sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Xem trước câu hỏi
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>{title}</strong>
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
          {passage.substring(0, 300)}...
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          • {items.length} mục cần ghép với {options.length} lựa chọn
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Loại: {getFormTitle()}
        </Typography>
      </Paper>
    </Box>
  );
}