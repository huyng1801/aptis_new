const {
  Question,
  QuestionType,
  SkillType,
  AptisType,
  QuestionItem,
  QuestionOption,
  ExamSectionQuestion,
} = require('../../models');
const { paginate, paginationResponse } = require('../../utils/helpers');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const { DIFFICULTY_LEVELS, QUESTION_STATUS } = require('../../utils/constants');
const { Op } = require('sequelize');
const StorageService = require('../../services/StorageService');

/**
 * Create items and options from parsed JSON content based on question type
 */
async function createItemsAndOptionsFromContent(questionId, questionTypeCode, parsedContent) {
  switch (questionTypeCode) {
    // Reading question types
    case 'READING_GAP_FILL':
      await createGapFillingItemsAndOptions(questionId, parsedContent);
      break;
    case 'READING_ORDERING':
      await createOrderingItems(questionId, parsedContent);
      break;
    case 'READING_MATCHING':
      await createMatchingItemsAndOptions(questionId, parsedContent);
      break;
    case 'READING_MATCHING_HEADINGS':
      await createMatchingHeadingsItemsAndOptions(questionId, parsedContent);
      break;
    case 'READING_SHORT_TEXT':
      await createShortTextMatchingItemsAndOptions(questionId, parsedContent);
      break;
    
    // Listening question types
    case 'LISTENING_MCQ':
      await createListeningMCQItemsAndOptions(questionId, parsedContent);
      break;
    case 'LISTENING_MATCHING':
      await createListeningMatchingItemsAndOptions(questionId, parsedContent);
      break;
    case 'LISTENING_STATEMENT_MATCHING':
      await createListeningStatementMatchingItemsAndOptions(questionId, parsedContent);
      break;
    
    default:
      console.log(`No auto-generation logic for question type: ${questionTypeCode}`);
      break;
  }
}

/**
 * Gap Filling: Create options and items with correct answers
 */
async function createGapFillingItemsAndOptions(questionId, data) {
  const { options = [], correctAnswers = [] } = data;
  
  // Create options
  for (let i = 0; i < options.length; i++) {
    await QuestionOption.create({
      question_id: questionId,
      item_id: null,
      option_text: options[i],
      option_order: i + 1,
      is_correct: false,
    });
  }
  
  // Create gap items with correct answers
  for (let i = 0; i < correctAnswers.length; i++) {
    await QuestionItem.create({
      question_id: questionId,
      item_text: `[GAP${i + 1}]`,
      item_number: i + 1,
      item_order: i + 1,
      answer_text: correctAnswers[i],
    });
  }
}

/**
 * Ordering: Create items with correct order
 */
async function createOrderingItems(questionId, data) {
  const { sentences = [], correctOrder = [] } = data;
  
  // Shuffle sentences for random display order
  const shuffled = sentences
    .map((s, idx) => ({ text: s, originalIdx: idx + 1 }))
    .sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < shuffled.length; i++) {
    const correctPosition = correctOrder[shuffled[i].originalIdx - 1];
    
    await QuestionItem.create({
      question_id: questionId,
      item_text: `${shuffled[i].originalIdx}. ${shuffled[i].text}`,
      item_order: i + 1, // Display order (random)
      answer_text: `${correctPosition}`, // Correct position
    });
  }
}

/**
 * Matching: Create options and items for person-question matching
 */
async function createMatchingItemsAndOptions(questionId, data) {
  const { questions = [], persons = [] } = data;
  
  // Create person options
  const optionMap = {};
  for (let i = 0; i < persons.length; i++) {
    const person = persons[i];
    const option = await QuestionOption.create({
      question_id: questionId,
      item_id: null,
      option_text: person.name || `Person ${String.fromCharCode(65 + i)}`,
      option_order: i + 1,
      is_correct: false,
    });
    optionMap[person.name || `Person ${String.fromCharCode(65 + i)}`] = option.id;
  }
  
  // Create question items
  for (let i = 0; i < questions.length; i++) {
    const questionItem = questions[i];
    await QuestionItem.create({
      question_id: questionId,
      item_text: questionItem.text,
      item_order: i + 1,
      answer_text: questionItem.correct,
      correct_option_id: optionMap[questionItem.correct],
    });
  }
}

