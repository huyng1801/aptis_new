const { AttemptAnswer, QuestionOption, QuestionItem } = require('../models');
const { SCORING_METHODS } = require('../utils/constants');
const { BadRequestError } = require('../utils/errors');


class ScoringService {
  async scoreMultipleChoice(selectedOptionId, correctOptionId) {
    return selectedOptionId === correctOptionId;
  }


  async scoreMatching(answerJson, correctMapping, options = null) {
    try {
      if (!answerJson) {
        console.log('[ScoringService] Matching: No answer provided');
        return { correct: 0, total: Object.keys(correctMapping).length, percentage: 0 };
      }

      const parsed = typeof answerJson === 'string' ? JSON.parse(answerJson) : answerJson;
      const answer = parsed.matches || parsed;

      let correct = 0;
      const total = Object.keys(correctMapping).length;

      if (total === 0) {
        console.log('[ScoringService] No correct mapping found for matching question');
        return { correct: 0, total: 1, percentage: 0 };
      }

      for (const [itemId, selectedOptionId] of Object.entries(answer)) {
        if (selectedOptionId && correctMapping[itemId]) {
          const correctOptionId = correctMapping[itemId];
          
          // Direct ID comparison
          const selectedId = parseInt(selectedOptionId);
          const correctId = parseInt(correctOptionId);
          
          if (selectedId === correctId) {
            correct++;
          }
        }
      }

      console.log('[ScoringService] Matching scoring:', { answer, correctMapping, correct, total });
      return { correct, total, percentage: (correct / total) * 100 };
    } catch (error) {
      console.error('[ScoringService] Matching scoring error:', error);
      return { correct: 0, total: Object.keys(correctMapping).length, percentage: 0 };
    }
  }


  async scoreGapFilling(answerJson, correctAnswers) {
    try {
      if (!answerJson) {
        console.log('[ScoringService] Gap filling: No answer provided');
        return { correct: 0, total: correctAnswers.length, percentage: 0 };
      }


      const parsed = typeof answerJson === 'string' ? JSON.parse(answerJson) : answerJson;
      let answerArray = [];
      if (parsed.gap_answers) {
        answerArray = parsed.gap_answers;
      } else if (parsed.gaps) {
        answerArray = correctAnswers.map((_, index) => {
          const key = Object.keys(parsed.gaps)[index];
          return key ? parsed.gaps[key] : '';
        });
      } else if (Array.isArray(parsed)) {
        answerArray = parsed;
      } else {
        answerArray = Object.values(parsed);
      }


      let correct = 0;
      const total = correctAnswers.length;


      for (let i = 0; i < total; i++) {
        const userAnswer = answerArray[i];
        const correctAnswer = correctAnswers[i];
        if (
          userAnswer &&
          correctAnswer &&
          userAnswer.toString().trim().toLowerCase() === correctAnswer.toString().trim().toLowerCase()
        ) {
          correct++;
        }
      }


      console.log('[ScoringService] Gap filling scoring:', { answerArray, correctAnswers, correct, total });
      return { correct, total, percentage: (correct / total) * 100 };
    } catch (error) {
      console.error('[ScoringService] Gap filling scoring error:', error);
      return { correct: 0, total: correctAnswers.length, percentage: 0 };
    }
  }


  async scoreOrdering(itemOrder, correctOrderIds) {
    try {
      if (!itemOrder) {
        console.log('[ScoringService] Ordering: No answer provided');
        return { correct: 0, total: correctOrderIds.length, percentage: 0 };
      }


      let userOrderIds = [];
      if (typeof itemOrder === 'string') {
        const parsed = JSON.parse(itemOrder);
        if (parsed.ordered_items) {
          // Frontend sends: {ordered_items: [{id, text, original_order}, ...]}
          userOrderIds = parsed.ordered_items.map(item => item.id || item);
        } else if (parsed.order) {
          userOrderIds = Array.isArray(parsed.order) ? parsed.order : Object.values(parsed.order);
        } else if (Array.isArray(parsed)) {
          userOrderIds = parsed;
        }
      } else if (Array.isArray(itemOrder)) {
        userOrderIds = itemOrder;
      } else if (typeof itemOrder === 'object') {
        if (itemOrder.ordered_items) {
          userOrderIds = itemOrder.ordered_items.map(item => item.id || item);
        } else if (itemOrder.order) {
          userOrderIds = Array.isArray(itemOrder.order) ? itemOrder.order : Object.values(itemOrder.order);
        } else {
          userOrderIds = Object.values(itemOrder);
        }
      }


      let correct = 0;
      const total = correctOrderIds.length;


      // For ordering, we need exact sequence match of item IDs
      for (let i = 0; i < total && i < userOrderIds.length; i++) {
        if (userOrderIds[i] === correctOrderIds[i]) {
          correct++;
        }
      }


      console.log('[ScoringService] Ordering scoring:', { userOrderIds, correctOrderIds, correct, total });
      return { correct, total, percentage: (correct / total) * 100 };
    } catch (error) {
      console.error('[ScoringService] Ordering scoring error:', error);
      return { correct: 0, total: correctOrderIds.length, percentage: 0 };
    }
  }


