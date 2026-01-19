const fs = require('fs').promises;
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { UPLOAD_LIMITS } = require('../utils/constants');
const { STORAGE_CONFIG } = require('../config/storage');
const { BadRequestError } = require('../utils/errors');
const AzureSpeechService = require('./AzureSpeechService');

// Configure FFmpeg path for fluent-ffmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);

class SpeechToTextService {
  constructor() {
    // Azure Speech Service only
    this.useAzureSpeech = AzureSpeechService.isConfigured();
    
    if (this.useAzureSpeech) {
      console.log('[SpeechToText] ✅ Azure Speech Service configured');
    } else {
      console.error('[SpeechToText] ❌ Azure Speech not configured - service will not work');
      throw new Error('Azure Speech Service must be configured. Please set AZURE_SPEECH_KEY in .env');
    }
  }

  async convertAudioToText(audioFilePath, language = 'en', referenceText = '') {
    let convertedFilePath = null;
    try {
      const fileExists = await fs.access(audioFilePath).then(() => true).catch(() => false);
      if (!fileExists) throw new BadRequestError('Audio file not found');
      
      const stats = await fs.stat(audioFilePath);
      if (stats.size > UPLOAD_LIMITS.MAX_AUDIO_SIZE) {
        throw new BadRequestError('Audio file too large');
      }

      console.log('🎙️ Analyzing audio with Azure Speech:', path.basename(audioFilePath));
      
      const azureLanguage = language === 'vi' ? 'vi-VN' : 'en-US';
      
      // Convert to WAV if not already WAV (Azure Speech works best with WAV)
      const ext = path.extname(audioFilePath).toLowerCase();
      let fileToProcess = audioFilePath;
      
      if (ext !== '.wav') {
        console.log('🔄 Converting audio to WAV format for Azure Speech...');
        convertedFilePath = await this.convertToWav(audioFilePath);
        fileToProcess = convertedFilePath;
        console.log('✅ Audio converted to WAV:', path.basename(convertedFilePath));
      }
      
      // Use Azure Speech transcription
      const transcriptionResult = await AzureSpeechService.transcribeWithAzure(fileToProcess, azureLanguage);
      
      // Convert to enhanced analysis format
      const speechAnalysis = this.convertAzureTranscriptionToAnalysis(transcriptionResult);
      
      console.log('✅ Azure Speech analysis complete:', transcriptionResult.text.substring(0, 50) + '...');
      console.log('📊 Analysis Summary:');
      console.log(`   - Text: "${transcriptionResult.text}"`);
      console.log(`   - Confidence: ${Math.round(transcriptionResult.confidence * 100)}%`);
      console.log(`   - Recognition Status: ${transcriptionResult.recognitionStatus}`);
      
      return {
        text: transcriptionResult.text,
        speechAnalysis
      };
      
    } catch (error) {
      console.error('❌ Azure Speech analysis failed:', error.message);
      throw new BadRequestError(`Speech analysis failed: ${error.message}`);
    } finally {
      // Cleanup converted file if exists
      if (convertedFilePath) {
        try {
          await fs.unlink(convertedFilePath);
          console.log('🗑️ Cleaned up converted WAV file:', path.basename(convertedFilePath));
        } catch (err) {
          console.warn('⚠️ Failed to cleanup converted file:', err.message);
        }
      }
    }
  }

  /**
   * Convert audio file to WAV format (16kHz, 16-bit, mono)
   * Azure Speech works best with WAV format
   * @param {string} inputPath - Path to input audio file
   * @returns {Promise<string>} - Path to converted WAV file
   */
  async convertToWav(inputPath) {
    return new Promise((resolve, reject) => {
      const outputPath = inputPath.replace(/\.[^.]+$/, '') + '-converted.wav';
      
      ffmpeg(inputPath)
        .audioFrequency(16000) // 16kHz sample rate (Azure Speech requirement)
        .audioChannels(1)       // Mono
        .audioCodec('pcm_s16le') // 16-bit PCM
        .format('wav')
        .on('start', (commandLine) => {
          console.log('[FFmpeg] Converting audio:', commandLine);
        })
        .on('end', () => {
          console.log('[FFmpeg] ✅ Conversion complete:', path.basename(outputPath));
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('[FFmpeg] ❌ Conversion failed:', err.message);
          reject(new Error(`Audio conversion failed: ${err.message}`));
        })
        .save(outputPath);
    });
  }

  // Phân tích cảm xúc từ kết quả pronunciation
  detectEmotionalTone(analysis) {
    const { fluencyScore, prosodyScore, pronunciationScore } = analysis;
    
    if (prosodyScore > 85 && fluencyScore > 80) {
      return 'confident';
    } else if (fluencyScore < 40) {
      return 'hesitant';
    } else if (prosodyScore > 70 && pronunciationScore > 75) {
      return 'engaged';
    } else if (fluencyScore < 50 || pronunciationScore < 60) {
      return 'nervous';
    } else {
      return 'neutral';
    }
  }

