'use client';

import {
  Box,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Chip,
  Grid,
  Paper,
  Button,
  Divider,
} from '@mui/material';
import {
  Close,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { groupQuestionsBySkill, groupQuestionsBySection, getSkillFromQuestionType, getSectionFromQuestionType } from './ExamHelpers';

export default function ExamNavigation({
  drawerOpen,
  setDrawerOpen,
  questions,
  answers,
  attemptType,
  availableSkills,
  selectedSkillFilter,
  setSelectedSkillFilter,
  currentQuestionIndex,
  onQuestionNavigation,
  getQuestionStatus,
  skillMode = false
}) {
  // Filter questions based on skill selection - not used in skill mode
  const getFilteredQuestions = () => {
    if (attemptType === 'full_exam' && selectedSkillFilter && !skillMode) {
      return questions.filter(q => q.question?.questionType?.skill_type_id === selectedSkillFilter);
    }
    return questions;
  };

  const filteredQuestions = getFilteredQuestions();

  return (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      PaperProps={{
        sx: { width: { xs: '85vw', sm: 400 } }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Danh sách câu hỏi</Typography>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <Close />
        </IconButton>
      </Box>
      
      {/* Skill Filter for Full Exam - Hidden in skill mode */}
      {attemptType === 'full_exam' && availableSkills.length > 0 && !skillMode && (
        <>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Kỹ năng:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {availableSkills.map(skill => (
                <Chip
                  key={skill.id}
                  label={skill.skill_type_name}
                  onClick={() => setSelectedSkillFilter(skill.id)}
                  color={selectedSkillFilter === skill.id ? 'primary' : 'default'}
                  variant={selectedSkillFilter === skill.id ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Current Skill Info in skill mode */}
      {skillMode && availableSkills.length > 0 && (
        <>
          <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              📚 {availableSkills[0]?.skill_type_name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Câu hỏi trong phần này: {questions.length}
            </Typography>
          </Box>
          <Divider />
        </>
      )}
      
      {/* Question List */}
      <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
        {filteredQuestions.length === 0 ? (
          <Typography color="textSecondary" textAlign="center" sx={{ mt: 4 }}>
            Không có câu hỏi nào
          </Typography>
        ) : (
          <>
            {/* Group by skill only */}
            {(() => {
              const grouped = {};
              
              filteredQuestions.forEach((q, index) => {
                // q is now an answer object with nested question
                const skill = getSkillFromQuestionType(q.question?.questionType?.code);
                
                if (!grouped[skill]) {
                  grouped[skill] = [];
                }
                grouped[skill].push({ ...q, displayIndex: index + 1 });
              });

              // Check if skill allows clicking (all skills now allowed)
              const isClickableSkill = (skillName) => {
                return true; // Allow all skills including Listening
              };

              return Object.entries(grouped).map(([skillName, skillQuestions]) => {
                const canClick = isClickableSkill(skillName);
                
                return (
                  <Box key={skillName} sx={{ mb: 3 }}>
                
                    <List sx={{ p: 0 }}>
                      {skillQuestions.map((question, idx) => {
                        // question is an answer object with question_id
                        const questionIndex = filteredQuestions.findIndex(q => q.question_id === question.question_id);
                        const status = getQuestionStatus(question.question_id);
                        const isActive = questionIndex === currentQuestionIndex;
                        
                        return (
                          <ListItem
                            key={question.question_id}
                            disablePadding
                            sx={{ mb: 1 }}
                          >
                            <ListItemButton
                              onClick={() => {
                                // Allow navigation for all skills
                                if (canClick) {
                                  onQuestionNavigation(questionIndex);
                                  setDrawerOpen(false);
                                }
                              }}
                              disabled={!canClick}
                              sx={{
                                p: 1.5,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: isActive ? 'primary.main' : 'divider',
                                bgcolor: isActive ? 'primary.main' : 'background.paper',
                                color: isActive ? 'primary.contrastText' : 'text.primary',
                                transition: 'all 0.2s',
                                cursor: canClick ? 'pointer' : 'not-allowed',
                                opacity: !canClick && !isActive ? 0.8 : 1,
                                '&:hover': canClick ? {
                                  boxShadow: 2,
                                  transform: 'translateX(4px)',
                                  bgcolor: isActive ? 'primary.main' : 'background.paper',
                                } : {},
                          
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1.5 }}>
                                <ListItemText
                                  primary={`Câu ${question.displayIndex}`}
                                  sx={{
                                    '& .MuiListItemText-primary': { fontWeight: 500 }
                                  }}
                                />
                                {status === 'answered' && (
                                  <Box sx={{ ml: 'auto' }}>
                                    <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} />
                                  </Box>
                                )}
                              </Box>
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                );
              });
            })()}
          </>
        )}
      </Box>
      
      {/* Progress Summary */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Tiến độ: {answers.filter(a => a.selected_option_id || a.text_answer || a.answer_json || a.audio_url).length}/{filteredQuestions.length} câu
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          <Chip 
            size="small" 
            icon={<CheckCircle />} 
            label={`${answers.filter(a => a.selected_option_id || a.text_answer || a.answer_json || a.audio_url).length} đã làm`}
            color="success"
          />
          <Chip 
            size="small" 
            icon={<RadioButtonUnchecked />} 
            label={`${filteredQuestions.length - answers.filter(a => a.selected_option_id || a.text_answer || a.answer_json || a.audio_url).length} chưa làm`}
          />
        </Box>
      </Box>
    </Drawer>
  );
}