const path = require('path');
const {
  AttemptAnswer,
  AiScoringCriteria,
  AnswerAiFeedback,
  Question,
  QuestionSampleAnswer,
  QuestionType,
  ExamSection,
  Exam,
  ExamAttempt,
  AptisType,
} = require('../models');
const { BadRequestError, NotFoundError } = require('../utils/errors');

// Import modular services
const CefrConverter = require('./scoring/CefrConverterService');
const ScoringPromptBuilder = require('./scoring/ScoringPromptBuilder');
const AudioAnalysisEnhancer = require('./scoring/AudioAnalysisEnhancer');
const FeedbackGenerator = require('./scoring/FeedbackGenerator');
const AiServiceClient = require('./scoring/AiServiceClient');

class AiScoringService {
  /**
   * Validate and correct CEFR level based on actual score percentage
   * @param {number} score - Actual score achieved
   * @param {number} maxScore - Maximum possible score
   * @param {string} aiCefrLevel - CEFR level suggested by AI
   * @returns {string} Validated CEFR level
   */
  validateCefrLevel(score, maxScore, aiCefrLevel) {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    // Define CEFR thresholds based on percentage
    let validatedLevel;
    if (percentage >= 90) {
      validatedLevel = ['C2', 'C1'].includes(aiCefrLevel) ? aiCefrLevel : 'C1';
    } else if (percentage >= 80) {
      validatedLevel = ['C1', 'B2', 'C2'].includes(aiCefrLevel) ? (aiCefrLevel === 'C2' ? 'C1' : aiCefrLevel) : 'B2';
    } else if (percentage >= 70) {
      validatedLevel = ['B2', 'B1', 'C1'].includes(aiCefrLevel) ? (aiCefrLevel === 'C1' ? 'B2' : aiCefrLevel) : 'B2';
    } else if (percentage >= 60) {
      validatedLevel = ['B1', 'B2'].includes(aiCefrLevel) ? aiCefrLevel : 'B1';
    } else if (percentage >= 50) {
      validatedLevel = ['B1', 'A2'].includes(aiCefrLevel) ? aiCefrLevel : 'A2';
    } else if (percentage >= 30) {
      validatedLevel = ['A2', 'A1'].includes(aiCefrLevel) ? aiCefrLevel : 'A2';
    } else {
      validatedLevel = 'A1';
    }
    
    if (validatedLevel !== aiCefrLevel) {
      console.warn(`[validateCefrLevel] ⚠️  CEFR level corrected: AI suggested '${aiCefrLevel}' but score ${score}/${maxScore} (${percentage.toFixed(1)}%) indicates '${validatedLevel}'`);
    }
    
    return validatedLevel;
  }

  async scoreWriting(answerId) {
    console.log(`[scoreWriting] Starting comprehensive writing assessment for answer ${answerId}`);

    try {
      // Use comprehensive scoring
      const result = await this.scoreAnswerComprehensively(answerId, false);

      // Refetch answer from database to get a fresh instance for updating
      const answer = await AttemptAnswer.findByPk(answerId);
      if (!answer) {
        throw new BadRequestError('Answer not found');
      }

      const finalScore = Math.min(result.score, answer.max_score || 10);
      
      // Validate CEFR level consistency 
      const validatedCefrLevel = this.validateCefrLevel(finalScore, answer.max_score || 10, result.cefrLevel);
      result.cefrLevel = validatedCefrLevel;
      
      if (finalScore !== result.score) {
        console.warn(`[scoreWriting] ⚠️  AI score capped: ${result.score} -> ${finalScore} (max: ${answer.max_score})`);
      }
      
      await answer.update({
        score: finalScore,
        ai_feedback: result.overallFeedback || result.comment,
        ai_graded_at: new Date(),
      });

      console.log(`[scoreWriting] ✅ Writing answer ${answerId} scored comprehensively: ${finalScore}/${answer.max_score}`);
      return result;
      
    } catch (error) {
      console.error(`[scoreWriting] ❌ Failed to score writing answer ${answerId}:`, error.message);
      throw error;
    }
  }

