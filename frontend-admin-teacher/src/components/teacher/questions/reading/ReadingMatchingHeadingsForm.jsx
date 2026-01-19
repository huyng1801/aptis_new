'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider
} from '@mui/material';
import { Add, Delete, CheckCircle, Warning } from '@mui/icons-material';

/**
 * Reading Matching Headings Form - Part 4 của Reading skill
 * Dựa trên seed data: 7 câu, 16 điểm (~2.29 điểm/câu)
 * Ghép tiêu đề với đoạn văn
 */
export default function ReadingMatchingHeadingsForm({ content, onChange }) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.');
  const [passages, setPassages] = useState([{ text: '', heading: '' }]);
  const [headingOptions, setHeadingOptions] = useState(['']);
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [isValidated, setIsValidated] = useState(false);

  // Parse existing content if available
  useEffect(() => {
    if (content) {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        setTitle(parsed.title || '');
        setInstructions(parsed.instructions || 'Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.');
        setPassages(parsed.passages || [{ text: '', heading: '' }]);
        setHeadingOptions(parsed.headingOptions || ['']);
      } catch (error) {
        // If content is not JSON, treat as title
        setTitle(content || '');
      }
    }
  }, [content]);

  // Validation function - called manually, not auto
  const validateData = useCallback(() => {
    const newErrors = {};
    
    // Check title
    if (!title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }
    
    // Check instructions
    if (!instructions.trim()) {
      newErrors.instructions = 'Hướng dẫn làm bài không được để trống';
    }
    
    // Check passages
    const validPassages = passages.filter(p => p.text.trim());
    if (validPassages.length < 2) {
      newErrors.passages = 'Phải có ít nhất 2 đoạn văn';
    }
    
    // Check heading options
    const validHeadings = headingOptions.filter(h => h.trim());
    if (validHeadings.length < validPassages.length) {
      newErrors.headingOptions = 'Số lượng tiêu đề phải ít nhất bằng số đoạn văn';
    }
    
    // Check if all passages have correct headings assigned
    for (const passage of validPassages) {
      if (!passage.heading || !validHeadings.includes(passage.heading)) {
        newErrors.passages = 'Tất cả đoạn văn phải có tiêu đề hợp lệ';
        break;
      }
    }
    
    // Check for duplicate heading assignments
    const assignedHeadings = validPassages.map(p => p.heading).filter(h => h);
    const uniqueAssignedHeadings = [...new Set(assignedHeadings)];
    if (assignedHeadings.length !== uniqueAssignedHeadings.length) {
      newErrors.passages = 'Mỗi tiêu đề chỉ được sử dụng cho một đoạn văn';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    return isValid;
  }, [title, instructions, passages, headingOptions]);

  // Remove auto-validation useEffect - causes infinite loops
  // Data is sent to parent on every change (via onChange)
  // Validation is only called on demand via button click

  // Update parent component
  useEffect(() => {
    const questionData = {
      title: title.trim(),
      instructions: instructions.trim(),
      passages: passages.filter(p => p.text.trim()),
      headingOptions: headingOptions.filter(h => h.trim())
    };
    
    if (onChange) {
      onChange(JSON.stringify(questionData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, instructions, passages, headingOptions]);

  // Handle adding new passage
  const handleAddPassage = () => {
    setPassages([...passages, { text: '', heading: '' }]);
  };

  // Handle removing passage
  const handleRemovePassage = (index) => {
    const newPassages = passages.filter((_, i) => i !== index);
    setPassages(newPassages);
  };

  // Handle passage change
  const handlePassageChange = (index, field, value) => {
    const newPassages = [...passages];
    newPassages[index][field] = value;
    setPassages(newPassages);
  };

  // Handle adding new heading option
  const handleAddHeadingOption = () => {
    setHeadingOptions([...headingOptions, '']);
  };

  // Handle removing heading option
  const handleRemoveHeadingOption = (index) => {
    const removedHeading = headingOptions[index];
    const newHeadingOptions = headingOptions.filter((_, i) => i !== index);
    setHeadingOptions(newHeadingOptions);
    
    // Remove this heading from any passages that use it
    if (removedHeading) {
      const updatedPassages = passages.map(passage => ({
        ...passage,
        heading: passage.heading === removedHeading ? '' : passage.heading
      }));
      setPassages(updatedPassages);
    }
  };

  // Handle heading option change
  const handleHeadingOptionChange = (index, value) => {
    const oldHeading = headingOptions[index];
    const newHeadingOptions = [...headingOptions];
    newHeadingOptions[index] = value;
    setHeadingOptions(newHeadingOptions);
    
    // Update passages that use the old heading
    if (oldHeading) {
      const updatedPassages = passages.map(passage => ({
        ...passage,
        heading: passage.heading === oldHeading ? value : passage.heading
      }));
      setPassages(updatedPassages);
    }
  };

  // Get available heading options (excluding already used ones)
  const getAvailableHeadings = (currentHeading = '') => {
    const usedHeadings = passages
      .map(p => p.heading)
      .filter(h => h && h !== currentHeading);
    
    return headingOptions.filter(h => h.trim() && (!usedHeadings.includes(h) || h === currentHeading));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Reading - Matching Headings (Part 4)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Hướng dẫn:</Typography>
        <Typography variant="body2">
          • Tạo 7 đoạn văn với chủ đề khác nhau<br/>
          • Tạo tiêu đề phù hợp cho từng đoạn (có thể thêm tiêu đề nhiễu)<br/>
          • Điểm: ~2.29 điểm/câu đúng, tối đa 7 câu (16 điểm)
        </Typography>
      </Alert>

      {/* Title */}
      <TextField
        fullWidth
        label="Tiêu đề chung"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={!!errors.title}
        helperText={errors.title}
        sx={{ mb: 3 }}
        placeholder="Environmental Challenges"
      />

      {/* Instructions */}
      <TextField
        fullWidth
        label="Hướng dẫn làm bài"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        error={!!errors.instructions}
        helperText={errors.instructions}
        sx={{ mb: 3 }}
        placeholder="Read the passage quickly. Choose a heading for each numbered paragraph..."
      />

      {/* Heading Options */}
      <Typography variant="subtitle1" gutterBottom>
        Các tiêu đề để chọn:
      </Typography>
      
      {headingOptions.map((heading, index) => (
        <Box key={index} display="flex" alignItems="center" mb={2}>
          <TextField
            value={heading}
            onChange={(e) => handleHeadingOptionChange(index, e.target.value)}
            label={`Tiêu đề ${index + 1}`}
            size="small"
            sx={{ flexGrow: 1, mr: 1 }}
            placeholder="Climate Change Effects"
          />
          <IconButton
            onClick={() => handleRemoveHeadingOption(index)}
            disabled={headingOptions.length <= 1}
            color="error"
            size="small"
          >
            <Delete />
          </IconButton>
        </Box>
      ))}
      
      <Button
        onClick={handleAddHeadingOption}
        startIcon={<Add />}
        variant="outlined"
        size="small"
        sx={{ mb: 3 }}
      >
        Thêm tiêu đề
      </Button>

      <Divider sx={{ my: 3 }} />

      {/* Passages */}
      <Typography variant="subtitle1" gutterBottom>
        Các đoạn văn:
      </Typography>
      
      {passages.map((passage, index) => (
        <Paper key={index} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="subtitle2" sx={{ mr: 2, minWidth: '80px' }}>
              Đoạn {index + 1}:
            </Typography>
            <FormControl size="small" sx={{ minWidth: '200px', mr: 2 }}>
              <InputLabel>Tiêu đề đúng</InputLabel>
              <Select
                value={passage.heading}
                onChange={(e) => handlePassageChange(index, 'heading', e.target.value)}
                label="Tiêu đề đúng"
              >
                <MenuItem value="">Chọn tiêu đề...</MenuItem>
                {getAvailableHeadings(passage.heading).map((heading) => (
                  <MenuItem key={heading} value={heading}>
                    {heading}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box flexGrow={1} />
            <IconButton
              onClick={() => handleRemovePassage(index)}
              disabled={passages.length <= 1}
              color="error"
              size="small"
            >
              <Delete />
            </IconButton>
          </Box>
          
          <TextField
            fullWidth
            label={`Nội dung đoạn ${index + 1}`}
            value={passage.text}
            onChange={(e) => handlePassageChange(index, 'text', e.target.value)}
            multiline
            rows={4}
            size="small"
            placeholder="Nhập nội dung đoạn văn..."
          />
        </Paper>
      ))}
      
      <Button
        onClick={handleAddPassage}
        startIcon={<Add />}
        variant="outlined"
        size="small"
        sx={{ mb: 3 }}
      >
        Thêm đoạn văn
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

      {/* Preview */}
      {passages.filter(p => p.text.trim()).length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom>
            Xem trước bài làm:
          </Typography>
          {passages.filter(p => p.text.trim()).map((passage, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Đoạn {index + 1}: [Dropdown: {passage.heading || 'Chưa chọn tiêu đề'}]
              </Typography>
              <Typography variant="body2" sx={{ pl: 2 }}>
                {passage.text.length > 100 ? passage.text.substring(0, 100) + '...' : passage.text}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* Validation Status */}
      {isValidated && (
        <Alert severity="success" icon={<CheckCircle />}>
          Câu hỏi Matching Headings hợp lệ!
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