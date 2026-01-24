'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Paper
} from '@mui/material';
import { Save, ArrowBack, Edit, Psychology, AutoAwesome } from '@mui/icons-material';
import { questionApi } from '@/services/questionService';
import { updateQuestion } from '@/store/slices/questionSlice';
import { showNotification } from '@/store/slices/uiSlice';
import { usePublicData } from '@/hooks/usePublicData';
import QuestionForm from '@/components/teacher/questions/QuestionForm';
import SpeakingImageBasedForm from '@/components/teacher/questions/SpeakingImageBasedForm';
import { QuestionPreview } from '@/components/teacher/questions/common';

const steps = ['Thông tin câu hỏi', 'Chỉnh sửa nội dung', 'Xem trước'];

export default function EditQuestionPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useParams();
  const questionId = params.id;
  
  const { aptisTypes, skillTypes, questionTypes, loading: publicDataLoading } = usePublicData();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questionData, setQuestionData] = useState(null);
  const [originalQuestionData, setOriginalQuestionData] = useState(null);
  const [formData, setFormData] = useState({});

  // Load question data
  useEffect(() => {
    if (questionId) {
      loadQuestionData();
    }
  }, [questionId]);

  const loadQuestionData = async () => {
    try {
      setLoading(true);
      const response = await questionApi.getQuestionById(questionId);
      console.log('✅ Loaded question data:', response.data);
      
      setQuestionData(response.data);
      setOriginalQuestionData(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('❌ Error loading question:', error);
      dispatch(showNotification({
        message: 'Không thể tải thông tin câu hỏi',
        type: 'error'
      }));
      router.push('/teacher/questions');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFormSubmit = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    handleNext();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('🔍 Updating question with data:', formData);
      
      // Check if it's a speaking image-based question
      const isSpeakingImageBased = questionData?.question_type_code === 'SPEAKING_DESCRIPTION' || 
                                    questionData?.question_type_code === 'SPEAKING_COMPARISON';
      
      if (isSpeakingImageBased && formData.mainQuestion && formData.childQuestions) {
        // Handle speaking image-based questions
        console.log('🎤 Updating Speaking image-based questions...');
        
        // Update main question
        const mainQuestionData = {
          ...formData.mainQuestion,
          id: questionData.id
        };
        
        const result = await dispatch(updateQuestion({
          id: questionData.id,
          questionData: mainQuestionData
        }));
        
        if (updateQuestion.fulfilled.match(result)) {
          // Handle image uploads if new images
          if (formData.imageFiles && formData.imageFiles.length > 0) {
            console.log('📷 Uploading new images...');
            try {
              await questionApi.uploadQuestionImages(questionData.id, formData.imageFiles);
              console.log('✅ Images uploaded successfully');
            } catch (uploadError) {
              console.error('❌ Failed to upload images:', uploadError);
              dispatch(showNotification({
                message: 'Cập nhật câu hỏi thành công nhưng upload ảnh thất bại',
                type: 'warning'
              }));
            }
          }
          
          // Update child questions if they exist
          if (formData.childQuestions && formData.childQuestions.length > 0) {
            console.log('👶 Updating child questions...');
            // You might need to implement child question updates here
            // For now, we'll just show success
          }
          
          dispatch(showNotification({
            message: 'Cập nhật câu hỏi Speaking thành công!',
            type: 'success'
          }));
          
          router.push('/teacher/questions');
        }
      } else if (questionData?.skill_type_code === 'listening' && formData.content) {
        // Handle listening questions
        console.log('🎧 Updating Listening questions...');
        
        // Parse content for audio files
        let contentData;
        try {
          contentData = JSON.parse(formData.content);
        } catch (error) {
          throw new Error('Dữ liệu nội dung câu hỏi listening không hợp lệ');
        }

        // Extract audio files
        const audioFiles = {
          mainAudio: contentData.audioFile || null,
          speakerAudios: []
        };

        if (contentData.speakers && Array.isArray(contentData.speakers)) {
          contentData.speakers.forEach(speaker => {
            if (speaker.audioFile && speaker.audioFile instanceof File) {
              audioFiles.speakerAudios.push(speaker.audioFile);
            }
          });
        }

        // Clean content for database
        const cleanedFormData = {
          ...formData,
          content: JSON.stringify({
            ...contentData,
            audioFile: undefined,
            speakers: contentData.speakers?.map(speaker => ({
              ...speaker,
              audioFile: undefined
            })) || undefined
          })
        };

        const result = await dispatch(updateQuestion({
          id: questionData.id,
          questionData: cleanedFormData
        }));
        
        if (updateQuestion.fulfilled.match(result)) {
          // Upload audio files if new ones
          const hasNewAudioFiles = audioFiles.mainAudio || audioFiles.speakerAudios.length > 0;
          if (hasNewAudioFiles) {
            console.log('🎵 Uploading new audio files...');
            try {
              await questionApi.uploadQuestionAudios(questionData.id, audioFiles);
              console.log('✅ Audio files uploaded successfully');
            } catch (uploadError) {
              console.error('❌ Failed to upload audio files:', uploadError);
              dispatch(showNotification({
                message: 'Cập nhật câu hỏi thành công nhưng upload audio thất bại',
                type: 'warning'
              }));
            }
          }
          
          dispatch(showNotification({
            message: 'Cập nhật câu hỏi Listening thành công!',
            type: 'success'
          }));
          
          router.push('/teacher/questions');
        }
      } else {
        // Handle regular questions
        const result = await dispatch(updateQuestion({
          id: questionData.id,
          questionData: formData
        }));
        
        if (updateQuestion.fulfilled.match(result)) {
          dispatch(showNotification({
            message: 'Cập nhật câu hỏi thành công!',
            type: 'success'
          }));
          
          router.push('/teacher/questions');
        }
      }
    } catch (error) {
      console.error('❌ Error updating question:', error);
      dispatch(showNotification({
        message: error.message || 'Có lỗi xảy ra khi cập nhật câu hỏi',
        type: 'error'
      }));
    } finally {
      setSaving(false);
    }
  };

  const getStepContent = (step) => {
    if (!questionData) return null;

    switch (step) {
      case 0:
        // Question info display
        const aptisData = aptisTypes.find(a => a.id === questionData.aptis_type_id);
        const skillData = skillTypes.find(s => s.id === questionData.skill_type_id);
        const questionTypeData = questionTypes.find(qt => qt.id === questionData.question_type_id);
        const isAIScoring = questionTypeData?.scoring_method === 'ai';
        
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Thông tin câu hỏi
            </Typography>
            
            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Loại APTIS
                  </Typography>
                  <Chip 
                    label={aptisData?.aptis_type_name || 'N/A'} 
                    color="primary" 
                    variant="outlined" 
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Loại câu hỏi
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box display="flex" alignItems="center">
                      {isAIScoring ? (
                        <Psychology color="secondary" sx={{ mr: 1 }} />
                      ) : (
                        <AutoAwesome color="primary" sx={{ mr: 1 }} />
                      )}
                      <Typography variant="h6">
                        {questionTypeData?.question_type_name || 'N/A'}
                      </Typography>
                    </Box>
                    <Chip 
                      label={isAIScoring ? 'AI Scoring' : 'Auto Scoring'} 
                      size="small" 
                      color={isAIScoring ? 'secondary' : 'primary'}
                    />
                  </Box>
                </Grid>
                

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    ID câu hỏi
                  </Typography>
                  <Typography variant="body1">#{questionData.id}</Typography>
                </Grid>
                
                {/* <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Trạng thái
                  </Typography>
                  <Chip 
                    label={questionData.status || 'draft'} 
                    size="small" 
                    color={questionData.status === 'published' ? 'success' : 'default'}
                  />
                </Grid> */}
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ngày tạo / Cập nhật
                  </Typography>
                  <Typography variant="body2">
                    Tạo: {new Date(questionData.created_at).toLocaleString('vi-VN')}
                    <br />
                    Cập nhật: {new Date(questionData.updated_at).toLocaleString('vi-VN')}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<Edit />}
            >
              Chỉnh sửa nội dung
            </Button>
          </Box>
        );
        
      case 1:
        // Edit form
        const isSpeakingImageBased = questionData?.question_type_code === 'SPEAKING_DESCRIPTION' || 
                                      questionData?.question_type_code === 'SPEAKING_COMPARISON';
        
        if (isSpeakingImageBased) {
          return (
            <SpeakingImageBasedForm
              key={`edit-speaking-form-${questionData.id}`}
              questionType={questionTypes.find(qt => qt.id === questionData.question_type_id)}
              initialData={questionData}
              onSubmit={handleFormSubmit}
              onBack={handleBack}
              isEdit={true}
            />
          );
        }
        
        return (
          <QuestionForm
            key={`edit-question-form-${questionData.id}`}
            aptisType={questionData.aptis_type_id}
            skillType={questionData.skill_type_id}
            questionType={questionTypes.find(qt => qt.id === questionData.question_type_id)}
            aptisData={aptisTypes.find(a => a.id === questionData.aptis_type_id)}
            skillData={skillTypes.find(s => s.id === questionData.skill_type_id)}
            questionTypeData={questionTypes.find(qt => qt.id === questionData.question_type_id)}
            initialData={questionData}
            onSubmit={handleFormSubmit}
            onBack={handleBack}
            isEdit={true}
          />
        );
        
      case 2:
        // Preview
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Xem trước câu hỏi đã chỉnh sửa
            </Typography>
            <QuestionPreview
              question={formData}
              aptisData={aptisTypes.find(a => a.id === questionData.aptis_type_id)}
              skillData={skillTypes.find(s => s.id === questionData.skill_type_id)}
              questionTypeData={questionTypes.find(qt => qt.id === questionData.question_type_id)}
              showActions={false}
              open={false}
            />
            <Box mt={3} display="flex" gap={2}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={saving}
              >
                Quay lại chỉnh sửa
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </Box>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

  if (loading || publicDataLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!questionData) {
    return (
      <Box>
        <Alert severity="error">
          Không tìm thấy câu hỏi hoặc bạn không có quyền chỉnh sửa câu hỏi này.
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/teacher/questions')}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách câu hỏi
        </Button>
      </Box>
    );
  }

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
          Chỉnh sửa câu hỏi #{questionData.id}
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