  async scoreSpeakingWithAudioAnalysis(answerId) {
    console.log(`[scoreSpeakingWithAudioAnalysis] Starting comprehensive speaking assessment for answer ${answerId}`);

    try {
      // Use comprehensive scoring with audio analysis
      const result = await this.scoreAnswerComprehensively(answerId, true);

      // Refetch answer from database to get a fresh instance for updating
      const answer = await AttemptAnswer.findByPk(answerId);
      if (!answer) {
        throw new BadRequestError('Answer not found');
      }

      const finalScore = Math.min(result.score, answer.max_score || 10);
      
      // Validate CEFR level consistency
      const validatedCefrLevel = this.validateCefrLevel(finalScore, answer.max_score || 10, result.cefrLevel);
      result.cefrLevel = validatedCefrLevel;
      
      if (finalScore !== result.score) {
        console.warn(`[scoreSpeakingWithAudioAnalysis] ⚠️  AI score capped: ${result.score} -> ${finalScore} (max: ${answer.max_score})`);
      }
      
      await answer.update({
        score: finalScore,
        ai_feedback: result.overallFeedback || result.comment,
        ai_graded_at: new Date(),
      });

      console.log(`[scoreSpeakingWithAudioAnalysis] ✅ Speaking answer ${answerId} scored comprehensively: ${finalScore}/${answer.max_score}`);
      return result;
      
    } catch (error) {
      console.error(`[scoreSpeakingWithAudioAnalysis] ❌ Failed to score speaking answer ${answerId}:`, error.message);
      throw error;
    }
  }

  async scoreSpeaking(answerId) {
    console.log(`[scoreSpeaking] Starting comprehensive speaking assessment for answer ${answerId}`);

    try {
      // For speaking, we need to wait for transcription if it's still processing
      // Try to get the answer with transcription, with retries
      let answer = await AttemptAnswer.findByPk(answerId, {
        include: [
          {
            model: Question,
            as: 'question',
            include: [
              { model: QuestionType, as: 'questionType' }
            ]
          }
        ]
      });
      
      if (!answer) {
        throw new BadRequestError('Answer not found');
      }
      
      // If transcribed_text is not available, wait for transcription queue to process
      let maxRetries = 10;
      let retryCount = 0;
      while (!answer.transcribed_text && retryCount < maxRetries) {
        retryCount++;
        console.log(`[scoreSpeaking] Waiting for transcription (attempt ${retryCount}/${maxRetries})...`);
        // Wait 3 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));
        answer = await AttemptAnswer.findByPk(answerId, {
          include: [
            {
              model: Question,
              as: 'question',
              include: [
                { model: QuestionType, as: 'questionType' }
              ]
            }
          ]
        });
      }
      
      // If still no transcription, log warning but proceed anyway
      // AI will score based on audio_url or minimal context
      if (!answer.transcribed_text) {
        console.warn(`[scoreSpeaking] ⚠️  No transcription available for answer ${answerId} after waiting. Will attempt scoring with available data.`);
      } else {
        console.log(`[scoreSpeaking] ✅ Transcription available: ${answer.transcribed_text.substring(0, 100)}...`);
      }
      
      // Use comprehensive scoring with audio analysis - speaking has audio
      const result = await this.scoreAnswerComprehensively(answerId, true);

      // Refetch answer from database to get a fresh instance for updating
      answer = await AttemptAnswer.findByPk(answerId);
      if (!answer) {
        throw new BadRequestError('Answer not found');
      }

      const finalScore = Math.min(result.score, answer.max_score || 10);
      
      // Validate CEFR level consistency
      const validatedCefrLevel = this.validateCefrLevel(finalScore, answer.max_score || 10, result.cefrLevel);
      result.cefrLevel = validatedCefrLevel;
      
      if (finalScore !== result.score) {
        console.warn(`[scoreSpeaking] ⚠️  AI score capped: ${result.score} -> ${finalScore} (max: ${answer.max_score})`);
      }
      
      await answer.update({
        score: finalScore,
        ai_feedback: result.overallFeedback || result.comment,
        ai_graded_at: new Date(),
      });

      console.log(`[scoreSpeaking] ✅ Speaking answer ${answerId} scored comprehensively: ${finalScore}/${answer.max_score}`);
      return result;
      
    } catch (error) {
      console.error(`[scoreSpeaking] ❌ Failed to score speaking answer ${answerId}:`, error.message);
      console.error(`[scoreSpeaking] Error stack:`, error.stack);
      throw error;
    }
  }

