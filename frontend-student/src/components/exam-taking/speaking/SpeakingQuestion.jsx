'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress, 
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Mic, Stop } from '@mui/icons-material';
import { getAssetUrl } from '@/services/api';
import { attemptService } from '@/services/attemptService';

/**
 * Enhanced Speaking Question Component for multi-section structure
 * Handles individual question recording with section context
 */
export default function SpeakingQuestion({ 
  question, 
  onAnswerChange, 
  onMoveToNextQuestion, 
  attemptId,
  onHideHeader,
  questionNumber,
  totalQuestions,
  sectionInfo,
  allQuestions // Add this to access parent question data
}) {
  // Early return if no question
  if (!question) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading question...</Typography>
      </Box>
    );
  }
  
  // Find parent question if this is a follow-up question
  const parentQuestion = question.parent_question_id && allQuestions ? 
    allQuestions.find(q => q.id === question.parent_question_id) : null;
  
  console.log('[SpeakingQuestion] Parent question check:', { 
    hasParentId: !!question.parent_question_id,
    parentId: question.parent_question_id,
    foundParent: !!parentQuestion,
    parentMedia: parentQuestion?.additional_media
  });
  
  // Recording states
  const [step, setStep] = useState('recording');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(120); // Default 2 minutes
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
  
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const timeCounterRef = useRef(0);
  const recordingCompletedRef = useRef(false);
  const autoAdvanceTimerRef = useRef(null); // Track auto-advance timer
  
  // Debug logging - after state initialization
  console.log('[SpeakingQuestion] Render:', { 
    questionId: question.id, 
    questionNumber,
    sectionInfo,
    hasAnswer: !!question.answer_data?.audio_url,
    step,
    answerData: question.answer_data
  });
  
  const MAX_UPLOAD_RETRIES = 3;

  // Use question type to determine timing
  const getTimingByQuestionType = () => {
    const questionTypeCode = question.QuestionType?.code;
    
    // All speaking questions: 10s prep, 30s record
    switch (questionTypeCode) {
      case 'SPEAKING_INTRO':
      case 'SPEAKING_DESCRIPTION':
      case 'SPEAKING_COMPARISON':
      case 'SPEAKING_DISCUSSION':
      default:
        return { prep: 10, recording: 30 };      // Unified timing for all speaking questions
    }
  };

  const timing = getTimingByQuestionType();
  const maxRecordingTime = timing.recording;
  const maxPreparationTime = timing.prep;

  // Check if question already has audio answer
  const hasExistingAudio = question.answer_data?.audio_url;

  // Effect to update step when answer_data changes from parent
  useEffect(() => {
    console.log('[SpeakingQuestion] answer_data updated:', {
      questionId: question.id,
      hasAudio: !!hasExistingAudio,
      audioUrl: hasExistingAudio ? 'present' : 'missing'
    });
    
    if (hasExistingAudio) {
      console.log('[SpeakingQuestion] Audio found from parent update, transitioning to completed');
      setStep('completed');
    }
  }, [hasExistingAudio, question.id]);

  const startRecording = useCallback(async () => {
    console.log('[SpeakingQuestion] Starting recording for question', question.id);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        console.log('[SpeakingQuestion] Recording stopped, blob created:', {
          size: audioBlob.size,
          type: audioBlob.type
        });
        
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setIsRecording(false);
        recordingCompletedRef.current = true;
        
        // Stop all tracks
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
      alert('Cannot access microphone. Please check permissions.');
    }
  }, [maxRecordingTime, question.id]);

  // Initialize component - only depend on question.id to prevent loops
  useEffect(() => {
    // If already has audio answer, show completed state
    if (hasExistingAudio) {
      console.log('[SpeakingQuestion] Question already has audio answer');
      setStep('completed');
      return;
    }
    
    console.log('[SpeakingQuestion] Starting fresh for question', question.id);
    
    // Reset states
    setStep('recording');
    setAudioBlob(null);
    setAudioUrl('');
    setIsRecording(false);
    setIsPreparing(true);
    setPreparationTime(maxPreparationTime);
    setIsUploading(false);
    setUploadError(null);
    setUploadRetries(0);
    recordingCompletedRef.current = false;
    
    // Start preparation countdown
    let countdown = maxPreparationTime;
    const prepTimer = setInterval(() => {
      countdown--;
      setPreparationTime(countdown);
      
      if (countdown <= 0) {
        clearInterval(prepTimer);
        setIsPreparing(false);
        // Auto-start recording after preparation
        setTimeout(() => {
          startRecording();
        }, 500);
      }
    }, 1000);
    
    return () => {
      clearInterval(prepTimer);
      // Clear auto-advance timer if component unmounts
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [question.id, hasExistingAudio, maxPreparationTime, startRecording]); // Include hasExistingAudio to reset when audio arrives

  // Recording timer
  useEffect(() => {
    if (!isRecording) {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      return;
    }

    recordingTimerRef.current = setInterval(() => {
      timeCounterRef.current--;
      setRecordingTime(timeCounterRef.current);

      if (timeCounterRef.current <= 0) {
        // Auto-stop recording when time runs out
        console.log('[SpeakingQuestion] Auto-stopping recording - time limit reached');
        if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
        }
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }, 1000);

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [isRecording]);

  // Store callback refs to avoid stale closures
  const onMoveToNextQuestionRef = useRef(onMoveToNextQuestion);
  
  useEffect(() => {
    onMoveToNextQuestionRef.current = onMoveToNextQuestion;
  }, [onMoveToNextQuestion]);

  const uploadAudioToBackend = useCallback(async (audioBlob, duration) => {
    if (uploadRetries === 0) {
      console.log('[SpeakingQuestion] Starting upload for question', question.id);
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Use attemptService to upload audio
      const response = await attemptService.uploadAudioAnswer(
        attemptId,
        question.id,
        audioBlob,
        (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(percentComplete);
          }
        }
      );

      console.log('[SpeakingQuestion] Upload successful:', response);
      
      // Extract audio_url from response data
      // Backend returns { success: true, data: { answerId, audio_url, duration, fileSize } }
      const audioUrl = response.data?.data?.audio_url || response.data?.audio_url;
      
      if (!audioUrl) {
        throw new Error('No audio_url in response: ' + JSON.stringify(response.data));
      }
      
      console.log('[SpeakingQuestion] Audio URL from response:', audioUrl);
      
      // Update answer in state with complete data
      onAnswerChange?.(question.id, {
        answer_type: 'audio',
        audio_url: audioUrl,
        transcribed_text: null,
        duration: response.data?.data?.duration || response.data?.duration || duration
      });
      
      // Transition to completed immediately after successful upload
      // Don't wait for parent state update since that might be delayed
      setStep('completed');
      setAudioBlob(null);
      setAudioUrl('');
      setIsRecording(false);
      setIsUploading(false);
      setUploadError(null);
      setUploadRetries(0);
      recordingCompletedRef.current = false;
      
      console.log('[SpeakingQuestion] Upload completed successfully, transitioned to completed state');
      
      // Auto-advance after 2 seconds to allow parent state to update
      autoAdvanceTimerRef.current = setTimeout(() => {
        console.log('[SpeakingQuestion] Auto-advancing to next question after delay');
        if (onMoveToNextQuestionRef.current) {
          onMoveToNextQuestionRef.current();
        } else {
          console.warn('[SpeakingQuestion] onMoveToNextQuestion callback not available!');
        }
      }, 2000);
      
    } catch (error) {
      console.error('[SpeakingQuestion] Upload error:', error);
      
      if (uploadRetries < MAX_UPLOAD_RETRIES) {
        setUploadRetries(prev => prev + 1);
        setUploadError(`Upload failed. Retrying... (${uploadRetries + 1}/${MAX_UPLOAD_RETRIES})`);
        
        // Retry after 2 seconds
        setTimeout(() => {
          uploadAudioToBackend(audioBlob, duration);
        }, 2000);
      } else {
        setUploadError('Upload failed after multiple attempts. Please try again.');
        setIsUploading(false);
      }
    }
  }, [question.id, attemptId, uploadRetries, onAnswerChange]);

  // Auto-upload when recording completes - but only once
  useEffect(() => {
    if (audioBlob && !isUploading && !uploadError && recordingCompletedRef.current && step === 'recording') {
      const duration = maxRecordingTime - recordingTime;
      console.log('[SpeakingQuestion] Auto-uploading recorded audio, duration:', duration);
      recordingCompletedRef.current = false; // Prevent duplicate uploads
      uploadAudioToBackend(audioBlob, duration);
    }
  }, [audioBlob, isUploading, uploadError, uploadAudioToBackend, maxRecordingTime, recordingTime, step]);

  const confirmStopRecording = () => {
    setShowStopConfirmation(false);
    if (mediaRecorderRef.current && isRecording) {
      console.log('[SpeakingQuestion] User stopped recording manually');
      mediaRecorderRef.current.stop();
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

  const recordedDuration = maxRecordingTime - recordingTime;
  const canStopRecording = recordedDuration >= 10;

  return (
    <Box>
      {/* Completed State */}
      {step === 'completed' && (
        <Box>
          <Paper sx={{ p: 3, mb: 2, textAlign: 'center', backgroundColor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
            <Typography variant="h6" gutterBottom color="success.dark" sx={{ fontWeight: 'bold' }}>
              ✓ Recording completed successfully
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your answer has been saved
            </Typography>
            <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
              → Moving to next question...
            </Typography>
            
            {hasExistingAudio && question.answer_data?.audio_url && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <audio 
                  controls 
                  style={{ width: '100%', maxWidth: '400px' }}
                  src={getAssetUrl(question.answer_data.audio_url)}
                >
                  Browser does not support audio.
                </audio>
              </Box>
            )}
            
            {hasExistingAudio && question.answer_data?.transcribed_text && (
              <Paper sx={{ p: 2, mt: 2, backgroundColor: 'white', textAlign: 'left' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Transcription:
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {question.answer_data.transcribed_text}
                </Typography>
              </Paper>
            )}
          </Paper>
          
          <Paper sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Question:</Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              {question.content}
            </Typography>
          </Paper>
        </Box>
      )}
      
      {/* Recording Step */}
      {step === 'recording' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '300px 1fr 360px', gap: 2, alignItems: 'start' }}>
          {/* COLUMN 1: Media (Image or Audio) */}
          <Box>
            {/* Render images from additional_media (SPEAKING section unified structure) */}
            {(() => {
              // For follow-up questions, use parent question's media
              const sourceQuestion = parentQuestion || question;
              
              // Handle both string and already parsed JSON
              let additionalMedia = sourceQuestion.additional_media;
              if (typeof additionalMedia === 'string') {
                try {
                  additionalMedia = JSON.parse(additionalMedia);
                } catch (e) {
                  console.error('[SpeakingQuestion] Failed to parse additional_media:', e);
                  additionalMedia = null;
                }
              }
              
              console.log('[SpeakingQuestion] Media rendering:', { 
                questionId: question.id,
                parentQuestionId: question.parent_question_id,
                usingParent: !!parentQuestion,
                sourceQuestionId: sourceQuestion.id,
                additionalMedia
              });
              
              if (additionalMedia && Array.isArray(additionalMedia)) {
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {parentQuestion && (
                      <Typography variant="caption" sx={{ 
                        color: 'primary.main', 
                        fontWeight: 'bold', 
                        mb: 1,
                        padding: '4px 8px',
                        backgroundColor: 'primary.50',
                        borderRadius: 1,
                        textAlign: 'center'
                      }}>
                        📖 Refer to the same image(s) from the previous question
                      </Typography>
                    )}
                    {additionalMedia.map((media, index) => (
                      <Paper key={index} sx={{ p: 2, backgroundColor: '#f5f5f5', textAlign: 'center', position: 'sticky', top: '20px' }}>
                        {media.type === 'image' ? (
                          <Box>
                            {media.description && (
                              <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary', fontWeight: 'bold' }}>
                                {media.description}
                              </Typography>
                            )}
                            <img 
                              src={media.url} 
                              alt={media.description || 'Question media'} 
                              style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '4px', objectFit: 'cover' }}
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/280x280?text=Image+Not+Found'; }}
                            />
                          </Box>
                        ) : media.type === 'audio' ? (
                          <Box>
                            {media.description && (
                              <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary', fontWeight: 'bold' }}>
                                {media.description}
                              </Typography>
                            )}
                            <audio 
                              controls 
                              style={{ width: '100%' }}
                              src={media.url}
                            >
                              Browser does not support audio.
                            </audio>
                          </Box>
                        ) : null}
                      </Paper>
                    ))}
                  </Box>
                );
              } else if (sourceQuestion.media_url) {
                // Fallback to old media_url for backward compatibility
                return (
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', textAlign: 'center', position: 'sticky', top: '20px' }}>
                    {parentQuestion && (
                      <Typography variant="caption" sx={{ 
                        color: 'primary.main', 
                        fontWeight: 'bold', 
                        mb: 1,
                        display: 'block'
                      }}>
                        📖 Refer to the same image from the previous question
                      </Typography>
                    )}
                    {sourceQuestion.media_url.includes('.mp3') || sourceQuestion.media_url.includes('audio') ? (
                      <audio 
                        controls 
                        style={{ width: '100%' }}
                        src={getAssetUrl(sourceQuestion.media_url)}
                      >
                        Browser does not support audio.
                      </audio>
                    ) : (
                      <img 
                        src={sourceQuestion.media_url} 
                        alt="Question" 
                        style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '4px' }}
                      />
                    )}
                  </Paper>
                );
              } else {
                return (
                  <Paper sx={{ p: 2, backgroundColor: '#f9f9f9', textAlign: 'center', border: '2px dashed #ccc' }}>
                    <Typography variant="caption" color="text.secondary">
                      No media available for this question
                    </Typography>
                  </Paper>
                );
              }
            })()}
          </Box>

          {/* COLUMN 2: Question Content & Requirements */}
          <Box>
            {/* Question Content */}
            {question.content && (
              <Paper sx={{ p: 2.5, mb: 2, backgroundColor: '#f9f9f9', borderLeft: '3px solid #2196f3' }}>
                <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#333' }}>
                  {question.content}
                </Typography>
              </Paper>
            )}
            
            {/* Requirements */}
            <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2', display: 'block', mb: 1 }}>
                📋 Requirements
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                • Prep: {maxPreparationTime}s | Record: {formatTime(maxRecordingTime)}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                • Min: 10 seconds
              </Typography>
            </Box>
          </Box>

          {/* COLUMN 3: Recording Controls */}
          <Box sx={{ position: 'sticky', top: '20px' }}>
            {/* Preparation Timer */}
            {isPreparing && (
              <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3e0', borderTop: '4px solid #ff9800' }}>
                <Typography variant="caption" sx={{ color: '#e65100', fontWeight: 'bold', display: 'block', mb: 2 }}>
                  Preparing...
                </Typography>
                
                <Box sx={{
                  position: 'relative',
                  width: 140,
                  height: 140,
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CircularProgress
                    variant="determinate"
                    value={((maxPreparationTime - preparationTime) / maxPreparationTime) * 100}
                    size={140}
                    thickness={4}
                    sx={{ position: 'absolute', color: '#ff9800' }}
                  />
                  
                  <Box sx={{ textAlign: 'center', zIndex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ff9800', fontSize: '32px', lineHeight: 1 }}>
                      {formatTime(preparationTime)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Recording Controls */}
            {!isPreparing && (
              <Paper sx={{ p: 2 }}>
                {isUploading && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2', display: 'block', mb: 1 }}>
                      📤 Uploading...
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress}
                      sx={{ mb: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                      {uploadProgress}%
                    </Typography>
                  </Box>
                )}

                {!isUploading && isRecording && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#d32f2f', display: 'block', textAlign: 'center', mb: 1.5 }}>
                      ● Recording
                    </Typography>
                    
                    <Box sx={{
                      position: 'relative',
                      width: 120,
                      height: 120,
                      margin: '0 auto 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CircularProgress
                        variant="determinate"
                        value={((maxRecordingTime - recordingTime) / maxRecordingTime) * 100}
                        size={120}
                        thickness={4}
                        sx={{ position: 'absolute', color: '#d32f2f' }}
                      />
                      
                      <Box sx={{ textAlign: 'center', zIndex: 1 }}>
                        <Mic sx={{ fontSize: 40, color: '#d32f2f', mb: 0.5 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#d32f2f', fontSize: '28px', lineHeight: 1 }}>
                          {formatTime(recordingTime)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 1 }}>
                      {canStopRecording ? (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold', display: 'block', mb: 1, textAlign: 'center' }}>
                            ✓ Can stop
                          </Typography>
                          <Button 
                            variant="contained" 
                            color="error"
                            onClick={() => setShowStopConfirmation(true)}
                            fullWidth
                            size="small"
                            startIcon={<Stop sx={{ fontSize: 18 }} />}
                            sx={{ fontSize: '12px', py: 1 }}
                          >
                            STOP
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 'bold', display: 'block', textAlign: 'center' }}>
                          ⏳ Min 10s
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}

                {!isRecording && !isUploading && !audioBlob && (
                  <Box sx={{ textAlign: 'center', py: 1 }}>
                    <Mic sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '11px' }}>
                      Auto-start...
                    </Typography>
                    <CircularProgress size={20} sx={{ mt: 1, color: '#2196f3' }} />
                  </Box>
                )}
              </Paper>
            )}
          </Box>
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
          Confirm stop recording?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Recording time: <strong>{formatTime(maxRecordingTime - recordingTime)}</strong>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 1, pb: 2 }}>
          <Button 
            variant="outlined"
            onClick={() => setShowStopConfirmation(false)}
            sx={{ px: 3 }}
          >
            Continue
          </Button>
          <Button 
            variant="contained"
            color="error"
            onClick={confirmStopRecording}
            sx={{ px: 3 }}
          >
            Stop
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}