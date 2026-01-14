# AI Scoring Flow Diagram

## 📊 Luồng Chấm Điếm AI

```
┌─────────────────────────────────────────────────────────────────────┐
│                      STUDENT SUBMITS ANSWER                         │
│                  (Writing Text / Audio Recording)                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  1. RETRIEVE ANSWER & CRITERIA          │
        │  - Get AttemptAnswer from DB            │
        │  - Load Question & Sample Answer        │
        │  - Fetch AiScoringCriteria              │
        └────────────────────┬───────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌─────────────┐         ┌──────────────────┐
        │  WRITING    │         │    SPEAKING      │
        │  SCORING    │         │    SCORING       │
        └─────────────┘         └──────────────────┘
                │                       │
                │                       ▼
                │              ┌──────────────────────┐
                │              │ 2a. TRANSCRIBE AUDIO │
                │              │ SpeechToTextService  │
                │              │ - Whisper API        │
                │              │ - Audio Analysis     │
                │              └──────────┬───────────┘
                │                         │
                │              ┌──────────▼──────────┐
                │              │ 2b. EXTRACT TEXT    │
                │              │ & AUDIO METRICS     │
                │              │ - Pronunciation     │
                │              │ - Fluency           │
                │              │ - Accuracy          │
                │              │ - Prosody           │
                │              └──────────┬──────────┘
                │                         │
                └────────────┬────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  3. BUILD AI SCORING PROMPT             │
        │  ScoringPromptBuilder                   │
        │  ─────────────────────────────────────  │
        │  For each Criterion:                    │
        │  - Question content & sample answer     │
        │  - Student's answer/transcription       │
        │  - Audio analysis (if available)        │
        │  - Scoring rubric & instructions        │
        └────────────────────┬───────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  4. CALL GROQ AI SERVICE                │
        │  AiServiceClient                        │
        │  ─────────────────────────────────────  │
        │  - Send prompt to Groq API              │
        │  - Retry logic (max 3 attempts)         │
        │  - Get JSON response with CEFR level    │
        └────────────────────┬───────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  5. PARSE AI RESPONSE                   │
        │  AiServiceClient.parseAiResponse()      │
        │  ─────────────────────────────────────  │
        │  Extract:                               │
        │  - CEFR level (e.g., B1.2)              │
        │  - Comment & feedback                   │
        │  - Strengths & weaknesses               │
        │  - Suggestions                          │
        └────────────────────┬───────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  6. CONVERT CEFR TO SCORE               │
        │  CefrConverter                          │
        │  ─────────────────────────────────────  │
        │  CEFR Level → Numeric Score             │
        │  (A2 → 0-2, B1 → 2-4, B2 → 4-6)        │
        └────────────────────┬───────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  7. APPLY AUDIO ADJUSTMENTS (Speaking) │
        │  AudioAnalysisEnhancer                  │
        │  ─────────────────────────────────────  │
        │  Optional: Adjust score based on:       │
        │  - Pronunciation metrics                │
        │  - Fluency confidence                   │
        │  - Emotional tone                       │
        │  - Error severity                       │
        └────────────────────┬───────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  8. GENERATE FEEDBACK                   │
        │  FeedbackGenerator                      │
        │  ─────────────────────────────────────  │
        │  - Combine criteria scores              │
        │  - Calculate weighted average           │
        │  - Generate overall feedback            │
        │  - Add audio insights (if available)    │
        └────────────────────┬───────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │  9. SAVE RESULTS TO DATABASE            │
        │  ─────────────────────────────────────  │
        │  Update AttemptAnswer:                  │
        │  - score                                │
        │  - ai_feedback                          │
        │  - ai_graded_at                         │
        │                                         │
        │  Create AnswerAiFeedback:               │
        │  - criteria_id                          │
        │  - score                                │
        │  - cefr_level                           │
        │  - comment, strengths, weaknesses       │
        │  - suggestions                          │
        └────────────────────┬───────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  SCORING COMPLETE ✅                    │
        │  Return result with all feedback        │
        └────────────────────────────────────────┘
```

---

## 🔄 Data Flow Chi Tiết

### Writing Answer Flow
```
Writing Answer (text_answer)
    ↓
Extract Text Content
    ↓
For Each Criterion:
  - Build Prompt (text + rubric)
  - Call AI → Get CEFR level
  - Convert CEFR → Score
  - Generate Feedback
    ↓
Aggregate Scores
    ↓
Calculate Overall Feedback
    ↓
Save to DB
```

