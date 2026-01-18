import { Card, CardContent, Typography, Box } from '@mui/material';

export default function StatsCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <Card sx={{ height: '100%', boxShadow: 1 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {subtitle}
            </Typography>
          </Box>
          <Icon sx={{ fontSize: 32, color, opacity: 0.8 }} />
        </Box>
      </CardContent>
    </Card>
  );
}
