/**
 * APTIS Speaking Scoring Prompt Builder
 * Builds comprehensive scoring prompts for APTIS Speaking tasks based on official rubrics
 */

class SpeakingScoringPromptBuilder {
  /**
   * Build comprehensive speaking scoring prompt based on question type
   * @param {string} answerText - Transcribed text from student's speech
   * @param {Object} question - Question object with content and metadata
   * @param {Array} criteria - Scoring criteria
   * @param {number} maxScore - Maximum score for this question
   * @returns {string} Comprehensive scoring prompt
   */
  static buildSpeakingPrompt(answerText, question, criteria, maxScore) {
    const questionTypeCode = question.questionType?.code || '';
    
    // Detect which speaking part based on question type code
    // Part 1: Personal Introduction (A0-B1+, 0-5 scale)
    if (questionTypeCode.includes('SPEAKING_INTRO') || questionTypeCode.includes('SPEAKING_PERSONAL') || questionTypeCode.includes('PART1')) {
      return this.buildPart1Prompt(answerText, question, criteria, maxScore);
    } 
    // Part 2: Describe & Opinion (Below A2-B2+, 0-5 scale)
    else if (questionTypeCode.includes('SPEAKING_DESCRIPTION') || questionTypeCode.includes('SPEAKING_DESCRIBE') || questionTypeCode.includes('PART2')) {
      return this.buildPart2Prompt(answerText, question, criteria, maxScore);
    } 
    // Part 3: Compare & Reasons (Below A2-B2+, 0-5 scale)
    else if (questionTypeCode.includes('SPEAKING_COMPARISON') || questionTypeCode.includes('SPEAKING_COMPARE') || questionTypeCode.includes('PART3')) {
      return this.buildPart3Prompt(answerText, question, criteria, maxScore);
    } 
    // Part 4: Abstract Discussion (A1/A2-C2, 0-6 scale)
    else if (questionTypeCode.includes('SPEAKING_DISCUSSION') || questionTypeCode.includes('SPEAKING_DISCUSS') || questionTypeCode.includes('PART4')) {
      return this.buildPart4Prompt(answerText, question, criteria, maxScore);
    }
    
    // Fallback: generic speaking prompt
    return this.buildGenericSpeakingPrompt(answerText, question, criteria, maxScore);
  }

  /**
   * APTIS Speaking Part 1: Personal Information (A0-B1+, 0-5 scale)
   */
  static buildPart1Prompt(answerText, question, criteria, maxScore) {
    return `You are an official APTIS Speaking assessor scoring Part 1 - Personal Information.

OFFICIAL APTIS RUBRIC FOR PART 1:
Maximum Score: ${maxScore} points (CEFR-based conversion)

CEFR SCALE (0-5 internal rubric, will be converted to ${maxScore} points):
5 = B1 or above: Likely to be above A2 level
4 = A2.2: All three questions answered on-topic with:
  • Some simple grammatical structures used correctly, basic mistakes systematically occur
  • Vocabulary sufficient to respond, inappropriate lexical choices noticeable
  • Mispronunciations noticeable and frequently strain listener
  • Frequent pausing, false starts, reformulations but meaning clear

3 = A2.1: Two questions answered on-topic with same features as A2.2

2 = A1.2: At least two questions on-topic with:
  • Grammatical structure limited to words and phrases
  • Errors in basic patterns impede understanding
  • Vocabulary limited to very basic personal information words
  • Pronunciation mostly unintelligible except isolated words
  • Frequent pausing, false starts impede understanding

1 = A1.1: One question on-topic with same features as A1.2

0 = A0: No meaningful language or completely off-topic (memorised script, guessing)

ASSESSMENT AREAS:
- Task fulfilment / topic relevance
- Grammatical range and accuracy
- Vocabulary range and accuracy
- Pronunciation
- Fluency

QUESTION: ${question.content}

STUDENT'S TRANSCRIBED SPEECH: ${answerText}

SCORING INSTRUCTIONS:
- First, assess the CEFR level (A0, A1.1, A1.2, A2.1, A2.2, or B1+) based on APTIS rubric above
- Then, convert CEFR to numerical score using this mapping for ${maxScore} max points:
  * A0 = 0 points
  * A1.1 = ${(maxScore * 0.2).toFixed(2)} points (20% of max)
  * A1.2 = ${(maxScore * 0.4).toFixed(2)} points (40% of max)
  * A2.1 = ${(maxScore * 0.6).toFixed(2)} points (60% of max)
  * A2.2 = ${(maxScore * 0.8).toFixed(2)} points (80% of max)
  * B1+ = ${maxScore} points (100% of max)
- Consider: How many questions answered on-topic? Quality of grammar, vocabulary, pronunciation, fluency
- Be strict: A2.2 requires ALL THREE questions answered well

Return assessment in JSON format:
{
  "score": [calculated numerical score based on CEFR mapping above],
  "cefr_level": "[A0, A1.1, A1.2, A2.1, A2.2, or B1+ - must match rubric exactly]",
  "comment": "[Assessment covering task completion, grammar, vocabulary, pronunciation, fluency]",
  "suggestions": "[Specific improvement tips for pronunciation, grammar, vocabulary, fluency]"
}`;
  }