  async scoreAnswer(answer, question) {
    const { scoring_method } = question.questionType;
    if (scoring_method !== SCORING_METHODS.AUTO) {
      return null;
    }
    const questionTypeCode = question.questionType.code;
    let score = 0;
    console.log(`[ScoringService] Scoring question ${question.id}, type: ${questionTypeCode}`);
    console.log(`[ScoringService] Answer data:`, {
      answer_type: answer.answer_type,
      answer_json: answer.answer_json,
      selected_option_id: answer.selected_option_id,
      text_answer: answer.text_answer
    });
    if (questionTypeCode.includes('MCQ') || questionTypeCode.includes('TRUE_FALSE')) {
      // Check if this is a Multi MCQ (has multiple items)
      const items = await QuestionItem.findAll({
        where: { question_id: question.id }
      });
      
      if (items.length > 1) {
        // Multi MCQ scoring: each item has its own correct option
        console.log('[ScoringService] Multi MCQ with', items.length, 'items');
        
        const options = await QuestionOption.findAll({
          where: { question_id: question.id }
        });
        
        // Parse user answers from answer_json
        const userAnswers = answer.answer_json ? JSON.parse(answer.answer_json) : {};
        
        let correct = 0;
        const total = items.length;
        
        // Group options by item (typically 3 options per item)
        const optionsPerItem = Math.floor(options.length / items.length);
        
        items.forEach((item, itemIndex) => {
          const userAnswerOptionId = userAnswers[item.id];
          
          // Find correct option for this item
          const itemOptionsStart = itemIndex * optionsPerItem;
          const itemOptions = options.slice(itemOptionsStart, itemOptionsStart + optionsPerItem);
          const correctOption = itemOptions.find(opt => opt.is_correct);
          
          if (userAnswerOptionId === correctOption?.id) {
            correct++;
          }
        });
        
        console.log('[ScoringService] Multi MCQ scoring:', { correct, total, userAnswers });
        score = total > 0 ? (correct / total) * answer.max_score : 0;
      } else {
        // Single MCQ scoring
        const correctOption = await QuestionOption.findOne({
          where: {
            question_id: question.id,
            is_correct: true,
          },
        });
        const isCorrect = await this.scoreMultipleChoice(
          answer.selected_option_id,
          correctOption?.id,
        );
        score = isCorrect ? answer.max_score : 0;
      }
    } else if (questionTypeCode.includes('MATCHING')) {
      const items = await QuestionItem.findAll({
        where: { question_id: question.id }
      });
      const options = await QuestionOption.findAll({
        where: { question_id: question.id }
      });
      
      // Create a mapping from item_id to correct option_id
      const correctMapping = {};
      items.forEach((item) => {
        if (item.correct_option_id) {
          correctMapping[item.id] = item.correct_option_id;
        }
      });
      console.log('[ScoringService] Matching question', question.id, 'correct mapping:', correctMapping);
      const result = await this.scoreMatching(answer.answer_json, correctMapping, options);
      score = result.total > 0 ? (result.correct / result.total) * answer.max_score : 0;
    } else if (questionTypeCode.includes('GAP_FILL') || questionTypeCode.includes('FILL')) {
      const items = await QuestionItem.findAll({
        where: { question_id: question.id },
        order: [['item_order', 'ASC']],
      });
      const correctAnswers = items.map((item) => item.answer_text);
      console.log('[ScoringService] Gap filling correct answers:', correctAnswers);
      const result = await this.scoreGapFilling(answer.answer_json, correctAnswers, items);
      score = (result.correct / result.total) * answer.max_score;
    } else if (questionTypeCode.includes('ORDERING')) {
      const items = await QuestionItem.findAll({
        where: { question_id: question.id },
        order: [['item_order', 'ASC']],
      });
      
      // Build correct order as array of item IDs sorted by their correct position
      const correctOrderIds = items
        .filter(item => parseInt(item.answer_text) > 0) // Filter out instruction items
        .sort((a, b) => {
          const aPos = parseInt(a.answer_text) || a.item_order;
          const bPos = parseInt(b.answer_text) || b.item_order;
          return aPos - bPos;
        })
        .map(item => item.id);
      
      console.log('[ScoringService] Ordering correct order (IDs):', correctOrderIds);
      const result = await this.scoreOrdering(answer.answer_json, correctOrderIds);
      score = (result.correct / result.total) * answer.max_score;
    }
    const finalScore = Math.min(score, answer.max_score);
    console.log(`[ScoringService] Final score: ${finalScore}/${answer.max_score}`);
    return Math.round(finalScore * 100) / 100;
  }


  async calculateAttemptScore(attemptId) {
    const answers = await AttemptAnswer.findAll({
      where: { attempt_id: attemptId },
    });
    let totalScore = 0;
    for (const answer of answers) {
      const answerScore = answer.final_score !== null ? answer.final_score : answer.score;
      if (answerScore !== null) {
        totalScore += parseFloat(answerScore);
      }
    }
    return Math.round(totalScore * 100) / 100;
  }

  async autoGradeAnswer(answerId) {
    const answer = await AttemptAnswer.findByPk(answerId, {
      include: [
        {
          model: require('../models').Question,
          as: 'question',
          include: [
            {
              model: require('../models').QuestionType,
              as: 'questionType',
            },
          ],
        },
      ],
    });
    if (!answer) {
      throw new BadRequestError('Answer not found');
    }
    const score = await this.scoreAnswer(answer, answer.question);
    console.log(`[ScoringService] Auto-grading Q${answer.question_id}: calculated=${score}, max_score=${answer.max_score}`);
    if (score !== null) {
      const finalScore = Math.min(score, answer.max_score);
      if (finalScore !== score) {
        console.warn(`[ScoringService] ⚠️  Score capped: ${score} -> ${finalScore} (max: ${answer.max_score})`);
      }
      await answer.update({
        score: finalScore,
        auto_graded_at: new Date(),
      });
      return finalScore;
    }
    return score;
  }
}

module.exports = new ScoringService();
