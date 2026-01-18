import { Box, List, ListItem, ListItemText, Typography, Chip, Avatar } from '@mui/material';
import { Star, Timeline, Person } from '@mui/icons-material';

export default function PracticeHistory({ attempts, formatDate, formatSkillName }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Timeline fontSize="small" />
        Lịch sử luyện tập
      </Typography>

      {attempts.length > 0 ? (
        <List disablePadding sx={{ maxHeight: '600px', overflowY: 'auto' }}>
          {attempts.map((attempt) => (
            <ListItem
              key={attempt.id}
              disablePadding
              sx={{
                mb: 1.5,
                p: 1.5,
                bgcolor: 'background.default',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: '#f5f5f5',
                }
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {attempt.exam?.title || 'Bài thi'}
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 600 }}>
                        {(() => {
                          // If single skill practice, try to get skill name from selected_skill_id
                          if (attempt.attempt_type === 'single_skill' && attempt.selected_skill_id) {
                            const skillMapping = {
                              1: 'Reading',
                              2: 'Listening', 
                              3: 'Writing',
                              4: 'Speaking'
                            };
                            
                            if (skillMapping[attempt.selected_skill_id]) {
                              return skillMapping[attempt.selected_skill_id];
                            }
                          }
                          
                          // Try from selectedSkill relation
                          if (attempt.selectedSkill?.skill_type_name) {
                            return formatSkillName(attempt.selectedSkill.skill_type_name);
                          }
                          
                          // Try from exam sections
                          if (attempt.selected_skill_id && attempt.exam?.sections) {
                            const section = attempt.exam.sections.find(s => s.skill_type_id === attempt.selected_skill_id);
                            return formatSkillName(section?.skillType?.skill_type_name || section?.skillType?.type_name || 'Unknown');
                          }
                          
                          // Try to detect from exam title
                          if (attempt.exam?.title) {
                            const title = attempt.exam.title.toLowerCase();
                            if (title.includes('reading')) return 'Reading';
                            if (title.includes('listening')) return 'Listening';
                            if (title.includes('writing')) return 'Writing';
                            if (title.includes('speaking')) return 'Speaking';
                          }
                          
                          // For full_exam attempts
                          if (attempt.attempt_type === 'full_exam') {
                            return 'Tất cả kỹ năng';
                          }
                          
                          return 'Luyện tập';
                        })()}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(attempt.start_time)}
                    </Typography>
                    {attempt.total_score !== null && attempt.total_score !== undefined && (
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={`${attempt.total_score}/${attempt.exam?.max_score || 50} điểm`}
                          size="small"
                          variant="outlined"
                          icon={<Star />}
                        />
                      </Box>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Person sx={{ fontSize: 40, color: 'text.secondary', mb: 1, mx: 'auto' }} />
          <Typography variant="body2" color="text.secondary">
            Chưa có lịch sử luyện tập
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Hãy bắt đầu làm bài để ghi lại tiến độ
          </Typography>
        </Box>
      )}
    </Box>
  );
}