  /**
   * APTIS Speaking Part 2: Describe, Express Opinion (A0-B2+, 0-5 scale)
   */
  static buildPart2Prompt(answerText, question, criteria, maxScore) {
    // Extract visual context if available
    let visualContext = this.extractVisualContext(question);
    
    return `You are an official APTIS Speaking assessor scoring Part 2 - Describe, Express Opinion and Provide Reasons.

OFFICIAL APTIS RUBRIC FOR PART 2:
Maximum Score: ${maxScore} points (CEFR-based conversion)

CEFR SCALE (0-5 internal rubric, will be converted to ${maxScore} points):
5 = B2 or above: Likely to be above B1 level

4 = B1.2: All three questions answered on-topic with:
  • Control of simple grammatical structures, errors when attempting complex structures
  • Sufficient vocabulary range and control, errors when expressing complex thoughts
  • Pronunciation intelligible, inappropriate mispronunciations occasionally strain listener
  • Some pausing, false starts, reformulations
  • Uses simple cohesive devices, links between ideas not always clear

3 = B1.1: Two questions answered on-topic with same features as B1.2

2 = A2.2: At least two questions on-topic with:
  • Uses some simple grammatical structures correctly, systematically makes basic mistakes
  • Vocabulary limited to concrete topics and descriptions, inappropriate lexical choices noticeable
  • Mispronunciations noticeable and strain listener
  • Noticeable pausing, false starts, reformulations
  • Cohesion limited, responses tend to be list of points

1 = A2.1: One question on-topic with same features as A2.2

0 = Below A2: Performance below A2, no meaningful language, or completely off-topic

ASSESSMENT AREAS:
- Task fulfilment / topic relevance
- Grammatical range and accuracy
- Vocabulary range and accuracy
- Pronunciation
- Fluency
- Cohesion

QUESTION: ${question.content}${visualContext}

STUDENT'S TRANSCRIBED SPEECH: ${answerText}

IMPORTANT ASSESSMENT NOTES:
- Part 2 requires describing a photograph and answering TWO related questions
- Questions increase in complexity: description → opinion
- Expected to talk 45 seconds per question
- Student must describe the photo AND answer both follow-up questions

SCORING INSTRUCTIONS:
- First, assess the CEFR level (Below A2, A2.1, A2.2, B1.1, B1.2, or B2+) based on APTIS rubric
- Then, convert CEFR to numerical score using this mapping for ${maxScore} max points:
  * Below A2 = 0 points
  * A2.1 = ${(maxScore * 0.2).toFixed(2)} points (20% of max)
  * A2.2 = ${(maxScore * 0.4).toFixed(2)} points (40% of max)
  * B1.1 = ${(maxScore * 0.6).toFixed(2)} points (60% of max)
  * B1.2 = ${(maxScore * 0.8).toFixed(2)} points (80% of max)
  * B2+ = ${maxScore} points (100% of max)
- Check: Did student describe the photo? Answer both follow-up questions?
- B1.2 requires ALL THREE tasks completed (describe + 2 questions)
- Assess cohesion: Are ideas connected or just listed?

Return assessment in JSON format:
{
  "score": [calculated numerical score based on CEFR mapping above],
  "cefr_level": "[Below A2, A2.1, A2.2, B1.1, B1.2, or B2+ - must match rubric exactly]",
  "comment": "[Assessment: Did they describe photo? Answer all questions? Grammar, vocabulary, pronunciation, fluency, cohesion quality]",
  "suggestions": "[Specific tips: photo description skills, opinion expression, cohesive devices, pronunciation, grammar]"
}`;
  }

