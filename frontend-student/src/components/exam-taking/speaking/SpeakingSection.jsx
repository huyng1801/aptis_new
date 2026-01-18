'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Stepper, Step, StepLabel, Button, LinearProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import SpeakingQuestion from './SpeakingQuestion';

/**
 * Speaking Section Component - Handles 4 speaking sections with proper navigation
 * 
 * STRUCTURE:
 * Section 1: Personal Introduction (3 questions) - SPEAKING_INTRO
 * Section 2: Picture Description (3 questions) - SPEAKING_DESCRIPTION 
 * Section 3: Comparison (3 questions) - SPEAKING_COMPARISON
 * Section 4: Topic Discussion (1 question) - SPEAKING_DISCUSSION
 * Total: 10 questions, 50 points
 */
export default function SpeakingSection({ 
  questions, 
  onAnswerChange, 
  onComplete, 
  attemptId,
  onHideHeader
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sectionProgress, setSectionProgress] = useState({
    section1: { completed: 0, total: 3 }, // Personal Introduction
    section2: { completed: 0, total: 3 }, // Picture Description  
    section3: { completed: 0, total: 3 }, // Comparison
    section4: { completed: 0, total: 1 }  // Topic Discussion
  });

  // Debug logging
  console.log('[SpeakingSection] Render:', { 
    questionsLength: questions.length,
    currentIndex: currentQuestionIndex,
    questionTypes: questions.map(q => q.questionType?.code)
  });

  // Group questions by type to identify sections
  const questionSections = React.useMemo(() => {
    const sections = {
      section1: [], // SPEAKING_INTRO
      section2: [], // SPEAKING_DESCRIPTION
      section3: [], // SPEAKING_COMPARISON
      section4: []  // SPEAKING_DISCUSSION
    };

    questions.forEach((q, index) => {
      const type = q.questionType?.code;
      if (type === 'SPEAKING_INTRO') {
        sections.section1.push({ ...q, originalIndex: index });
      } else if (type === 'SPEAKING_DESCRIPTION') {
        sections.section2.push({ ...q, originalIndex: index });
      } else if (type === 'SPEAKING_COMPARISON') {
        sections.section3.push({ ...q, originalIndex: index });
      } else if (type === 'SPEAKING_DISCUSSION') {
        sections.section4.push({ ...q, originalIndex: index });
      }
    });

    console.log('[SpeakingSection] Questions grouped by section:', {
      section1: sections.section1.length,
      section2: sections.section2.length,
      section3: sections.section3.length,
      section4: sections.section4.length
    });

    return sections;
  }, [questions]);

  // Get current section info
  const getCurrentSectionInfo = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    const type = currentQuestion.questionType?.code;
    
    if (type === 'SPEAKING_INTRO') {
      const questionInSection = questionSections.section1.findIndex(q => q.originalIndex === currentQuestionIndex) + 1;
      return {
        section: 1,
        title: 'Section 1: Personal Introduction',
        description: 'Introduce yourself and talk about your experiences',
        questionInSection,
        totalInSection: 3,
        globalQuestion: currentQuestionIndex + 1
      };
    } else if (type === 'SPEAKING_DESCRIPTION') {
      const questionInSection = questionSections.section2.findIndex(q => q.originalIndex === currentQuestionIndex) + 1;
      return {
        section: 2,
        title: 'Section 2: Picture Description',
        description: 'Describe the images you see in detail',
        questionInSection,
        totalInSection: 3,
        globalQuestion: currentQuestionIndex + 1
      };
    } else if (type === 'SPEAKING_COMPARISON') {
      const questionInSection = questionSections.section3.findIndex(q => q.originalIndex === currentQuestionIndex) + 1;
      return {
        section: 3,
        title: 'Section 3: Comparison',
        description: 'Compare and contrast the given images or topics',
        questionInSection,
        totalInSection: 3,
        globalQuestion: currentQuestionIndex + 1
      };
    } else if (type === 'SPEAKING_DISCUSSION') {
      const questionInSection = questionSections.section4.findIndex(q => q.originalIndex === currentQuestionIndex) + 1;
      return {
        section: 4,
        title: 'Section 4: Topic Discussion',
        description: 'Discuss the given topic in detail',
        questionInSection,
        totalInSection: 1,
        globalQuestion: currentQuestionIndex + 1
      };
    }

    return null;
  };

  const sectionInfo = getCurrentSectionInfo();
  const currentQuestion = questions[currentQuestionIndex];

  // Handle moving to next question
  const handleNextQuestion = () => {
    console.log('[SpeakingSection] Manual navigation to next question');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All speaking questions completed
      console.log('[SpeakingSection] All questions completed, calling onComplete');
      onComplete?.();
    }
  };

  // Handle answer change
  const handleAnswerChange = (questionId, answer) => {
    onAnswerChange?.(questionId, answer);
  };

  // Calculate overall progress
  const overallProgress = ((currentQuestionIndex) / questions.length) * 100;

  if (!currentQuestion || !sectionInfo) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading speaking questions...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Speaking Section Header */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa', borderLeft: '4px solid #ff6b6b' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f', mb: 1 }}>
          🎙️ Speaking Section
        </Typography>
        
        {/* Section Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            {sectionInfo.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            {sectionInfo.description}
          </Typography>
        </Box>

        {/* Progress Indicators */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Question {sectionInfo.questionInSection} of {sectionInfo.totalInSection} in Section {sectionInfo.section}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Overall: {sectionInfo.globalQuestion} / {questions.length}
          </Typography>
        </Box>

        {/* Overall Progress Bar */}
        <LinearProgress 
          variant="determinate" 
          value={overallProgress} 
          sx={{ height: 8, borderRadius: 4, mb: 1 }} 
        />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {Math.round(overallProgress)}% Complete
        </Typography>
      </Paper>

      {/* Section Stepper */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={sectionInfo.section - 1} alternativeLabel>
          <Step completed={sectionInfo.section > 1}>
            <StepLabel>Section 1<br/><small>Personal Intro</small></StepLabel>
          </Step>
          <Step completed={sectionInfo.section > 2}>
            <StepLabel>Section 2<br/><small>Picture Description</small></StepLabel>
          </Step>
          <Step completed={sectionInfo.section > 3}>
            <StepLabel>Section 3<br/><small>Comparison</small></StepLabel>
          </Step>
          <Step completed={sectionInfo.section > 4}>
            <StepLabel>Section 4<br/><small>Topic Discussion</small></StepLabel>
          </Step>
        </Stepper>
      </Paper>

      {/* Current Question */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <SpeakingQuestion
          question={currentQuestion}
          onAnswerChange={handleAnswerChange}
          onMoveToNextQuestion={handleNextQuestion}
          attemptId={attemptId}
          onHideHeader={onHideHeader}
          questionNumber={sectionInfo.globalQuestion}
          totalQuestions={questions.length}
          sectionInfo={sectionInfo}
        />
      </Paper>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button 
          variant="outlined" 
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
        >
          Previous Question
        </Button>
        
        <Typography variant="body2" sx={{ alignSelf: 'center', color: 'text.secondary' }}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Typography>

        {currentQuestionIndex < questions.length - 1 ? (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleNextQuestion}
            disabled={!currentQuestion.answer_data?.audio_url}
          >
            Next Question
          </Button>
        ) : (
          <Button 
            variant="contained" 
            color="success"
            onClick={onComplete}
            disabled={!currentQuestion.answer_data?.audio_url}
          >
            Complete Speaking
          </Button>
        )}
      </Box>
    </Box>
  );
}