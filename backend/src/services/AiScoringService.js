const path = require('path');
const {
  AttemptAnswer,
  AiScoringCriteria,
  AnswerAiFeedback,
  Question,
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
const SpeakingScoringPromptBuilder = require('./scoring/SpeakingScoringPromptBuilder');
const AudioAnalysisEnhancer = require('./scoring/AudioAnalysisEnhancer');
const FeedbackGenerator = require('./scoring/FeedbackGenerator');
const AiServiceClient = require('./scoring/AiServiceClient');

class AiScoringService {
  /**
   * Validate CEFR level - enforce consistency between score and CEFR level
   * If AI provides inconsistent CEFR level, correct it based on score percentage
   * @param {number} score - Actual score achieved
   * @param {number} maxScore - Maximum possible score
   * @param {string} aiCefrLevel - CEFR level suggested by AI
   * @returns {string} Validated CEFR level
   */
  validateCefrLevel(score, maxScore, aiCefrLevel) {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    // Define CEFR level thresholds based on score percentage
    let expectedCefrLevel;
    if (percentage < 30) {
      expectedCefrLevel = 'A1';
    } else if (percentage < 50) {
      expectedCefrLevel = 'A2';
    } else if (percentage < 60) {
      expectedCefrLevel = 'B1';
    } else if (percentage < 70) {
      expectedCefrLevel = 'B1-B2';
    } else if (percentage < 80) {
      expectedCefrLevel = 'B2';
    } else if (percentage < 90) {
      expectedCefrLevel = 'B2-C1';
    } else {
      expectedCefrLevel = 'C1-C2';
    }
    
    // Check if AI's CEFR level is consistent with score
    const aiCefrClean = (aiCefrLevel || 'N/A').toUpperCase().replace(/[.\s]/g, '');
    const expectedCefrClean = expectedCefrLevel.toUpperCase().replace(/[.\s]/g, '');
    
    // Allow some flexibility: if AI says B2.1 and expected is B2, that's OK
    const isConsistent = 
      aiCefrClean === expectedCefrClean ||
      aiCefrClean.startsWith(expectedCefrClean) ||
      expectedCefrClean.includes(aiCefrClean.substring(0, 2)) ||
      (percentage >= 50 && percentage < 80 && aiCefrClean.startsWith('B')) || // B1/B2 range
      (percentage >= 30 && percentage < 60 && aiCefrClean.startsWith('A')); // A1/A2 range
    
    if (!isConsistent) {
      console.warn(`[validateCefrLevel] ⚠️ CEFR inconsistency detected!`);
      console.warn(`[validateCefrLevel]   AI suggested: ${aiCefrLevel}`);
      console.warn(`[validateCefrLevel]   Score: ${score}/${maxScore} (${percentage.toFixed(1)}%)`);
      console.warn(`[validateCefrLevel]   Expected CEFR: ${expectedCefrLevel}`);
      console.warn(`[validateCefrLevel]   ✓ Correcting to: ${expectedCefrLevel}`);
      return expectedCefrLevel;
    }
    
    console.log(`[validateCefrLevel] ✓ CEFR Level: ${aiCefrLevel} | Score: ${score}/${maxScore} (${percentage.toFixed(1)}%)`);
    return aiCefrLevel;
  }

  /**
   * Map CEFR level to numerical score based on question type and max score
   * @param {string} cefrLevel - CEFR level from AI assessment
   * @param {number} maxScore - Maximum score for the question
   * @param {string} questionTypeCode - Question type code (WRITING_SHORT, etc.)
   * @returns {number} Mapped numerical score
   */
  mapCefrToNumericalScore(cefrLevel, maxScore, questionTypeCode) {
    if (!cefrLevel) return 0;

    const mappings = {
      'WRITING_SHORT': { // Task 1: 0-3 scale
        'A0': 0,
        'A1.1': 1,
        'A1.2': 2, 
        'above A1': 3
      },
      'WRITING_FORM': { // Task 2: 0-5 scale
        'A0': 0,
        'A1.1': 1,
        'A1.2': 2,
        'A2.1': 3,
        'A2.2': 4,
        'B1+': 5
      },
      'WRITING_LONG': { // Task 3: 0-5 scale
        'A0': 0,
        'A2.1': 1,
        'A2.2': 2, 
        'B1.1': 3,
        'B1.2': 4,
        'B2+': 5
      },
      'WRITING_EMAIL': { // Task 4: 0-6 scale
        'A1/A2': 0,
        'B1.1': 1,
        'B1.2': 2,
        'B2.1': 3,
        'B2.2': 4,
        'C1': 5,
        'C2': 6
      }
    };

    const mapping = mappings[questionTypeCode];
    if (!mapping) {
      console.log(`[mapCefrToNumericalScore] No mapping found for ${questionTypeCode}, using percentage mapping`);
      // Fallback: map common CEFR levels to percentage of max score
      const percentageMapping = {
        'A0': 0,
        'A1': 0.2,
        'A2': 0.4, 
        'B1': 0.6,
        'B2': 0.8,
        'C1': 0.9,
        'C2': 1.0
      };
      const level = cefrLevel.split('.')[0]; // Get base level (A1, A2, etc.)
      const percentage = percentageMapping[level] || 0;
      return Math.round(maxScore * percentage);
    }

    const score = mapping[cefrLevel];
    if (score === undefined) {
      console.log(`[mapCefrToNumericalScore] CEFR level "${cefrLevel}" not found in mapping for ${questionTypeCode}`);
      return 0;
    }

    return Math.min(score, maxScore); // Ensure score doesn't exceed max
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
      // Load parent question if this is a child question (to get images/context)
      let parentQuestion = null;
      if (question.parent_question_id) {
        console.log(`[scoreEntireAnswer] Loading parent question ID: ${question.parent_question_id}`);
        parentQuestion = await Question.findByPk(question.parent_question_id);
        
        if (parentQuestion && parentQuestion.additional_media) {
          console.log(`[scoreEntireAnswer] ✓ Parent question has media (images/audio) for context`);
          // Merge parent's media into current question for AI context
          const parentMedia = typeof parentQuestion.additional_media === 'string' 
            ? JSON.parse(parentQuestion.additional_media) 
            : parentQuestion.additional_media;
          
          const currentMedia = question.additional_media 
            ? (typeof question.additional_media === 'string' ? JSON.parse(question.additional_media) : question.additional_media)
            : [];
          
          // Add parent media with context note
          question.additional_media = [...currentMedia, ...parentMedia.map(m => ({
            ...m,
            source: 'parent_question',
            description: `${m.description} (from main question)`
          }))];
          
          console.log(`[scoreEntireAnswer] ✓ Added ${parentMedia.length} media item(s) from parent question`);
        }
      }

      console.log(`[scoreEntireAnswer] Building prompt for ${criteria.length} criteria`);
      // Build comprehensive prompt with all criteria
      const prompt = this.buildComprehensiveScoringPrompt(answerText, question, criteria, taskType);

      // Call AI service
      const aiResponse = await AiServiceClient.callAiWithRetry(prompt);
      console.log(`[scoreEntireAnswer] Raw AI response: ${aiResponse.substring(0, 200)}...`);
      
      // Get max score from question
      const maxScore = this.getMaxScoreFromCriteria(criteria, question);
      
      // Parse AI response - AI calculates score directly based on CEFR and maxScore in prompt
      const parsedResult = AiServiceClient.parseAiResponse(aiResponse, maxScore);
      
      // Use AI's calculated score (already converted from CEFR in prompt)
      const finalScore = parsedResult.score || 0;
      console.log(`[scoreEntireAnswer] ✅ AI scored: ${finalScore}/${maxScore} (CEFR: ${parsedResult.cefrLevel})`);
      
      // Validate CEFR level against final score
      const validatedCefrLevel = this.validateCefrLevel(finalScore, maxScore, parsedResult.cefrLevel);

      const result = {
        totalScore: Math.round(finalScore * 100) / 100,
        totalMaxScore: maxScore,
        score: Math.round(finalScore * 100) / 100, // For backward compatibility
        overallFeedback: parsedResult.comment || 'No feedback provided',
        comment: parsedResult.comment,
        suggestions: parsedResult.suggestions,
        cefrLevel: validatedCefrLevel, // Use validated level
        aiCefrLevel: parsedResult.cefrLevel, // Keep original AI assessment
        criteriaUsed: criteria.map(c => c.criteria_name)
      };

      console.log(`[scoreEntireAnswer] ✅ Answer scored: ${result.score}/${maxScore} (CEFR: ${result.cefrLevel})`);
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
      
      const maxScore = question.max_score || 10;
      const parsedResult = AiServiceClient.parseAiResponse(aiResponse, maxScore);

      // Use AI's calculated score (already converted from CEFR in prompt)
      let finalScore = parsedResult.score || 0;
      console.log(`[scoreEntireAnswerWithAudio] ✅ AI scored: ${finalScore}/${maxScore} (CEFR: ${parsedResult.cefrLevel})`);

      // Apply audio analysis adjustments if available
      if (audioAnalysis && AudioAnalysisEnhancer.validateAudioAnalysis(audioAnalysis)) {
        finalScore = AudioAnalysisEnhancer.applyOverallAudioAnalysisAdjustment(
          finalScore,
          audioAnalysis,
          maxScore
        );
        finalScore = Math.max(0, Math.min(maxScore, finalScore));
      }
      
      // Validate CEFR level against final score
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

      console.log(`[scoreEntireAnswerWithAudio] ✅ Answer scored: ${result.score}/${maxScore} (CEFR: ${result.cefrLevel})`);
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
    const criterion = criteria[0]; // Use first criterion as main assessment guideline
    const maxScore = this.getMaxScoreFromCriteria(criteria, question);
    
    // Detect question type
    const questionTypeCode = question.questionType?.code || taskType;
    
    // Use specialized Speaking prompt builder for speaking questions
    if (questionTypeCode.toLowerCase().includes('speaking')) {
      console.log(`[buildComprehensiveScoringPrompt] Using SpeakingScoringPromptBuilder for ${questionTypeCode}`);
      return SpeakingScoringPromptBuilder.buildSpeakingPrompt(answerText, question, criteria, maxScore);
    }
    
    // Use specialized Writing prompt builder for writing questions
    if (questionTypeCode === 'WRITING_SHORT') {
      return this.buildWritingTask1Prompt(answerText, question, criterion, maxScore);
    } else if (questionTypeCode === 'WRITING_FORM') {
      return this.buildWritingTask2Prompt(answerText, question, criterion, maxScore);
    } else if (questionTypeCode === 'WRITING_LONG') {
      return this.buildWritingTask3Prompt(answerText, question, criterion, maxScore);
    } else if (questionTypeCode === 'WRITING_EMAIL') {
      return this.buildWritingTask4Prompt(answerText, question, criterion, maxScore);
    }
    
    // Fallback for other question types
    return this.buildGenericScoringPrompt(answerText, question, criteria, taskType, maxScore);
  }

  // REMOVED: getCefrScale() - AI now uses max_score directly from question
  // No need for hardcoded CEFR scales

  /**
   * Get max score from question
   * IMPORTANT: Always use question.max_score for flexible scoring (10, 10, 10, 20, etc.)
   */
  getMaxScoreFromCriteria(criteria, question) {
    const maxScore = question.max_score || 10; // Default to 10 if not set
    console.log(`[getMaxScoreFromCriteria] Using max_score: ${maxScore}`);
    return maxScore;
  }

  /**
   * APTIS Writing Task 1: Word-level writing (0-3 scale)
   */
  buildWritingTask1Prompt(answerText, question, criterion, maxScore) {
    return `You are an official APTIS assessor scoring Writing Task 1 - Word-level writing.

OFFICIAL APTIS RUBRIC:
${criterion.rubric_prompt}

TASK REQUIREMENTS:
- Format: Fill in basic information using 1-5 words per question
- Level: A1 level vocabulary and structures
- Assessment focus: Task fulfilment and communicative competence
- Maximum Score: ${maxScore} points

STUDENT'S QUESTIONS AND ANSWERS:
${question.content}

Student's Response: ${answerText}

SCORING INSTRUCTIONS:
- Score directly from 0 to ${maxScore} points based on task achievement
- Consider: intelligibility, task completion, appropriacy of responses
- CEFR Reference: A0 (minimal) → A1.1 → A1.2 → above A1 (excellent)
- Award proportional points based on quality (e.g., ${(maxScore * 0.25).toFixed(1)} for minimal, ${(maxScore * 0.5).toFixed(1)} for partial, ${(maxScore * 0.75).toFixed(1)} for good, ${maxScore} for excellent)

For suggestions: Provide COMPLETE, COMPREHENSIVE improvement guidance for each answer with:
- Specific phrase or word from student's text
- Corrected version
- Clear explanation of why the correction is needed (grammar rule, vocabulary, clarity, etc.)
- Context of how it relates to the task requirement
Example format: "For the email answer: change 'email is' to 'email address is' to be more specific and complete the required information format. This provides the exact email address as requested."

Return assessment in this JSON format:
{
  "score": [0-${maxScore} based on task achievement - use decimal if needed],
  "cefr_level": "[A0, A1.1, A1.2, or above A1 for reference]",
  "comment": "[Brief assessment of task completion and intelligibility]",
  "suggestions": "[Array of COMPREHENSIVE improvement suggestions with context and rationale]"
}`;
  }

  /**
   * APTIS Writing Task 2: Short text writing (0-5 scale)
   */
  buildWritingTask2Prompt(answerText, question, criterion, maxScore) {
    const wordCount = answerText.trim().split(/\s+/).length;
    
    return `You are an official APTIS assessor scoring Writing Task 2 - Short text writing.

OFFICIAL APTIS RUBRIC:
${criterion.rubric_prompt}

TASK REQUIREMENTS:
- Word count: 20-30 words (Student wrote: ${wordCount} words)
- Level: A2 level response
- Assessment areas: Task fulfilment/topic relevance, grammatical range and accuracy, punctuation, vocabulary range and accuracy, cohesion
- Maximum Score: ${maxScore} points

QUESTION: ${question.content}
STUDENT RESPONSE: ${answerText}

SCORING INSTRUCTIONS:
- Score directly from 0 to ${maxScore} points based on overall quality
- CEFR Reference Levels (for assessment guidance only):
  * A0 (0 points): No meaningful language or completely off-topic
  * A1.1 (${(maxScore * 0.2).toFixed(1)} pts): Limited words/phrases, serious errors
  * A1.2 (${(maxScore * 0.4).toFixed(1)} pts): Not fully on topic, limited grammar/vocabulary
  * A2.1 (${(maxScore * 0.6).toFixed(1)} pts): On topic, simple structures, some errors
  * A2.2 (${(maxScore * 0.8).toFixed(1)} pts): On topic, mostly accurate, sufficient vocabulary
  * B1+ (${maxScore} pts): Above A2 level performance
- Award proportional score based on quality across all assessment areas

For suggestions: Provide COMPLETE, COMPREHENSIVE improvement guidance with:
- Specific phrase/sentence from student's text
- Corrected version with proper grammar/vocabulary
- Clear explanation of WHY this correction is needed (grammar rule, verb tense, vocabulary choice, cohesion, etc.)
- How this helps meet the task requirement (maintaining topic, improving clarity, better connecting ideas)
Example: "Change 'I play football because is healthy' to 'I play football because it is healthy' to correct the missing subject pronoun 'it', making the sentence grammatically complete and clear. This shows proper subject-verb structure required at A2 level."

Return assessment in this JSON format:
{
  "score": [0-${maxScore} based on overall quality - use decimal if needed],
  "cefr_level": "[A0, A1.1, A1.2, A2.1, A2.2, or B1+ for reference]",
  "comment": "[Assessment covering all areas: topic relevance, grammar, punctuation, vocabulary, cohesion]",
  "suggestions": "[Array of COMPREHENSIVE improvement suggestions with context, explanation, and language learning rationale]"
}`;
  }

  /**
   * APTIS Writing Task 3: Three written responses (0-5 scale)
   */
  buildWritingTask3Prompt(answerText, question, criterion, maxScore) {
    const responses = answerText.split('\n').filter(r => r.trim());
    const responseCount = responses.length;
    
    return `You are an official APTIS assessor scoring Writing Task 3 - Three written responses.

OFFICIAL APTIS RUBRIC (0-5 scale):
${criterion.rubric_prompt}

TASK REQUIREMENTS:
- Format: 3 responses to chat questions, 30-40 words each
- Level: B1 level responses expected
- Student provided: ${responseCount} responses
- Assessment areas: Task fulfilment/topic relevance, punctuation, grammatical range and accuracy, vocabulary range and accuracy, cohesion

QUESTION: ${question.content}
STUDENT RESPONSES: ${answerText}

SCORING GUIDELINES:
- 5 (B2+): Above B1 level
- 4 (B1.2): ALL three questions on topic with B1 features: control of simple grammatical structures, errors when attempting complex structures, punctuation/spelling mostly accurate without impeding understanding, sufficient vocabulary, simple cohesive devices for linear sequence
- 3 (B1.1): TWO questions on topic with same B1.2 language features
- 2 (A2.2): At least two questions on topic with A2 features: simple grammatical structures at sentence level, errors common and sometimes impede understanding, noticeable punctuation/spelling mistakes, vocabulary insufficient with inappropriate choices impeding understanding, responses are lists not cohesive texts
- 1 (A2.1): ONE question on topic with same A2.2 language features
- 0: Below A2, no meaningful language, or completely off-topic

For suggestions: Provide COMPLETE, COMPREHENSIVE improvement guidance for EACH response with:
- Which response (Response 1, 2, or 3)
- Specific phrase or sentence from the student's text
- Corrected version
- Clear explanation of why this correction improves the writing (grammar, vocabulary choice, naturalness, cohesion)
- How it better addresses the original question
Example format: "Response 1: Change 'watched a movie' to 'watched a movie together' to provide more specific context about the shared activity. This shows better vocabulary detail and makes the answer more complete in response to 'did you go out?'"

Return assessment in this JSON format:
{
  "score": [0-5 based on number of on-topic responses and language level],
  "cefr_level": "[A0, A2.1, A2.2, B1.1, B1.2, or B2+]",
  "comment": "[Assessment of all responses covering task completion and language control]",
  "suggestions": "[Array of COMPREHENSIVE improvement suggestions, one for each identified issue, with full context and explanation]"
}`;
  }

  /**
   * APTIS Writing Task 4: Formal and informal writing (0-6 scale)
   */
  buildWritingTask4Prompt(answerText, question, criterion, maxScore) {
    return `You are an official APTIS assessor scoring Writing Task 4 - Formal and informal writing.

OFFICIAL APTIS RUBRIC:
${criterion.rubric_prompt}

TASK REQUIREMENTS:
- Format: Informal email (40-50 words) + Formal email (120-150 words)
- Level: B2 level with register control
- Key assessment: Register appropriacy between friend vs unknown person
- Areas: Task achievement/register control, grammatical range/accuracy, vocabulary range/accuracy, punctuation, fluency and cohesion
- Maximum Score: ${maxScore} points

QUESTION: ${question.content}
STUDENT RESPONSE: ${answerText}

SCORING INSTRUCTIONS:
- Score directly from 0 to ${maxScore} points based on register control and language proficiency
- CEFR Reference Levels (for assessment guidance only):
  * A1/A2 (0 pts): Below B1, no meaningful language
  * B1.1 (${(maxScore * 0.17).toFixed(1)} pts): Not on topic, no register awareness
  * B1.2 (${(maxScore * 0.33).toFixed(1)} pts): Partially on topic, register not consistent
  * B2.1 (${(maxScore * 0.5).toFixed(1)} pts): Partially on topic, register in ONE response
  * B2.2 (${(maxScore * 0.67).toFixed(1)} pts): On topic, TWO different registers, good grammar
  * C1 (${(maxScore * 0.83).toFixed(1)} pts): Features as B2.2 but higher proficiency
  * C2 (${maxScore} pts): Above C1 level
- Award proportional score based on register control quality and language accuracy

For suggestions: Provide COMPLETE, COMPREHENSIVE improvement guidance with:
- Which email section (Friend Email / Manager Email / Formal Email)
- Specific sentence or phrase from student's text
- Corrected version with proper register and grammar
- Clear explanation of WHY this change is needed:
  * Register appropriacy (formal vs informal tone)
  * Grammar and sentence structure
  * Vocabulary choice and formality level
  * How it better fulfills the task requirements
Example format: "In the Manager Email: Change 'I want to come' to 'I would like to participate' to use appropriate formal register. 'Would like' is more polite and formal than 'want', which is essential for addressing a manager in a professional context. This shows proper register awareness between different audiences."

Return assessment in this JSON format:
{
  "score": [0-${maxScore} based on register control and language proficiency - use decimal if needed],
  "cefr_level": "[A1/A2, B1.1, B1.2, B2.1, B2.2, C1, or C2 for reference]", 
  "comment": "[Assessment focusing on register control and language range/accuracy]",
  "suggestions": "[Array of COMPREHENSIVE improvement suggestions addressing register, grammar, vocabulary, and task fulfillment with full explanation]"
}`;
  }

  /**
   * Generic scoring prompt for non-writing tasks
   */
  buildGenericScoringPrompt(answerText, question, criteria, taskType, maxScore) {
    const criteriaList = criteria.map(c => `- ${c.criteria_name}: ${c.description || c.rubric_prompt}`).join('\n');
    
    const isWritingTask = taskType.toLowerCase().includes('writing') || 
                          question.questionType?.code?.includes('WRITING');
    
    const specialInstructions = isWritingTask ? 
      `\nSPECIAL INSTRUCTIONS FOR WRITING ASSESSMENT:
- In "suggestions", provide SPECIFIC text corrections using exact quotes
- Format: 'Change "student's text" to "corrected text"'
- Focus on grammar, vocabulary, spelling, and structure errors
- Give concrete fixes, not general advice
- Example: 'Change "I go to school yesterday" to "I went to school yesterday"'` : '';
    
    // Add visual context if question has images
    let visualContext = '';
    if (question.additional_media) {
      try {
        const media = typeof question.additional_media === 'string' 
          ? JSON.parse(question.additional_media) 
          : question.additional_media;
        
        const images = media.filter(m => m.type === 'image');
        if (images.length > 0) {
          visualContext = `\n\nVISUAL CONTEXT (Images provided to student):`;
          images.forEach((img, idx) => {
            const source = img.source === 'parent_question' ? ' [Reference image from main question]' : '';
            visualContext += `\n${idx + 1}. ${img.description}${source} - URL: ${img.url}`;
          });
          visualContext += `\n\nIMPORTANT: The student's response should be evaluated based on how well they describe/discuss these images. Consider:
- Did they accurately describe what's shown in the image(s)?
- Did they respond appropriately to the visual prompts?
- Did they use relevant vocabulary related to what's visible in the image(s)?
- For comparison tasks: Did they identify similarities and differences between the images?`;
        }
      } catch (e) {
        console.error('[buildGenericScoringPrompt] Error parsing additional_media:', e);
      }
    }
    
    return `You are an expert language assessor. Score this ${taskType} response holistically using ALL the following criteria:

${criteriaList}

Question: ${question.content}${visualContext}
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
      
      // CRITICAL: For speaking questions, MUST have transcribed_text before scoring
      const isSpeaking = question.questionType.code.toLowerCase().includes('speaking');
      if (isSpeaking && hasAudio && !answer.transcribed_text) {
        console.error(`[scoreAnswerComprehensively] ❌ Cannot score speaking answer ${answerId} - transcription not completed yet`);
        throw new BadRequestError('Cannot score speaking answer: transcription not completed. Please wait for speech-to-text processing to finish.');
      }
      
      // For speaking, prefer transcribed_text over text_answer
      const answerText = answer.transcribed_text || answer.text_answer || '';
      
      console.log(`[scoreAnswerComprehensively] hasAudio=${hasAudio}, includeAudio=${includeAudio}, isSpeaking=${isSpeaking}, answerText length=${answerText.length}`);
      
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
      let aiScore = (typeof result.score === 'number' && !isNaN(result.score) && result.score > 0) ? result.score : 0;
      let aiFeedback = result.overallFeedback || result.comment || 'Không có câu trả lời để chấm điểm.';
      let aiCefr = result.cefrLevel || 'N/A';
      if (aiScore === 0) {
        aiFeedback = 'Không có câu trả lời để chấm điểm.';
        aiCefr = 'N/A';
      }
      const finalScore = Math.min(Math.max(0, aiScore), maxScore);
      // Validate CEFR level against score percentage
      const validatedCefrLevel = this.validateCefrLevel(finalScore, maxScore, aiCefr);
      // Update result with validated CEFR level and safe values
      result.cefrLevel = validatedCefrLevel;
      result.score = finalScore;
      result.overallFeedback = aiFeedback;
      // Log
      console.log(`[scoreAnswerComprehensively] Score validation: ${result.score}/${maxScore} (${((finalScore/maxScore)*100).toFixed(1)}%) -> CEFR: ${validatedCefrLevel}`);
      // Update the answer with the score and AI feedback
      await answer.update({
        score: finalScore,
        ai_feedback: aiFeedback,
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
      
      // Handle suggestions - keep as array for JSON storage
      let suggestions = result.suggestions;
      if (!Array.isArray(suggestions)) {
        if (typeof suggestions === 'string' && suggestions.trim()) {
          // If it's a string, convert to array with single item
          suggestions = [suggestions];
        } else if (typeof suggestions === 'object' && suggestions !== null) {
          // If it's an object, convert to array
          suggestions = [suggestions];
        } else {
          // Otherwise empty array
          suggestions = [];
        }
      }
      
      // Force score=0 and feedback if invalid
      let safeScore = (typeof result.score === 'number' && !isNaN(result.score) && result.score > 0) ? result.score : 0;
      let safeComment = result.comment || result.overallFeedback || 'Không có câu trả lời để chấm điểm.';
      let safeCefr = validatedCefrLevel || 'N/A';
      if (safeScore === 0) {
        safeComment = 'Không có câu trả lời để chấm điểm.';
        safeCefr = 'N/A';
      }
      const feedbackData = {
        answer_id: answerId,
        score: safeScore,
        comment: safeComment,
        suggestions: suggestions, // Store as array - JSON column will handle serialization
        cefr_level: safeCefr // Use validated level
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