  /**
   * APTIS Speaking Part 3: Compare and Provide Reasons (A0-B2+, 0-5 scale)
   */
  static buildPart3Prompt(answerText, question, criteria, maxScore) {
    let visualContext = this.extractVisualContext(question);
    
    return `You are an official APTIS Speaking assessor scoring Part 3 - Compare and Provide Reasons.

OFFICIAL APTIS RUBRIC FOR PART 3:
Maximum Score: ${maxScore} points (CEFR-based conversion)

CEFR SCALE (0-5 internal rubric, will be converted to ${maxScore} points):
5 = B2 or above: Likely to be above B1 level

4 = B1.2: All three questions answered on-topic with:
  • Control of simple grammatical structures, errors when attempting complex structures
  • Sufficient vocabulary range and control, errors when expressing complex thoughts
  • Pronunciation intelligible, inappropriate mispronunciations occasionally strain listener
  • Some pausing, false starts, reformulations
  • Uses simple cohesive devices, links between ideas not always clear

3 = B1.1: Two questions answered on-topic with same features as B1.2

2 = A2.2: At least two questions on-topic with:
  • Uses some simple grammatical structures correctly, systematically makes basic mistakes
  • Vocabulary limited to concrete topics and descriptions, inappropriate lexical choices noticeable
  • Mispronunciations noticeable and strain listener
  • Noticeable pausing, false starts, reformulations
  • Cohesion limited, responses tend to be list of points

1 = A2.1: One question on-topic with same features as A2.2

0 = Below A2: Performance below A2, no meaningful language, or completely off-topic

ASSESSMENT AREAS:
- Task fulfilment / topic relevance
- Grammatical range and accuracy
- Vocabulary range and accuracy
- Pronunciation
- Fluency
- Cohesion

QUESTION: ${question.content}${visualContext}

STUDENT'S TRANSCRIBED SPEECH: ${answerText}

IMPORTANT ASSESSMENT NOTES:
- Part 3 requires comparing TWO pictures and answering TWO related questions
- Questions increase in complexity: description → comparison → speculation
- Expected to talk 45 seconds per question
- High scores require correct grammatical structures for speculation (e.g., might, could, would)
- Must identify similarities AND differences between images

SCORING INSTRUCTIONS:
- First, assess the CEFR level (Below A2, A2.1, A2.2, B1.1, B1.2, or B2+) based on APTIS rubric
- Then, convert CEFR to numerical score using this mapping for ${maxScore} max points:
  * Below A2 = 0 points
  * A2.1 = ${(maxScore * 0.2).toFixed(2)} points (20% of max)
  * A2.2 = ${(maxScore * 0.4).toFixed(2)} points (40% of max)
  * B1.1 = ${(maxScore * 0.6).toFixed(2)} points (60% of max)
  * B1.2 = ${(maxScore * 0.8).toFixed(2)} points (80% of max)
  * B2+ = ${maxScore} points (100% of max)
- Check: Did student compare both images? Answer both follow-up questions? Use speculation grammar?
- B1.2 requires ALL THREE tasks completed (compare + 2 questions)
- Assess speculation grammar: "might", "could", "would", conditional structures

Return assessment in JSON format:
{
  "score": [calculated numerical score based on CEFR mapping above],
  "cefr_level": "[Below A2, A2.1, A2.2, B1.1, B1.2, or B2+ - must match rubric exactly]",
  "comment": "[Assessment: Did they compare images? Answer all questions? Use speculation grammar? Quality of grammar, vocabulary, pronunciation, fluency, cohesion]",
  "suggestions": "[Specific tips: comparison skills, speculation grammar (might/could/would), cohesive devices, pronunciation]"
}`;
  }

