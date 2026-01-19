'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from '@mui/material';

// CERF Level mapping based on APTIS score (0-50 scale per skill)
// Reference: A1=4, A2=16, B1=26, B2=41, C=48
const getCERFLevel = (score) => {
  if (score >= 48) return { level: 'C', label: 'C', color: '#C41E3A' };
  if (score >= 41) return { level: 'B2', label: 'B2', color: '#C41E3A' };
  if (score >= 26) return { level: 'B1', label: 'B1', color: '#C41E3A' };
  if (score >= 16) return { level: 'A2', label: 'A2', color: '#C41E3A' };
  if (score >= 4) return { level: 'A1', label: 'A1', color: '#C41E3A' };
  return { level: 'A0', label: 'A0', color: '#CCCCCC' };
};

// Check if a CERF level should be filled based on achieved level
const isLevelReached = (currentLevel, achievedLevel) => {
  const levels = ['A0', 'A1', 'A2', 'B1', 'B2', 'C'];
  const currentIndex = levels.indexOf(currentLevel);
  const achievedIndex = levels.indexOf(achievedLevel);
  // Fill from A0 up to and including the achieved level (reversed order in display)
  return currentIndex <= achievedIndex;
};

export default function ResultsSummary({ attempt, exam, skillScores, overallStats }) {
  // Validate input data
  const totalScore = Number(overallStats?.totalScore ?? attempt?.total_score ?? 0);
  const maxScore = Number(overallStats?.maxScore ?? exam?.total_score ?? 200);
  const timeSpent = attempt?.time_spent ?? 0;
  const isSkillPractice = overallStats?.isSkillPractice || attempt?.attempt_type === 'skill_practice';

  // Prepare skill data with CERF mapping
  const skillsWithCERF = skillScores.map(skill => {
    const skillMaxScore = skill.max_score ?? skill.maxScore ?? 50;
    const skillScore = skill.score ?? 0;
    // Normalize to 50-point scale
    const normalizedScore = skillMaxScore > 0 ? (skillScore / skillMaxScore) * 50 : 0;
    const cerf = getCERFLevel(normalizedScore);
    
    return {
      name: skill.skillName || skill.skill_type || 'Unknown',
      score: Math.round(skillScore),
      maxScore: Math.round(skillMaxScore),
      normalizedScore: Math.round(normalizedScore),
      cerf
    };
  });

  // Calculate overall CERF level (average of all skills)
  const averageNormalizedScore = skillsWithCERF.length > 0 
    ? skillsWithCERF.reduce((sum, s) => sum + s.normalizedScore, 0) / skillsWithCERF.length
    : 0;
  const overallCERF = getCERFLevel(averageNormalizedScore);

  const displayPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return (
    <Card sx={{ mb: 3, border: '4px solid #002E5C', borderRadius: 2 }}>
      <CardContent sx={{ p: 4, backgroundColor: '#ffffff' }}>
        {/* Title */}
        <Typography 
          variant="h5" 
          sx={{ 
            color: '#E63946', 
            fontWeight: 'bold', 
            mb: 3,
            fontSize: '1.5rem'
          }}
        >
          Overall CERF level:
        </Typography>

        {/* 2-Column Layout */}
        <Grid container spacing={4}>
          {/* LEFT COLUMN: Scale Score Table */}
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#002E5C',
                mb: 2,
                fontSize: '1.1rem'
              }}
            >
              Scale score
            </Typography>

            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #ddd' }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#002E5C' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Skill name
                    </TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Skill score
                    </TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      CERF grade
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {skillsWithCERF.map((skill, idx) => (
                    <TableRow key={idx} sx={{ '&:nth-of-type(even)': { backgroundColor: '#f9f9f9' } }}>
                      <TableCell sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                        {skill.name}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#002E5C', fontSize: '0.9rem' }}>
                        {skill.score}/{skill.maxScore}
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            width: 50,
                            height: 30,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: skill.cerf.color,
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            borderRadius: 0.5,
                            mx: 'auto'
                          }}
                        >
                          {skill.cerf.label}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Final Score Row */}
                  <TableRow sx={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Final scale score
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#002E5C', fontSize: '0.9rem' }}>
                      {Math.round(totalScore)}
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          width: 50,
                          height: 30,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: overallCERF.color,
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          borderRadius: 0.5,
                          mx: 'auto'
                        }}
                      >
                        {overallCERF.label}
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* RIGHT COLUMN: CERF Skill Profile Chart */}
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#002E5C',
                mb: 2,
                fontSize: '1.1rem'
              }}
            >
              CERF skill profile
            </Typography>

            <Box sx={{ p: 2, backgroundColor: 'white', border: '1px solid #ddd', borderRadius: 1, overflowX: 'auto' }}>
              <Box display="flex" gap={2}>
                {/* Y-axis labels */}
                <Box sx={{ minWidth: 50 }}>
                  <Box sx={{ height: 25, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>
                    CERF
                  </Box>
                  {['C', 'B2', 'B1', 'A2', 'A1', 'A0'].map((level) => (
                    <Box 
                      key={level}
                      sx={{ 
                        height: 28, 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '0.8rem',
                        borderBottom: '1px solid #999'
                      }}
                    >
                      {level}
                    </Box>
                  ))}
                  <Box sx={{ height: 40 }} />
                </Box>

                {/* Skill columns */}
                {skillsWithCERF.map((skill, idx) => (
                  <Box key={idx} sx={{ flex: 1, minWidth: 70 }}>
                    {/* Bar chart - 6 rows for CERF levels */}
                    {['C', 'B2', 'B1', 'A2', 'A1', 'A0'].map((level) => {
                      const isReached = isLevelReached(level, skill.cerf.label);
                      const isTopLevel = level === skill.cerf.label;
                      
                      return (
                        <Box
                          key={level}
                          sx={{
                            height: 28,
                            backgroundColor: isReached ? skill.cerf.color : '#ffffff',
                            borderBottom: '1px solid #999',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isTopLevel && (
                            <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>
                              {skill.normalizedScore}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                    
                    {/* Skill name and score at bottom */}
                    <Box sx={{ height: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center', color: '#333', fontSize: '0.75rem' }}>
                        {skill.name.split(' ')[0]}
                      </Typography>
           
                    </Box>
                  </Box>
                ))}

                {/* Overall CERF column */}
                <Box sx={{ flex: 1, minWidth: 70 }}>
                  {['C', 'B2', 'B1', 'A2', 'A1', 'A0'].map((level) => {
                    const isReached = isLevelReached(level, overallCERF.label);
                    const isTopLevel = level === overallCERF.label;
                    
                    return (
                      <Box
                        key={level}
                        sx={{
                          height: 28,
                          backgroundColor: isReached ? overallCERF.color : '#ffffff',
                          borderBottom: '1px solid #999',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isTopLevel && (
                          <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>
                            {Math.round(averageNormalizedScore)}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                  
                  {/* Overall label at bottom */}
                  <Box sx={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center', color: '#333', fontSize: '0.75rem' }}>
                      Overall
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}