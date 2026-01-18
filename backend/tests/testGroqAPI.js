#!/usr/bin/env node

/**
 * Test Groq API Configuration
 * Verify that Groq API is properly configured and working
 */

const path = require('path');
require('dotenv').config();

process.env.NODE_ENV = 'test';
process.chdir(path.join(__dirname, '..'));

const { callGroq, GROQ_CONFIG, checkAIProviders, isUsingGroq } = require('../src/config/ai');

async function testGroqAPI() {
  console.log('\n========== TEST GROQ API ==========\n');

  try {
    // Check configuration
    console.log('[1] Checking Groq Configuration...');
    console.log(`    API Key configured: ${GROQ_CONFIG.apiKey ? '✅ YES' : '❌ NO'}`);
    console.log(`    Model: ${GROQ_CONFIG.model}`);
    console.log(`    Temperature: ${GROQ_CONFIG.temperature}`);
    console.log(`    Max Tokens: ${GROQ_CONFIG.maxTokens}`);

    if (!GROQ_CONFIG.apiKey) {
      console.log('\n❌ ERROR: GROQ_API_KEY not configured');
      console.log('📝 Please set GROQ_API_KEY in .env file');
      console.log('📝 Get API Key from: https://console.groq.com/keys\n');
      return;
    }

    // Test simple prompt
    console.log('\n[2] Testing Simple Prompt...');
    const simplePrompt = 'Respond with JSON: {"status": "ok", "message": "Groq API is working!"}';
    
    const startTime = Date.now();
    const simpleResponse = await callGroq(simplePrompt);
    const duration = Date.now() - startTime;
    
    console.log(`    ✅ Response received in ${duration}ms`);
    console.log(`    Response (first 100 chars): ${simpleResponse.substring(0, 100)}...`);

    // Test APTIS scoring prompt
    console.log('\n[3] Testing APTIS Scoring Prompt...');
    const scoringPrompt = `You are an APTIS examiner. Score this student response:

QUESTION: Tell me about your hobbies

STUDENT RESPONSE: I like reading books and playing tennis. I read novels and enjoy sports very much.

SCORING CRITERIA:
1. Grammar and Vocabulary
2. Fluency and Coherence
3. Task Completion

Respond with JSON only (no markdown):
{
  "cefr_level": "A1|A2|B1|B2|C1|C2",
  "comment": "Brief overall assessment",
  "comment": "Key assessment feedback",
  "suggestions": "Specific recommendations"
}`;

    const scoringStartTime = Date.now();
    const scoringResponse = await callGroq(scoringPrompt);
    const scoringDuration = Date.now() - scoringStartTime;
    
    console.log(`    ✅ Scoring response received in ${scoringDuration}ms`);
    console.log(`    Response (first 200 chars):\n${scoringResponse.substring(0, 200)}...`);

    // Try to parse response
    try {
      const jsonMatch = scoringResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`\n    ✅ Successfully parsed JSON response:`);
        console.log(`       - CEFR Level: ${parsed.cefr_level}`);
        console.log(`       - Comment: ${parsed.comment.substring(0, 50)}...`);
        console.log(`       - Comment: ${parsed.comment ? parsed.comment.substring(0, 50) + '...' : 'None'}`);
      } else {
        console.log(`    ⚠️  Could not find JSON in response`);
      }
    } catch (parseError) {
      console.log(`    ⚠️  Error parsing JSON: ${parseError.message}`);
    }

    console.log('\n========== TEST RESULTS ==========');
    console.log('✅ GROQ API IS WORKING!');
    console.log(`✅ Model: ${GROQ_CONFIG.model}`);
    console.log(`✅ Average response time: ~${Math.round((duration + scoringDuration) / 2)}ms`);
    console.log('\n🚀 Ready for production use!');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Error details:', error);
    console.log('\n📝 Troubleshooting:');
    console.log('1. Check that GROQ_API_KEY is set in .env');
    console.log('2. Verify API key is valid at https://console.groq.com/keys');
    console.log('3. Check rate limits (free tier has limits)');
    console.log('4. Try with a simpler prompt first');
    console.log('5. Check your Groq account status\n');
  }
}

// Run the test
testGroqAPI();
