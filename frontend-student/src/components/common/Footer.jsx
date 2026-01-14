'use client';

import { Box, Container, Grid, Typography } from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1565C0',
        color: 'white',
        py: 4,
        mt: 6,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Company Information */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
              CÔNG TY TNHH THƯƠNG MẠI VÀ PHÁT TRIỂN GIÁO DỤC VIỆT NAM
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: '500' }}>
              VIET NAM TRADING AND DEVELOPMENT EDUCATION COMPANY LIMITED (VTED)
            </Typography>
            
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: '1rem' }} />
                <Typography variant="body2">
                  Địa chỉ: 188 Cầu Giấy, Quận Cầu Giấy, Hà Nội
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: '1rem' }} />
                <Typography variant="body2">
                  Email: info.vted@gmail.com | admin@aptistests.vn
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: '1rem' }} />
                <Typography variant="body2">
                  Hotline: 091.242.1116 - 032.521.4191
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                Số người đang thi thử trực tuyến: 129
              </Typography>
              
              {/* Development Credit */}
              <Box sx={{ mt: 3, textAlign: { xs: 'left', md: 'right' } }}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Phát triển bởi HCmedia
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}