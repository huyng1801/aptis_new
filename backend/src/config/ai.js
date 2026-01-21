
require('dotenv').config();


const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,

  // Note: Must use gpt-4-turbo or gpt-4o for Vision API support
  // gpt-4 does NOT support vision - will fail with images
  model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
  baseURL: 'https://api.openai.com/v1',
  temperature: 1, 
  maxTokens: 2048, 
};


let useOpenAI = !!OPENAI_CONFIG.apiKey;


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


checkAIProviders();


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
    
    // Prepare content - support both text and vision (images)
    let messageContent = prompt;
    
    // If images provided, build vision content
    if (options.images && Array.isArray(options.images) && options.images.length > 0) {
      console.log(`[OpenAI] 🖼️  Vision mode: Including ${options.images.length} image(s)`);
      
      // Log image details for debugging
      options.images.forEach((img, idx) => {
        const imageSize = img.base64 ? `${(img.base64.length / 1024 / 1024).toFixed(2)}MB` : 'URL';
        console.log(`[OpenAI]   Image ${idx + 1}: ${img.description || 'No description'} (${imageSize})`);
      });
      
      messageContent = [
        {
          type: 'text',
          text: prompt
        },
        ...options.images.map((img, idx) => {
          const imageUrl = img.url || `data:${img.media_type || 'image/jpeg'};base64,${img.base64}`;
          console.log(`[OpenAI]   Image ${idx + 1} URL type: ${img.url ? 'HTTP URL' : 'Base64 Data URL'}`);
          return {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'high' // high detail for better analysis
            }
          };
        })
      ];
      console.log(`[OpenAI] ✅ Vision content prepared with ${options.images.length} image(s)`);
    }
    
    // Prepare request body
    const requestBody = {
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ],
      max_completion_tokens: options.max_completion_tokens || OPENAI_CONFIG.maxTokens,
      temperature: options.temperature !== undefined ? options.temperature : OPENAI_CONFIG.temperature,
    };
    
    // Log request details for debugging
    if (Array.isArray(messageContent)) {
      const imageCount = messageContent.filter(item => item.type === 'image_url').length;
      console.log(`[OpenAI] 🚀 Sending request with ${imageCount} image(s) to ${OPENAI_CONFIG.model}...`);
    } else {
      console.log(`[OpenAI] 🚀 Sending text-only request to ${OPENAI_CONFIG.model}...`);
    }
    
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