  // Phân tích accent từ word details
  analyzeAccent(wordDetails) {
    const avgAccuracy = wordDetails.reduce((acc, word) => acc + word.pronunciationScore, 0) / wordDetails.length;
    const errorWords = wordDetails.filter(word => word.errorType !== 'None').length;
    const errorRate = errorWords / wordDetails.length;
    
    let strength = 'light';
    if (errorRate > 0.3 || avgAccuracy < 60) {
      strength = 'strong';
    } else if (errorRate > 0.2 || avgAccuracy < 75) {
      strength = 'moderate';
    }
    
    return {
      strength,
      region: 'general', // Could be enhanced with pattern analysis
      confidence: Math.max(0, 1 - errorRate)
    };
  }

  async uploadAudioFile(file) {
    try {
      this.validateAudioFile(file);
      
      // Case 1: File already saved by multer (has path)
      if (file.path && file.filename) {
        const fileName = file.filename;
        const filePath = file.path;
        
        return {
          path: filePath,
          url: `/uploads/${fileName}`, // Direct filename since multer saves to uploads/
          fileName,
          originalName: file.originalname,
          size: file.size,
          duration: 0 // Will be extracted from audio metadata if needed
        };
      }
      
      // Case 2: File in memory (has buffer) - need to save
      if (file.buffer) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(STORAGE_CONFIG.AUDIO_UPLOAD_PATH, fileName);
        
        await fs.mkdir(STORAGE_CONFIG.AUDIO_UPLOAD_PATH, { recursive: true });
        await fs.writeFile(filePath, file.buffer);
        
        return {
          path: filePath,
          url: `/uploads/audio/${fileName}`,
          fileName,
          originalName: file.originalname,
          size: file.size,
          duration: 0 // Will be extracted from audio metadata if needed
        };
      }
      
      throw new Error('Invalid file object - missing both path and buffer');
      
    } catch (error) {
      throw new BadRequestError(`File upload failed: ${error.message}`);
    }
  }

  async deleteAudioFile(filePath) {
    try {
      const fullPath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(STORAGE_CONFIG.AUDIO_UPLOAD_PATH, filePath);
        
      await fs.unlink(fullPath);
      console.log('🗑️ Audio file deleted:', filePath);
    } catch (error) {
      console.warn('⚠️ Failed to delete audio file:', error.message);
    }
  }

  validateAudioFile(file) {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'];

    if (!file) {
      throw new BadRequestError('No audio file provided');
    }

    // Handle both multer file object and regular File object
    const mimeType = file.mimetype || file.type;
    if (!mimeType || !allowedTypes.includes(mimeType)) {
      throw new BadRequestError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    const maxSize = UPLOAD_LIMITS.MAX_AUDIO_SIZE;
    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      throw new BadRequestError(`File too large. Maximum size: ${maxMB}MB`);
    }

    // Additional check for minimum file size
    const minSize = 1024; // 1KB minimum
    if (file.size < minSize) {
      throw new BadRequestError('File too small. Minimum size: 1KB');
    }

    return true;
  }

  async getTranscriptionStatus(answerId) {
    const answer = await require('../models').AttemptAnswer.findByPk(answerId);

    if (!answer) {
      throw new BadRequestError('Answer not found');
    }

    return {
      hasAudio: !!answer.audio_url,
      isTranscribed: !!answer.transcribed_text,
      transcribedText: answer.transcribed_text,
    };
  }

  /**
   * Convert basic Azure transcription to analysis format
   */
  convertAzureTranscriptionToAnalysis(transcriptionResult) {
    const confidence = transcriptionResult.confidence || 0.8;
    const baseScore = Math.round(confidence * 80 + 20); // 20-100 range based on confidence
    
    return {
      text: transcriptionResult.text || '',
      pronunciationScore: baseScore,
      accuracyScore: baseScore,
      fluencyScore: baseScore,
      completenessScore: baseScore,
      prosodyScore: baseScore,
      confidence: confidence,
      wordDetails: (transcriptionResult.text || '').split(' ').map(word => ({
        word,
        pronunciationScore: baseScore + (Math.random() - 0.5) * 20,
        errorType: 'None',
        confidence: confidence
      })),
      emotionalTone: 'neutral',
      accentAnalysis: { strength: 'light', region: 'general', confidence: confidence },
      audioQualityMetrics: {
        voiceActivityRatio: confidence,
        speechRate: { wordsPerMinute: 150, rateAssessment: 'normal' },
        pauseAnalysis: { frequency: 'normal', length: 'appropriate', naturalness: 'natural' },
        spectralQuality: { overall: 'good', clarity: 'clear', consistency: 'consistent' }
      },
      errorAnalysis: { totalErrors: 0, errorRate: 0, severity: 'minimal' },
      pronunciationDifficulty: { overall: 'moderate', difficultWordCount: 0, difficultWordRatio: 0 }
    };
  }

  /**
   * Check which speech service is being used
   */
  getActiveService() {
    return 'Azure Speech';
  }

  /**
   * Get service status for Azure Speech only
   */
  getServiceStatus() {
    return {
      activeService: this.getActiveService(),
      azureSpeech: AzureSpeechService.getServiceStatus()
    };
  }
}

module.exports = new SpeechToTextService();
