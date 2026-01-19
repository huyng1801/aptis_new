const {
  ExamAttempt,
  Exam,
  ExamSection,
  ExamSectionQuestion,
  AttemptSection,
  AttemptAnswer,
  Question,
  QuestionItem,
  QuestionOption,
  QuestionType,
  SkillType,
} = require('../../models');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../utils/errors');
const { isValidAttemptType } = require('../../utils/validators');
const { SCORING_METHODS } = require('../../utils/constants');
const ScoringService = require('../../services/ScoringService');
const AiScoringService = require('../../services/AiScoringService');
const { addSpeechJob } = require('../../jobs/speechQueue');


/**
 * Start exam attempt
 */
exports.startAttempt = async (req, res, next) => {
  try {
    const { exam_id, attempt_type, selected_skill_id } = req.body;
    const studentId = req.user.userId;

    console.log('[startAttempt] Request body:', { exam_id, attempt_type, selected_skill_id });
    console.log('[startAttempt] StudentId:', studentId);

    // Validate attempt type
    if (!isValidAttemptType(attempt_type, selected_skill_id)) {
      console.log('[startAttempt] Invalid attempt type:', { attempt_type, selected_skill_id });
      throw new BadRequestError('Invalid attempt type or missing selected_skill_id');
    }

    // Check if exam exists and is published
    const exam = await Exam.findOne({
      where: { id: exam_id, status: 'published' },
    });

    if (!exam) {
      throw new NotFoundError('Exam not found or not published');
    }

    // If single_skill attempt, validate that skill exists
    if (attempt_type === 'single_skill' && selected_skill_id) {
      const skill = await SkillType.findByPk(selected_skill_id);
      if (!skill) {
        console.log('[startAttempt] Skill not found:', selected_skill_id);
        throw new BadRequestError(`Skill with ID ${selected_skill_id} not found`);
      }
    }

    // Get next attempt number
    const lastAttempt = await ExamAttempt.findOne({
      where: {
        student_id: studentId,
        exam_id,
        attempt_type,
        selected_skill_id: selected_skill_id || null,
      },
      order: [['attempt_number', 'DESC']],
    });

    const attempt_number = lastAttempt ? lastAttempt.attempt_number + 1 : 1;

    // Create attempt
    const attempt = await ExamAttempt.create({
      student_id: studentId,
      exam_id,
      attempt_type,
      selected_skill_id: selected_skill_id || null,
      attempt_number,
      start_time: new Date(),
      status: 'in_progress',
    });

    // Get exam sections based on attempt type
    const where = { exam_id };
    if (attempt_type === 'single_skill') {
      where.skill_type_id = selected_skill_id;
    }

    const sections = await ExamSection.findAll({
      where,
      include: [
        {
          model: ExamSectionQuestion,
          as: 'questions',
          include: [
            {
              model: Question,
              as: 'question',
              include: [
                { model: QuestionItem, as: 'items' },
                { model: QuestionOption, as: 'options' },
                { model: QuestionType, as: 'questionType' },
              ],
            },
          ],
        },
      ],
      order: [['section_order', 'ASC']],
    });

    // Create attempt sections
    for (const section of sections) {
      await AttemptSection.create({
        attempt_id: attempt.id,
        exam_section_id: section.id,
        section_status: 'not_started',
      });

      // Create attempt answers (empty) - use findOrCreate to avoid duplicates
      for (const esq of section.questions) {
        // Auto-detect answer_type based on question type code
        const questionTypeCode = esq.question.questionType.code.toLowerCase();
        let defaultAnswerType = 'text';
        
        if (questionTypeCode.includes('mcq') || 
            questionTypeCode.includes('true_false') || 
            questionTypeCode.includes('multiple_choice')) {
          defaultAnswerType = 'option';
        } else if (questionTypeCode.includes('speaking')) {
          defaultAnswerType = 'audio';
        } else if (questionTypeCode.includes('matching') || 
                   questionTypeCode.includes('ordering') ||
                   questionTypeCode.includes('gap_filling')) {
          defaultAnswerType = 'json';
        }
        // else: writing, reading short answer, etc. = 'text'
        
        await AttemptAnswer.findOrCreate({
          where: {
            attempt_id: attempt.id,
            question_id: esq.question_id,
          },
          defaults: {
            answer_type: defaultAnswerType,
            max_score: esq.max_score,
          },
        });
      }
    }

    // Reload with lightweight data (NO questions to improve performance)
    const lightAttempt = await ExamAttempt.findByPk(attempt.id, {
      include: [
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'title', 'duration_minutes', 'total_score'],
        },
        {
          model: AttemptSection,
          as: 'sections',
          include: [
            {
              model: ExamSection,
              as: 'examSection',
              attributes: ['id', 'section_order', 'instruction'],
              include: [
                {
                  model: SkillType,
                  as: 'skillType',
                  attributes: ['id', 'code', 'skill_type_name'],
                },
              ],
            },
          ],
        },
      ],
    });

    const plainAttempt = lightAttempt.toJSON();
    
    console.log('[startAttempt] Lightweight attempt created:');
    console.log('[startAttempt] - Attempt ID:', plainAttempt.id);
    console.log('[startAttempt] - Sections count:', plainAttempt.sections?.length || 0);
    console.log('[startAttempt] - Use GET /attempts/:id/questions to load questions progressively');

    res.status(201).json({
      success: true,
      data: {
        ...plainAttempt,
        // Provide metadata for frontend to know how to load questions
        questions_count: await AttemptAnswer.count({ where: { attempt_id: attempt.id } }),
        load_questions_url: `/student/attempts/${attempt.id}/questions`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attempt details (to continue)
 */
exports.getAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.user.userId;

    const attempt = await ExamAttempt.findOne({
      where: { id: attemptId, student_id: studentId },
      include: [
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'title', 'duration_minutes', 'total_score'],
        },
        {
          model: AttemptSection,
          as: 'sections',
          include: [
            {
              model: ExamSection,
              as: 'examSection',
              attributes: ['id', 'section_order', 'instruction'],
              include: [
                {
                  model: SkillType,
                  as: 'skillType',
                  attributes: ['id', 'code', 'skill_type_name'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!attempt) {
      throw new NotFoundError('Attempt not found');
    }

    const plainAttempt = attempt.toJSON();
    
    console.log('[getAttempt] Retrieved lightweight attempt:');
    console.log('[getAttempt] - Attempt ID:', plainAttempt.id);
    console.log('[getAttempt] - Use /attempts/:id/questions to load questions');

    res.json({
      success: true,
      data: {
        ...plainAttempt,
        questions_count: await AttemptAnswer.count({ where: { attempt_id: attemptId } }),
        load_questions_url: `/student/attempts/${attemptId}/questions`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit exam
 * ⚠️ IMPORTANT: This endpoint returns immediately (202 Accepted) when AI scoring is needed
 * to prevent timeout issues. AI scoring happens asynchronously in the background.
 */
exports.submitAttempt = async (req, res, next) => {
  const submitStartTime = Date.now();
  
  try {
    const { attemptId } = req.params;
    const studentId = req.user.userId;

    console.log(`[submitAttempt] Starting submission for attempt ${attemptId}, student ${studentId}`);

    const attempt = await ExamAttempt.findOne({
      where: { id: attemptId, student_id: studentId },
    });

    if (!attempt) {
      throw new NotFoundError('Attempt not found');
    }

    if (attempt.status !== 'in_progress') {
      throw new BadRequestError('Attempt already submitted');
    }

    // Update attempt status
    await attempt.update({
      end_time: new Date(),
      status: 'submitted',
    });

    // Calculate total score for auto-graded questions only
    const totalScore = await ScoringService.calculateAttemptScore(attemptId);
    await attempt.update({ total_score: totalScore });

    console.log(`[submitAttempt] Auto-graded score: ${totalScore}`);

    // Get all answers to check for Writing/Speaking that need AI grading
    const answers = await AttemptAnswer.findAll({
      where: { attempt_id: attemptId },
      include: [
        {
          model: Question,
          as: 'question',
          include: [
            {
              model: QuestionType,
              as: 'questionType',
              attributes: ['id', 'code', 'scoring_method'],
            },
          ],
        },
      ],
    });

    // Find answers that need AI scoring
    const aiAnswersToScore = [];
    const speakingAnswersNeedTranscription = [];
    
    for (const answer of answers) {
      const questionType = answer.question.questionType;
      
      // Skip if already scored
      if (answer.score !== null && answer.score !== undefined) {
        continue;
      }

      // Check if requires AI scoring
      if (questionType.scoring_method === SCORING_METHODS.AI) {
        const questionCode = questionType.code.toLowerCase();

        if (questionCode.includes('writing')) {
          if ((answer.text_answer && answer.text_answer.trim()) || (answer.answer_json && answer.answer_json.trim())) {
            aiAnswersToScore.push({
              answerId: answer.id,
              type: 'writing',
              content: answer.text_answer || answer.answer_json
            });
          }
        } else if (questionCode.includes('speaking')) {
          if (answer.audio_url) {
            // If transcribed_text is not available, queue for transcription
            // AI scoring will be triggered automatically AFTER transcription completes
            if (!answer.transcribed_text) {
              speakingAnswersNeedTranscription.push({
                answerId: answer.id,
                audioUrl: answer.audio_url
              });
              console.log(`[submitAttempt] Speaking answer ${answer.id} queued for transcription (will auto-score after)`);
            } else {
              // Only score speaking if already transcribed
              aiAnswersToScore.push({
                answerId: answer.id,
                type: 'speaking',
                audioUrl: answer.audio_url
              });
              console.log(`[submitAttempt] Speaking answer ${answer.id} already transcribed, will score now`);
            }
          }
        }
      }
    }

    const hasAiScoring = aiAnswersToScore.length > 0;
    const hasSpeakingTranscription = speakingAnswersNeedTranscription.length > 0;
    console.log(`[submitAttempt] Found ${aiAnswersToScore.length} answers needing AI scoring`);
    console.log(`[submitAttempt] Found ${speakingAnswersNeedTranscription.length} speaking answers needing transcription`);

    // ⏳ IMPORTANT: If AI scoring OR transcription is needed, use async approach
    if (hasAiScoring || hasSpeakingTranscription) {
      console.log(`[submitAttempt] ⚠️  Background processing needed - will handle asynchronously`);

      // Queue AI scoring in the background (don't await!)
      // Using setImmediate to prevent blocking the response
      setImmediate(async () => {
        try {
          console.log(`[submitAttempt-Background] Starting async processing for attempt ${attemptId}`);
          const backgroundStartTime = Date.now();

          // Step 1: Queue speaking answers for transcription
          // They will be automatically scored AFTER transcription completes
          if (speakingAnswersNeedTranscription.length > 0) {
            console.log(`[submitAttempt-Background] Adding ${speakingAnswersNeedTranscription.length} speaking answers to transcription queue...`);
            console.log(`[submitAttempt-Background] ⚠️ These will be scored automatically after transcription completes`);
            for (const speechAnswer of speakingAnswersNeedTranscription) {
              addSpeechJob({
                answerId: speechAnswer.answerId,
                audioUrl: speechAnswer.audioUrl,
                language: 'en'  // Default to English - could be made configurable based on exam language
              });
            }
            // NO WAIT - transcription queue will handle scoring automatically
          }
          

          // Step 2: Score writing answers and already-transcribed speaking answers
          // Speaking answers queued for transcription will be scored automatically after transcription
          let successCount = 0;
          let errorCount = 0;

          console.log(`[submitAttempt-Background] Scoring ${aiAnswersToScore.length} answers immediately (writing + already-transcribed speaking)`);

          for (const answerItem of aiAnswersToScore) {
            try {
              const itemStartTime = Date.now();
              
              if (answerItem.type === 'writing') {
                console.log(`[submitAttempt-Background] Scoring Writing answer ${answerItem.answerId} comprehensively...`);
                await AiScoringService.scoreAnswerComprehensively(answerItem.answerId, false);
                const itemDuration = Date.now() - itemStartTime;
                console.log(`[submitAttempt-Background] ✅ Writing answer ${answerItem.answerId} scored comprehensively in ${itemDuration}ms`);
                successCount++;
              } else if (answerItem.type === 'speaking') {
                console.log(`[submitAttempt-Background] Scoring Speaking answer ${answerItem.answerId} comprehensively...`);
                await AiScoringService.scoreAnswerComprehensively(answerItem.answerId, true);
                const itemDuration = Date.now() - itemStartTime;
                console.log(`[submitAttempt-Background] ✅ Speaking answer ${answerItem.answerId} scored comprehensively in ${itemDuration}ms`);
                successCount++;
              }
            } catch (error) {
              errorCount++;
              console.error(`[submitAttempt-Background] ❌ Failed to score answer ${answerItem.answerId}:`, error.message);
              console.error(`[submitAttempt-Background] Error stack:`, error.stack);
              // Continue with other answers even if one fails
            }
          }

          // Recalculate final score
          const finalScore = await ScoringService.calculateAttemptScore(attemptId);
          await attempt.update({ total_score: finalScore });

          const backgroundDuration = Date.now() - backgroundStartTime;
          console.log(`[submitAttempt-Background] ✅ Async processing completed for attempt ${attemptId}`);
          console.log(`[submitAttempt-Background]    - Queued for transcription: ${speakingAnswersNeedTranscription.length} speaking answers`);
          console.log(`[submitAttempt-Background]    - Scored immediately: ${successCount}/${aiAnswersToScore.length} answers (writing + already-transcribed speaking)`);
          console.log(`[submitAttempt-Background]    - Errors: ${errorCount}`);
          console.log(`[submitAttempt-Background]    - Note: Speaking answers will be scored automatically after transcription completes`);
          console.log(`[submitAttempt-Background]    - Total time: ${backgroundDuration}ms`);

        } catch (error) {
          console.error(`[submitAttempt-Background] ❌ Background processing failed:`, error);
        }
      });

      // Return 202 Accepted immediately (DON'T WAIT FOR AI SCORING/TRANSCRIPTION)
      const submitDuration = Date.now() - submitStartTime;
      console.log(`[submitAttempt] ✅ Returning 202 Accepted after ${submitDuration}ms (background processing active)`);

      return res.status(202).json({
        success: true,
        data: {
          attemptId: attempt.id,
          status: attempt.status,
          total_score: totalScore,
          message: '✅ Bài thi đã được nộp thành công!',
          aiScoringInfo: {
            status: 'scoring_in_progress',
            answers_to_score: aiAnswersToScore.length,
            speaking_to_transcribe: speakingAnswersNeedTranscription.length,
            estimated_time: `${(aiAnswersToScore.length * 30) + (speakingAnswersNeedTranscription.length * 45)}s`,
            check_status_url: `/student/attempts/${attemptId}/status`,
            note: 'Điểm Writing và Speaking sẽ được cập nhật trong vài phút. Vui lòng kiểm tra lại kết quả sau ít phút.'
          }
        },
      });
    }

    // No AI scoring needed - return immediately with final score
    const submitDuration = Date.now() - submitStartTime;
    console.log(`[submitAttempt] ✅ Attempt ${attemptId} submitted in ${submitDuration}ms (no AI scoring needed)`);

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt.id,
        status: attempt.status,
        total_score: totalScore,
        message: '✅ Bài thi đã được nộp thành công. Điểm đã được tính toán.',
      },
    });

  } catch (error) {
    const submitDuration = Date.now() - submitStartTime;
    console.error(`[submitAttempt] ❌ Error after ${submitDuration}ms:`, error.message);
    next(error);
  }
};

/**
 * Get attempt status and scoring progress
 * Used to check if AI scoring is complete
 */
exports.getAttemptStatus = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.user.userId;

    const attempt = await ExamAttempt.findOne({
      where: { id: attemptId, student_id: studentId },
      include: [
        {
          model: AttemptAnswer,
          as: 'answers',
          attributes: ['id', 'question_id', 'answer_type', 'score', 'ai_graded_at'],
          include: [
            {
              model: Question,
              as: 'question',
              attributes: ['id', 'question_type_id'],
              include: [
                {
                  model: QuestionType,
                  as: 'questionType',
                  attributes: ['id', 'code', 'scoring_method'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!attempt) {
      throw new NotFoundError('Attempt not found');
    }

    // Calculate scoring progress
    const answers = attempt.answers || [];
    const aiAnswers = answers.filter(
      a => a.question?.questionType?.scoring_method === SCORING_METHODS.AI
    );
    
    const scoredAiAnswers = aiAnswers.filter(a => a.score !== null && a.score !== undefined);
    const pendingAiAnswers = aiAnswers.filter(a => a.score === null || a.score === undefined);

    const scoringProgress = {
      total_ai_answers: aiAnswers.length,
      scored_ai_answers: scoredAiAnswers.length,
      pending_ai_answers: pendingAiAnswers.length,
      progress_percentage: aiAnswers.length > 0 
        ? Math.round((scoredAiAnswers.length / aiAnswers.length) * 100)
        : 100,
      is_complete: pendingAiAnswers.length === 0,
    };

    res.json({
      success: true,
      data: {
        attemptId: attempt.id,
        status: attempt.status,
        total_score: attempt.total_score,
        scoring_status: attempt.status === 'submitted' 
          ? (scoringProgress.is_complete ? 'complete' : 'in_progress')
          : 'not_submitted',
        scoring_progress: scoringProgress,
        last_updated: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get questions for attempt (progressive loading)
 * Query params: section_id, offset, limit
 */
exports.getAttemptQuestions = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { section_id, offset = 0, limit = 999 } = req.query;
    const studentId = req.user.userId;

    console.log('[getAttemptQuestions] Request:', { attemptId, section_id, offset, limit });

    // Verify attempt belongs to student
    const attempt = await ExamAttempt.findOne({
      where: { id: attemptId, student_id: studentId },
    });

    if (!attempt) {
      throw new NotFoundError('Attempt not found');
    }

    // Build where clause for filtering
    const where = { attempt_id: attemptId };
    
    // If section_id provided, filter questions by section
    if (section_id) {
      const attemptSection = await AttemptSection.findOne({
        where: { 
          attempt_id: attemptId,
          exam_section_id: section_id 
        },
        include: [{
          model: ExamSection,
          as: 'examSection',
          include: [{
            model: ExamSectionQuestion,
            as: 'questions',
            attributes: ['question_id']
          }]
        }]
      });

      if (attemptSection && attemptSection.examSection) {
        const questionIds = attemptSection.examSection.questions.map(q => q.question_id);
        where.question_id = questionIds;
      }
    }

    // Get answers with questions (optimized query)
    const answers = await AttemptAnswer.findAll({
      where,
      include: [
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'question_type_id', 'aptis_type_id', 'difficulty', 'content', 'media_url', 'additional_media', 'parent_question_id', 'duration_seconds', 'status'],
          include: [
            { 
              model: QuestionItem, 
              as: 'items',
              separate: true, // Prevent cartesian product
              order: [['item_order', 'ASC']]
            },
            { 
              model: QuestionOption, 
              as: 'options',
              separate: true, // Prevent cartesian product
              order: [['option_order', 'ASC']]
            },
            { 
              model: QuestionType, 
              as: 'questionType',
              attributes: ['id', 'code', 'question_type_name', 'scoring_method', 'skill_type_id']
            },
          ],
        },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['id', 'ASC']],
    });

    // Get total count
    const totalCount = await AttemptAnswer.count({ where });

    console.log('[getAttemptQuestions] Loaded', answers.length, 'questions, total:', totalCount);

    // Format answers with answer_data for frontend consumption
    const formattedAnswers = answers.map(answer => {
      const answerJson = answer.toJSON();
      
      // Log media_url for debugging
      if (answerJson.question?.media_url) {
        console.log('[getAttemptQuestions] Q' + answerJson.question.id + ' has media_url:', answerJson.question.media_url);
      }
      
      // Create answer_data structure based on answer_type
      let answer_data = null;
      
      if (answer.answer_type === 'option' && answer.selected_option_id) {
        answer_data = { selected_option_id: answer.selected_option_id };
      } else if (answer.answer_type === 'json' && answer.answer_json) {
        try {
          answer_data = JSON.parse(answer.answer_json);
        } catch (e) {
          answer_data = answer.answer_json;
        }
      } else if (answer.answer_type === 'text' && answer.text_answer) {
        answer_data = { text_answer: answer.text_answer };
      } else if (answer.answer_type === 'audio' && answer.audio_url) {
        // For audio answers, just mark as completed - don't need to load audio file
        answer_data = { 
          audio_url: answer.audio_url,
          completed: true,
          transcribed_text: answer.transcribed_text || null
        };
      }
      
      return {
        ...answerJson,
        answer_data
      };
    });

    res.json({
      success: true,
      data: {
        answers: formattedAnswers,
        pagination: {
          offset: parseInt(offset),
          limit: parseInt(limit),
          total: totalCount,
          hasMore: parseInt(offset) + answers.length < totalCount,
        },
      },
    });
  } catch (error) {
    console.error('[getAttemptQuestions] Error:', error);
    next(error);
  }
};
