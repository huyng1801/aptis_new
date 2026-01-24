import React from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  Grid,
  Paper,
  Alert,
  Avatar,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  CheckCircle,
  Warning,
  Upload,
  AudioFile
} from '@mui/icons-material';
import { questionApi } from '../../../../services/questionService';

/**
 * APTIS Listening Speaker Matching Form  
 * Part 2-4: Listening comprehension with speaker matching tasks
 */
const ListeningMatchingForm = ({ questionData, onChange, onValidate, isEdit = false }) => {
  const [formData, setFormData] = React.useState({
    content: questionData?.content || '',
    title: questionData?.title || '',
    audioFile: null,
    audioUrl: questionData?.audioUrl || '',
    speakers: questionData?.speakers || [
      {
        id: 1,
        name: 'Speaker A', 
        audioFile: null,
        audioUrl: '',
        description: ''
      },
      {
        id: 2,
        name: 'Speaker B',
        audioFile: null, 
        audioUrl: '',
        description: ''
      }
    ],
    statements: questionData?.statements || [
      {
        id: 1,
        statement: '',
        speaker_id: 1
      }
    ],
    instructions: questionData?.instructions || 'Listen to the conversation. Match each speaker with what they say.',
    difficulty: questionData?.difficulty || 'medium'
  });

  const [errors, setErrors] = React.useState({});
  const [isValidated, setIsValidated] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  // Main audio file selection handler
  const handleMainAudioFileSelect = (file) => {
    if (!file) return;
    
    setFormData(prev => ({ ...prev, audioFile: file }));
    console.log('✅ Main audio file selected:', file.name);
  };

  // Speaker audio file selection handler
  const handleSpeakerAudioFileSelect = (speakerIndex, file) => {
    if (!file) return;
    
    const newSpeakers = [...formData.speakers];
    newSpeakers[speakerIndex].audioFile = file;
    setFormData(prev => ({ ...prev, speakers: newSpeakers }));
    console.log(`✅ Speaker ${speakerIndex + 1} audio file selected:`, file.name);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Check title
    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }
    
    // Không cần validate audio chính cho phần này
    
    // Check speakers
    const validSpeakers = formData.speakers.filter(s => s.name.trim() && (s.audioUrl || s.audioFile));
    if (validSpeakers.length < 2) {
      newErrors.speakers = 'Phải có ít nhất 2 người nói với file audio';
    }
    
    // Check statements
    const validStatements = formData.statements.filter(s => s.statement.trim());
    if (validStatements.length === 0) {
      newErrors.statements = 'Phải có ít nhất 1 câu nói';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsValidated(isValid);
    
    if (isValid && onChange) {
      // Prepare data for backend helper function
      const structuredData = {
        speakers: validSpeakers.map(speaker => speaker.name),
        statements: validStatements.map(statement => ({
          text: statement.statement,
          speaker: validSpeakers.find(s => s.id === statement.speaker_id)?.name || ''
        })),
        audioUrl: formData.audioUrl,
        instructions: formData.instructions.trim(),
        title: formData.title.trim()
      };
      
      // Send content as JSON string for backend auto-generation
      onChange(JSON.stringify(structuredData));
    }
    
    return isValid;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpeakerChange = (index, field, value) => {
    const newSpeakers = [...formData.speakers];
    newSpeakers[index][field] = value;
    setFormData(prev => ({ ...prev, speakers: newSpeakers }));
  };

  const handleStatementChange = (index, field, value) => {
    const newStatements = [...formData.statements];
    newStatements[index][field] = value;
    setFormData(prev => ({ ...prev, statements: newStatements }));
  };

  const addSpeaker = () => {
    const newSpeaker = {
      id: Math.max(...formData.speakers.map(s => s.id)) + 1,
      name: `Speaker ${String.fromCharCode(65 + formData.speakers.length)}`,
      audioFile: null,
      audioUrl: '',
      description: ''
    };
    setFormData(prev => ({ ...prev, speakers: [...prev.speakers, newSpeaker] }));
  };

  const removeSpeaker = (index) => {
    if (formData.speakers.length <= 2) return;
    const newSpeakers = formData.speakers.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, speakers: newSpeakers }));
  };

  const addStatement = () => {
    const newStatement = {
      id: Math.max(...formData.statements.map(s => s.id)) + 1,
      statement: '',
      speaker_id: 1
    };
    setFormData(prev => ({ ...prev, statements: [...prev.statements, newStatement] }));
  };

  const removeStatement = (index) => {
    if (formData.statements.length <= 1) return;
    const newStatements = formData.statements.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, statements: newStatements }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Listening Speaker Matching
      </Typography>
      
      <Typography variant="body2" color="text.secondary" mb={3}>
        Tạo bài nghe ghép người nói với câu nói tương ứng
      </Typography>

      {/* Title */}
      <TextField
        label="Tiêu đề bài nghe"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        fullWidth
        margin="normal"
        error={!!errors.title}
        helperText={errors.title}
      />



      {/* Speakers Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Người nói ({formData.speakers.length})
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addSpeaker}
            variant="outlined"
            size="small"
          >
            Thêm người nói
          </Button>
        </Box>

        <Grid container spacing={2}>
          {formData.speakers.map((speaker, index) => (
            <Grid item xs={12} md={6} key={speaker.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Người {index + 1}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() => removeSpeaker(index)}
                      disabled={formData.speakers.length <= 2}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <TextField
                    label="Tên người nói"
                    value={speaker.name}
                    onChange={(e) => handleSpeakerChange(index, 'name', e.target.value)}
                    fullWidth
                    size="small"
                    margin="normal"
                  />

                  <TextField
                    label="Mô tả"
                    value={speaker.description}
                    onChange={(e) => handleSpeakerChange(index, 'description', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    margin="normal"
                  />

                  {/* Speaker Audio Upload */}
                  <Box mt={2}>
                    <Typography variant="caption" display="block" mb={1}>
                      File audio mẫu của người nói:
                    </Typography>
                    
                    <Button
                      variant="text"
                      component="label"
                      startIcon={<AudioFile />}
                      size="small"
                      disabled={isUploading}
                    >
                      {speaker.audioUrl ? 'Thay đổi audio' : 'Chọn file audio'}
                      <input
                        type="file"
                        hidden
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleSpeakerAudioFileSelect(index, file);
                          }
                        }}
                      />
                    </Button>
                    
                    {speaker.audioUrl && (
                      <audio controls style={{ width: '100%', marginTop: 8 }}>
                        <source src={speaker.audioUrl} type="audio/mpeg" />
                      </audio>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {errors.speakers && (
          <Typography variant="caption" color="error" display="block" mt={1}>
            {errors.speakers}
          </Typography>
        )}
      </Paper>

      {/* Statements Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Câu nói ({formData.statements.length})
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addStatement}
            variant="outlined"
            size="small"
          >
            Thêm câu nói
          </Button>
        </Box>

        {formData.statements.map((statement, index) => (
          <Box key={statement.id} mb={2}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle2">
                    Câu nói {index + 1}
                  </Typography>
                  <IconButton
                    onClick={() => removeStatement(index)}
                    disabled={formData.statements.length <= 1}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <TextField
                  label="Nội dung câu nói"
                  value={statement.statement}
                  onChange={(e) => handleStatementChange(index, 'statement', e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  margin="normal"
                />
              </CardContent>
            </Card>
          </Box>
        ))}

        {errors.statements && (
          <Typography variant="caption" color="error" display="block" mt={1}>
            {errors.statements}
          </Typography>
        )}
      </Paper>

      {/* Instructions */}
      <TextField
        label="Hướng dẫn"
        value={formData.instructions}
        onChange={(e) => handleChange('instructions', e.target.value)}
        fullWidth
        multiline
        rows={2}
        margin="normal"
      />

      {/* Manual Validation Button */}
      <Button
        onClick={validateForm}
        variant="contained"
        color="info"
        size="small"
        sx={{ mb: 3, mt: 2 }}
        disabled={isUploading}
        startIcon={isUploading ? <Upload /> : <CheckCircle />}
      >
        {isUploading ? 'Đang tải audio...' : 'Kiểm tra câu hỏi'}
      </Button>

      {/* Validation Status */}
      {isValidated && (
        <Alert severity="success" icon={<CheckCircle />}>
          Câu hỏi Listening Speaker Matching hợp lệ!
        </Alert>
      )}

      {/* Show validation errors */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" icon={<Warning />} sx={{ mt: 2 }}>
          <Typography variant="body2">
            Vui lòng sửa các lỗi sau:
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {Object.values(errors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}
    </Box>
  );
};

export default ListeningMatchingForm;