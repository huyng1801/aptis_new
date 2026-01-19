'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  School,
  WorkspacePremium,
  Group,
  MenuBook,
  TrendingUp,
  Security,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleGetStartedClick = () => {
    router.push('/register');
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      {/* Navigation Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: '#FFFFFF', 
          borderBottom: '1px solid #E0E0E0'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ py: 1 }}>
            {/* Logo */}
            <Typography 
              variant="h5" 
              sx={{ 
                flexGrow: 1,
                fontWeight: 'bold', 
                color: '#1976D2',
                letterSpacing: '0.5px'
              }}
            >
              APTIS
            </Typography>

            {/* Navigation Links */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, mr: 4 }}>
              <Button 
                color="inherit" 
                sx={{ 
                  color: '#666666',
                  '&:hover': { color: '#1976D2' },
                  textTransform: 'none',
                  fontSize: '16px'
                }}
              >
                Home
              </Button>
              <Button 
                color="inherit" 
                sx={{ 
                  color: '#666666',
                  '&:hover': { color: '#1976D2' },
                  textTransform: 'none',
                  fontSize: '16px'
                }}
              >
                About
              </Button>
              <Button 
                color="inherit" 
                sx={{ 
                  color: '#666666',
                  '&:hover': { color: '#1976D2' },
                  textTransform: 'none',
                  fontSize: '16px'
                }}
              >
                Courses
              </Button>
              <Button 
                color="inherit" 
                sx={{ 
                  color: '#666666',
                  '&:hover': { color: '#1976D2' },
                  textTransform: 'none',
                  fontSize: '16px'
                }}
              >
                Contact
              </Button>
            </Box>

            {/* Login Button */}
            <Button 
              variant="contained" 
              onClick={handleLoginClick}
              sx={{ 
                backgroundColor: '#1976D2',
                color: 'white',
                textTransform: 'none',
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: '500',
                '&:hover': { 
                  backgroundColor: '#1565C0',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Sign In
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ backgroundColor: '#FFFFFF', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 'bold', 
                  mb: 3, 
                  lineHeight: 1.2,
                  color: '#333333',
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                Master English with
                <Box component="span" sx={{ color: '#1976D2', display: 'block' }}>
                  APTIS Training
                </Box>
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 4, 
                  color: '#666666',
                  lineHeight: 1.6,
                  fontSize: '1.2rem',
                  fontWeight: 400
                }}
              >
                Professional English language learning platform designed to help you achieve your certification goals with expert guidance.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={handleGetStartedClick}
                  sx={{ 
                    backgroundColor: '#1976D2',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    borderRadius: 2,
                    fontWeight: '600',
                    '&:hover': { 
                      backgroundColor: '#1565C0',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                    },
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  Get Started
                </Button>
                
                <Button 
                  variant="outlined" 
                  size="large" 
                  onClick={handleLoginClick}
                  sx={{ 
                    borderColor: '#1976D2',
                    color: '#1976D2',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    borderRadius: 2,
                    fontWeight: '600',
                    '&:hover': { 
                      backgroundColor: '#1976D2', 
                      color: 'white',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  Learn More
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center', position: 'relative' }}>
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="English learning"
                  style={{ 
                    width: '100%', 
                    maxWidth: '500px', 
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: '#F8F9FA' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 2, 
                color: '#333333',
                fontSize: { xs: '2rem', md: '2.5rem' }
              }}
            >
              Why Choose APTIS?
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#666666', 
                maxWidth: '600px', 
                mx: 'auto',
                fontSize: '1.1rem',
                fontWeight: 400
              }}
            >
              Experience comprehensive English training with our proven methodology and expert instructors.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  textAlign: 'center', 
                  p: 4, 
                  height: '100%', 
                  borderRadius: 3,
                  border: '1px solid #E0E0E0',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <School sx={{ fontSize: 64, color: '#1976D2', mb: 3 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#333333' }}>
                  Expert Training
                </Typography>
                <Typography variant="body1" sx={{ color: '#666666', lineHeight: 1.6 }}>
                  Learn from certified instructors with years of APTIS teaching experience
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  textAlign: 'center', 
                  p: 4, 
                  height: '100%', 
                  borderRadius: 3,
                  border: '1px solid #E0E0E0',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <MenuBook sx={{ fontSize: 64, color: '#1976D2', mb: 3 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#333333' }}>
                  Comprehensive Curriculum
                </Typography>
                <Typography variant="body1" sx={{ color: '#666666', lineHeight: 1.6 }}>
                  Complete course material covering all APTIS test components and skills
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  textAlign: 'center', 
                  p: 4, 
                  height: '100%', 
                  borderRadius: 3,
                  border: '1px solid #E0E0E0',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <TrendingUp sx={{ fontSize: 64, color: '#1976D2', mb: 3 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#333333' }}>
                  Progress Tracking
                </Typography>
                <Typography variant="body1" sx={{ color: '#666666', lineHeight: 1.6 }}>
                  Monitor your improvement with detailed analytics and performance reports
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Statistics Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: '#FFFFFF' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 'bold', 
                  mb: 3, 
                  color: '#333333',
                  fontSize: { xs: '2rem', md: '2.5rem' }
                }}
              >
                Trusted by Students Worldwide
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 4, 
                  color: '#666666', 
                  lineHeight: 1.6,
                  fontSize: '1.1rem',
                  fontWeight: 400
                }}
              >
                Join thousands of successful students who have achieved their English proficiency goals through our platform.
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleLoginClick}
                sx={{ 
                  backgroundColor: '#1976D2',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: '600',
                  '&:hover': { 
                    backgroundColor: '#1565C0',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                  },
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                Start Your Journey
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Grid container spacing={4}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: '#1976D2',
                        fontSize: { xs: '2.5rem', md: '3rem' }
                      }}
                    >
                      1,200+
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#666666', fontWeight: '500' }}>
                      Students Enrolled
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: '#1976D2',
                        fontSize: { xs: '2.5rem', md: '3rem' }
                      }}
                    >
                      95%
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#666666', fontWeight: '500' }}>
                      Success Rate
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: '#1976D2',
                        fontSize: { xs: '2.5rem', md: '3rem' }
                      }}
                    >
                      50+
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#666666', fontWeight: '500' }}>
                      Expert Instructors
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: '#1976D2',
                        fontSize: { xs: '2.5rem', md: '3rem' }
                      }}
                    >
                      5★
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#666666', fontWeight: '500' }}>
                      Average Rating
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Box 
        sx={{ 
          py: { xs: 6, md: 10 }, 
          background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
          color: 'white'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 3,
                fontSize: { xs: '2rem', md: '2.5rem' }
              }}
            >
              Ready to Start Your English Journey?
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 5, 
                opacity: 0.9,
                maxWidth: '600px',
                mx: 'auto',
                fontSize: '1.2rem',
                fontWeight: 400
              }}
            >
              Join our community of learners and take the first step towards achieving your English proficiency goals.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button 
                variant="contained" 
                size="large" 
                onClick={handleGetStartedClick}
                sx={{ 
                  backgroundColor: 'white',
                  color: '#1976D2',
                  px: 5,
                  py: 2,
                  fontSize: '1.2rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: '600',
                  '&:hover': { 
                    backgroundColor: '#F5F5F5',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
                  },
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                Get Started Now
              </Button>
              
              <Button 
                variant="outlined" 
                size="large" 
                onClick={handleLoginClick}
                sx={{ 
                  borderColor: 'white',
                  color: 'white',
                  px: 5,
                  py: 2,
                  fontSize: '1.2rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: '600',
                  '&:hover': { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)',
                    borderColor: 'white'
                  },
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                Sign In
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: '#333333', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1976D2' }}>
                APTIS
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, mb: 3, lineHeight: 1.6 }}>
                Your trusted partner for English language learning and APTIS test preparation.
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.6 }}>
                contact@aptis.com • +1 (555) 123-4567
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button color="inherit" sx={{ textTransform: 'none', justifyContent: 'center' }}>
                  About Us
                </Button>
                <Button color="inherit" sx={{ textTransform: 'none', justifyContent: 'center' }}>
                  Courses
                </Button>
                <Button color="inherit" sx={{ textTransform: 'none', justifyContent: 'center' }}>
                  Contact
                </Button>
                <Button color="inherit" sx={{ textTransform: 'none', justifyContent: 'center' }}>
                  Support
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Follow Us
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                Stay connected for updates and tips
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleLoginClick}
                sx={{ 
                  borderColor: 'white',
                  color: 'white',
                  textTransform: 'none',
                  '&:hover': { 
                    backgroundColor: 'white', 
                    color: '#333333' 
                  }
                }}
              >
                Join Our Community
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ borderTop: '1px solid #555555', mt: 6, pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              © 2024 APTIS Learning Platform. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}