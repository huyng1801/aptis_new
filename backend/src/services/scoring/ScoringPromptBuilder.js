/**
 * Scoring Prompt Builder Service
 * Handles building AI prompts for scoring with and without audio analysis
 */

class ScoringPromptBuilder {
  /**
   * Enhanced prompt builder that incorporates detailed audio analysis data
   * Provides AI with objective metrics to make more accurate assessments
   */
  buildEnhancedScoringPrompt(answerText, question, criterion, taskType = 'general', audioAnalysis = null) {
    const sampleAnswer = question.sampleAnswer?.sample_answer || 'N/A';
    const keyPoints = question.sampleAnswer?.answer_key_points
      ? JSON.parse(question.sampleAnswer.answer_key_points).join(', ')
      : 'N/A';

    // Build audio analysis context if available
    let audioAnalysisContext = '';
    if (audioAnalysis) {
      audioAnalysisContext = `
ENHANCED AUDIO ANALYSIS DATA:
============================
🎯 OBJECTIVE PRONUNCIATION METRICS:
- Pronunciation Score: ${audioAnalysis.pronunciationScore}/100
- Accuracy Score: ${audioAnalysis.accuracyScore}/100  
- Fluency Score: ${audioAnalysis.fluencyScore}/100
- Prosody Score: ${audioAnalysis.prosodyScore || 'N/A'}/100
- Overall Confidence: ${Math.round((audioAnalysis.confidence || 0) * 100)}%

📊 DETAILED SPEECH ANALYSIS:
- Speech Rate: ${audioAnalysis.audioQualityMetrics?.speechRate?.wordsPerMinute || 'N/A'} WPM (${audioAnalysis.audioQualityMetrics?.speechRate?.rateAssessment || 'N/A'})
- Voice Activity Ratio: ${Math.round((audioAnalysis.audioQualityMetrics?.voiceActivityRatio || 0) * 100)}%
- Pause Analysis: ${audioAnalysis.audioQualityMetrics?.pauseAnalysis?.frequency || 'N/A'} frequency, ${audioAnalysis.audioQualityMetrics?.pauseAnalysis?.length || 'N/A'} length
- Spectral Quality: ${audioAnalysis.audioQualityMetrics?.spectralQuality?.overall || 'N/A'} (${audioAnalysis.audioQualityMetrics?.spectralQuality?.clarity || 'N/A'} clarity)

🗣️ PRONUNCIATION ASSESSMENT:
- Emotional Tone: ${audioAnalysis.emotionalTone || 'neutral'}
- Accent Strength: ${audioAnalysis.accentAnalysis?.strength || 'N/A'} (confidence: ${Math.round((audioAnalysis.accentAnalysis?.confidence || 0) * 100)}%)
- Error Analysis: ${audioAnalysis.errorAnalysis?.totalErrors || 0} total errors, ${audioAnalysis.errorAnalysis?.severity || 'N/A'} severity
- Pronunciation Difficulty: ${audioAnalysis.pronunciationDifficulty?.overall || 'N/A'} (${audioAnalysis.pronunciationDifficulty?.difficultWordRatio ? Math.round(audioAnalysis.pronunciationDifficulty.difficultWordRatio * 100) + '%' : 'N/A'} difficult words)
`;
    }

    // Get task-specific context
    let typeContext = this.getTaskTypeContext(taskType);

    return `
You are an expert APTIS English language examiner with access to advanced audio analysis technology. Your task is to score a student's speaking performance based on a specific criterion.

⚠️ CRITICAL LANGUAGE VALIDATION:
- This is an ENGLISH language test. The response MUST be in English.
- If the transcribed text is in Vietnamese, Chinese, Spanish, or any non-English language, assign the MINIMUM score and explain the language error.
- If the response is song lyrics, random words, or unrelated content instead of answering the question, apply heavy penalty.
- Content relevance is mandatory - the response must address the given question.

CONTEXT:
=========
Question Type: APTIS Speaking Assessment
${typeContext}
Question: ${question.content}

Sample Answer: ${sampleAnswer}

Key Points Expected: ${keyPoints}
${audioAnalysisContext}

STUDENT'S TRANSCRIBED RESPONSE:
===============================
${answerText}

SCORING CRITERION:
==================
Criterion Name: ${criterion.criteria_name}
Description: ${criterion.description || 'N/A'}

RUBRIC FOR SCORING:
====================
${criterion.rubric_prompt}

ENHANCED SCORING INSTRUCTIONS:
==============================
🔴 **LANGUAGE VALIDATION (HIGHEST PRIORITY)**:
   - FIRST check if response is in English. If not English → assign 0-1 points maximum
   - Check if response answers the question. If unrelated/lyrics → assign 0-1 points maximum

1. **Primary Assessment**: Evaluate based on the criterion and rubric above
2. **Audio Validation**: Use objective audio metrics to validate your assessment  
3. **Holistic Integration**: Combine subjective evaluation with technical measurements
4. **CEFR Alignment**: Determine CEFR level that best describes the overall performance
5. **Evidence-Based Feedback**: Reference both transcription content and audio metrics

SCORING PENALTIES:
==================
- Wrong Language (Vietnamese/Chinese/etc): Maximum 1 point, explain language error
- Song Lyrics/Unrelated Content: Maximum 1 point, explain content irrelevance  
- No Answer/Silence: 0 points
- English but completely off-topic: Maximum 2 points

${audioAnalysis ? `
SPECIFIC GUIDANCE FOR AUDIO-ENHANCED SCORING:
- If pronunciation score is high (>80), consider higher fluency/accuracy CEFR levels
- If fluency score is low (<60), be cautious about assigning high CEFR levels
- Emotional tone 'confident'/'engaged' may indicate better performance than 'hesitant'
- Multiple pronunciation errors suggest lower accuracy levels
- Strong accent (strength) may affect intelligibility ratings` : ''}

RESPONSE FORMAT - MUST BE VALID JSON:
====================================
Return EXACTLY this JSON format with audio-informed assessment:

{
  "cefr_level": "B1.2",
  "comment": "Assessment comment integrating both transcription analysis and audio metrics (2-3 sentences)",
  "suggestions": "For writing tasks: Provide specific text corrections (e.g., 'Change \"I go to school yesterday\" to \"I went to school yesterday\"'). For speaking: Suggest pronunciation/fluency improvements."
}

CRITICAL REQUIREMENTS:
======================
- Use exact BAND descriptions from the rubric for cefr_level
- Integrate objective audio metrics with subjective assessment
- Reference specific measurements when relevant (e.g., "pronunciation score of 85 supports...")
- Maintain APTIS standards while leveraging enhanced data
- All text fields MUST use \\n for line breaks (escaped for JSON)
- Return ONLY the JSON object
`.trim();
  }

