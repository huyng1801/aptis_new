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
  Avatar,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Headphones as HeadphonesIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  VolumeUp as VolumeIcon
} from '@mui/icons-material';

/**
 * APTIS Listening Speaker/Statement Matching Form
 * Hỗ trợ cả Speaker Matching và Statement Matching
 * Part 2-4: Listening comprehension with matching tasks
 */
const ListeningMatchingForm = ({ questionData, onChange, onValidate }) => {
  const [formData, setFormData] = React.useState({
    content: questionData?.content || '',
    matching_type: questionData?.matching_type || 'speaker', // 'speaker' or 'statement'
    audio_file: questionData?.audio_file || '',
    transcript: questionData?.transcript || '',
    speakers: questionData?.speakers || [
      {
        id: 1,
        name: 'Speaker A',
        description: '',
        voice_characteristics: ''
      },
      {
        id: 2,
        name: 'Speaker B',
        description: '',
        voice_characteristics: ''
      }
    ],
    statements: questionData?.statements || [
      {
        id: 1,
        statement: '',
        speaker_id: 1,
        time_code: ''
      }
    ],
    options: questionData?.options || [
      {
        id: 1,
        option_text: '',
        matches_statement_id: null
      }
    ],
    instructions: questionData?.instructions || 'Listen to the conversation. Match each speaker with what they say, or match each statement with the correct person.',
    difficulty: questionData?.difficulty || 'medium',
    time_limit: questionData?.time_limit || 8,
    audio_length: questionData?.audio_length || 120,
    points: questionData?.points || 8
  });

  const [errors, setErrors] = React.useState({});

  // Remove auto-validation useEffect - causes infinite loops
  // Validation is only called on demand via button click

  const validateForm = () => {
    const newErrors = {};
    
    // Validate audio file
    if (!formData.audio_file.trim()) {
      newErrors.audio_file = 'Audio file is required';
    }

    // Validate speakers
    if (formData.speakers.length < 2) {
      newErrors.speakers = 'At least 2 speakers are required for matching';
    }

    const emptySpeakers = formData.speakers.filter(speaker => !speaker.name.trim());
    if (emptySpeakers.length > 0) {
      newErrors.speaker_names = `${emptySpeakers.length} speaker(s) missing names`;
    }

    // Validate statements
    if (formData.statements.length === 0) {
      newErrors.statements = 'At least one statement is required';
    }

    const emptyStatements = formData.statements.filter(stmt => !stmt.statement.trim());
    if (emptyStatements.length > 0) {
      newErrors.statement_content = `${emptyStatements.length} statement(s) are empty`;
    }

    // Validate options
    if (formData.matching_type === 'statement' && formData.options.length === 0) {
      newErrors.options = 'Options are required for statement matching';
    }

    setErrors(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    
    return isValid;
  };

  const handleChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    if (onChange) onChange(newFormData);
  };

  const handleSpeakerChange = (index, field, value) => {
    const newSpeakers = [...formData.speakers];
    newSpeakers[index] = { ...newSpeakers[index], [field]: value };
    handleChange('speakers', newSpeakers);
  };

  const handleStatementChange = (index, field, value) => {
    const newStatements = [...formData.statements];
    newStatements[index] = { ...newStatements[index], [field]: value };
    handleChange('statements', newStatements);
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    handleChange('options', newOptions);
  };

  const addSpeaker = () => {
    if (formData.speakers.length < 6) {
      const newSpeakers = [...formData.speakers];
      newSpeakers.push({
        id: Date.now(),
        name: `Speaker ${String.fromCharCode(65 + newSpeakers.length)}`,
        description: '',
        voice_characteristics: ''
      });
      handleChange('speakers', newSpeakers);
    }
  };

  const removeSpeaker = (index) => {
    if (formData.speakers.length > 2) {
      const newSpeakers = formData.speakers.filter((_, i) => i !== index);
      handleChange('speakers', newSpeakers);
    }
  };

  const addStatement = () => {
    const newStatements = [...formData.statements];
    newStatements.push({
      id: Date.now(),
      statement: '',
      speaker_id: formData.speakers[0]?.id || 1,
      time_code: ''
    });
    handleChange('statements', newStatements);
  };

  const removeStatement = (index) => {
    if (formData.statements.length > 1) {
      const newStatements = formData.statements.filter((_, i) => i !== index);
      handleChange('statements', newStatements);
    }
  };

  const addOption = () => {
    const newOptions = [...formData.options];
    newOptions.push({
      id: Date.now(),
      option_text: '',
      matches_statement_id: null
    });
    handleChange('options', newOptions);
  };

  const removeOption = (index) => {
    if (formData.options.length > 1) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      handleChange('options', newOptions);
    }
  };

  const matchingTypes = [
    { value: 'speaker', label: 'Speaker Matching' },
    { value: 'statement', label: 'Statement Matching' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HeadphonesIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">
            Listening Matching Task
          </Typography>
          <Chip label="8 Points" color="primary" />
          <Chip label="Parts 2-4" variant="outlined" />
        </Box>
        
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Students listen to conversations and match speakers with statements, or statements with correct persons/categories.
        </Typography>
      </Paper>

      {/* Task Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon /> Task Configuration
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Matching Type</InputLabel>
                <Select
                  value={formData.matching_type}
                  onChange={(e) => handleChange('matching_type', e.target.value)}
                  label="Matching Type"
                >
                  {matchingTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                label="Time Limit (min)"
                type="number"
                value={formData.time_limit}
                onChange={(e) => handleChange('time_limit', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 5, max: 15 } }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                label="Audio Length (sec)"
                type="number"
                value={formData.audio_length}
                onChange={(e) => handleChange('audio_length', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 60, max: 300 } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={formData.difficulty}
                  onChange={(e) => handleChange('difficulty', e.target.value)}
                  label="Difficulty"
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Instructions to Students"
            value={formData.instructions}
            onChange={(e) => handleChange('instructions', e.target.value)}
            sx={{ mb: 2 }}
            helperText="Clear instructions for the matching task"
          />

          <TextField
            fullWidth
            label="Audio File Path/URL"
            value={formData.audio_file}
            onChange={(e) => handleChange('audio_file', e.target.value)}
            error={!!errors.audio_file}
            helperText={errors.audio_file || 'Path to the audio file for this listening task'}
            placeholder="/uploads/audio/listening_matching_01.mp3"
            InputProps={{
              startAdornment: <VolumeIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </CardContent>
      </Card>

      {/* Speakers Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Speakers ({formData.speakers.length}/6 max)
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addSpeaker}
              disabled={formData.speakers.length >= 6}
              variant="outlined"
              size="small"
            >
              Add Speaker
            </Button>
          </Box>

          {errors.speakers && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.speakers}
            </Alert>
          )}

          {errors.speaker_names && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {errors.speaker_names}
            </Alert>
          )}

          <Grid container spacing={2}>
            {formData.speakers.map((speaker, index) => (
              <Grid item xs={12} md={6} key={speaker.id}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Speaker {index + 1}
                      </Typography>
                    </Box>
                    {formData.speakers.length > 2 && (
                      <IconButton 
                        size="small" 
                        onClick={() => removeSpeaker(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>

                  <TextField
                    fullWidth
                    label="Speaker Name/ID"
                    value={speaker.name}
                    onChange={(e) => handleSpeakerChange(index, 'name', e.target.value)}
                    sx={{ mb: 1 }}
                    error={!speaker.name.trim()}
                    placeholder="e.g., Speaker A, John, Woman 1"
                  />

                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    value={speaker.description}
                    onChange={(e) => handleSpeakerChange(index, 'description', e.target.value)}
                    sx={{ mb: 1 }}
                    placeholder="Brief description of the speaker's role or background"
                  />

                  <TextField
                    fullWidth
                    label="Voice Characteristics"
                    value={speaker.voice_characteristics}
                    onChange={(e) => handleSpeakerChange(index, 'voice_characteristics', e.target.value)}
                    placeholder="e.g., Male, British accent, Young adult"
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Statements Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Statements ({formData.statements.length})
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addStatement}
              variant="outlined"
              size="small"
            >
              Add Statement
            </Button>
          </Box>

          {errors.statement_content && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {errors.statement_content}
            </Alert>
          )}

          {formData.statements.map((statement, index) => (
            <Paper key={statement.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Statement {index + 1}
                </Typography>
                {formData.statements.length > 1 && (
                  <IconButton 
                    size="small" 
                    onClick={() => removeStatement(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Statement Text"
                    value={statement.statement}
                    onChange={(e) => handleStatementChange(index, 'statement', e.target.value)}
                    placeholder="What the speaker says or the statement to be matched"
                    error={!statement.statement.trim()}
                  />
                </Grid>

                <Grid item xs={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Spoken by</InputLabel>
                    <Select
                      value={statement.speaker_id}
                      onChange={(e) => handleStatementChange(index, 'speaker_id', e.target.value)}
                      label="Spoken by"
                    >
                      {formData.speakers.map((speaker) => (
                        <MenuItem key={speaker.id} value={speaker.id}>
                          {speaker.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    label="Time Code"
                    value={statement.time_code}
                    onChange={(e) => handleStatementChange(index, 'time_code', e.target.value)}
                    placeholder="1:30"
                    helperText="Optional"
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}
        </CardContent>
      </Card>

      {/* Options Section (for Statement Matching) */}
      {formData.matching_type === 'statement' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Matching Options ({formData.options.length})
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addOption}
                variant="outlined"
                size="small"
              >
                Add Option
              </Button>
            </Box>

            {errors.options && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.options}
              </Alert>
            )}

            <Grid container spacing={2}>
              {formData.options.map((option, index) => (
                <Grid item xs={12} md={6} key={option.id}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" color="primary">
                        Option {String.fromCharCode(65 + index)}
                      </Typography>
                      {formData.options.length > 1 && (
                        <IconButton 
                          size="small" 
                          onClick={() => removeOption(index)}
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
                      label="Option Text"
                      value={option.option_text}
                      onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                      sx={{ mb: 1 }}
                      placeholder="Option for students to match with statements"
                    />

                    <FormControl fullWidth size="small">
                      <InputLabel>Matches Statement</InputLabel>
                      <Select
                        value={option.matches_statement_id || ''}
                        onChange={(e) => handleOptionChange(index, 'matches_statement_id', e.target.value)}
                        label="Matches Statement"
                      >
                        <MenuItem value="">
                          <em>No match (distractor)</em>
                        </MenuItem>
                        {formData.statements.map((statement, stmtIndex) => (
                          <MenuItem key={statement.id} value={statement.id}>
                            Statement {stmtIndex + 1}: {statement.statement.substring(0, 30)}...
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
      )}

      {/* Transcript Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Audio Transcript (Optional)
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Full Transcript"
            value={formData.transcript}
            onChange={(e) => handleChange('transcript', e.target.value)}
            placeholder="Enter the complete transcript of the audio for reference..."
            helperText="This helps with marking and validation. Include speaker labels."
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <Paper sx={{ p: 2, mt: 3, backgroundColor: '#f9f9f9' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Summary:</strong> {formData.matching_type} matching task, 
          {formData.speakers.length} speakers, {formData.statements.length} statements, 
          {formData.matching_type === 'statement' ? formData.options.length : 0} options, 
          {formData.time_limit} minutes, {formData.audio_length}s audio
        </Typography>
      </Paper>
    </Box>
  );
};

export default ListeningMatchingForm;