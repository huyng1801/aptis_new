import React from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Grid,
  Paper,
  Alert,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Info as InfoIcon,
  Article as ArticleIcon
} from '@mui/icons-material';

/**
 * APTIS Reading Part 5: Short Text Matching Form
 * Cấu trúc: 7 văn bản ngắn + 7-10 mô tả/danh mục
 * Điểm: 14 điểm (2 điểm/câu)
 * Mức độ: Intermediate-level reading comprehension
 */
const ReadingShortTextForm = ({ questionData, onChange, onValidate }) => {
  const [formData, setFormData] = React.useState({
    content: questionData?.content || '',
    instructions: questionData?.instructions || 'Match each short text (1-7) with the correct description (A-J). There are three extra descriptions you do not need.',
    short_texts: questionData?.short_texts || Array(7).fill().map((_, i) => ({
      id: i + 1,
      letter: String.fromCharCode(65 + i), // A, B, C...
      title: '',
      text: '',
      category: ''
    })),
    descriptions: questionData?.descriptions || Array(10).fill().map((_, i) => ({
      id: i + 1,
      letter: String.fromCharCode(65 + i), // A, B, C...
      description: '',
      matches_text_id: null // ID của text mà description này match với
    })),
    correct_matches: questionData?.correct_matches || {},
    difficulty: questionData?.difficulty || 'medium',
    time_limit: questionData?.time_limit || 15, // phút
    points: questionData?.points || 14
  });

  const [errors, setErrors] = React.useState({});

  // Remove auto-validation useEffect - causes infinite loops
  // Validation is only called on demand via button click

  const validateForm = () => {
    const newErrors = {};
    
    // Validate instructions
    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    }

    // Validate short texts
    const emptyTexts = formData.short_texts.filter(text => !text.text.trim() || !text.title.trim());
    if (emptyTexts.length > 0) {
      newErrors.short_texts = `${emptyTexts.length} short text(s) are incomplete`;
    }

    // Validate descriptions
    const emptyDescriptions = formData.descriptions.filter(desc => !desc.description.trim());
    if (emptyDescriptions.length > 0) {
      newErrors.descriptions = `${emptyDescriptions.length} description(s) are empty`;
    }

    // Validate correct matches
    const matchCount = Object.keys(formData.correct_matches).length;
    if (matchCount !== 7) {
      newErrors.correct_matches = `Need exactly 7 correct matches, currently have ${matchCount}`;
    }

    // Check for duplicate matches
    const matchedDescriptions = Object.values(formData.correct_matches);
    const duplicates = matchedDescriptions.filter((desc, index) => 
      matchedDescriptions.indexOf(desc) !== index
    );
    if (duplicates.length > 0) {
      newErrors.correct_matches = 'Duplicate description matches detected';
    }

    setErrors(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    
    return isValid;
  };

  const handleChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    // Send JSON string to match other Reading forms
    if (onChange) onChange(JSON.stringify(newFormData));
  };

  const handleShortTextChange = (index, field, value) => {
    const newTexts = [...formData.short_texts];
    newTexts[index] = { ...newTexts[index], [field]: value };
    handleChange('short_texts', newTexts);
  };

  const handleDescriptionChange = (index, field, value) => {
    const newDescriptions = [...formData.descriptions];
    newDescriptions[index] = { ...newDescriptions[index], [field]: value };
    handleChange('descriptions', newDescriptions);
  };

  const handleMatchChange = (textId, descriptionLetter) => {
    const newMatches = { ...formData.correct_matches };
    if (descriptionLetter === '') {
      delete newMatches[textId];
    } else {
      newMatches[textId] = descriptionLetter;
    }
    handleChange('correct_matches', newMatches);
  };

  const addShortText = () => {
    if (formData.short_texts.length < 10) {
      const newTexts = [...formData.short_texts];
      newTexts.push({
        id: newTexts.length + 1,
        letter: String.fromCharCode(65 + newTexts.length),
        title: '',
        text: '',
        category: ''
      });
      handleChange('short_texts', newTexts);
    }
  };

  const removeShortText = (index) => {
    if (formData.short_texts.length > 5) {
      const newTexts = formData.short_texts.filter((_, i) => i !== index);
      handleChange('short_texts', newTexts);
    }
  };

  const addDescription = () => {
    if (formData.descriptions.length < 15) {
      const newDescriptions = [...formData.descriptions];
      newDescriptions.push({
        id: newDescriptions.length + 1,
        letter: String.fromCharCode(65 + newDescriptions.length),
        description: '',
        matches_text_id: null
      });
      handleChange('descriptions', newDescriptions);
    }
  };

  const removeDescription = (index) => {
    if (formData.descriptions.length > 7) {
      const newDescriptions = formData.descriptions.filter((_, i) => i !== index);
      handleChange('descriptions', newDescriptions);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ArticleIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">
            Reading Part 5: Short Text Matching
          </Typography>
          <Chip label="14 Points" color="primary" />
          <Chip label="7 Questions" variant="outlined" />
        </Box>
        
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Students match short texts (advertisements, notices, emails) with appropriate descriptions or categories.
          Includes 3 extra descriptions as distractors.
        </Typography>
      </Paper>

      {/* Instructions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon /> Question Instructions
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Instructions to Students"
            value={formData.instructions}
            onChange={(e) => handleChange('instructions', e.target.value)}
            error={!!errors.instructions}
            helperText={errors.instructions || 'Clear instructions for the matching task'}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Difficulty Level"
                select
                value={formData.difficulty}
                onChange={(e) => handleChange('difficulty', e.target.value)}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Time Limit (minutes)"
                value={formData.time_limit}
                onChange={(e) => handleChange('time_limit', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 5, max: 30 } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Short Texts Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Short Texts ({formData.short_texts.length}/10 max)
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addShortText}
              disabled={formData.short_texts.length >= 10}
              variant="outlined"
              size="small"
            >
              Add Text
            </Button>
          </Box>

          {errors.short_texts && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.short_texts}
            </Alert>
          )}

          <Grid container spacing={2}>
            {formData.short_texts.map((text, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="primary">
                      Text {index + 1}
                    </Typography>
                    {formData.short_texts.length > 5 && (
                      <IconButton 
                        size="small" 
                        onClick={() => removeShortText(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>

                  <TextField
                    fullWidth
                    size="small"
                    label="Title/Header"
                    value={text.title}
                    onChange={(e) => handleShortTextChange(index, 'title', e.target.value)}
                    sx={{ mb: 1 }}
                    placeholder="e.g., For Sale, Notice, Job Advertisement"
                  />

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Text Content"
                    value={text.text}
                    onChange={(e) => handleShortTextChange(index, 'text', e.target.value)}
                    sx={{ mb: 1 }}
                    placeholder="Enter the short text content..."
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Category (optional)"
                    value={text.category}
                    onChange={(e) => handleShortTextChange(index, 'category', e.target.value)}
                    placeholder="e.g., Advertisement, Notice, Email"
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Descriptions Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Descriptions ({formData.descriptions.length}/15 max)
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addDescription}
              disabled={formData.descriptions.length >= 15}
              variant="outlined"
              size="small"
            >
              Add Description
            </Button>
          </Box>

          {errors.descriptions && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.descriptions}
            </Alert>
          )}

          <Grid container spacing={2}>
            {formData.descriptions.map((desc, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="secondary">
                      {desc.letter}. Description {index + 1}
                    </Typography>
                    {formData.descriptions.length > 7 && (
                      <IconButton 
                        size="small" 
                        onClick={() => removeDescription(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description Text"
                    value={desc.description}
                    onChange={(e) => handleDescriptionChange(index, 'description', e.target.value)}
                    placeholder="Enter the description that matches with one of the short texts..."
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Correct Matches Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Correct Matches ({Object.keys(formData.correct_matches).length}/7)
          </Typography>

          {errors.correct_matches && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.correct_matches}
            </Alert>
          )}

          <Grid container spacing={2}>
            {formData.short_texts.map((text, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Text {index + 1}: {text.title || 'Untitled'}
                  </Typography>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>Matches with Description</InputLabel>
                    <Select
                      value={formData.correct_matches[text.id] || ''}
                      onChange={(e) => handleMatchChange(text.id, e.target.value)}
                      label="Matches with Description"
                    >
                      <MenuItem value="">
                        <em>Select a description</em>
                      </MenuItem>
                      {formData.descriptions.map((desc, descIndex) => (
                        <MenuItem key={descIndex} value={desc.letter}>
                          {desc.letter}. {desc.description.substring(0, 50)}
                          {desc.description.length > 50 ? '...' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Summary */}
      <Paper sx={{ p: 2, mt: 3, backgroundColor: '#f9f9f9' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Summary:</strong> {formData.short_texts.length} short texts, {formData.descriptions.length} descriptions, 
          {Object.keys(formData.correct_matches).length}/7 matches configured, 
          {formData.descriptions.length - 7} extra distractors
        </Typography>
      </Paper>
    </Box>
  );
};

export default ReadingShortTextForm;