  /**
   * Enhanced scoring method that incorporates audio analysis data
   * Provides more accurate assessment by combining AI evaluation with objective metrics
   */
  async scoreWithAudioAnalysis(answerText, question, criteria, taskType = 'general', audioAnalysis = null) {
    if (!criteria || criteria.length === 0) {
      throw new BadRequestError('No scoring criteria provided');
    }

    const criteriaScores = [];
    let totalScore = 0;
    let totalMaxScore = 0;

    console.log(`[scoreWithAudioAnalysis] Enhanced scoring with ${criteria.length} criteria and audio analysis: ${!!audioAnalysis}`);

    for (let i = 0; i < criteria.length; i++) {
      const criterion = criteria[i];
      try {
        console.log(`[scoreWithAudioAnalysis] Scoring criterion ${i + 1}/${criteria.length}: ${criterion.criteria_name}`);

        // Build enhanced prompt with audio analysis
        const prompt = ScoringPromptBuilder.buildEnhancedScoringPrompt(
          answerText,
          question,
          criterion,
          taskType,
          audioAnalysis
        );

        // Call AI service
        const aiResponse = await AiServiceClient.callAiWithRetry(prompt);
        const parsedResult = AiServiceClient.parseAiResponse(aiResponse, criterion.max_score);

        // Apply audio analysis adjustments if available
        let finalScore = parsedResult.score;
        if (audioAnalysis && AudioAnalysisEnhancer.validateAudioAnalysis(audioAnalysis)) {
          finalScore = AudioAnalysisEnhancer.applyAudioAnalysisAdjustment(
            parsedResult.score,
            criterion.criteria_name,
            audioAnalysis,
            criterion.max_score
          );
          // Ensure score stays within bounds
          finalScore = Math.max(0, Math.min(criterion.max_score, finalScore));
        }

        const criteriaScore = {
          criteriaId: criterion.id,
          criteriaName: criterion.criteria_name,
          score: Math.round(finalScore * 100) / 100,
          maxScore: criterion.max_score,
          weight: criterion.weight,
          cefrLevel: parsedResult.cefrLevel,
          comment: parsedResult.comment,
          strengths: parsedResult.strengths,
          weaknesses: parsedResult.weaknesses,
          suggestions: parsedResult.suggestions,
          aiEnhanced: !!audioAnalysis
        };

        criteriaScores.push(criteriaScore);
        totalScore += criteriaScore.score;
        totalMaxScore += criteriaScore.maxScore;

        console.log(`[scoreWithAudioAnalysis] ✅ Criterion scored: ${criterion.criteria_name} = ${criteriaScore.score}/${criteriaScore.maxScore} (${parsedResult.cefrLevel})`);
      } catch (error) {
        console.error(`[scoreWithAudioAnalysis] ❌ Failed to score criterion ${criterion.criteria_name}:`, error.message);
        criteriaScores.push({
          criteriaId: criterion.id,
          criteriaName: criterion.criteria_name,
          score: 0,
          maxScore: criterion.max_score,
          weight: criterion.weight,
          cefrLevel: 'Error',
          comment: `Error: ${error.message}`,
          strengths: 'Unable to assess due to error',
          weaknesses: 'System error occurred during assessment',
          suggestions: 'Please retry the assessment'
        });
      }
    }

    const overallFeedback = FeedbackGenerator.generateEnhancedOverallFeedback(criteriaScores, audioAnalysis);

    const result = {
      totalScore: Math.round(totalScore * 100) / 100,
      totalMaxScore: Math.round(totalMaxScore * 100) / 100,
      criteriaScores,
      overallFeedback,
      audioAnalysisUsed: !!audioAnalysis
    };

    console.log(`[scoreWithAudioAnalysis] Enhanced final score: ${result.totalScore}/${result.totalMaxScore}`);

    return result;
  }

  async scoreWithCriteria(answerText, question, criteria, writingType = 'general') {
    if (!criteria || criteria.length === 0) {
      throw new BadRequestError('No scoring criteria provided');
    }

    const criteriaScores = [];
    let totalScore = 0;
    let totalMaxScore = 0;

    console.log(`[scoreWithCriteria] Scoring answer with ${criteria.length} criteria`);

    for (let i = 0; i < criteria.length; i++) {
      const criterion = criteria[i];
      try {
        console.log(`[scoreWithCriteria] Scoring criterion ${i + 1}/${criteria.length}: ${criterion.criteria_name}`);

        const prompt = ScoringPromptBuilder.buildScoringPrompt(answerText, question, criterion, writingType);
        const aiResponse = await AiServiceClient.callAiWithRetry(prompt);
        const parsedResult = AiServiceClient.parseAiResponse(aiResponse, criterion.max_score);

        const criteriaScore = {
          criteriaId: criterion.id,
          criteriaName: criterion.criteria_name,
          score: Math.round(parsedResult.score * 100) / 100,
          maxScore: criterion.max_score,
          weight: criterion.weight,
          cefrLevel: parsedResult.cefrLevel,
          comment: parsedResult.comment,
          strengths: parsedResult.strengths,
          weaknesses: parsedResult.weaknesses,
          suggestions: parsedResult.suggestions,
        };

        criteriaScores.push(criteriaScore);
        totalScore += criteriaScore.score;
        totalMaxScore += criteriaScore.maxScore;

        console.log(`[scoreWithCriteria] ✅ Criterion scored: ${criterion.criteria_name} = ${criteriaScore.score}/${criteriaScore.maxScore} (${parsedResult.cefrLevel})`);
      } catch (error) {
        console.error(`[scoreWithCriteria] ❌ Failed to score criterion ${criterion.criteria_name}:`, error.message);
        criteriaScores.push({
          criteriaId: criterion.id,
          criteriaName: criterion.criteria_name,
          score: 0,
          maxScore: criterion.max_score,
          weight: criterion.weight,
          cefrLevel: 'Error',
          comment: `Error: ${error.message}`,
          strengths: 'Unable to assess due to error',
          weaknesses: 'System error occurred during assessment',
          suggestions: 'Please retry the assessment'
        });
      }
    }

    const overallFeedback = FeedbackGenerator.generateOverallFeedback(criteriaScores);

    const result = {
      totalScore: Math.round(totalScore * 100) / 100,
      totalMaxScore: Math.round(totalMaxScore * 100) / 100,
      criteriaScores,
      overallFeedback,
    };

    console.log(`[scoreWithCriteria] Final score: ${result.totalScore}/${result.totalMaxScore}`);

    return result;
  }

