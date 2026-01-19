/**
 * AI Service Client
 * Handles AI API calls and response parsing
 * Uses OpenAI ChatGPT exclusively for best English assessment accuracy
 */

const { callAI, OPENAI_CONFIG, isUsingOpenAI } = require('../../config/ai');
const { AI_SCORING_CONFIG } = require('../../utils/constants');
const { delay } = require('../../utils/helpers');

class AiServiceClient {
  /**
   * Call AI service with retry logic
   */
  async callAiWithRetry(prompt, maxRetries = AI_SCORING_CONFIG.MAX_RETRIES) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[callAiWithRetry] Attempt ${attempt}/${maxRetries}: Calling AI service...`);

        // 🚀 OPTIMIZED: Minimal system prompt = faster processing
        const systemPrompt = 'Expert APTIS English assessor. Respond JSON only. Be precise with CEFR levels.';
        const fullPrompt = `${systemPrompt}\n\n${prompt}`;
        
        // Prepare options - handle models that don't support temperature
        const options = {
          max_completion_tokens: OPENAI_CONFIG.maxTokens,
          temperature: OPENAI_CONFIG.temperature
        };
        
        const content = await callAI(fullPrompt, options);

        if (!content || content.trim().length === 0) {
          throw new Error('No response content from AI service');
        }
        console.log(`[callAiWithRetry] ✅ AI response received (attempt ${attempt})`);

        return content;
      } catch (error) {
        lastError = error;
        console.error(`[callAiWithRetry] ❌ Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          const delayMs = AI_SCORING_CONFIG.RETRY_DELAY * attempt;
          console.log(`[callAiWithRetry] Retrying in ${delayMs}ms...`);
          await delay(delayMs);
        }
      }
    }

    throw new Error(
      `AI scoring failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Parse AI response and convert to scoring format
   */
  parseAiResponse(responseText, maxScore) {
    try {
      console.log(`[parseAiResponse] Raw AI response: ${responseText.substring(0, 200)}...`);

      // Clean the response - remove code blocks, markdown, extra text
      let cleanedResponse = responseText.trim();
      
      // Remove markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
      
      // Remove any text before the first {
      const jsonStartIndex = cleanedResponse.indexOf('{');
      if (jsonStartIndex > 0) {
        cleanedResponse = cleanedResponse.substring(jsonStartIndex);
      }
      
      // Try to fix incomplete JSON by finding the last complete field
      let jsonToTry = cleanedResponse;
      const jsonEndIndex = cleanedResponse.lastIndexOf('}');
      if (jsonEndIndex > 0) {
        jsonToTry = cleanedResponse.substring(0, jsonEndIndex + 1);
      } else {
        // If no closing }, try to add one at the end of last complete field
        const lastCommaIndex = cleanedResponse.lastIndexOf(',');
        const lastQuoteIndex = cleanedResponse.lastIndexOf('"');
        if (lastQuoteIndex > lastCommaIndex) {
          jsonToTry = cleanedResponse.substring(0, lastQuoteIndex + 1) + '\n}';
        } else {
          // Add closing brace after last comma
          jsonToTry = cleanedResponse + '\n}';
        }
      }
      
      console.log(`[parseAiResponse] Trying to parse: ${jsonToTry.substring(0, 100)}...`);
      
      // Parse the JSON
      const parsed = JSON.parse(jsonToTry);
      console.log(`[parseAiResponse] ✅ Successfully parsed AI response:`, parsed);

      // Validate required fields
      if (parsed.score === null || parsed.score === undefined) {
        throw new Error('Missing required field: score');
      }
      if (!parsed.cefr_level) {
        console.warn('[parseAiResponse] ⚠️ Missing cefr_level, will use fallback');
      }

      // Use AI's direct score (already in 0-maxScore range)
      const score = parseFloat(parsed.score);
      
      // Validate score is within valid range
      if (isNaN(score) || score < 0 || score > maxScore) {
        throw new Error(`Invalid score: ${parsed.score} (must be 0-${maxScore})`);
      }

      return {
        score: Math.max(0, Math.min(maxScore, score)), // Ensure within bounds
        cefrLevel: parsed.cefr_level || 'N/A',
        comment: parsed.comment || 'No comment provided',
        strengths: parsed.strengths || 'N/A',
        weaknesses: parsed.weaknesses || 'N/A',
        suggestions: parsed.suggestions || 'N/A',
        rawResponse: cleanedResponse,
      };
    } catch (error) {
      console.error(`[parseAiResponse] ❌ Failed to parse AI response:`, error.message);
      console.error(`[parseAiResponse] Raw response length: ${responseText.length}`);

      // Enhanced fallback parsing - try to extract individual fields
      const scoreMatch = responseText.match(/["\']score["\']:\s*([0-9]+\.?[0-9]*)/i);
      const cefrMatch = responseText.match(/["\']cefr_level["\']:\s*["\']([ABC][12](?:\.[12])?)["\']?/i);
      const commentMatch = responseText.match(/["\']comment["\']:\s*["\']([^"\']*)["\'\']?/i);
      const suggestionsMatch = responseText.match(/["\']suggestions["\']:\s*(?:["\']([^"\']*)["\'\']?|\[([^\]]*)\])/i);
      
      let fallbackScore = maxScore * 0.5; // Default to 50%
      let extractedCefr = 'N/A';

      if (scoreMatch && scoreMatch[1]) {
        const extractedScore = parseFloat(scoreMatch[1]);
        if (!isNaN(extractedScore) && extractedScore >= 0 && extractedScore <= maxScore) {
          fallbackScore = extractedScore;
          console.log(`[parseAiResponse] 🔧 Extracted score: ${fallbackScore}`);
        }
      }
      
      if (cefrMatch && cefrMatch[1]) {
        extractedCefr = cefrMatch[1].toUpperCase();
        console.log(`[parseAiResponse] 🔧 Extracted CEFR level: ${extractedCefr}`);
      }

      return {
        score: fallbackScore,
        cefrLevel: extractedCefr,
        comment: commentMatch?.[1] || `Automated parsing failed. Raw response: ${responseText.substring(0, 100)}...`,
        suggestions: suggestionsMatch?.[1] || suggestionsMatch?.[2] || 'Please review the raw AI response for detailed feedback',
        rawResponse: responseText,
        parseError: error.message,
      };
    }
  }

  /**
   * Validate AI response format before parsing
   */
  validateAiResponse(responseText) {
    if (!responseText || typeof responseText !== 'string') {
      return false;
    }

    // Check for JSON structure
    const hasJsonStructure = responseText.includes('{') && responseText.includes('}');
    if (!hasJsonStructure) {
      return false;
    }

    // Check for required fields
    const requiredFields = ['cefr_level', 'comment'];
    const hasRequiredFields = requiredFields.every(field => 
      responseText.includes(`"${field}"`) || responseText.includes(`'${field}'`)
    );

    return hasRequiredFields;
  }

  /**
   * Get AI service status and configuration
   */
  getServiceStatus() {
    if (isUsingOpenAI()) {
      return {
        available: true,
        provider: 'OpenAI ChatGPT',
        model: OPENAI_CONFIG.model,
        purpose: 'English Assessment (Most Accurate)',
        maxRetries: AI_SCORING_CONFIG.MAX_RETRIES,
        retryDelay: AI_SCORING_CONFIG.RETRY_DELAY,
        temperature: OPENAI_CONFIG.temperature,
        maxTokens: OPENAI_CONFIG.maxTokens
      };
    } else {
      return {
        available: false,
        provider: 'None',
        error: 'OpenAI ChatGPT not configured'
      };
    }
  }
}

module.exports = new AiServiceClient();