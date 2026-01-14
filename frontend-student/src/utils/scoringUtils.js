// Scoring utilities for different question types

/**
 * Calculate accurate scores for all question types
 */

export const scoringUtils = {
  /**
   * Score Multiple Choice Questions
   */
  scoreMCQ: (userAnswer, correctAnswer, maxScore = 1) => {
    if (!userAnswer || !correctAnswer) return { score: 0, percentage: 0, feedback: 'No answer provided' };
    
    const isCorrect = userAnswer.toString().toLowerCase().trim() === correctAnswer.toString().toLowerCase().trim();
    const score = isCorrect ? maxScore : 0;
    const percentage = (score / maxScore) * 100;
    
    return {
      score,
      percentage,
      feedback: isCorrect ? 'Correct answer' : 'Incorrect answer'
    };
  },

  /**
   * Score Gap Filling Questions with partial credit
   */
  scoreGapFilling: (userAnswers, correctAnswers, maxScore = 1) => {
    if (!correctAnswers) return { score: 0, percentage: 0, feedback: 'No correct answers provided' };
    
    // Handle different correct answers formats
    let correctAnswersArray = [];
    if (Array.isArray(correctAnswers)) {
      correctAnswersArray = correctAnswers;
    } else if (typeof correctAnswers === 'object') {
      correctAnswersArray = Object.values(correctAnswers);
    } else {
      return { score: 0, percentage: 0, feedback: 'Invalid correct answers format' };
    }
    
    const totalGaps = correctAnswersArray.length;
    if (totalGaps === 0) return { score: 0, percentage: 0, feedback: 'No gaps to fill' };
    
    if (!userAnswers) return { score: 0, percentage: 0, feedback: 'No user answers provided' };
    
    let correctCount = 0;
    const scorePerGap = maxScore / totalGaps;
    const gapResults = {};
    
    // Handle different user answer formats
    let userAnswersArray = [];
    if (Array.isArray(userAnswers)) {
      userAnswersArray = userAnswers;
    } else if (typeof userAnswers === 'object') {
      if (userAnswers.gaps) {
        // Frontend gap format: { gaps: { itemId: answer } }
        userAnswersArray = correctAnswersArray.map((_, index) => {
          const key = Object.keys(userAnswers.gaps)[index];
          return key ? userAnswers.gaps[key] : '';
        });
      } else if (userAnswers.gap_answers) {
        // Backend gap format: { gap_answers: [...] }
        userAnswersArray = userAnswers.gap_answers;
      } else {
        userAnswersArray = Object.values(userAnswers);
      }
    }
    
    for (let i = 0; i < totalGaps; i++) {
      const userAnswer = userAnswersArray[i];
      const correctAnswer = correctAnswersArray[i];
      const isCorrect = userAnswer && correctAnswer &&
        userAnswer.toString().toLowerCase().trim() === correctAnswer.toString().toLowerCase().trim();
      
      gapResults[i] = {
        userAnswer: userAnswer || '',
        correctAnswer,
        isCorrect,
        score: isCorrect ? scorePerGap : 0
      };
      
      if (isCorrect) correctCount++;
    }
    
    const totalScore = correctCount * scorePerGap;
    const percentage = (totalScore / maxScore) * 100;
    
    return {
      score: totalScore,
      percentage,
      feedback: `${correctCount}/${totalGaps} gaps filled correctly`,
      gapResults
    };
  },

  /**
   * Score Matching Questions with partial credit
   */
  scoreMatching: (userMatches, correctMatches, maxScore = 1) => {
    if (!userMatches || !correctMatches) return { score: 0, percentage: 0, feedback: 'No matches provided' };
    
    const totalItems = Object.keys(correctMatches).length;
    if (totalItems === 0) return { score: 0, percentage: 0, feedback: 'No items to match' };
    
    let correctCount = 0;
    const scorePerMatch = maxScore / totalItems;
    const matchResults = {};
    
    Object.entries(correctMatches).forEach(([itemId, correctMatch]) => {
      const userMatch = userMatches[itemId];
      const isCorrect = userMatch && 
        userMatch.toString().toLowerCase().trim() === correctMatch.toString().toLowerCase().trim();
      
      matchResults[itemId] = {
        userMatch: userMatch || '',
        correctMatch,
        isCorrect,
        score: isCorrect ? scorePerMatch : 0
      };
      
      if (isCorrect) correctCount++;
    });
    
    const totalScore = correctCount * scorePerMatch;
    const percentage = (totalScore / maxScore) * 100;
    
    return {
      score: totalScore,
      percentage,
      feedback: `${correctCount}/${totalItems} items matched correctly`,
      matchResults
    };
  },

  /**
   * Score Statement Matching (True/False/Not Given)
   */
  scoreStatementMatching: (userAnswers, correctAnswers, maxScore = 1) => {
    if (!userAnswers || !correctAnswers) return { score: 0, percentage: 0, feedback: 'No answers provided' };
    
    const totalStatements = Object.keys(correctAnswers).length;
    if (totalStatements === 0) return { score: 0, percentage: 0, feedback: 'No statements to evaluate' };
    
    let correctCount = 0;
    const scorePerStatement = maxScore / totalStatements;
    const statementResults = {};
    
    Object.entries(correctAnswers).forEach(([statementId, correctAnswer]) => {
      const userAnswer = userAnswers[statementId];
      const isCorrect = userAnswer && 
        userAnswer.toString().toLowerCase().trim() === correctAnswer.toString().toLowerCase().trim();
      
      statementResults[statementId] = {
        userAnswer: userAnswer || '',
        correctAnswer,
        isCorrect,
        score: isCorrect ? scorePerStatement : 0
      };
      
      if (isCorrect) correctCount++;
    });
    
    const totalScore = correctCount * scorePerStatement;
    const percentage = (totalScore / maxScore) * 100;
    
    return {
      score: totalScore,
      percentage,
      feedback: `${correctCount}/${totalStatements} statements answered correctly`,
      statementResults
    };
  },

  /**
   * Score Ordering Questions
   */
  scoreOrdering: (userOrder, correctOrder, maxScore = 1) => {
    if (!correctOrder) return { score: 0, percentage: 0, feedback: 'No correct order provided' };
    
    // Handle different correct order formats
    let correctOrderArray = [];
    if (Array.isArray(correctOrder)) {
      correctOrderArray = correctOrder;
    } else if (typeof correctOrder === 'object') {
      correctOrderArray = Object.values(correctOrder);
    } else {
      return { score: 0, percentage: 0, feedback: 'Invalid correct order format' };
    }
    
    const totalItems = correctOrderArray.length;
    if (totalItems === 0) return { score: 0, percentage: 0, feedback: 'No items to order' };
    
    if (!userOrder) return { score: 0, percentage: 0, feedback: 'No order provided' };
    
    let correctPositions = 0;
    const scorePerPosition = maxScore / totalItems;
    const orderResults = {};
    
    // Handle different user order formats
    let userOrderArray = [];
    if (Array.isArray(userOrder)) {
      userOrderArray = userOrder;
    } else if (typeof userOrder === 'object') {
      if (userOrder.ordered_items) {
        // Extract order from ordered_items array
        userOrderArray = userOrder.ordered_items.map(item => item.id || item.original_order);
      } else if (userOrder.order) {
        userOrderArray = Object.values(userOrder.order);
      } else {
        userOrderArray = Object.values(userOrder);
      }
    }
    
    for (let i = 0; i < totalItems && i < userOrderArray.length; i++) {
      const userPosition = userOrderArray[i];
      const correctPosition = correctOrderArray[i];
      const isCorrect = userPosition && 
        parseInt(userPosition) === parseInt(correctPosition);
      
      orderResults[i] = {
        userPosition: userPosition || '',
        correctPosition,
        isCorrect,
        score: isCorrect ? scorePerPosition : 0
      };
      
      if (isCorrect) correctPositions++;
    }
    
    const totalScore = correctPositions * scorePerPosition;
    const percentage = (totalScore / maxScore) * 100;
    
    return {
      score: totalScore,
      percentage,
      feedback: `${correctPositions}/${totalItems} items in correct position`,
      orderResults
    };
  },

  /**
   * Score Writing Questions based on word count and content quality
   */
  scoreWriting: (userText, criteria = {}, maxScore = 1) => {
    if (!userText || userText.trim() === '') {
      return { score: 0, percentage: 0, feedback: 'No writing response provided' };
    }
    
    const wordCount = userText.trim().split(/\s+/).filter(word => word.length > 0).length;
    const {
      minWords = 0,
      maxWords = 1000,
      targetWords = 100
    } = criteria;
    
    let wordCountScore = 0;
    let lengthFeedback = '';
    
    // Word count scoring
    if (wordCount < minWords) {
      wordCountScore = wordCount / minWords * 0.5; // Partial credit for short responses
      lengthFeedback = `Too short (${wordCount}/${minWords} minimum words)`;
    } else if (wordCount > maxWords) {
      wordCountScore = 0.8; // Penalty for too long
      lengthFeedback = `Too long (${wordCount}/${maxWords} maximum words)`;
    } else if (wordCount >= minWords && wordCount <= targetWords * 1.2) {
      wordCountScore = 1.0; // Full marks for appropriate length
      lengthFeedback = `Good length (${wordCount} words)`;
    } else {
      wordCountScore = 0.9; // Slightly long but acceptable
      lengthFeedback = `Acceptable length (${wordCount} words)`;
    }
    
    // Basic content scoring (would be replaced by AI in real system)
    let contentScore = 0.7; // Default content score
    
    // Check for basic structure
    const sentences = userText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 3) contentScore += 0.1;
    
    // Check for variety in vocabulary (simple metric)
    const words = userText.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const vocabularyRatio = uniqueWords.size / words.length;
    if (vocabularyRatio > 0.6) contentScore += 0.1;
    
    // Combine scores
    const finalScore = (wordCountScore * 0.3 + contentScore * 0.7) * maxScore;
    const percentage = (finalScore / maxScore) * 100;
    
    return {
      score: Math.round(finalScore * 100) / 100,
      percentage: Math.round(percentage),
      feedback: `${lengthFeedback}. Content quality: ${Math.round(contentScore * 100)}%`,
      wordCount,
      wordCountScore,
      contentScore
    };
  },

  /**
   * Score Speaking Questions (placeholder for AI scoring)
   */
  scoreSpeaking: (audioUrl, transcription = '', criteria = {}, maxScore = 1) => {
    if (!audioUrl && !transcription) {
      return { score: 0, percentage: 0, feedback: 'No speaking response provided' };
    }
    
    // Placeholder scoring - in real system this would be AI-based
    let score = 0;
    let feedback = [];
    
    // Check if audio exists
    if (audioUrl) {
      score += maxScore * 0.3; // 30% for providing audio
      feedback.push('Audio response provided');
    }
    
    // Check transcription quality if available
    if (transcription && transcription.trim().length > 0) {
      const wordCount = transcription.trim().split(/\s+/).length;
      
      if (wordCount >= 10) {
        score += maxScore * 0.4; // 40% for sufficient content
        feedback.push(`Good content length (${wordCount} words)`);
      } else {
        score += maxScore * 0.2;
        feedback.push(`Short response (${wordCount} words)`);
      }
      
      // Basic fluency check (sentences)
      const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length >= 2) {
        score += maxScore * 0.3; // 30% for structure
        feedback.push('Good sentence structure');
      } else {
        score += maxScore * 0.1;
        feedback.push('Basic sentence structure');
      }
    } else {
      score += maxScore * 0.2; // Basic score for audio only
      feedback.push('Audio provided but no transcription available');
    }
    
    const percentage = (score / maxScore) * 100;
    
    return {
      score: Math.round(score * 100) / 100,
      percentage: Math.round(percentage),
      feedback: feedback.join('. '),
      hasAudio: !!audioUrl,
      hasTranscription: !!transcription
    };
  },

  /**
   * Calculate overall section score
   */
  calculateSectionScore: (questionScores, maxSectionScore = 100) => {
    if (!questionScores || questionScores.length === 0) {
      return { score: 0, percentage: 0, totalQuestions: 0, correctAnswers: 0 };
    }
    
    const totalScore = questionScores.reduce((sum, qs) => sum + (qs.score || 0), 0);
    const totalMaxScore = questionScores.reduce((sum, qs) => sum + (qs.maxScore || 1), 0);
    const correctAnswers = questionScores.filter(qs => qs.percentage >= 80).length;
    
    // Normalize to section max score
    const normalizedScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * maxSectionScore : 0;
    const percentage = maxSectionScore > 0 ? (normalizedScore / maxSectionScore) * 100 : 0;
    
    return {
      score: Math.round(normalizedScore * 100) / 100,
      percentage: Math.round(percentage),
      totalQuestions: questionScores.length,
      correctAnswers
    };
  },

  /**
   * Auto-score a question based on its type
   */
  autoScoreQuestion: (question, answer, maxScore = 1) => {
    const questionType = question.question_type?.code || question.code;
    
    try {
      let userAnswer, correctData;
      
      // Parse user answer
      if (answer.answer_json) {
        userAnswer = JSON.parse(answer.answer_json);
      } else {
        userAnswer = answer.text_answer;
      }
      
      switch (questionType) {
        case 'LISTENING_MCQ':
        case 'READING_MCQ': {
          const correctOption = question.question_options?.find(opt => opt.is_correct);
          const correctAnswer = correctOption?.option_text || correctOption?.option_id;
          return scoringUtils.scoreMCQ(userAnswer, correctAnswer, maxScore);
        }
        
        case 'LISTENING_GAP_FILL':
        case 'READING_GAP_FILL': {
          const correctAnswers = [];
          if (question.question_items) {
            // Sort items by item_order and extract answer_text
            question.question_items.sort((a, b) => (a.item_order || 0) - (b.item_order || 0));
            question.question_items.forEach(item => {
              if (item.answer_text) {
                correctAnswers.push(item.answer_text);
              }
            });
          } else if (question.items) {
            // Alternative data structure
            question.items.sort((a, b) => (a.item_order || 0) - (b.item_order || 0));
            question.items.forEach(item => {
              if (item.answer_text) {
                correctAnswers.push(item.answer_text);
              }
            });
          }
          return scoringUtils.scoreGapFilling(userAnswer?.gaps || userAnswer, correctAnswers, maxScore);
        }
        
        case 'LISTENING_MATCHING':
        case 'READING_MATCHING': {
          const correctMatches = {};
          question.question_items?.forEach(item => {
            if (item.sample_answers?.length > 0) {
              correctMatches[item.id] = item.sample_answers[0].answer_text;
            }
          });
          return scoringUtils.scoreMatching(userAnswer?.matches || userAnswer, correctMatches, maxScore);
        }
        
        case 'LISTENING_STATEMENT_MATCHING': {
          const correctAnswers = {};
          question.question_items?.forEach(item => {
            if (item.sample_answers?.length > 0) {
              correctAnswers[item.id] = item.sample_answers[0].answer_text;
            }
          });
          return scoringUtils.scoreStatementMatching(userAnswer?.statements || userAnswer, correctAnswers, maxScore);
        }
        
        case 'READING_ORDERING': {
          const correctOrder = [];
          if (question.question_items) {
            // Sort items by item_order and extract the correct positions
            question.question_items.sort((a, b) => (a.item_order || 0) - (b.item_order || 0));
            question.question_items.forEach(item => {
              // The correct position should be in answer_text
              const position = parseInt(item.answer_text);
              correctOrder.push(isNaN(position) ? item.id : position);
            });
          } else if (question.items) {
            // Alternative data structure  
            question.items.sort((a, b) => (a.item_order || 0) - (b.item_order || 0));
            question.items.forEach(item => {
              const position = parseInt(item.answer_text);
              correctOrder.push(isNaN(position) ? item.id : position);
            });
          }
          return scoringUtils.scoreOrdering(userAnswer?.order || userAnswer?.ordered_items || userAnswer, correctOrder, maxScore);
        }
        
        // WRITING_SHORT removed per APTIS Technical Report
        case 'WRITING_FORM':
        case 'WRITING_LONG':
        case 'WRITING_EMAIL': {
          // WRITING_ESSAY removed per APTIS Technical Report
          const criteria = {
            minWords: question.min_words || 0,
            maxWords: question.max_words || 1000,
            targetWords: question.target_words || 100
          };
          return scoringUtils.scoreWriting(answer.text_answer, criteria, maxScore);
        }
        
        case 'SPEAKING_INTRO':
        case 'SPEAKING_DESCRIPTION':
        case 'SPEAKING_COMPARISON':
        case 'SPEAKING_DISCUSSION': {
          return scoringUtils.scoreSpeaking(answer.audio_url, answer.transcribed_text, {}, maxScore);
        }
        
        default:
          // Fallback for unknown question types
          return {
            score: userAnswer ? maxScore * 0.5 : 0,
            percentage: userAnswer ? 50 : 0,
            feedback: 'Manual scoring required for this question type'
          };
      }
    } catch (error) {
      console.error('Error scoring question:', error);
      return {
        score: 0,
        percentage: 0,
        feedback: 'Error occurred during scoring'
      };
    }
  }
};