  /**
   * Enhanced prompt builder that incorporates detailed audio analysis data
   * Provides AI with objective metrics to make more accurate assessments
   */
  buildEnhancedScoringPrompt(answerText, question, criterion, taskType = 'general', audioAnalysis = null) {
    return ScoringPromptBuilder.buildEnhancedScoringPrompt(answerText, question, criterion, taskType, audioAnalysis);
  }

  buildScoringPrompt(answerText, question, criterion, writingType = 'general') {
    return ScoringPromptBuilder.buildScoringPrompt(answerText, question, criterion, writingType);
  }

  async callAiWithRetry(prompt, maxRetries = 3) {
    return AiServiceClient.callAiWithRetry(prompt, maxRetries);
  }

  parseAiResponse(responseText, maxScore) {
    return AiServiceClient.parseAiResponse(responseText, maxScore);
  }

  async createAnswerAiFeedbacks(answerId, criteriaScores) {
    if (!criteriaScores || criteriaScores.length === 0) {
      return;
    }

    console.log(
      `[createAnswerAiFeedbacks] Creating ${criteriaScores.length} feedback records for answer ${answerId}`
    );
    console.log(`[createAnswerAiFeedbacks] Criteria scores:`, criteriaScores.map(cs => `${cs.criteriaName}: ${cs.score}/${cs.maxScore}`));

    for (const cs of criteriaScores) {
      try {
        const feedbackData = {
          answer_id: answerId,
          criteria_id: cs.criteriaId,
          score: cs.score,
          comment: cs.comment,
          suggestions: cs.suggestions,
        };
        
        console.log(`[createAnswerAiFeedbacks] Creating feedback for ${cs.criteriaName}:`, feedbackData);
        
        const feedback = await AnswerAiFeedback.create(feedbackData);
        console.log(`[createAnswerAiFeedbacks] ✅ Created feedback ${feedback.id} for criterion ${cs.criteriaName}: ${cs.score}/${cs.maxScore}`);
      } catch (error) {
        console.error(
          `[createAnswerAiFeedbacks] ❌ Failed to create feedback for criterion ${cs.criteriaName}:`,
          error.message
        );
        console.error(`[createAnswerAiFeedbacks] Error details:`, error);
      }
    }
    
    console.log(`[createAnswerAiFeedbacks] Completed feedback creation for answer ${answerId}`);
  }

  generateOverallFeedback(criteriaScores) {
    return FeedbackGenerator.generateOverallFeedback(criteriaScores);
  }

  /**
   * Apply audio analysis adjustments to AI-generated scores
   * Uses objective metrics to fine-tune subjective assessments
   */
  applyAudioAnalysisAdjustment(baseScore, criteriaName, audioAnalysis, maxScore) {
    return AudioAnalysisEnhancer.applyAudioAnalysisAdjustment(baseScore, criteriaName, audioAnalysis, maxScore);
  }

  /**
   * Generate enhanced overall feedback incorporating audio analysis
   */
  generateEnhancedOverallFeedback(criteriaScores, audioAnalysis) {
    return FeedbackGenerator.generateEnhancedOverallFeedback(criteriaScores, audioAnalysis);
  }

