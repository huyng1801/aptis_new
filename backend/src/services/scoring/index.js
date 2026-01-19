/**
 * Scoring Services Index
 * Exports all modular scoring services
 */

const CefrConverter = require('./CefrConverterService');
const ScoringPromptBuilder = require('./ScoringPromptBuilder');
const SpeakingScoringPromptBuilder = require('./SpeakingScoringPromptBuilder');
const AudioAnalysisEnhancer = require('./AudioAnalysisEnhancer');
const FeedbackGenerator = require('./FeedbackGenerator');
const AiServiceClient = require('./AiServiceClient');

module.exports = {
  CefrConverter,
  ScoringPromptBuilder,
  SpeakingScoringPromptBuilder,
  AudioAnalysisEnhancer,
  FeedbackGenerator,
  AiServiceClient
};