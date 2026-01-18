import { Grid, Card, CardContent, Typography, Box, Avatar, Divider, Button, Chip, CircularProgress } from '@mui/material';
import { Schedule, Quiz, PlayArrow, School, TrendingUp } from '@mui/icons-material';

export default function ExamsList({ 
  selectedSkill, 
  exams, 
  isLoadingExams, 
  onStartPractice, 
  getSkillColor, 
  getSkillIcon, 
  formatSkillName,
  formatDuration 
}) {
  if (!selectedSkill) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: getSkillColor(selectedSkill.skill_type_name),
              fontSize: 16,
            }}
          >
            {getSkillIcon(selectedSkill.skill_type_name)}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Bài thi luyện tập {formatSkillName(selectedSkill.skill_type_name || selectedSkill.type_name)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {exams.length} bài thi có sẵn cho kỹ năng này
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Loading State */}
      {isLoadingExams && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Exams Grid */}
      {!isLoadingExams && exams.length > 0 && (
        <Grid container spacing={3}>
          {exams.map((exam) => (
            <Grid item xs={12} sm={6} md={6} key={exam.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                    borderColor: getSkillColor(selectedSkill.skill_type_name),
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Exam Title */}
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {exam.title}
                  </Typography>

                  {/* APTIS Type Badge */}
                  {exam.aptis_type && (
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        icon={<School />}
                        label={exam.aptis_type}
                        size="small"
                        variant="filled"
                        color="primary"
                      />
                    </Box>
                  )}

                  {/* Description */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {exam.description || `Luyện tập kỹ năng ${formatSkillName(selectedSkill.skill_type_name || selectedSkill.type_name)} với các dạng bài tập đa dạng.`}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Exam Info */}
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="caption">
                          {formatDuration(exam.duration_minutes) || '45 phút'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Quiz fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="caption">
                          {exam.total_questions || exam.question_count || '10+'} câu
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>

                {/* Action Button */}
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PlayArrow />}
                    size="small"
                    sx={{
                      bgcolor: getSkillColor(selectedSkill.skill_type_name),
                      '&:hover': {
                        filter: 'brightness(0.9)',
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartPractice(exam.id);
                    }}
                  >
                    Làm bài
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* No Exams for Selected Skill */}
      {!isLoadingExams && exams.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
          <TrendingUp sx={{ fontSize: 48, color: 'text.secondary', mb: 2, mx: 'auto' }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Chưa có bài thi cho kỹ năng này
          </Typography>
        </Card>
      )}
    </Box>
  );
}