  /**
   * New method: Score entire answer as single unit using all criteria as context
   */
  async scoreEntireAnswer(answerText, question, criteria, taskType = 'general') {
    if (!criteria || criteria.length === 0) {
      throw new BadRequestError('No scoring criteria provided');
    }

    console.log(`[scoreEntireAnswer] Scoring entire answer with ${criteria.length} criteria as context`);

    try {
      console.log(`[scoreEntireAnswer] Building prompt for ${criteria.length} criteria`);
      // Build comprehensive prompt with all criteria
      const prompt = this.buildComprehensiveScoringPrompt(answerText, question, criteria, taskType);

      // Call AI service
      const aiResponse = await AiServiceClient.callAiWithRetry(prompt);
      console.log(`[scoreEntireAnswer] Raw AI response: ${aiResponse.substring(0, 200)}...`);
      const parsedResult = AiServiceClient.parseAiResponse(aiResponse, question.max_score || 10);
      
      // Validate CEFR level against score
      const maxScore = question.max_score || 10;
      const validatedCefrLevel = this.validateCefrLevel(parsedResult.score, maxScore, parsedResult.cefrLevel);

      const result = {
        score: Math.round(parsedResult.score * 100) / 100,
        overallFeedback: parsedResult.comment || 'No feedback provided',
        comment: parsedResult.comment,
        suggestions: parsedResult.suggestions,
        cefrLevel: validatedCefrLevel, // Use validated level
        criteriaUsed: criteria.map(c => c.criteria_name)
      };

      console.log(`[scoreEntireAnswer] ✅ Answer scored: ${result.score}/${question.max_score}`);
      return result;
    } catch (error) {
      console.error(`[scoreEntireAnswer] ❌ Failed to score answer:`, error.message);
      throw error;
    }
  }

  /**
   * Score entire answer with audio analysis
   */
  async scoreEntireAnswerWithAudio(answerText, question, criteria, taskType = 'general', audioAnalysis = null) {
    if (!criteria || criteria.length === 0) {
      throw new BadRequestError('No scoring criteria provided');
    }

    console.log(`[scoreEntireAnswerWithAudio] Scoring with audio analysis: ${!!audioAnalysis}`);

    try {
      console.log(`[scoreEntireAnswerWithAudio] Building enhanced prompt for ${criteria.length} criteria`);
      // Build enhanced prompt with audio analysis
      const prompt = this.buildEnhancedComprehensiveScoringPrompt(
        answerText, 
        question, 
        criteria, 
        taskType, 
        audioAnalysis
      );

      // Call AI service
      const aiResponse = await AiServiceClient.callAiWithRetry(prompt);
      console.log(`[scoreEntireAnswerWithAudio] Raw AI response: ${aiResponse.substring(0, 200)}...`);
      const parsedResult = AiServiceClient.parseAiResponse(aiResponse, question.max_score || 10);

      // Apply audio analysis adjustments if available
      let finalScore = parsedResult.score;
      if (audioAnalysis && AudioAnalysisEnhancer.validateAudioAnalysis(audioAnalysis)) {
        finalScore = AudioAnalysisEnhancer.applyOverallAudioAnalysisAdjustment(
          parsedResult.score,
          audioAnalysis,
          question.max_score || 10
        );
        finalScore = Math.max(0, Math.min(question.max_score || 10, finalScore));
      }
      
      // Validate CEFR level against final score
      const maxScore = question.max_score || 10;
      const validatedCefrLevel = this.validateCefrLevel(finalScore, maxScore, parsedResult.cefrLevel);

      const result = {
        score: Math.round(finalScore * 100) / 100,
        overallFeedback: parsedResult.comment || 'No feedback provided',
        comment: parsedResult.comment,
        suggestions: parsedResult.suggestions,
        cefrLevel: validatedCefrLevel, // Use validated level
        criteriaUsed: criteria.map(c => c.criteria_name),
        audioAnalysisUsed: !!audioAnalysis
      };

      console.log(`[scoreEntireAnswerWithAudio] ✅ Answer scored: ${result.score}/${question.max_score}`);
      return result;
    } catch (error) {
      console.error(`[scoreEntireAnswerWithAudio] ❌ Failed to score answer:`, error.message);
      throw error;
    }
  }

