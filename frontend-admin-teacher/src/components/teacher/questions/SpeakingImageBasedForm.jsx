'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import { CloudUpload, Delete, Image as ImageIcon, Add } from '@mui/icons-material';

/**
 * Component đặc biệt cho SPEAKING_DESCRIPTION và SPEAKING_COMPARISON
 * 1 câu hỏi chính có ảnh + 2 câu hỏi con không có ảnh (cùng tham chiếu ảnh của câu chính)
 */
export default function SpeakingImageBasedForm({ questionType, initialData, onSubmit, onBack }) {
  const isSpeakingDescription = questionType?.code === 'SPEAKING_DESCRIPTION';
  const isSpeakingComparison = questionType?.code === 'SPEAKING_COMPARISON';
  
  // Main question (parent) data
  const [mainQuestion, setMainQuestion] = useState({
    content: initialData?.content || '',
    difficulty: initialData?.difficulty || 'medium',
    duration_seconds: initialData?.duration_seconds || 150,
    additional_media: initialData?.additional_media || [],
    imageFiles: [],
    imagePreviews: []
  });

  // Child questions data
  const [childQuestions, setChildQuestions] = useState([
    {
      content: '',
      duration_seconds: 90
    },
    {
      content: '',
      duration_seconds: 90
    }
  ]);

  const handleMainQuestionChange = (field, value) => {
    setMainQuestion(prev => ({ ...prev, [field]: value }));
  };

  const handleChildQuestionChange = (index, field, value) => {
    const updated = [...childQuestions];
    updated[index][field] = value;
    setChildQuestions(updated);
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxImages = isSpeakingComparison ? 2 : 1;
    
    if (files.length > maxImages) {
      alert(`Bạn chỉ có thể upload tối đa ${maxImages} hình ảnh`);
      return;
    }

    const newImageFiles = [...mainQuestion.imageFiles, ...files].slice(0, maxImages);
    const newImagePreviews = newImageFiles.map(file => URL.createObjectURL(file));
    
    setMainQuestion(prev => ({
      ...prev,
      imageFiles: newImageFiles,
      imagePreviews: newImagePreviews
    }));
  };

  const handleRemoveImage = (index) => {
    const newImageFiles = mainQuestion.imageFiles.filter((_, i) => i !== index);
    const newImagePreviews = mainQuestion.imagePreviews.filter((_, i) => i !== index);
    
    setMainQuestion(prev => ({
      ...prev,
      imageFiles: newImageFiles,
      imagePreviews: newImagePreviews
    }));
  };

  const handleSubmit = () => {
    // Validate
    if (!mainQuestion.content.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi chính');
      return;
    }

    const requiredImages = isSpeakingComparison ? 2 : 1;
    if (mainQuestion.imagePreviews.length < requiredImages) {
      alert(`Vui lòng upload ${requiredImages} hình ảnh cho câu hỏi chính`);
      return;
    }

    if (!childQuestions[0].content.trim() || !childQuestions[1].content.trim()) {
      alert('Vui lòng nhập đầy đủ nội dung cho 2 câu hỏi phụ');
      return;
    }

    // Prepare additional_media array
    const additionalMedia = mainQuestion.imagePreviews.map((preview, index) => ({
      type: 'image',
      description: isSpeakingComparison ? `Image ${String.fromCharCode(65 + index)}` : 'Main image',
      url: preview,
      file: mainQuestion.imageFiles[index]
    }));

    // Prepare data structure for backend
    // Không gửi file ở đây, sẽ upload sau khi có question ID
    const formData = {
      mainQuestion: {
        content: mainQuestion.content,
        difficulty: mainQuestion.difficulty,
        duration_seconds: mainQuestion.duration_seconds,
        additional_media: null, // Sẽ được update sau khi upload ảnh
      },
      childQuestions: childQuestions,
      // Giữ file ở đây để sử dụng sau
      imageFiles: mainQuestion.imageFiles,
      isSpeakingComparison: isSpeakingComparison
    };

    onSubmit(formData);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>{isSpeakingDescription ? 'Picture Description' : 'Comparison'}:</strong> 
          {' '}Câu hỏi này bao gồm 1 câu hỏi chính có hình ảnh và 2 câu hỏi phụ tham chiếu cùng hình ảnh đó.
        </Typography>
      </Alert>

      {/* Main Question (Parent) */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
        <Typography variant="h6" gutterBottom color="primary">
          📷 Câu hỏi chính (có hình ảnh)
        </Typography>
        
        {/* Image Upload */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Hình ảnh câu hỏi {isSpeakingComparison ? '(Upload 2 hình để so sánh)' : '(Upload 1 hình)'}
          </Typography>
          
          {mainQuestion.imagePreviews.length > 0 ? (
            <Box>
              <Grid container spacing={2} mb={2}>
                {mainQuestion.imagePreviews.map((preview, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box position="relative">
                      <Box 
                        component="img" 
                        src={preview} 
                        alt={`Question image ${index + 1}`}
                        sx={{ 
                          width: '100%',
                          height: 300,
                          objectFit: 'cover',
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: 'divider'
                        }}
                      />
                      <IconButton
                        onClick={() => handleRemoveImage(index)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' }
                        }}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                      <Chip 
                        label={isSpeakingComparison ? `Hình ${String.fromCharCode(65 + index)}` : 'Hình chính'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                          bgcolor: 'primary.main',
                          color: 'white'
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {isSpeakingComparison && mainQuestion.imagePreviews.length < 2 && (
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  fullWidth
                >
                  Thêm hình ảnh thứ 2
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
              )}
            </Box>
          ) : (
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUpload />}
              fullWidth
              sx={{ py: 3, border: '2px dashed', borderColor: 'primary.main' }}
            >
              <Box textAlign="center">
                <ImageIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="body1">
                  Click để upload {isSpeakingComparison ? '2 hình ảnh' : '1 hình ảnh'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Định dạng: JPG, PNG (tối đa 5MB)
                </Typography>
              </Box>
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
                multiple={isSpeakingComparison}
              />
            </Button>
          )}
        </Box>

        {/* Main Question Content */}
        <TextField
          label="Nội dung câu hỏi chính"
          multiline
          rows={4}
          value={mainQuestion.content}
          onChange={(e) => handleMainQuestionChange('content', e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          placeholder={
            isSpeakingDescription
              ? "Ví dụ: Look at the picture of a park.\n\nDescribe:\n- The people and what they are doing\n- The environment and atmosphere"
              : "Ví dụ: Look at the two pictures showing different ways to travel.\n\nCompare them:\n- What are the similarities and differences?\n- Which method is faster and why?"
          }
        />

        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Độ khó</InputLabel>
            <Select
              value={mainQuestion.difficulty}
              label="Độ khó"
              onChange={(e) => handleMainQuestionChange('difficulty', e.target.value)}
            >
              <MenuItem value="easy">Dễ</MenuItem>
              <MenuItem value="medium">Trung bình</MenuItem>
              <MenuItem value="hard">Khó</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Thời gian (giây)"
            type="number"
            value={mainQuestion.duration_seconds}
            onChange={(e) => handleMainQuestionChange('duration_seconds', parseInt(e.target.value))}
            inputProps={{ min: 30, max: 300 }}
            sx={{ width: 200 }}
          />
        </Box>
      </Paper>

      {/* Child Questions */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
        📝 Câu hỏi phụ (tham chiếu cùng hình ảnh)
      </Typography>

      {childQuestions.map((child, index) => (
        <Card key={index} sx={{ mb: 2, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Câu hỏi phụ #{index + 1}
            </Typography>
            
            <TextField
              label={`Nội dung câu hỏi phụ ${index + 1}`}
              multiline
              rows={3}
              value={child.content}
              onChange={(e) => handleChildQuestionChange(index, 'content', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              placeholder={
                index === 0
                  ? "Ví dụ: What would you like to do there?"
                  : "Ví dụ: Looking back at the park/images:\n\nNow tell me:\n- What activities could families do there?\n- How often would you visit this place?"
              }
            />

            <TextField
              label="Thời gian (giây)"
              type="number"
              value={child.duration_seconds}
              onChange={(e) => handleChildQuestionChange(index, 'duration_seconds', parseInt(e.target.value))}
              inputProps={{ min: 30, max: 120 }}
              sx={{ width: 200 }}
            />
          </CardContent>
        </Card>
      ))}

      {/* Actions */}
      <Box mt={4} display="flex" gap={2}>
        <Button
          variant="outlined"
          onClick={onBack}
        >
          Quay lại
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
        >
          Tiếp tục xem trước
        </Button>
      </Box>
    </Box>
  );
}