/**
 * Matching Headings: Create heading options and paragraph items
 */
async function createMatchingHeadingsItemsAndOptions(questionId, data) {
  const { headingOptions = [], passages = [] } = data;
  
  // Create heading options
  const headingOptionMap = {};
  for (let i = 0; i < headingOptions.length; i++) {
    const option = await QuestionOption.create({
      question_id: questionId,
      item_id: null,
      option_text: headingOptions[i],
      option_order: i + 1,
      is_correct: false,
    });
    headingOptionMap[headingOptions[i]] = option.id;
  }
  
  // Create paragraph items
  for (let i = 0; i < passages.length; i++) {
    const passage = passages[i];
    await QuestionItem.create({
      question_id: questionId,
      item_text: `Paragraph ${i + 1}`,
      item_order: i + 1,
      answer_text: passage.heading,
      correct_option_id: headingOptionMap[passage.heading],
    });
  }
}

/**
 * Short Text Matching: Create description options and text items
 */
async function createShortTextMatchingItemsAndOptions(questionId, data) {
  const { descriptions = [], short_texts = [], correct_matches = {} } = data;
  
  // Create description options
  const descriptionOptionMap = {};
  for (let i = 0; i < descriptions.length; i++) {
    const desc = descriptions[i];
    const option = await QuestionOption.create({
      question_id: questionId,
      item_id: null,
      option_text: desc.description,
      option_order: i + 1,
      is_correct: false,
    });
    descriptionOptionMap[desc.letter] = option.id;
  }
  
  // Create short text items
  for (let i = 0; i < short_texts.length; i++) {
    const text = short_texts[i];
    const correctLetter = correct_matches[text.id] || correct_matches[i + 1];
    
    await QuestionItem.create({
      question_id: questionId,
      item_text: text.text,
      item_order: i + 1,
      answer_text: correctLetter,
      correct_option_id: descriptionOptionMap[correctLetter],
    });
  }
}

/**
 * Listening MCQ: Create questions and options (can be single or multiple choice)
 */
async function createListeningMCQItemsAndOptions(questionId, data) {
  const { questions = [], isMultiple = false } = data;
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    
    // Create question item
    const item = await QuestionItem.create({
      question_id: questionId,
      item_text: question.question,
      item_order: i + 1,
      answer_text: null,
      correct_option_id: null,
    });
    
    // Create options for this question
    for (let j = 0; j < question.options.length; j++) {
      const option = question.options[j];
      const isCorrect = isMultiple ? option.correct : (j === question.correctAnswer);
      
      await QuestionOption.create({
        question_id: questionId,
        item_id: item.id,
        option_text: option.text,
        option_order: j + 1,
        is_correct: isCorrect,
      });
    }
  }
}

/**
 * Listening Matching: Create speaker-statement pairs 
 */
async function createListeningMatchingItemsAndOptions(questionId, data) {
  const { speakers = [], statements = [] } = data;
  
  // Create speaker options
  const speakerOptionMap = {};
  for (let i = 0; i < speakers.length; i++) {
    const speaker = speakers[i];
    const option = await QuestionOption.create({
      question_id: questionId,
      item_id: null,
      option_text: speaker,
      option_order: i + 1,
      is_correct: false,
    });
    speakerOptionMap[speaker] = option.id;
  }
  
  // Create statement items
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const correctSpeaker = statement.speaker;
    
    await QuestionItem.create({
      question_id: questionId,
      item_text: statement.text,
      item_order: i + 1,
      answer_text: correctSpeaker,
      correct_option_id: speakerOptionMap[correctSpeaker],
    });
  }
}

/**
 * Listening Statement Matching: Create statements with correct speakers
 */