  /**
   * Build comprehensive prompt for scoring entire answer
   */
  buildComprehensiveScoringPrompt(answerText, question, criteria, taskType) {
    const criteriaList = criteria.map(c => `- ${c.criteria_name}: ${c.description || c.rubric_prompt}`).join('\n');
    const maxScore = question.max_score || 10;
    
    const isWritingTask = taskType.toLowerCase().includes('writing') || 
                          question.questionType?.code?.includes('WRITING');
    
    const specialInstructions = isWritingTask ? 
      `\nSPECIAL INSTRUCTIONS FOR WRITING ASSESSMENT:
- In "suggestions", provide SPECIFIC text corrections using exact quotes
- Format: 'Change "student's text" to "corrected text"'
- Focus on grammar, vocabulary, spelling, and structure errors
- Give concrete fixes, not general advice
- Example: 'Change "I go to school yesterday" to "I went to school yesterday"'` : '';
    
    return `You are an expert language assessor. Score this ${taskType} response holistically using ALL the following criteria:

${criteriaList}

Question: ${question.content}
Student Response: ${answerText}${specialInstructions}

IMPORTANT SCORING GUIDELINES:
- Maximum possible score is ${maxScore} points
- Be consistent between numerical score and CEFR level:
  * 0-30% (0-${Math.round(maxScore * 0.3)}): A1 (Beginner)
  * 30-50% (${Math.round(maxScore * 0.3)}-${Math.round(maxScore * 0.5)}): A2 (Elementary)
  * 50-60% (${Math.round(maxScore * 0.5)}-${Math.round(maxScore * 0.6)}): B1 (Intermediate)
  * 60-70% (${Math.round(maxScore * 0.6)}-${Math.round(maxScore * 0.7)}): B1-B2 
  * 70-80% (${Math.round(maxScore * 0.7)}-${Math.round(maxScore * 0.8)}): B2 (Upper-Intermediate)
  * 80-90% (${Math.round(maxScore * 0.8)}-${Math.round(maxScore * 0.9)}): B2-C1
  * 90-100% (${Math.round(maxScore * 0.9)}-${maxScore}): C1-C2 (Advanced/Proficient)

Provide a comprehensive assessment considering ALL criteria above. For WRITING tasks, focus heavily on SPECIFIC TEXT CORRECTIONS in your suggestions.

Return your response in this exact JSON format:
{
  "score": [numerical score out of ${maxScore} - be accurate and consistent with CEFR level],
  "cefr_level": "[CEFR level: A1, A2, B1, B2, C1, or C2 - must match score percentage]",
  "comment": "[overall assessment combining all criteria]",
  "suggestions": "[For writing: Provide specific text corrections using 'Change X to Y' format. For speaking: Pronunciation/fluency tips.]"
}`;
  }

  /**
   * Build enhanced prompt with audio analysis
   */
  buildEnhancedComprehensiveScoringPrompt(answerText, question, criteria, taskType, audioAnalysis) {
    const basePrompt = this.buildComprehensiveScoringPrompt(answerText, question, criteria, taskType);
    
    if (!audioAnalysis) {
      return basePrompt;
    }

    const audioInfo = `
ADDITIONAL AUDIO ANALYSIS DATA:
- Fluency: ${audioAnalysis.fluency || 'N/A'}
- Pace: ${audioAnalysis.averageWordsPerMinute || 'N/A'} WPM
- Pause frequency: ${audioAnalysis.pauseFrequency || 'N/A'}
- Total duration: ${audioAnalysis.totalDuration || 'N/A'}s

Consider this objective audio data when assessing speaking fluency and delivery. However, your CEFR level and score must still be consistent with the percentage guidelines above.`;

    // Insert audio info before the JSON format instruction
    return basePrompt.replace(
      'Return your response in this exact JSON format:',
      audioInfo + '\n\nReturn your response in this exact JSON format:'
    );
  }

  /**
   * Get all scoring criteria for a question type
   */
  async getCriteriaByQuestionType(questionTypeId, aptisTypeId) {
    try {
      const criteria = await AiScoringCriteria.findAll({
        where: {
          question_type_id: questionTypeId,
          aptis_type_id: aptisTypeId
        },
        order: [['criteria_name', 'ASC']]
      });
      
      console.log(`[getCriteriaByQuestionType] Found ${criteria.length} criteria for question type ${questionTypeId}`);
      return criteria;
    } catch (error) {
      console.error('[getCriteriaByQuestionType] Error:', error.message);
      throw error;
    }
  }

