import { Grid, Card, CardContent, Typography, Box, Avatar, Divider, Chip } from '@mui/material';
import { useSelector } from 'react-redux';

export default function SkillSelector({ skills, selectedSkill, onSelectSkill, getSkillColor, getSkillIcon, formatSkillName }) {
  const practiceState = useSelector((state) => state.practice || {});
  const myAttempts = practiceState.myAttempts || [];

  // Format skill name properly
  const getFormattedSkillName = (skill) => {
    // Use skill_type_name from backend or format from type_name
    if (skill.skill_type_name) {
      // Remove "Test" prefix and clean up
      const cleaned = skill.skill_type_name
        .replace(/^Test\s+/i, '')
        .replace(/\s+(comprehension|communication)\s+skills?/i, '')
        .replace(/\s+skills?/i, '')
        .trim();
      
      // Capitalize properly
      if (cleaned.toLowerCase().includes('listen')) return 'Listening';
      if (cleaned.toLowerCase().includes('read')) return 'Reading';
      if (cleaned.toLowerCase().includes('writ')) return 'Writing';
      if (cleaned.toLowerCase().includes('speak') || cleaned.toLowerCase().includes('spoken')) return 'Speaking';
      
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    }
    
    if (skill.type_name) {
      return formatSkillName ? formatSkillName(skill.type_name) : skill.type_name;
    }
    
    return skill.name || 'Unknown Skill';
  };

  // Calculate skill stats from attempts
  const getSkillStatsFromAttempts = (skill) => {
    if (!myAttempts || !Array.isArray(myAttempts)) {
      return {
        totalExams: 8,
        completedAttempts: 0,
        averageScore: 0
      };
    }

    const skillAttempts = myAttempts.filter(attempt => 
      attempt.attempt_type === 'single_skill' &&
      (attempt.selected_skill_id === skill.id || 
       attempt.skillType === skill.id || 
       attempt.skill_id === skill.id ||
       attempt.skill_type_id === skill.id ||
       (attempt.Exam && attempt.Exam.skill_type === skill.id) ||
       (attempt.exam && attempt.exam.skill_type === skill.id))
    );

    const completedAttempts = skillAttempts.filter(attempt => 
      attempt.status === 'submitted' || attempt.status === 'completed'
    );

    const avgScore = completedAttempts.length > 0 
      ? completedAttempts.reduce((sum, attempt) => sum + (attempt.total_score || 0), 0) / completedAttempts.length
      : 0;

    return {
      totalExams: Math.max(8, skillAttempts.length + 3),
      completedAttempts: completedAttempts.length,
      averageScore: Math.round(avgScore * 10) / 10
    };
  };

  return (
    <Grid container spacing={2}>
      {skills.map((skill) => {
        const isSelected = selectedSkill?.id === skill.id;
        const stats = getSkillStatsFromAttempts(skill);
        const skillName = getFormattedSkillName(skill);
        const skillColor = getSkillColor(skillName.toUpperCase());
        const skillNameFormatted = skillName;
        
        return (
          <Grid item xs={6} sm={6} md={6} key={skill.id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: isSelected ? `3px solid ${skillColor}` : '2px solid transparent',
                transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                boxShadow: isSelected ? 2 : 0,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                  borderColor: skillColor,
                },
              }}
              onClick={() => onSelectSkill(skill)}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: skillColor,
                      fontSize: 20,
                    }}
                  >
                    {getSkillIcon(skillName.toUpperCase())}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {skillNameFormatted}
                    </Typography>
                    {skill.description && (
                      <Typography variant="caption" color="text.secondary">
                        {skill.description.substring(0, 30)}...
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Stats */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`${stats.totalExams} bài thi`}
                    size="small"
                    sx={{
                      bgcolor: '#e3f2fd',
                      color: '#1565c0',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  />
                  <Chip
                    label={`Hoàn thành ${stats.completedAttempts}`}
                    size="small"
                    sx={{
                      bgcolor: '#e8f5e8',
                      color: '#2e7d32',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  />
                </Box>
                
                {stats.averageScore > 0 && (
                  <Box sx={{ mt: 1, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Điểm trung bình: <strong>{stats.averageScore}/200</strong>
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