async function createListeningStatementMatchingItemsAndOptions(questionId, data) {
  const { statements = [], correctSpeakers = [] } = data;
  
  for (let i = 0; i < statements.length; i++) {
    await QuestionItem.create({
      question_id: questionId,
      item_text: statements[i],
      item_order: i + 1,
      answer_text: correctSpeakers[i] || null,
      correct_option_id: null,
    });
  }
}

exports.createQuestion = async (req, res, next) => {
  try {
    const {
      question_type_id,
      aptis_type_id,
      difficulty,
      content,
      media_url,
      duration_seconds,
      parent_question_id,
      additional_media,
      items,
      options,
      sample_answer,
    } = req.body;

    const teacherId = req.user.userId;

    const question = await Question.create({
      question_type_id,
      aptis_type_id,
      difficulty,
      content,
      media_url: media_url || null,
      duration_seconds: duration_seconds || null,
      parent_question_id: parent_question_id || null,
      additional_media: additional_media || null,
      created_by: teacherId,
      status: 'draft',
    });

    // Parse JSON content to create items and options for Reading questions
    let parsedContent = null;
    if (content && typeof content === 'string') {
      try {
        parsedContent = JSON.parse(content);
      } catch (error) {
        console.warn('Content is not valid JSON, treating as plain text');
      }
    }

    // Auto-generate items and options based on question type and content
    if (parsedContent) {
      const questionType = await QuestionType.findByPk(question_type_id);
      await createItemsAndOptionsFromContent(question.id, questionType?.code, parsedContent);
    }

    // Create manual items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        await QuestionItem.create({
          question_id: question.id,
          item_text: item.item_text,
          item_order: item.item_order,
          answer_text: item.answer_text || null,
          correct_option_id: item.correct_option_id || null,
        });
      }
    }

    // Create manual options if provided
    if (options && options.length > 0) {
      for (const option of options) {
        await QuestionOption.create({
          question_id: question.id,
          item_id: option.item_id || null,
          option_text: option.option_text,
          option_order: option.option_order || null,
          is_correct: option.is_correct || false,
        });
      }
    }

    const fullQuestion = await Question.findByPk(question.id, {
      include: [
        { model: QuestionType, as: 'questionType' },
        { model: AptisType, as: 'aptisType' },
        { model: QuestionItem, as: 'items' },
        { model: QuestionOption, as: 'options' },
      ],
    });

    res.status(201).json({
      success: true,
      data: fullQuestion,
      questionId: question.id, // Trả về question ID
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadQuestionImages = async (req, res, next) => {
  try {
    console.log('📸 Upload images endpoint called');
    console.log('Question ID:', req.params.questionId);
    console.log('Files received:', req.files ? req.files.length : 0);
    
    const { questionId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      console.error('❌ No files in request');
      throw new BadRequestError('No images provided');
    }

    // Find question
    const question = await Question.findByPk(questionId);
    if (!question) {
      console.error('❌ Question not found:', questionId);
      throw new NotFoundError('Question not found');
    }

    console.log('📁 Files to process:', files.map(f => ({ 
      filename: f.filename, 
      size: f.size,
      mimetype: f.mimetype 
    })));

    // Build additional_media array
    const additionalMedia = files.map((file, index) => ({
      type: 'image',
      description: files.length > 1 ? `Image ${String.fromCharCode(65 + index)}` : 'Main image',
      url: `/uploads/questions/${file.filename}`,
    }));

    // Update question with additional_media
    await question.update({
      additional_media: JSON.stringify(additionalMedia),
    });

    console.log('✅ Images uploaded and saved:', additionalMedia);

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        questionId: question.id,
        additional_media: additionalMedia,
      },
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    next(error);
  }
};

exports.uploadQuestionAudios = async (req, res, next) => {
  try {
    console.log('🎧 Upload audios endpoint called');
    console.log('Question ID:', req.params.questionId);
    console.log('Files received:', req.files);
    
    const { questionId } = req.params;
    const { mainAudio, speakerAudios } = req.files || {};

    if (!mainAudio && !speakerAudios) {
      console.error('❌ No audio files in request');
      throw new BadRequestError('No audio files provided');
    }

    // Find question
    const question = await Question.findByPk(questionId);
    if (!question) {
      console.error('❌ Question not found:', questionId);
      throw new NotFoundError('Question not found');
    }

    const audioData = {};
    
    // Process main audio
    if (mainAudio && mainAudio[0]) {
      audioData.mainAudioUrl = `/uploads/audio/${mainAudio[0].filename}`;
      console.log('📁 Main audio processed:', audioData.mainAudioUrl);
    }
    
    // Process speaker audios
    if (speakerAudios && speakerAudios.length > 0) {
      audioData.speakerAudioUrls = speakerAudios.map(file => 
        `/uploads/audio/${file.filename}`
      );
      console.log('📁 Speaker audios processed:', audioData.speakerAudioUrls);
    }

    // Update question content with audio URLs
    let updatedContent = {};
    try {
      if (question.content) {
        updatedContent = JSON.parse(question.content);
      }
    } catch (error) {
      console.warn('Question content is not valid JSON, creating new structure');
    }

    // Update URLs in content
    if (audioData.mainAudioUrl) {
      updatedContent.audioUrl = audioData.mainAudioUrl;
      // Also update media_url for main audio
      await question.update({ media_url: audioData.mainAudioUrl });
    }
    
    if (audioData.speakerAudioUrls) {
      // Update speakers with their audio URLs
      if (updatedContent.speakers && Array.isArray(updatedContent.speakers)) {
        updatedContent.speakers = updatedContent.speakers.map((speaker, index) => ({
          ...speaker,
          audioUrl: audioData.speakerAudioUrls[index] || speaker.audioUrl
        }));
      }
    }

    // Update question with new content containing audio URLs
    await question.update({
      content: JSON.stringify(updatedContent)
    });

    console.log('✅ Audios uploaded and question updated:', audioData);

    res.status(200).json({
      success: true,
      message: 'Audio files uploaded successfully',
      data: {
        questionId: question.id,
        audioData: audioData,
      },
    });
  } catch (error) {
    console.error('❌ Audio upload error:', error);
    next(error);
  }
};

exports.getQuestions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      question_type,
      aptis_type,
      skill,
      difficulty,
      status,
      search,
    } = req.query;
    const { offset, limit: validLimit } = paginate(page, limit);


    const where = {};

    if (question_type) {
      where.question_type_id = question_type;
    }
    if (aptis_type) {
      where.aptis_type_id = aptis_type;
    }
    if (difficulty) {
      where.difficulty = difficulty;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.content = { [Op.like]: `%${search}%` };
    }

    const include = [
      { 
        model: QuestionType, 
        as: 'questionType', 
        attributes: ['id', 'question_type_name', 'code'],
        include: [
          {
            model: SkillType,
            as: 'skillType',
            attributes: ['id', 'skill_type_name', 'code']
          }
        ]
      },
      { model: AptisType, as: 'aptisType', attributes: ['id', 'aptis_type_name', 'code'] },
    ];

    let finalWhere = where;
    if (skill) {
      include[0].where = { skill_type_id: skill };
      include[0].required = true; // INNER JOIN to enforce the filter
    }


    const { count, rows } = await Question.findAndCountAll({
      where: finalWhere,
      include,
      offset,
      limit: validLimit,
      order: [['created_at', 'DESC']],
      raw: false,
      distinct: true, // Important for counting with joins
    });

    const transformedRows = await Promise.all(rows.map(async (question) => {
      // Get count of exams this question is used in
      const usageCount = await ExamSectionQuestion.count({
        where: { question_id: question.id }
      });

      return {
        id: question.id,
        title: question.content?.substring(0, 100) || 'Untitled Question',
        description: question.content?.substring(0, 200) || '',
        content: question.content,
        question_type: question.questionType?.question_type_name || 'Unknown',
        question_type_id: question.question_type_id,
        skill: question.questionType?.skillType?.skill_type_name || 'General',
        skill_id: question.questionType?.skillType?.id,
        difficulty: question.difficulty,
        aptis_type: question.aptisType?.aptis_type_name || 'Unknown',
        aptis_type_id: question.aptis_type_id,
        media_url: question.media_url,
        duration_seconds: question.duration_seconds,
        status: question.status,
        usage_count: usageCount,
        is_used_in_exam: usageCount > 0,
        created_at: question.created_at,
        updated_at: question.updated_at,
      };
    }));

    res.json({
      success: true,
      data: transformedRows,
      page: parseInt(page),
      limit: validLimit,
      total: count,
      totalPages: Math.ceil(count / validLimit),
    });
  } catch (error) {
    next(error);
  }
};