  /**
   * Score answer comprehensively with all criteria at once
   */
  async scoreAnswerComprehensively(answerId, includeAudio = false) {
    try {
      console.log(`[scoreAnswerComprehensively] Starting comprehensive scoring for answer ${answerId}`);

      // Get answer with related data
      const answer = await AttemptAnswer.findByPk(answerId, {
        include: [
          {
            model: Question,
            as: 'question',
            include: [
              { model: QuestionType, as: 'questionType' }
            ]
          },
          {
            model: ExamAttempt,
            as: 'attempt',
            include: [{
              model: Exam,
              as: 'exam',
              attributes: ['aptis_type_id']
            }]
          }
        ]
      });

      if (!answer) {
        throw new NotFoundError(`Answer ${answerId} not found`);
      }

      console.log(`[scoreAnswerComprehensively] Answer found with audio_url: ${answer.audio_url}`);

      const question = answer.question;
      const questionTypeId = question.question_type_id;
      
      // Get aptisTypeId from Question first, then fallback to Exam
      let aptisTypeId = question.aptis_type_id;
      
      // Fallback to exam aptis_type_id if not in question
      if (!aptisTypeId && answer.attempt?.exam?.aptis_type_id) {
        aptisTypeId = answer.attempt.exam.aptis_type_id;
      }
      
      if (!aptisTypeId) {
        throw new BadRequestError(`Cannot determine APTIS type for question ${question.id}`);
      }
      
      console.log(`[scoreAnswerComprehensively] Using aptisTypeId: ${aptisTypeId}, questionTypeId: ${questionTypeId}`);
      
      // Get all criteria for this question type
      const criteria = await this.getCriteriaByQuestionType(questionTypeId, aptisTypeId);
      
      if (!criteria || criteria.length === 0) {
        throw new BadRequestError(`No scoring criteria found for question type ${questionTypeId}`);
      }

      console.log(`[scoreAnswerComprehensively] Found ${criteria.length} criteria`);

      // Determine scoring method based on question type and audio availability
      let result;
      const hasAudio = includeAudio && answer.audio_url;
      
      // For speaking, prefer transcribed_text over text_answer
      const answerText = answer.transcribed_text || answer.text_answer || '';
      
      console.log(`[scoreAnswerComprehensively] hasAudio=${hasAudio}, includeAudio=${includeAudio}, answerText length=${answerText.length}`);
      
      if (hasAudio) {
        console.log(`[scoreAnswerComprehensively] Using scoreEntireAnswerWithAudio`);
        // Get audio analysis if available
        const audioAnalysis = answer.audio_analysis ? JSON.parse(answer.audio_analysis) : null;
        result = await this.scoreEntireAnswerWithAudio(
          answerText, 
          question, 
          criteria, 
          question.questionType.type_name || 'general',
          audioAnalysis
        );
      } else {
        console.log(`[scoreAnswerComprehensively] Using scoreEntireAnswer`);
        result = await this.scoreEntireAnswer(
          answerText, 
          question, 
          criteria, 
          question.questionType.type_name || 'general'
        );
      }

      console.log(`[scoreAnswerComprehensively] Got result with score: ${result.score}`);
      
      // Validate and adjust score if needed
      const maxScore = answer.max_score || question.max_score || 10;
      const finalScore = Math.min(Math.max(0, result.score || 0), maxScore);
      
      // Validate CEFR level against score percentage
      const validatedCefrLevel = this.validateCefrLevel(finalScore, maxScore, result.cefrLevel);
      
      // Update result with validated CEFR level
      result.cefrLevel = validatedCefrLevel;
      result.score = finalScore;
      
      console.log(`[scoreAnswerComprehensively] Score validation: ${result.score}/${maxScore} (${((finalScore/maxScore)*100).toFixed(1)}%) -> CEFR: ${validatedCefrLevel}`);
      
      // Update the answer with the score and AI feedback
      await answer.update({
        score: finalScore,
        ai_feedback: result.comment || result.overallFeedback,
        ai_graded_at: new Date(),
      });
      
      console.log(`[scoreAnswerComprehensively] ✅ Updated answer score: ${finalScore}/${maxScore}`);
      
      // Create comprehensive feedback record
      console.log(`[scoreAnswerComprehensively] Creating feedback record...`);
      await this.createComprehensiveFeedback(answerId, result);

      console.log(`[scoreAnswerComprehensively] ✅ Comprehensive scoring completed for answer ${answerId}`);
      return result;
      
    } catch (error) {
      console.error(`[scoreAnswerComprehensively] ❌ Error scoring answer ${answerId}:`, error.message);
      console.error(`[scoreAnswerComprehensively] Stack:`, error.stack);
      throw error;
    }
  }

  /**
   * Create comprehensive feedback record for entire answer
   */
  async createComprehensiveFeedback(answerId, result) {
    try {
      console.log(`[createComprehensiveFeedback] Creating comprehensive feedback for answer ${answerId}`);
      
      // Validate result object
      if (!result) {
        throw new Error('Result object is null or undefined');
      }
      
      console.log(`[createComprehensiveFeedback] Result object keys:`, Object.keys(result));
      console.log(`[createComprehensiveFeedback] Result score: ${result.score}, type: ${typeof result.score}`);
      console.log(`[createComprehensiveFeedback] Result cefrLevel: ${result.cefrLevel}`);
      
      // Get answer to determine max_score for validation
      const answer = await AttemptAnswer.findByPk(answerId, {
        include: [{
          model: Question,
          as: 'question'
        }]
      });
      
      if (!answer) {
        throw new Error(`Answer ${answerId} not found for feedback creation`);
      }
      
      const maxScore = answer.max_score || answer.question?.max_score || 10;
      
      // Validate CEFR level based on actual score
      const validatedCefrLevel = this.validateCefrLevel(result.score, maxScore, result.cefrLevel);
      
      const feedbackData = {
        answer_id: answerId,
        score: result.score,
        comment: result.comment || result.overallFeedback,
        suggestions: result.suggestions,
        cefr_level: validatedCefrLevel // Use validated level
      };
      
      console.log(`[createComprehensiveFeedback] Feedback data to create:`, JSON.stringify(feedbackData, null, 2));
      
      // Validate required fields before creating
      if (feedbackData.score === null || feedbackData.score === undefined) {
        throw new Error(`Invalid score: ${feedbackData.score}`);
      }
      if (feedbackData.answer_id === null || feedbackData.answer_id === undefined) {
        throw new Error(`Invalid answer_id: ${feedbackData.answer_id}`);
      }
      
      const feedback = await AnswerAiFeedback.create(feedbackData);
      console.log(`[createComprehensiveFeedback] ✅ Created comprehensive feedback ${feedback.id} with score ${feedback.score} and validated CEFR: ${feedback.cefr_level}`);
      
      return feedback;
    } catch (error) {
      console.error(`[createComprehensiveFeedback] ❌ Failed to create comprehensive feedback:`, error.message);
      console.error(`[createComprehensiveFeedback] Full error stack:`, error.stack);
      console.error(`[createComprehensiveFeedback] Error details:`, error);
      throw error;
    }
  }

