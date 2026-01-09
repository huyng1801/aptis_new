'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Mic,
  Stop,
  PlayArrow,
  Pause,
  RecordVoiceOver,
  Timer,
  Upload,
  CheckCircle
} from '@mui/icons-material';

export default function PracticeSpeakingQuestion({ question, answer, onAnswerChange }) {
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [maxRecordingTime] = useState(30); // 30 seconds for practice
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  
  // Preparation states
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparationTime, setPreparationTime] = useState(0);
  const [maxPreparationTime] = useState(30); // 30 seconds preparation
  
  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  
  // UI states
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const preparationTimerRef = useRef(null);

  useEffect(() => {
    // Check if there's an existing answer
    if (answer && answer.audio_url) {
      setAudioUrl(answer.audio_url);
      setUploadComplete(true);
    }
  }, [answer, question.question_id]);

  const startPreparation = async () => {
    setError('');
    setIsPreparing(true);
    setPreparationTime(maxPreparationTime);
    
    preparationTimerRef.current = setInterval(() => {
      setPreparationTime((prev) => {
        if (prev <= 1) {
          clearInterval(preparationTimerRef.current);
          setIsPreparing(false);
          // Auto-start recording after preparation
          setTimeout(startRecording, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      setError('');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      const audioChunks = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunks, { 
          type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' 
        });
        setAudioBlob(blob);
        
        // Create URL for playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxRecordingTime) {
            stopRecording();
            return maxRecordingTime;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const handleStopClick = () => {
    if (recordingTime < 5) {
      setShowStopDialog(true);
    } else {
      stopRecording();
    }
  };

  const confirmStopRecording = () => {
    stopRecording();
    setShowStopDialog(false);
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const uploadRecording = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress for practice
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadComplete(true);
      
      // Update answer
      onAnswerChange({
        audio_blob: audioBlob,
        audio_url: audioUrl,
        recording_duration: recordingTime,
        completed: true
      });
      
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const retryRecording = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setUploadComplete(false);
    setRecordingTime(0);
    setError('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingProgress = () => {
    return (recordingTime / maxRecordingTime) * 100;
  };

  const getPreparationProgress = () => {
    return ((maxPreparationTime - preparationTime) / maxPreparationTime) * 100;
  };

  return (
    <Paper elevation={0} sx={{ p: 0 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2, 
          p: 2, 
          bgcolor: 'error.50',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'error.200'
        }}>
          <RecordVoiceOver sx={{ mr: 1, color: 'error.main' }} />
          <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 600 }}>
            Speaking Question
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <Chip 
              label="Recording Practice" 
              size="small" 
              color="error"
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
          {question.content?.question_text || question.question_text || 'Record your response to the speaking prompt.'}
        </Typography>
        
        {question.content?.prompt && (
          <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body1" sx={{ fontStyle: 'italic', lineHeight: 1.7 }}>
              "{question.content.prompt}"
            </Typography>
          </Paper>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Preparation Phase */}
      {isPreparing && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Timer sx={{ mr: 1, color: 'warning.main' }} />
            <Typography variant="h6" color="warning.main">
              Preparation Time
            </Typography>
          </Box>
          
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 2, color: 'warning.main' }}>
            {formatTime(preparationTime)}
          </Typography>
          
          <LinearProgress
            variant="determinate"
            value={getPreparationProgress()}
            color="warning"
            sx={{ height: 8, borderRadius: 4 }}
          />
          
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            Think about what you want to say. Recording will start automatically.
          </Typography>
        </Paper>
      )}

      {/* Recording Phase */}
      {!isPreparing && !uploadComplete && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: isRecording ? 'error.50' : 'grey.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Mic sx={{ mr: 1, color: isRecording ? 'error.main' : 'text.secondary' }} />
            <Typography variant="h6" color={isRecording ? 'error.main' : 'text.primary'}>
              {isRecording ? 'Recording...' : 'Ready to Record'}
            </Typography>
          </Box>
          
          {isRecording && (
            <>
              <Typography variant="h3" sx={{ textAlign: 'center', mb: 2, color: 'error.main' }}>
                {formatTime(recordingTime)}
              </Typography>
              
              <LinearProgress
                variant="determinate"
                value={getRecordingProgress()}
                color="error"
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
            </>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {!isRecording && !audioBlob && (
              <>
                <Button
                  variant="outlined"
                  onClick={startPreparation}
                  startIcon={<Timer />}
                  disabled={isPreparing}
                >
                  Start Preparation ({maxPreparationTime}s)
                </Button>
                <Button
                  variant="contained"
                  onClick={startRecording}
                  startIcon={<Mic />}
                  color="error"
                >
                  Start Recording
                </Button>
              </>
            )}
            
            {isRecording && (
              <Button
                variant="contained"
                onClick={handleStopClick}
                startIcon={<Stop />}
                color="error"
                sx={{ minWidth: 140 }}
              >
                Stop Recording
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Audio Playback */}
      {audioUrl && !isUploading && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="h6" color="success.main">
              Recording Complete
            </Typography>
            <Typography variant="body2" sx={{ ml: 'auto' }}>
              Duration: {formatTime(recordingTime)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              onClick={handlePlayPause}
              startIcon={isPlaying ? <Pause /> : <PlayArrow />}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <LinearProgress
              variant="determinate"
              value={duration > 0 ? (currentTime / duration) * 100 : 0}
              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
            />
            
            <Typography variant="body2">
              {formatTime(Math.floor(currentTime))} / {formatTime(Math.floor(duration))}
            </Typography>
          </Box>
          
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={handleAudioEnded}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            preload="metadata"
          />
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={retryRecording}
              disabled={uploadComplete}
            >
              Record Again
            </Button>
            <Button
              variant="contained"
              onClick={uploadRecording}
              startIcon={<Upload />}
              disabled={uploadComplete}
            >
              Submit Recording
            </Button>
          </Box>
        </Paper>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="h6">
              Uploading Recording... {uploadProgress}%
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Paper>
      )}

      {/* Upload Complete */}
      {uploadComplete && (
        <Paper sx={{ p: 3, bgcolor: 'success.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="h6" color="success.main">
              Recording Submitted Successfully!
            </Typography>
          </Box>
          <Typography variant="body2" color="success.dark">
            Your speaking response has been recorded and saved.
          </Typography>
        </Paper>
      )}

      {/* Stop Recording Confirmation Dialog */}
      <Dialog open={showStopDialog} onClose={() => setShowStopDialog(false)}>
        <DialogTitle>Stop Recording?</DialogTitle>
        <DialogContent>
          <Typography>
            Your recording is very short ({recordingTime} seconds). Are you sure you want to stop?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStopDialog(false)}>
            Continue Recording
          </Button>
          <Button onClick={confirmStopRecording} variant="contained" color="warning">
            Stop Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}