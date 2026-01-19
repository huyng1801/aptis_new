
// Cấu hình AI - Dùng CHỈ OpenAI ChatGPT (Best for English assessment)
require('dotenv').config();

// ========================================
// OPENAI CHATGPT CONFIGURATION (PRIMARY - ONLY PROVIDER)
// ========================================
const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  // Best models for English assessment:
  // - gpt-4o: Latest, most capable (recommended)
  // - gpt-4: Fast and accurate
  // - gpt-4: Most stable for instruction following
  model: process.env.OPENAI_MODEL || 'gpt-4',
  baseURL: 'https://api.openai.com/v1',
  temperature: 1, // Lower for more consistent, deterministic scoring
  maxTokens: 1024, // Enough for scoring JSON responses
};

// Determine which AI provider to use
let useOpenAI = !!OPENAI_CONFIG.apiKey;

// Kiểm tra AI provider khả dụng
const checkAIProviders = async () => {
  if (useOpenAI) {
    console.log('[AI Config] ✅ OpenAI ChatGPT API configured (ONLY PROVIDER)');
    console.log('[AI Config] 🤖 Model: ' + OPENAI_CONFIG.model);
    console.log('[AI Config] 🎯 Purpose: English Assessment (Most Accurate)');
    return;
  }

  console.log('[AI Config] ❌ No AI provider available');
  console.log('[AI Config] 💡 Please set OPENAI_API_KEY in .env file');
  console.log('[AI Config] 📖 Get API Key: https://platform.openai.com/api-keys');
};

// Check providers on startup
checkAIProviders();

/**
 * Gọi Google Gemini API (Removed - Using OpenAI only)
 * This function is deprecated and kept for reference only
 */
const callGemini = async (prompt) => {
  throw new Error('Gemini API is no longer supported. Using OpenAI ChatGPT exclusively.');
};

/**
 * Gọi OpenAI ChatGPT API (Cloud-based, most capable)
 * @param {string} prompt - Prompt để gửi
 * @param {object} options - Options for the API call
 * @returns {Promise<string>} Kết quả từ model
 */
const callOpenAI = async (prompt, options = {}) => {
  if (!OPENAI_CONFIG.apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    console.log(`[OpenAI] Calling model: ${OPENAI_CONFIG.model}`);
    
    // Prepare request body
    const requestBody = {
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_completion_tokens: options.max_completion_tokens || OPENAI_CONFIG.maxTokens,
      temperature: options.temperature !== undefined ? options.temperature : OPENAI_CONFIG.temperature,
    };
    
    const response = await fetch(`${OPENAI_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`
      },
      body: JSON.stringify(requestBody),
      timeout: 300000 // 5 minute timeout
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
      throw new Error(`OpenAI API error: ${errorMsg}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Debug logging
    if (!content || content.trim().length === 0) {
      console.log('[OpenAI] ⚠️  Empty content received. Full response:', JSON.stringify(data, null, 2));
    }
    
    console.log('[OpenAI] ✅ Response received');
    return content;
  } catch (error) {
    console.error('[OpenAI] ❌ Error:', error.message);
    throw error;
  }
};

/**
 * Gọi AI service - OpenAI ChatGPT ONLY
 * @param {string} prompt - Prompt để gửi
 * @param {object} options - Tùy chọn
 * @returns {Promise<string>} Kết quả từ model
 */
const callAI = async (prompt, options = {}) => {
  console.log('[AI] Calling OpenAI ChatGPT (Only provider)...');
  return callOpenAI(prompt, options);
};

// Export các thành phần cấu hình AI
module.exports = {
  // OpenAI ChatGPT (ONLY PROVIDER - Best for English assessment)
  callOpenAI,
  OPENAI_CONFIG,
  
  // AI service (calls OpenAI directly)
  callAI,
  checkAIProviders,
  
  // Status
  isUsingOpenAI: () => useOpenAI,
};