  /**
   * APTIS Speaking Part 4: Discuss Abstract Topic (A1/A2-C2, 0-6 scale)
   */
  static buildPart4Prompt(answerText, question, criteria, maxScore) {
    let visualContext = this.extractVisualContext(question);
    
    return `You are an official APTIS Speaking assessor scoring Part 4 - Discuss Personal Experience and Opinion on Abstract Topic.

OFFICIAL APTIS RUBRIC FOR PART 4:
Maximum Score: ${maxScore} points (CEFR-based conversion)

CEFR SCALE (0-6 internal rubric, will be converted to ${maxScore} points):
6 = C2: Likely to be above C1 level

5 = C1: Addresses all three questions, well-structured speech

4 = B2.2: All three questions addressed, well-structured with:
  • Range of complex grammar constructions used accurately, minor errors don't impede understanding
  • Range of vocabulary to discuss topics, some awkward usage or slightly inappropriate lexical choices
  • Pronunciation clearly intelligible
  • Backtracking and reformulations don't interrupt flow
  • Range of cohesive devices clearly indicate links between ideas

3 = B2.1: Two questions answered on-topic with:
  • Some complex grammar constructions used accurately, errors don't lead to misunderstanding
  • Sufficient vocabulary range, inappropriate choices don't lead to misunderstanding
  • Pronunciation intelligible, mispronunciations don't strain listener
  • Some pausing while searching for vocabulary but doesn't strain listener
  • Limited cohesive devices used to indicate links

2 = B1.2: At least two questions on-topic with:
  • Control of simple grammatical structures, errors when attempting complex structures
  • Vocabulary limitations make it difficult to deal fully with task
  • Pronunciation intelligible, occasional mispronunciations occasionally strain listener
  • Noticeable pausing, false starts, reformulations, repetition
  • Uses only simple cohesive devices, links not always clearly indicated

1 = B1.1: One question on-topic with same features as B1.2

0 = A1/A2: Performance below B1, no meaningful language, or completely off-topic

ASSESSMENT AREAS:
- Task fulfilment / topic relevance
- Grammatical range and accuracy
- Vocabulary range and accuracy
- Pronunciation
- Fluency
- Cohesion

QUESTION: ${question.content}${visualContext}

STUDENT'S TRANSCRIBED SPEECH: ${answerText}

CRITICAL ASSESSMENT NOTES:
- Part 4 gives 1 minute preparation, expects 2 minutes continuous speech
- Must answer ALL THREE abstract questions in one structured response
- First, assess the CEFR level (A1/A2, B1.1, B1.2, B2.1, B2.2, C1, or C2) based on APTIS rubric
- Then, convert CEFR to numerical score using this mapping for ${maxScore} max points:
  * A1/A2 = 0 points
  * B1.1 = ${(maxScore * 0.17).toFixed(2)} points (≈17% of max, 1/6 scale)
  * B1.2 = ${(maxScore * 0.33).toFixed(2)} points (≈33% of max, 2/6 scale)
  * B2.1 = ${(maxScore * 0.50).toFixed(2)} points (50% of max, 3/6 scale)
  * B2.2 = ${(maxScore * 0.67).toFixed(2)} points (≈67% of max, 4/6 scale)
  * C1 = ${(maxScore * 0.83).toFixed(2)} points (≈83% of max, 5/6 scale)
  * C2 = ${maxScore} points (100% of max, 6/6 scale)
- Did student answer ALL THREE questions? Or describe photo (wrong)?
- Is speech well-structured with clear flow? Or just listing points?
- Assess complexity: Simple grammar only → B1, Complex grammar → B2+
- Assess cohesion: Simple connectors (and, but) → B1, Range of devices (however, moreover, consequently) → B2+

Return assessment in JSON format:
{
  "score": [calculated numerical score based on CEFR mapping above], Assess complexity: Simple grammar only → B1, Complex grammar → B2+
- Assess cohesion: Simple connectors (and, but) → B1, Range of devices (however, moreover, consequently) → B2+
- DO NOT calculate numerical score - only determine CEFR level
- The system will automatically convert CEFR level to 0-${maxScore} points

Return assessment in JSON format:
{
  "cefr_level": "[A1/A2, B1.1, B1.2, B2.1, B2.2, C1, or C2 - must match rubric exactly]",
  "comment": "[Assessment: Did they answer all 3 questions? Avoid photo description? Well-structured? Grammar complexity, vocabulary range, pronunciation, fluency, cohesion quality]",
  "suggestions": "[Specific tips: structure (intro-body-conclusion), abstract thinking, complex grammar, cohesive devices, avoid photo description, stay on topic]"
}`;
  }