### Speaking Answer Flow (Basic)
```
Audio File (audio_url)
    ↓
Convert to Float32 Audio
    ↓
Transcribe (Whisper API)
    ↓
Extract Transcribed Text
    ↓
For Each Criterion:
  - Build Prompt (text + rubric)
  - Call AI → Get CEFR level
  - Convert CEFR → Score
  - Generate Feedback
    ↓
Aggregate Scores
    ↓
Calculate Overall Feedback
    ↓
Save to DB
```

### Speaking Answer Flow (Enhanced with Audio Analysis)
```
Audio File (audio_url)
    ↓
Convert to Float32 Audio
    ↓
Transcribe (Whisper API)
    ↓
Analyze Audio Features:
  - Pronunciation Score (Meyda + Pitchfinder)
  - Fluency Score (speech rate, pauses)
  - Accuracy Score (error analysis)
  - Prosody Score (intonation, stress)
    ↓
Extract Audio Analysis Data
    ↓
For Each Criterion:
  - Build Enhanced Prompt
    (text + rubric + audio metrics)
  - Call AI → Get CEFR level
    (informed by audio data)
  - Convert CEFR → Score
  - Apply Audio Adjustment
    (±adjustment based on metrics)
  - Generate Feedback
    (with audio references)
    ↓
Aggregate Scores
    ↓
Calculate Enhanced Overall Feedback
    (with technical summary)
    ↓
Save to DB with audioAnalysisUsed flag
```

---

## 🎯 Key Components

| Component | Trách Nhiệm |
|-----------|-----------|
| **AiScoringService** | Orchestrates entire scoring process |
| **SpeechToTextService** | Transcribes audio, analyzes features |
| **ScoringPromptBuilder** | Builds AI prompts (basic + enhanced) |
| **AiServiceClient** | Calls Groq API, parses responses |
| **CefrConverter** | Converts CEFR levels to scores |
| **AudioAnalysisEnhancer** | Adjusts scores based on audio metrics |
| **FeedbackGenerator** | Generates feedback & summaries |

---

## 📊 Score Ranges

```
Writing: 0-6 points per criterion
  - A2 level → 0-1 point
  - B1 level → 2-4 points
  - B2 level → 5-6 points

Speaking: 0-5 points per criterion
  - A2 level → 0-1 point
  - B1 level → 2-4 points
  - B2 level → 5 points
```

---

## ✨ Audio Analysis Metrics (Speaking)

```
Pronunciation Score (0-100):
  - Voice quality, clarity, accent
  - Measured via Meyda FFT + Pitchfinder

Fluency Score (0-100):
  - Speech rate, pause patterns, rhythm
  - Measured via energy analysis, VAD

Accuracy Score (0-100):
  - Error detection, intelligibility
  - Measured via spectral analysis, MFCC

Prosody Score (0-100):
  - Intonation, stress patterns
  - Measured via pitch variation, energy dynamics

Overall Confidence (0-1):
  - Weighted average of all metrics
```

---

## 🚀 Usage Examples

### Write Simple Scoring
```javascript
const result = await AiScoringService.scoreWriting(answerId);
// Returns: { totalScore, criteriaScores[], overallFeedback }
```

### Speaking Simple Scoring
```javascript
const result = await AiScoringService.scoreSpeaking(answerId);
// Returns: { totalScore, criteriaScores[], overallFeedback }
```

### Speaking Enhanced (with Audio Analysis)
```javascript
const result = await AiScoringService.scoreSpeakingWithAudioAnalysis(answerId);
// Returns: { totalScore, criteriaScores[], overallFeedback, audioAnalysisUsed: true }
```

---

## ✅ Validation Steps

1. **Answer Validation**: Verify text_answer or audio_url exists
2. **Criteria Validation**: Ensure criteria loaded for question type
3. **AI Response Validation**: Check CEFR level extracted successfully
4. **Score Validation**: Ensure score within min/max bounds
5. **Audio Validation**: Confirm audio analysis data integrity (if used)

---

## ⚙️ Configuration

```javascript
// Constants
AI_SCORING_CONFIG = {
  MAX_RETRIES: 3,           // AI call retry attempts
  RETRY_DELAY: 500          // Delay between retries (ms)
}

GROQ_CONFIG = {
  model: 'mixtral-8x7b-32768',
  temperature: 0.7,
  max_tokens: 2000
}
```

---

## 🔍 Error Handling

```
If Transcription Fails:
  → Fallback to mock analysis
  → Continue with error message
  → Allow manual review

If AI Call Fails:
  → Retry up to 3 times
  → Use fallback CEFR "B1"
  → Score = 50% of max

If Response Parsing Fails:
  → Try numeric extraction
  → Default to 0 score
  → Mark as error in feedback
```

---

**Status**: ✅ All flows tested and working correctly