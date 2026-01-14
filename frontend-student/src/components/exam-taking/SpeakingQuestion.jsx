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
  
  // Debug logging
  console.log('[SpeakingQuestion] Component render:', { 
    questionId: question.id, 
    hasOnMoveToNext: !!onMoveToNextQuestion,
    attemptId 
  });
  // Modal states
  const [step, setStep] = useState('recording'); // recording only
  
  // Parse question requirements first (before using in useState)
  const requirements = question.question_content?.requirements || {};
  
  // Extract question number from content (e.g., "Câu 1/4" -> 1)
  const questionNumberMatch = question.content?.match(/Câu\s+(\d+)\/\d+/);
  const questionNumber = questionNumberMatch ? parseInt(questionNumberMatch[1]) : 1;
  
  // Calculate max recording time based on question number
  // Q1: 30s, Q2: 60s, Q3: 90s, Q4: 120s
  const maxRecordingTime = (questionNumber === 1) ? 30 : (questionNumber === 2) ? 60 : (questionNumber === 3) ? 90 : 120;
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(maxRecordingTime); // Start at max recording time
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
  const timeCounterRef = useRef(0);
  const MAX_UPLOAD_RETRIES = 3;

  // Fixed preparation time: 10 seconds
  const preparationTimeLimit = 10;
  const hasPreparationTime = true;
  
  // Confirmation dialog state
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  
  // Track when recording actually completes (to trigger upload)
  const recordingCompletedRef = useRef(false);

  // Check if question already has audio answer
  const hasExistingAudio = question.answer_data?.audio_url;

  // Define startRecording EARLY - before any effect that uses it
  const startRecording = useCallback(async () => {
    console.log('[SpeakingQuestion] startRecording called for question', question.id);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      
      console.log('[SpeakingQuestion] MediaRecorder created, starting recording');
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        console.log('[SpeakingQuestion] Recording stopped, processing audio');
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
      setRecordingTime(maxRecordingTime);
      timeCounterRef.current = maxRecordingTime;
      
      console.log('[SpeakingQuestion] Recording started successfully');
      
    } catch (error) {
      console.error('[SpeakingQuestion] Microphone error:', error.message);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  }, [maxRecordingTime, question.id]);

  // Initialize component - start with preparation or recording
  useEffect(() => {
    // If already has audio answer, don't start recording/preparation
    if (hasExistingAudio) {
      console.log('[SpeakingQuestion] Question already has audio answer, showing completed state');
      setStep('completed');
      return;
    }
    
    console.log('[SpeakingQuestion] Starting fresh for question', question.id);
    
    // Reset step and start fresh - always start with preparation
    setStep('recording');
    setAudioBlob(null);
    setAudioUrl('');
    setIsRecording(false);
    setIsPreparing(true);
    setPreparationTime(preparationTimeLimit);
    
    // Auto start preparation countdown
    let countdown = preparationTimeLimit;
    const prepTimer = setInterval(() => {
      countdown--;
      setPreparationTime(countdown);
      
      if (countdown <= 0) {
        clearInterval(prepTimer);
        console.log('[SpeakingQuestion] Preparation ended, auto-starting recording');
        setIsPreparing(false);
        
        // Auto start recording after preparation
        setTimeout(() => {
          startRecording();
        }, 300);
      }
    }, 1000);
    
    return () => {
      clearInterval(prepTimer);
    };
  }, [question.id, preparationTimeLimit, hasExistingAudio, startRecording]);

  // Reset states when question changes (but skip first initialization)
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    // Skip first render to avoid interfering with initialization
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    
    console.log('[SpeakingQuestion] Resetting states for new question:', question.id);
    
    // Reset all states without triggering any timers or recordings
    setIsRecording(false);
    setRecordingTime(maxRecordingTime);
    setAudioBlob(null);
    setAudioUrl('');
    setIsPreparing(false);
    setPreparationTime(0);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    recordingCompletedRef.current = false;
    setUploadRetries(0);
    timeCounterRef.current = maxRecordingTime;
    setShowStopConfirmation(false);
    
    // Cleanup function for unmount
    return () => {
      // Stop any ongoing recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // Clear recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // Cleanup old audio URLs to prevent memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [question.id, maxRecordingTime]); // Include maxRecordingTime dependency

  // Removed complex preparation timer - now handled in initialization effect

  // Recording timer (dynamic max time based on question number)
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
  }, [isRecording, question.id, maxRecordingTime]);

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

      // Ensure duration is properly set
      const actualDuration = duration || 30;

      // Create a proper file object with duration property
      const audioFile = new File([audioBlob], `speaking_q${question.id}_${Date.now()}.webm`, {
        type: audioBlob.type || 'audio/webm'
      });
      
      // Add duration property to the file object
      Object.defineProperty(audioFile, 'duration', {
        value: actualDuration,
        writable: false,
        enumerable: true,
        configurable: false
      });

      console.log('[SpeakingQuestion] Uploading audio for question:', question.id, 'to attempt:', attemptId);
      console.log('[SpeakingQuestion] Audio file details:', {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type,
        duration: audioFile.duration
      });
      
      const response = await attemptService.uploadAudioAnswer(
        attemptId,
        question.id,
        audioFile,
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
        
        // Auto-move to next question after upload success
        setTimeout(() => {
          console.log('[SpeakingQuestion] Upload successful, moving to next question');
          if (onMoveToNextQuestion) {
            onMoveToNextQuestion();
          }
        }, 1000); // Reduced from 1500ms
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
  }, [question.id, attemptId, uploadRetries, onMoveToNextQuestion, onAnswerChange]);

  // Auto-upload when audioBlob is set (after recording stops)
  useEffect(() => {
    console.log('[SpeakingQuestion] Auto-upload effect triggered:', {
      hasAudioBlob: !!audioBlob,
      isUploading,
      uploadError: !!uploadError,
      recordingCompleted: recordingCompletedRef.current
    });
    
    if (audioBlob && !isUploading && !uploadError && recordingCompletedRef.current) {
      console.log('[SpeakingQuestion] Auto-uploading audio blob for question:', question.id);
      recordingCompletedRef.current = false; // Reset so it only triggers once per recording
      const duration = maxRecordingTime - timeCounterRef.current;
      console.log('[SpeakingQuestion] Upload duration calculated:', duration, 'seconds');
      uploadAudioToBackend(audioBlob, duration);
    }
  }, [audioBlob, isUploading, uploadError, uploadAudioToBackend, question.id, maxRecordingTime]); // Add proper deps

  // Removed auto-start recording effect - now handled directly in preparation timer
  
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

  // Can stop recording if at least 10 seconds have been recorded
  const recordedDuration = maxRecordingTime - recordingTime;
  const canStopRecording = recordedDuration >= 10;

  return (
    <Box>
      {/* Completed State - Show when audio already uploaded */}
      {step === 'completed' && hasExistingAudio && (
        <Box>
          <Paper sx={{ p: 3, mb: 2, textAlign: 'center', backgroundColor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
            <Typography variant="h6" gutterBottom color="success.dark" sx={{ fontWeight: 'bold' }}>
              ✓ Đã ghi âm thành công
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Câu trả lời của bạn đã được lưu
            </Typography>
            
            {/* Audio Player */}
            {question.answer_data?.audio_url && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <audio 
                  controls 
                  style={{ width: '100%', maxWidth: '400px' }}
                  src={getAssetUrl(question.answer_data.audio_url)}
                >
                  Trình duyệt không hỗ trợ phát audio.
                </audio>
              </Box>
            )}
            
            {question.answer_data?.transcribed_text && (
              <Paper sx={{ p: 2, mt: 2, backgroundColor: 'white', textAlign: 'left' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Nội dung phiên âm:
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {question.answer_data.transcribed_text}
                </Typography>
              </Paper>
            )}
          </Paper>
          
          {/* Original Question */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Câu hỏi:</Typography>
          <Paper sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              {question.content}
            </Typography>
          </Paper>
        </Box>
      )}
      
      {/* Recording Step */}
      {step === 'recording' && (
        <Box>
          {/* Question Title */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            {question.questionType?.code === 'SPEAKING_INTRO' && 'Giới thiệu bản thân'}
            {question.questionType?.code === 'SPEAKING_DESCRIPTION' && 'Mô tả hình ảnh'}
            {question.questionType?.code === 'SPEAKING_COMPARISON' && 'So sánh và phân tích'}
            {question.questionType?.code === 'SPEAKING_DISCUSSION' && 'Thảo luận chủ đề'}
            {!['SPEAKING_INTRO', 'SPEAKING_DESCRIPTION', 'SPEAKING_COMPARISON', 'SPEAKING_DISCUSSION'].includes(question.questionType?.code) && 'Ghi âm câu trả lời'}
          </Typography>
          
          {/* Question Content */}
          {question.content && (
            <Paper sx={{ p: 2.5, mb: 3, backgroundColor: '#f9f9f9', borderLeft: '3px solid #2196f3' }}>
              <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#333' }}>
                {question.content}
              </Typography>
            </Paper>
          )}
          
          {/* Requirements */}
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2', display: 'block', mb: 1 }}>
              📋 Yêu cầu
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              • Thời gian chuẩn bị: {preparationTimeLimit} giây
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              • Thời gian ghi âm: Tối đa {maxRecordingTime} giây ({Math.floor(maxRecordingTime / 60)}:{(maxRecordingTime % 60).toString().padStart(2, '0')})
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              • Có thể dừng sau: 10 giây
            </Typography>
          </Box>

          {/* Preparation Timer */}
          {isPreparing && (
            <Paper sx={{ p: 3, mb: 3, textAlign: 'center', backgroundColor: '#fff3e0', borderTop: '4px solid #ff9800' }}>
              <Typography variant="caption" sx={{ color: '#e65100', fontWeight: 'bold', display: 'block', mb: 3 }}>
                Chuẩn bị...
              </Typography>
              
              {/* Circular Progress Timer */}
              <Box sx={{
                position: 'relative',
                width: 200,
                height: 200,
                margin: '0 auto 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Circular Progress */}
                <CircularProgress
                  variant="determinate"
                  value={((preparationTimeLimit - preparationTime) / preparationTimeLimit) * 100}
                  size={200}
                  thickness={3}
                  sx={{ position: 'absolute', color: '#ff9800' }}
                />
                
                {/* Center Timer */}
                <Box sx={{ textAlign: 'center', zIndex: 1 }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#ff9800', fontSize: '44px', lineHeight: 1 }}>
                    {formatTime(preparationTime)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Recording UI */}
          {!isPreparing && (
            <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
              {/* Uploading State */}
              {isUploading && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                    📤 Đang tải lên...
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {uploadProgress}%
                  </Typography>
                </Box>
              )}

              {/* Recording State */}
              {!isUploading && isRecording && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 3, color: '#d32f2f' }}>
                    ● Đang ghi âm
                  </Typography>
                  
                  {/* Recording Timer */}
                  <Box sx={{ my: 4 }}>
                    <Box sx={{
                      position: 'relative',
                      width: 200,
                      height: 200,
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {/* Circular Progress */}
                      <CircularProgress
                        variant="determinate"
                        value={((maxRecordingTime - recordingTime) / maxRecordingTime) * 100}
                        size={200}
                        thickness={3}
                        sx={{ position: 'absolute', color: '#d32f2f' }}
                      />
                      
                      {/* Center Timer */}
                      <Box sx={{ textAlign: 'center', zIndex: 1 }}>
                        <Mic sx={{ fontSize: 48, color: '#d32f2f', mb: 1 }} />
                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#d32f2f', fontSize: '44px', lineHeight: 1 }}>
                          {formatTime(recordingTime)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Stop Recording Info */}
                  <Box sx={{ mt: 3 }}>
                    {canStopRecording ? (
                      <Box>
                        <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold', display: 'block', mb: 1.5 }}>
                          ✓ Đã ghi ≥10 giây - có thể dừng
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="error"
                          onClick={() => setShowStopConfirmation(true)}
                          startIcon={<Stop />}
                          sx={{ fontSize: '14px', py: 1.5, px: 3 }}
                        >
                          DỪNG THU ÂM
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                        ⏳ Ghi ít nhất 10 giây trước khi dừng
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Auto-Recording State (Waiting to start) */}
              {!isRecording && !isUploading && !audioBlob && (
                <Box sx={{ py: 2 }}>
                  <Mic sx={{ fontSize: 56, color: '#2196f3', mb: 2 }} />
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Sẽ tự động bắt đầu ghi âm sau khi chuẩn bị...
                  </Typography>
                  <CircularProgress size={24} sx={{ color: '#2196f3' }} />
                </Box>
              )}
            </Paper>
          )}
        </Box>
      )}

      {/* Stop Recording Confirmation Dialog */}
      <Dialog
        open={showStopConfirmation}
        onClose={() => setShowStopConfirmation(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Xác nhận dừng ghi âm?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Thời gian ghi âm: <strong>{formatTime(maxRecordingTime - recordingTime)}</strong>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 1, pb: 2 }}>
          <Button 
            variant="outlined"
            onClick={() => setShowStopConfirmation(false)}
            sx={{ px: 3 }}
          >
            Tiếp tục
          </Button>
          <Button 
            variant="contained"
            color="error"
            onClick={confirmStopRecording}
            sx={{ px: 3 }}
          >
            Dừng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}