  /**
   * Generic speaking prompt for unknown types
   */
  static buildGenericSpeakingPrompt(answerText, question, criteria, maxScore) {
    const criteriaList = criteria.map(c => `- ${c.criteria_name}: ${c.description || c.rubric_prompt}`).join('\n');
    let visualContext = this.extractVisualContext(question);
    
    return `You are an APTIS Speaking assessor. Score this speaking response comprehensively.

SCORING CRITERIA:
${criteriaList}

QUESTION: ${question.content}${visualContext}

STUDENT'S TRANSCRIBED SPEECH: ${answerText}

ASSESSMENT AREAS (APTIS Standard):
- Task fulfilment / topic relevance
- Grammatical range and accuracy
- Vocabulary range and accuracy
- Pronunciation (inferred from transcription quality and context)
- Fluency (inferred from speech patterns, pausing indicators)
- Cohesion (how ideas are connected)

SCORING INSTRUCTIONS:
- Maximum score: ${maxScore} points
- Award score based on overall performance across all areas
- CEFR level must match score percentage:
  * 0-30%: A1-A2 (Beginner-Elementary)
  * 30-50%: A2-B1
  * 50-70%: B1 (Intermediate)
  * 70-85%: B2 (Upper-Intermediate)
  * 85-95%: C1 (Advanced)
  * 95-100%: C2 (Proficient)

Return assessment in JSON format:
{
  "score": [0-${maxScore} - must be consistent with CEFR level],
  "cefr_level": "[CEFR level matching score percentage]",
  "comment": "[Comprehensive assessment covering all areas]",
  "suggestions": "[Specific improvement tips for speaking skills]"
}`;
  }

  /**
   * Extract visual context (images) from question if available
   */
  static extractVisualContext(question) {
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
            const source = img.source === 'parent_question' ? ' [From main question]' : '';
            visualContext += `\n${idx + 1}. ${img.description}${source}`;
          });
          
          if (images.length === 1) {
            visualContext += `\n\nASSESSMENT NOTE: Student should describe/discuss this image as part of their response.`;
          } else if (images.length === 2) {
            visualContext += `\n\nASSESSMENT NOTE: Student should compare these two images, identifying similarities and differences.`;
          }
        }
      } catch (e) {
        console.error('[SpeakingScoringPromptBuilder] Error parsing additional_media:', e);
      }
    }
    
    return visualContext;
  }
}

module.exports = SpeakingScoringPromptBuilder;
