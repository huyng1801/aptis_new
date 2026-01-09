'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Paper,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Save, Preview, ArrowBack, School, Psychology, AutoAwesome } from '@mui/icons-material';
import QuestionForm from '@/components/teacher/questions/QuestionForm';
import QuestionPreview from '@/components/teacher/questions/QuestionPreview';
import { createQuestion } from '@/store/slices/questionSlice';
import { showNotification } from '@/store/slices/uiSlice';
import { usePublicData } from '@/hooks/usePublicData';

const steps = ['Chọn APTIS & Kỹ năng', 'Chọn loại câu hỏi', 'Nhập thông tin', 'Xem trước'];

export default function NewQuestionPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { aptisTypes, skillTypes, questionTypes, loading: publicDataLoading } = usePublicData();
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAptis, setSelectedAptis] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [filteredQuestionTypes, setFilteredQuestionTypes] = useState([]);
  const [questionData, setQuestionData] = useState({
    aptis_type_id: '',
    skill_type_id: '',
    question_type_id: '',
    difficulty: 'medium',
    title: '',
    content: '',
    media_url: '',
    duration_seconds: null,
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);

  // Filter question types when skill changes
  useEffect(() => {
    if (selectedSkill && questionTypes.length > 0) {
      const filtered = questionTypes.filter(qt => qt.skill_type_id == selectedSkill);
      setFilteredQuestionTypes(filtered);
    }
  }, [selectedSkill, questionTypes]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleAptisSkillSelect = (aptisId, skillId) => {
    setSelectedAptis(aptisId);
    setSelectedSkill(skillId);
    setQuestionData(prev => ({
      ...prev,
      aptis_type_id: aptisId,
      skill_type_id: skillId
    }));
    handleNext();
  };

  const handleQuestionTypeSelect = (questionType) => {
    setSelectedQuestionType(questionType);
    setQuestionData(prev => ({
      ...prev,
      question_type_id: questionType.id
    }));
    handleNext();
  };

  const handleFormSubmit = (data) => {
    setQuestionData(prev => ({ ...prev, ...data }));
    handleNext();
  };

  const handleSave = async (shouldContinue = false) => {
    setLoading(true);
    try {
      // Validate question data before submitting
      if (!questionData.content || !questionData.content.trim()) {
        throw new Error('Nội dung câu hỏi không được để trống');
      }
      
      if (!questionData.aptis_type_id || !questionData.skill_type_id || !questionData.question_type_id) {
        throw new Error('Vui lòng chọn đầy đủ loại APTIS, kỹ năng và loại câu hỏi');
      }
      
      // Build complete question data with codes for API
      const completeQuestionData = {
        ...questionData,
        aptis_type_code: aptisTypes.find(a => a.id == selectedAptis)?.aptis_type_code,
        skill_type_code: skillTypes.find(s => s.id == selectedSkill)?.skill_type_code,
        question_type_code: selectedQuestionType?.code
      };
      
      console.log('Submitting question data:', completeQuestionData);
      const result = await dispatch(createQuestion(completeQuestionData));
      
      if (createQuestion.fulfilled.match(result)) {
        dispatch(showNotification({
          message: 'Tạo câu hỏi thành công!',
          type: 'success'
        }));
        
        if (shouldContinue) {
          // Reset form để tạo câu hỏi mới
          setActiveStep(0);
          setSelectedAptis('');
          setSelectedSkill('');
          setSelectedQuestionType('');
          setFilteredQuestionTypes([]);
          setQuestionData({
            aptis_type_id: '',
            skill_type_id: '',
            question_type_id: '',
            difficulty: 'medium',
            title: '',
            content: '',
            media_url: '',
            duration_seconds: null,
            status: 'draft'
          });
        } else {
          router.push('/teacher/questions');
        }
      } else if (createQuestion.rejected.match(result)) {
        const errorMessage = result.payload || 'Không thể tạo câu hỏi';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating question:', error);
      const errorMessage = error.message || 'Có lỗi xảy ra khi tạo câu hỏi';
      
      dispatch(showNotification({
        message: errorMessage,
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Chọn loại APTIS và kỹ năng
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Chọn loại bài thi APTIS và kỹ năng bạn muốn tạo câu hỏi
            </Typography>
            
            {publicDataLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : aptisTypes.length === 0 || skillTypes.length === 0 ? (
              <Alert severity="error">
                Không thể tải dữ liệu APTIS types hoặc Skill types. Vui lòng thử lại.
              </Alert>
            ) : (
              aptisTypes.map((aptis) => (
                <Paper key={aptis.id} elevation={1} sx={{ mb: 3, p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <School color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h6">{aptis.aptis_type_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {aptis.description}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {skillTypes.map((skill) => (
                      <Grid item xs={12} md={6} lg={4} key={skill.id}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            border: selectedAptis == aptis.id && selectedSkill == skill.id ? 2 : 1,
                            borderColor: selectedAptis == aptis.id && selectedSkill == skill.id 
                              ? 'primary.main' : 'divider',
                            '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' }
                          }}
                          onClick={() => handleAptisSkillSelect(aptis.id, skill.id)}
                        >
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              {skill.skill_type_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {skill.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              ))
            )}
          </Box>
        );
        
      case 1:
        const selectedSkillData = skillTypes.find(s => s.id == selectedSkill);
        const selectedAptisData = aptisTypes.find(a => a.id == selectedAptis);
        
        return (
          <Box>
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Chọn loại câu hỏi cho {selectedSkillData?.skill_type_name}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={selectedAptisData?.aptis_type_name} 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  label={selectedSkillData?.skill_type_name} 
                  color="secondary" 
                  variant="outlined" 
                />
              </Box>
            </Box>

            {publicDataLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : filteredQuestionTypes.length === 0 ? (
              <Alert severity="warning">
                Không có loại câu hỏi nào cho kỹ năng {selectedSkillData?.skill_type_name}
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {filteredQuestionTypes.map((type) => {
                  const isAIScoring = type.scoring_method === 'ai';
                  return (
                    <Grid item xs={12} md={6} key={type.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: selectedQuestionType?.id === type.id ? 2 : 1,
                          borderColor: selectedQuestionType?.id === type.id 
                            ? 'primary.main' : 'divider',
                          '&:hover': { borderColor: 'primary.light' },
                          height: '100%'
                        }}
                        onClick={() => handleQuestionTypeSelect(type)}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            {isAIScoring ? (
                              <Psychology color="secondary" sx={{ mr: 2 }} />
                            ) : (
                              <AutoAwesome color="primary" sx={{ mr: 2 }} />
                            )}
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                {type.question_type_name}
                              </Typography>
                              <Chip 
                                label={isAIScoring ? 'AI Scoring' : 'Auto Scoring'} 
                                size="small" 
                                color={isAIScoring ? 'secondary' : 'primary'}
                              />
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {type.instruction_template || 
                             (isAIScoring ? 'Câu hỏi sẽ được AI chấm điểm tự động' : 'Câu hỏi sẽ được chấm điểm tự động')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
            
            <Box mt={3}>
              <Button variant="outlined" onClick={handleBack}>
                Quay lại
              </Button>
            </Box>
          </Box>
        );
        
      case 2:
        return (
          <QuestionForm
            key={`question-form-${selectedAptis}-${selectedSkill}-${selectedQuestionType?.id}`}
            aptisType={selectedAptis}
            skillType={selectedSkill}
            questionType={selectedQuestionType}
            aptisData={aptisTypes.find(a => a.id == selectedAptis)}
            skillData={skillTypes.find(s => s.id == selectedSkill)}
            questionTypeData={selectedQuestionType}
            initialData={questionData}
            onSubmit={handleFormSubmit}
            onBack={handleBack}
          />
        );
        
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Xem trước câu hỏi
            </Typography>
            <QuestionPreview
              question={questionData}
              aptisData={aptisTypes.find(a => a.id == selectedAptis)}
              skillData={skillTypes.find(s => s.id == selectedSkill)}
              questionTypeData={selectedQuestionType}
              showActions={false}
              open={false}
            />
            <Box mt={3} display="flex" gap={2}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={loading}
              >
                Quay lại chỉnh sửa
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleSave(true)}
                disabled={loading}
              >
                Lưu & Tiếp tục
              </Button>
              <Button
                variant="contained"
                onClick={() => handleSave(false)}
                disabled={loading}
                startIcon={<Save />}
              >
                Lưu & Hoàn thành
              </Button>
            </Box>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/teacher/questions')}
          sx={{ mr: 2 }}
        >
          Quay lại
        </Button>
        <Typography variant="h4" fontWeight="bold">
          Tạo câu hỏi mới
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {getStepContent(activeStep)}
        </CardContent>
      </Card>
    </Box>
  );
}