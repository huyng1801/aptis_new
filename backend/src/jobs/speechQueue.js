const path = require('path');
const SpeechToTextService = require('../services/SpeechToTextService');
const { AttemptAnswer } = require('../models');
const { STORAGE_CONFIG } = require('../config/storage');
const AiScoringService = require('../services/AiScoringService');

// Hàng đợi xử lý chuyển đổi giọng nói sang văn bản (lưu trong RAM)
const queue = [];
let isProcessing = false;

/**
 * Thêm một job chuyển đổi giọng nói sang văn bản vào hàng đợi
 * @param {Object} jobData - Dữ liệu job (answerId, audioUrl, ...)
 * @returns {number} id của job vừa thêm
 */
function addSpeechJob(jobData) {
  // Tạo job mới với thông tin, số lần thử tối đa là 3
  const job = {
    id: Date.now() + Math.random(), // Tạo id duy nhất
    data: jobData,
    attempts: 0, // Số lần thử
    maxAttempts: 3, // Số lần thử tối đa
    createdAt: new Date(),
    status: 'pending', // Trạng thái ban đầu
  };
  queue.push(job); // Đưa job vào hàng đợi
  // Nếu chưa chạy xử lý thì bắt đầu xử lý
  if (!isProcessing) {
    processQueue();
  }
  return job.id;
}

/**
 * Xử lý các job trong hàng đợi
 * Tự động thử lại nếu chuyển đổi thất bại, tối đa 3 lần
 */
async function processQueue() {
  if (isProcessing || queue.length === 0) {
    return;
  }
  isProcessing = true;
  while (queue.length > 0) {
    const job = queue[0];
    try {
      // Thực hiện chuyển đổi giọng nói sang văn bản
      const transcription = await processJob(job);
      const transcriptionText = transcription.text || transcription;
      
      console.log(`[speechQueue] ✅ Transcription completed for answer ${job.data.answerId}`);
      console.log(`[speechQueue] Transcribed text: "${transcriptionText.substring(0, 100)}${transcriptionText.length > 100 ? '...' : ''}"`);
      
      // Cập nhật kết quả vào bảng AttemptAnswer
      await AttemptAnswer.update(
        { transcribed_text: transcriptionText },
        { where: { id: job.data.answerId } },
      );
      
      console.log(`[speechQueue] 🎯 Triggering AI scoring for answer ${job.data.answerId}...`);
      
      // Tự động trigger AI scoring SAU KHI có transcribed_text
      setImmediate(async () => {
        try {
          await AiScoringService.scoreAnswerComprehensively(job.data.answerId, true);
          console.log(`[speechQueue] ✅ AI scoring completed for answer ${job.data.answerId}`);
        } catch (scoringError) {
          console.error(`[speechQueue] ❌ AI scoring failed for answer ${job.data.answerId}:`, scoringError.message);
          // Đánh dấu cần review nếu scoring thất bại
          await AttemptAnswer.update(
            { needs_review: true },
            { where: { id: job.data.answerId } }
          );
        }
      });
      
      queue.shift(); // Xoá job khỏi hàng đợi
    } catch (error) {
      job.attempts++;
      if (job.attempts >= job.maxAttempts) {
        // Nếu quá số lần thử thì xoá khỏi hàng đợi và đánh dấu answer cần chấm tay
        queue.shift();
        try {
          await AttemptAnswer.update(
            { 
              transcribed_text: '[Transcription failed]',
              needs_review: true,
              ai_feedback: 'Không thể chuyển đổi giọng nói thành văn bản. Cần chấm thủ công.'
            },
            { where: { id: job.data.answerId } },
          );
        } catch (updateError) {
          // Nếu cập nhật thất bại thì log lỗi
        }
      } else {
        // Nếu chưa quá số lần thử thì chuyển job về cuối hàng đợi để thử lại sau
        queue.shift();
        queue.push(job);
        // Đợi 10 giây trước khi thử lại
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }
  isProcessing = false;
}

/**
 * Xử lý từng job chuyển đổi giọng nói sang văn bản
 * @param {Object} job - Job cần xử lý
 * @returns {string} kết quả chuyển đổi (transcription)
 */
async function processJob(job) {
  const { answerId, audioUrl, language = 'en' } = job.data;
  
  // Convert relative URL to absolute file path
  // audioUrl is like: /uploads/audio-xxx.webm or /uploads/audio/audio-xxx.webm
  let absolutePath = audioUrl;
  
  // If it's a relative URL (starts with /uploads), convert to absolute path
  if (audioUrl.startsWith('/uploads/')) {
    // Remove /uploads/ prefix and get filename
    const relativePath = audioUrl.replace(/^\/uploads\//, '');
    
    // Build absolute path: backend directory + basePath + filename
    // If basePath is relative, join with backend directory
    if (path.isAbsolute(STORAGE_CONFIG.basePath)) {
      absolutePath = path.join(STORAGE_CONFIG.basePath, relativePath);
    } else {
      // basePath is relative (e.g., 'uploads'), join with backend root
      const backendRoot = path.resolve(__dirname, '../../'); // Go up to backend/
      absolutePath = path.join(backendRoot, STORAGE_CONFIG.basePath, relativePath);
    }
    
    console.log(`[speechQueue] Converted relative URL to absolute path:`);
    console.log(`[speechQueue] - URL: ${audioUrl}`);
    console.log(`[speechQueue] - Path: ${absolutePath}`);
  }
  
  // Gọi service chuyển đổi audio sang text
  const transcription = await SpeechToTextService.convertAudioToText(absolutePath, language);
  return transcription;
}

/**
 * Lấy trạng thái hàng đợi
 * Trả về số lượng job, trạng thái xử lý và thông tin từng job
 */
function getQueueStatus() {
  return {
    queueLength: queue.length,
    isProcessing,
    jobs: queue.map((j) => ({
      id: j.id,
      answerId: j.data.answerId,
      attempts: j.attempts,
      createdAt: j.createdAt,
    })),
  };
}

/**
 * Xoá toàn bộ hàng đợi
 * Dừng xử lý các job hiện tại
 */
function clearQueue() {
  queue.length = 0;
  isProcessing = false;
}

module.exports = {
  addSpeechJob,
  getQueueStatus,
  clearQueue,
};