exports.getQuestionDetails = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findByPk(questionId, {
      include: [
        { model: QuestionType, as: 'questionType' },
        { model: AptisType, as: 'aptisType' },
        { model: QuestionItem, as: 'items' },
        { model: QuestionOption, as: 'options' },
      ],
    });

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const updateData = req.body;

    const question = await Question.findByPk(questionId);

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    const usage = await ExamSectionQuestion.count({
      where: { question_id: questionId },
    });

    if (usage > 0 && question.status === 'active') {
      throw new BadRequestError('Cannot update question that is used in active exams');
    }

    await question.update(updateData);

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

// Update only media URL for a question
exports.updateQuestionMediaUrl = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { media_url } = req.body;

    const question = await Question.findByPk(questionId);

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    await question.update({ media_url });

    res.json({
      success: true,
      data: { id: question.id, media_url: question.media_url },
      message: 'Media URL updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findByPk(questionId);

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    const usage = await ExamSectionQuestion.count({
      where: { question_id: questionId },
    });

    if (usage > 0) {
      throw new BadRequestError('Cannot delete question that is used in exams');
    }

    if (question.media_url) {
      await StorageService.deleteFile(question.media_url);
    }

    await question.destroy();

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getQuestionUsage = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const { ExamSection, Exam } = require('../../models');
    const usage = await ExamSectionQuestion.findAll({
      where: { question_id: questionId },
      include: [
        {
          model: ExamSection,
          as: 'examSection',
          include: [
            {
              model: Exam,
              as: 'exam',
              attributes: ['id', 'title', 'status'],
            },
          ],
        },
      ],
    });

    res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFilterOptions = async (req, res, next) => {
  try {
    const questionTypes = await QuestionType.findAll({
      attributes: ['id', 'question_type_name', 'code'],
      order: [['question_type_name', 'ASC']],
    });

    const aptisTypes = await AptisType.findAll({
      attributes: ['id', 'aptis_type_name', 'code'],
      order: [['aptis_type_name', 'ASC']],
    });

    const skillTypes = await SkillType.findAll({
      attributes: ['id', 'skill_type_name', 'code'],
      order: [['display_order', 'ASC']],
    });

    const difficulties = [
      { value: DIFFICULTY_LEVELS.EASY, label: 'Dễ' },
      { value: DIFFICULTY_LEVELS.MEDIUM, label: 'Trung bình' },
      { value: DIFFICULTY_LEVELS.HARD, label: 'Khó' }
    ];

    const statuses = [
      { value: QUESTION_STATUS.DRAFT, label: 'Bản nháp' },
      { value: QUESTION_STATUS.ACTIVE, label: 'Hoạt động' },
      { value: QUESTION_STATUS.INACTIVE, label: 'Không hoạt động' }
    ];

    const filterOptions = {
      aptisTypes: aptisTypes.map(type => ({
        value: type.id,
        label: type.aptis_type_name
      })),
      questionTypes: questionTypes.map(type => ({
        value: type.id,
        label: type.question_type_name
      })),
      skills: skillTypes.map(skill => ({
        value: skill.id,
        label: skill.skill_type_name
      })),
      difficulties,
      statuses
    };

    res.json({
      success: true,
      data: filterOptions,
    });
  } catch (error) {
    next(error);
  }
};
