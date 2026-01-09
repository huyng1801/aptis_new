'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Mic,
  Stop,
} from '@mui/icons-material';
import attemptService from '@/services/attemptService';
import { getAssetUrl } from '@/services/api';

export default function SpeakingQuestion({ 
  question, 
  onAnswerChange, 
  onMoveToNextQuestion, 
  attemptId, 
  onHideHeader,
  microphoneTestCompleted = false,
  onStartMicrophoneTest,
  onCompleteMicrophoneTest
}) {
  // Early return if no question
  if (!question) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Đang tải câu hỏi...</Typography>
      </Box>
    );
  }
  // Modal states
  const [step, setStep] = useState('recording'); // recording only
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(30); // Start at 30 seconds
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  
  // Preparation states
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparationTime, setPreparationTime] = useState(0);
  
  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadRetries, setUploadRetries] = useState(0);
  
  // Test tracking (removed - no longer needed)
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const preparationTimerRef = useRef(null);
  const timeCounterRef = useRef(0);
  const MAX_UPLOAD_RETRIES = 3;

  // Parse question requirements
  const requirements = question.question_content?.requirements || {};
  const maxRecordingTime = 30; // Fixed at 30 seconds
  const preparationTimeLimit = parseInt(requirements.preparation_time) || 5; // seconds (default 5)
  const hasPreparationTime = preparationTimeLimit > 0;
  
  // Confirmation dialog state
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  
  // Track if we should auto-start recording
  const shouldAutoStartRecordingRef = useRef(false);
  
  // Track when recording actually completes (to trigger upload)
  const recordingCompletedRef = useRef(false);

  // Check if question already has audio answer
  const hasExistingAudio = question.answer_data?.audio_url;

  // Initialize component - start with preparation or recording
  useEffect(() => {
    // If already has audio answer, don't start recording/preparation
    if (hasExistingAudio) {
      console.log('[SpeakingQuestion] Question already has audio answer, showing completed state');
      setStep('completed');
      return;
    }
    
    // Reset step and start fresh
    setStep('recording');
    
    // Start preparation or recording based on question requirements
    if (hasPreparationTime) {
      setAudioBlob(null);
      setAudioUrl('');
      setIsRecording(false);
      setIsPreparing(true);
      setPreparationTime(preparationTimeLimit);
      shouldAutoStartRecordingRef.current = false;
      // Keep header visible: onHideHeader?.(true);
    } else {
      setAudioBlob(null);
      setAudioUrl('');
      setIsRecording(false);
      setIsPreparing(false);
      shouldAutoStartRecordingRef.current = true;
      // Keep header visible: onHideHeader?.(false);
    }
  }, [question.id, hasPreparationTime, preparationTimeLimit]);

  // Reset states when question changes
  useEffect(() => {
    // Reset all states without triggering any timers or recordings
    setIsRecording(false);
    setRecordingTime(30);
    setAudioBlob(null);
    setAudioUrl('');
    setIsPreparing(false);
    setPreparationTime(0);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    recordingCompletedRef.current = false;
    setUploadRetries(0);
    timeCounterRef.current = 30;
    setShowStopConfirmation(false);
    
    // Cleanup function for unmount
    return () => {
      // Stop any ongoing recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // Clear all timers
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (preparationTimerRef.current) {
        clearInterval(preparationTimerRef.current);
        preparationTimerRef.current = null;
      }
      
      // Cleanup old audio URLs to prevent memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [question.id]); // Only depend on question.id

  // Preparation timer
  useEffect(() => {
    if (!isPreparing) {
      return;
    }

    // Don't hide header - keep timer and question info visible
    // onHideHeader?.(true);
    
    preparationTimerRef.current = setInterval(() => {
      setPreparationTime((prev) => {
        if (prev <= 1) {
          clearInterval(preparationTimerRef.current);
          preparationTimerRef.current = null;
          setIsPreparing(false);
          // onHideHeader?.(false);
          // Mark that we need to start recording
          shouldAutoStartRecordingRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (preparationTimerRef.current) {
        clearInterval(preparationTimerRef.current);
        preparationTimerRef.current = null;
      }
    };
  }, [isPreparing]); // Remove unnecessary deps

  // Recording timer (30 seconds)
  useEffect(() => {
    if (!isRecording) {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      return;
    }

    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const newTime = prev - 1;
        timeCounterRef.current = newTime;
        
        // Auto-stop at 0 seconds
        if (newTime <= 0) {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          setIsRecording(false);
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [isRecording, question.id]);

  // Removed microphone test functions - no longer needed

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm';
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        recordingCompletedRef.current = true;
        setAudioBlob(blob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(30);
      timeCounterRef.current = 30;
      
    } catch (error) {
      console.error('[SpeakingQuestion] Microphone error:', error.message);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  }, []);

  // Define uploadAudioToBackend BEFORE effects that use it
  const uploadAudioToBackend = useCallback(async (audioBlob, duration) => {
    if (uploadRetries === 0) {
      setUploadError(null);
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      if (!attemptId) {
        throw new Error('Không tìm thấy ID nộp bài. Vui lòng làm lại.');
      }
      
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('File âm thanh không hợp lệ. Vui lòng ghi âm lại.');
      }

      const MIN_AUDIO_SIZE = 1024; // 1KB
      const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
      
      if (audioBlob.size < MIN_AUDIO_SIZE) {
        throw new Error('Tệp âm thanh quá nhỏ. Vui lòng ghi âm lại.');
      }

      if (audioBlob.size > MAX_AUDIO_SIZE) {
        throw new Error('Tệp âm thanh quá lớn (tối đa 50MB). Vui lòng ghi âm lại.');
      }

      console.log('[SpeakingQuestion] Uploading audio for question:', question.id, 'to attempt:', attemptId);
      
      const response = await attemptService.uploadAudioAnswer(
        attemptId,
        question.id,
        audioBlob,
        (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
        }
      );

      if (response.data && response.data.success) {
        setIsUploading(false);
        setUploadError(null);
        setUploadRetries(0);
        
        // Notify parent component that answer has been saved
        if (onAnswerChange) {
          onAnswerChange(question.id, {
            answer_type: 'audio',
            audio_url: response.data.data.audio_url,
            duration: response.data.data.duration,
            answered_at: new Date().toISOString()
          });
          console.log('[SpeakingQuestion] Called onAnswerChange with:', { answer_type: 'audio', audio_url: response.data.data.audio_url });
        }
        
        // Auto-move to next question after 1.5 seconds
        setTimeout(() => {
          if (onMoveToNextQuestion) {
            console.log('[SpeakingQuestion] Moving to next question');
            onMoveToNextQuestion();
          }
        }, 1500);
      } else {
        throw new Error(response.data?.message || 'Lỗi tải lên audio');
      }
      
    } catch (error) {
      setIsUploading(false);

      let errorMsg = error.message || 'Lỗi tải lên audio. Vui lòng thử lại.';
      let shouldRetry = false;

      if (error.response) {
        const status = error.response.status;
        errorMsg = error.response.data?.message || errorMsg;
        shouldRetry = status >= 500 || status === 408 || status === 429;
        
        if (shouldRetry && uploadRetries < MAX_UPLOAD_RETRIES) {
          setUploadRetries(uploadRetries + 1);
          setUploadError(`Lỗi máy chủ, đang thử lại... (Lần ${uploadRetries + 2}/${MAX_UPLOAD_RETRIES + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (uploadRetries + 1)));
          return uploadAudioToBackend(audioBlob, duration);
        }
      } else if (error.message === 'timeout of 30000ms exceeded') {
        if (uploadRetries < MAX_UPLOAD_RETRIES) {
          setUploadRetries(uploadRetries + 1);
          setUploadError(`Hết thời gian, đang thử lại... (Lần ${uploadRetries + 2}/${MAX_UPLOAD_RETRIES + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (uploadRetries + 1)));
          return uploadAudioToBackend(audioBlob, duration);
        }
        errorMsg = 'Hết thời gian tải lên. Vui lòng kiểm tra kết nối và thử lại.';
      }
      
      setUploadError(errorMsg);
      alert(`❌ ${errorMsg}`);
    }
  }, [question.id, attemptId, uploadRetries, onMoveToNextQuestion]);

  // Auto-upload when audioBlob is set (after recording stops)
  useEffect(() => {
    if (audioBlob && !isUploading && !uploadError && recordingCompletedRef.current) {
      console.log('[SpeakingQuestion] Auto-uploading audio blob for question:', question.id);
      recordingCompletedRef.current = false; // Reset so it only triggers once per recording
      const duration = 30 - timeCounterRef.current;
      uploadAudioToBackend(audioBlob, duration);
    }
  }, [audioBlob, isUploading, uploadError, uploadAudioToBackend, question.id]); // Add proper deps

  // Auto-start recording when conditions are met
  useEffect(() => {
    if (shouldAutoStartRecordingRef.current && 
        step === 'recording' && 
        !isRecording && 
        !isPreparing && 
        !isUploading && 
        !audioBlob) {
      
      shouldAutoStartRecordingRef.current = false;
      
      setTimeout(() => {
        startRecording();
      }, 300);
    }
  }, [step, isRecording, isPreparing, isUploading, audioBlob, question.id, startRecording]);
  
  const confirmStopRecording = () => {
    setShowStopConfirmation(false);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop(); // This will trigger onstop event → upload
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canStopRecording = recordingTime <= 20; // Can stop after 10 seconds have elapsed (30-10=20)

  return (
    <Box>
      {/* Completed State - Show when audio already uploaded */}
      {step === 'completed' && hasExistingAudio && (
        <Box>
          <Paper sx={{ p: 3, mb: 2, textAlign: 'center', backgroundColor: 'success.light' }}>
            <Typography variant="h5" gutterBottom color="success.dark" sx={{ fontWeight: 'bold' }}>
              ✓ Đã hoàn thành ghi âm
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bạn đã ghi âm và nộp câu trả lời cho câu hỏi này.
            </Typography>
            
            {/* Audio Player */}
            {question.answer_data?.audio_url && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <audio 
                  controls 
                  style={{ width: '100%', maxWidth: '500px' }}
                  src={getAssetUrl(question.answer_data.audio_url)}
                >
                  Trình duyệt không hỗ trợ phát audio.
                </audio>
              </Box>
            )}
            
            {question.answer_data?.transcribed_text && (
              <Paper sx={{ p: 2, mt: 2, backgroundColor: 'white' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Nội dung phiên âm:
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  "{question.answer_data.transcribed_text}"
                </Typography>
              </Paper>
            )}
            
            <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
              Bạn có thể chuyển sang câu tiếp theo
            </Typography>
          </Paper>
          
          {/* Show original question content */}
          <Typography variant="h6" gutterBottom>
            Câu hỏi:
          </Typography>
          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {question.content}
            </Typography>
          </Paper>
        </Box>
      )}
      
      {/* Recording Step */}
      {step === 'recording' && (
        <Box>
          {/* Question Content - Always visible in recording step */}
          <Typography variant="h6" gutterBottom>
            {question.questionType?.code === 'SPEAKING_INTRO' && 'Giới thiệu bản thân:'}
            {question.questionType?.code === 'SPEAKING_DESCRIPTION' && 'Mô tả hình ảnh:'}
            {question.questionType?.code === 'SPEAKING_COMPARISON' && 'So sánh và phân tích:'}
            {question.questionType?.code === 'SPEAKING_DISCUSSION' && 'Thảo luận chủ đề:'}
            {!['SPEAKING_INTRO', 'SPEAKING_DESCRIPTION', 'SPEAKING_COMPARISON', 'SPEAKING_DISCUSSION'].includes(question.questionType?.code) && 'Ghi âm câu trả lời:'}
          </Typography>
          
          {/* Question Content */}
          {question.content && (
            <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {question.content}
              </Typography>
            </Paper>
          )}
          
          <Paper sx={{ p: 2, mb: 2, backgroundColor: 'info.light' }}>
            <Typography variant="subtitle2" gutterBottom>
              Yêu cầu:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {hasPreparationTime && (
                <Chip size="small" label={`Chuẩn bị: ${preparationTimeLimit}s`} variant="outlined" />
              )}
              <Chip size="small" label={`Ghi âm tối đa: 30s`} variant="outlined" />
              <Chip size="small" label={`Có thể dừng sau: 10s`} variant="outlined" color="success" />
            </Box>
            {requirements.prompt && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Yêu cầu:</strong> {requirements.prompt}
              </Typography>
            )}
          </Paper>

          {/* Preparation Timer */}
          {isPreparing && (
            <Paper sx={{ p: 3, mb: 2, textAlign: 'center', backgroundColor: 'warning.light' }}>
              <Typography variant="h3" gutterBottom color="warning.dark">
                {formatTime(preparationTime)}
              </Typography>
              <Typography variant="body1">
                Thời gian chuẩn bị còn lại
              </Typography>
              <LinearProgress
                variant="determinate"
                value={((preparationTimeLimit - preparationTime) / preparationTimeLimit) * 100}
                sx={{ mt: 2, height: 10, borderRadius: 4 }}
              />
            </Paper>
          )}

          {/* Recording UI */}
          {!isPreparing && (
            <Paper sx={{ p: 3, mb: 2, textAlign: 'center' }}>
              {isUploading && (
                <Box>
                  <Typography variant="h6" gutterBottom color="info.main">
                    📤 Đang tải lên...
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{ mb: 2, height: 10, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {uploadProgress}% - Vui lòng chờ
                  </Typography>
                </Box>
              )}

              {!isUploading && isRecording && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Đang ghi âm...
                  </Typography>
                  
                  {/* Circular Progress around Microphone */}
                  <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                my: 4,
                position: 'relative',
                width: 320,
                height: 320,
                margin: '30px auto'
              }}>
                {/* Circular Progress Background */}
                <CircularProgress
                  variant="determinate"
                  value={((30 - recordingTime) / 30) * 100}
                  size={280}
                  thickness={4}
                  sx={{
                    color: '#f44336',
                    position: 'absolute'
                  }}
                />
                
                {/* Center content - Microphone and Timer */}
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1
                }}>
                  {/* Microphone Icon */}
                  <Mic sx={{ 
                    fontSize: 80, 
                    color: '#f44336',
                    mb: 1,
                    animation: 'pulse 1.5s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 }
                    }
                  }} />
                  
                  {/* Recording Timer */}
                  <Typography variant="h2" sx={{ 
                    fontWeight: 'bold',
                    color: '#f44336',
                    lineHeight: 1,
                    mt: 1,
                    fontSize: '48px'
                  }}>
                    {formatTime(recordingTime)}
                  </Typography>
                  
                  {/* Recording indicator */}
                  <Typography variant="caption" sx={{ 
                    mt: 2,
                    color: '#666',
                    textAlign: 'center'
                  }}>
                    Đang ghi âm
                  </Typography>
                </Box>
              </Box>

                  {/* Stop Recording Status */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    {canStopRecording ? (
                      <Box>
                        <Typography variant="body2" color="success.main" sx={{ mb: 2, fontWeight: 'bold' }}>
                          ✓ Bạn có thể dừng bây giờ (đã ghi ≥10 giây)
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="error"
                          onClick={() => setShowStopConfirmation(true)}
                          startIcon={<Stop />}
                          size="large"
                          sx={{ 
                            fontSize: '16px',
                            py: 2,
                            px: 4
                          }}
                        >
                          DỪNG THU ÂM
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="caption" color="error.main" sx={{ fontWeight: 'bold' }}>
                          ⏳ Vui lòng ghi âm ít nhất 10 giây trước khi dừng
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                          Còn lại: {Math.ceil((30 - recordingTime) / 1)} giây
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Auto-stop info */}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                    Hệ thống sẽ tự động dừng khi hết thời gian
                  </Typography>
                </Box>
              )}

              {!isRecording && !isUploading && !audioBlob && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body1" gutterBottom>
                    Sẵn sàng để ghi âm?
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={startRecording}
                    startIcon={<Mic />}
                    size="large"
                    sx={{ 
                      fontSize: '16px',
                      py: 2,
                      px: 4
                    }}
                  >
                    BẮT ĐẦU GHI ÂM
                  </Button>
                </Box>
              )}
            </Paper>
          )}

          {/* Tips */}
          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              Gợi ý nói:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
              <li>Nói rõ ràng và với tốc độ vừa phải</li>
              <li>Sử dụng thời gian chuẩn bị để lên dàn ý</li>
              <li>Trả lời đúng trọng tâm câu hỏi</li>
              <li>Sử dụng từ vựng và cấu trúc đa dạng</li>
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Stop Recording Confirmation Dialog */}
      <Dialog
        open={showStopConfirmation}
        onClose={() => setShowStopConfirmation(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          Xác nhận dừng ghi âm?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph sx={{ mt: 2, textAlign: 'center' }}>
            Bạn có chắc muốn dừng ghi âm lúc này không?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Tổng thời gian ghi âm: {formatTime(30 - recordingTime)}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
          <Button 
            variant="outlined"
            onClick={() => setShowStopConfirmation(false)}
            sx={{ px: 4 }}
          >
            Tiếp tục ghi âm
          </Button>
          <Button 
            variant="contained"
            color="error"
            onClick={confirmStopRecording}
            sx={{ px: 4 }}
          >
            Dừng lại
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}