  /**
   * Create single feedback record for entire answer
   */
  async createSingleAnswerFeedback(answerId, result) {
    try {
      // For the new approach, we still need to create a feedback record
      // but we'll use the first criteria as a placeholder since the model expects criteria_id
      const answer = await AttemptAnswer.findByPk(answerId, {
        include: [{
          model: Question,
          as: 'question'
        }]
      });

      if (!answer) {
        throw new Error(`Answer ${answerId} not found`);
      }

      const firstCriteria = await AiScoringCriteria.findOne({
        where: {
          aptis_type_id: answer.question.aptis_type_id,
          question_type_id: answer.question.question_type_id,
        },
        order: [['id', 'ASC']]
      });

      if (!firstCriteria) {
        console.warn(`[createSingleAnswerFeedback] No criteria found for answer ${answerId}`);
        return;
      }

      // Delete any existing feedback for this answer (clean slate)
      await AnswerAiFeedback.destroy({
        where: { answer_id: answerId }
      });

      const feedbackData = {
        answer_id: answerId,
        criteria_id: firstCriteria.id, // Required by model but represents entire answer now
        score: result.score,
        comment: result.comment || result.overallFeedback,
        suggestions: result.suggestions,
        cefr_level: result.cefrLevel,
      };
      
      console.log(`[createSingleAnswerFeedback] Creating single feedback for answer ${answerId}:`, feedbackData);
      
      const feedback = await AnswerAiFeedback.create(feedbackData);
      console.log(`[createSingleAnswerFeedback] ✅ Created feedback ${feedback.id} with score: ${result.score}`);
      return feedback;
    } catch (error) {
      console.error(`[createSingleAnswerFeedback] ❌ Failed to create feedback:`, error.message);
      console.error(`[createSingleAnswerFeedback] Error details:`, error);
      throw error;
    }
  }

  /**
   * Legacy method - kept for backward compatibility but now redirects to new approach
   */
  async scoreWithCriteria(answerText, question, criteria, taskType = 'general') {
    console.log(`[scoreWithCriteria] LEGACY: Redirecting to scoreEntireAnswer`);
    const result = await this.scoreEntireAnswer(answerText, question, criteria, taskType);
    
    // Convert to legacy format for backward compatibility
    return {
      totalScore: result.score,
      totalMaxScore: question.max_score || 10,
      criteriaScores: [], // No longer used
      overallFeedback: result.overallFeedback
    };
  }

  /**
   * Legacy method for audio analysis - redirects to new approach
   */
  async scoreWithAudioAnalysis(answerText, question, criteria, taskType = 'general', audioAnalysis = null) {
    console.log(`[scoreWithAudioAnalysis] LEGACY: Redirecting to scoreEntireAnswerWithAudio`);
    const result = await this.scoreEntireAnswerWithAudio(answerText, question, criteria, taskType, audioAnalysis);
    
    // Convert to legacy format for backward compatibility
    return {
      totalScore: result.score,
      totalMaxScore: question.max_score || 10,
      criteriaScores: [], // No longer used
      overallFeedback: result.overallFeedback,
      audioAnalysisUsed: result.audioAnalysisUsed
    };
  }

  /**
   * Legacy method - kept for backward compatibility but simplified
   */
  async createAnswerAiFeedbacks(answerId, criteriaScores) {
    console.log(`[createAnswerAiFeedbacks] LEGACY: No longer creating individual criteria feedbacks`);
    // This method is now a no-op since we create single feedback in createSingleAnswerFeedback
    return;
  }
}

module.exports = new AiScoringService();