  buildScoringPrompt(answerText, question, criterion, writingType = 'general') {
    const sampleAnswer = question.sampleAnswer?.sample_answer || 'N/A';
    const keyPoints = question.sampleAnswer?.answer_key_points
      ? JSON.parse(question.sampleAnswer.answer_key_points).join(', ')
      : 'N/A';

    // Get task-specific context
    let typeContext = this.getTaskTypeContext(writingType);

    return `
You are an expert APTIS English language examiner. Your task is to score a student's answer based on a specific criterion.

⚠️ CRITICAL LANGUAGE VALIDATION:
- This is an ENGLISH language test. The response MUST be in English.
- If the text is in Vietnamese, Chinese, Spanish, or any non-English language, assign the MINIMUM score.
- If the response is song lyrics, random content, or doesn't answer the question, apply heavy penalty.

CONTEXT:
=========
Question Type: APTIS Writing/Speaking Assessment
${typeContext}
Question: ${question.content}

Sample Answer: ${sampleAnswer}

Key Points Expected: ${keyPoints}

STUDENT'S ANSWER:
=================
${answerText}

SCORING CRITERION:
==================
Criterion Name: ${criterion.criteria_name}
Description: ${criterion.description || 'N/A'}

RUBRIC FOR SCORING:
====================
${criterion.rubric_prompt}

SCORING INSTRUCTIONS:
=====================
🔴 **STEP 1 - LANGUAGE CHECK**: Verify the response is in English and answers the question
🔴 **STEP 2 - CONTENT RELEVANCE**: Ensure response addresses the given question
🔴 **STEP 3 - CRITERION EVALUATION**: Score based on the specific criterion
  
PENALTIES:
- Wrong Language: Maximum 0-1 points
- Irrelevant Content: Maximum 0-1 points  
- English but off-topic: Maximum 1-2 points
1. Carefully evaluate the student's answer ONLY based on the criterion above.
2. Instead of numeric score, determine the CEFR LEVEL that best describes the performance.
3. Use the exact BAND descriptions from the rubric (e.g., 'A2.1', 'B1.2', 'Strong B2', 'Above B1').
4. Provide honest, constructive feedback.
5. Be consistent with APTIS standards.

RESPONSE FORMAT - MUST BE VALID JSON:
====================================
Return EXACTLY this JSON format. ALL text fields MUST be strings with escaped newlines:
- Use literal \\n for line breaks (not actual newlines)
- Each bullet point should be on a separate line in the string
- Use proper JSON escaping for special characters
- The "cefr_level" should match the BAND descriptions from the rubric exactly

{
  "cefr_level": "B1.2",
  "comment": "Brief explanation of CEFR level assignment (1-2 sentences)",
  "suggestions": "For writing tasks: Specific text corrections with exact replacements (e.g., 'Change \"I am study\" to \"I am studying\"'). For other tasks: Targeted improvement suggestions."
}

CRITICAL REQUIREMENTS:
======================
- cefr_level MUST be a string that matches the BAND descriptions from the rubric
- All text fields MUST be valid JSON strings with proper escaping
- Use \\n (escaped) to separate bullet points, NOT actual newlines
- Ensure valid JSON that can be parsed by JSON.parse()
- Return ONLY the JSON object, no markdown, no code blocks, no extra text

Example of correct format:
{
  "cefr_level": "B1.2",
  "comment": "Good B1 performance with sustained features throughout.",
  "suggestions": "Change 'I am study' to 'I am studying' for correct grammar. Use 'have been studying' instead of 'study' for duration."
}

Valid CEFR levels based on rubric:
- Use exact BAND terms from the rubric (e.g., 'A2.1', 'B1.2', 'Above B1', 'Strong B2', 'Typical B2')
- For unclear cases, use standard CEFR notation: A1, A2, B1, B2, C1, C2
- Add modifiers when appropriate: A1+, B1+, Strong B2, Above B1, Below A2
`.trim();
  }

  /**
   * Extract task type context for prompts
   */
  getTaskTypeContext(taskType) {
    switch (taskType) {
      case 'form_filling':
        return 'This is a form-filling task where the student must provide specific information accurately.';
      case 'text_based':
        return 'This is a text-based writing task requiring coherent expression and appropriate language use.';
      case 'speaking':
        return 'This is a speaking task where pronunciation, fluency, and content delivery are evaluated.';
      case 'SPEAKING_INTRO':
        return 'This is an introductory speaking task focusing on basic personal information and simple responses.';
      default:
        return 'This is a general language assessment task requiring appropriate use of English language skills.';
    }
  }
}

module.exports = new ScoringPromptBuilder();