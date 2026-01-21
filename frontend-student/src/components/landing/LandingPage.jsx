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

      {/* How It Works Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: '#FFFFFF' }}>
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
              How It Works
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
              Getting started with APTIS is simple and straightforward
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                step: '01',
                title: 'Register Your Account',
                description: 'Create your free account in just a few minutes with your email address'
              },
              {
                step: '02',
                title: 'Choose Your Course',
                description: 'Select from our comprehensive APTIS preparation courses tailored to your level'
              },
              {
                step: '03',
                title: 'Learn at Your Pace',
                description: 'Access course materials anytime, anywhere with flexible learning schedule'
              },
              {
                step: '04',
                title: 'Practice & Improve',
                description: 'Complete exercises, take mock tests, and track your progress in real-time'
              }
            ].map((item, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: '#1976D2',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {item.step}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333333' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666666', lineHeight: 1.6 }}>
                    {item.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
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
              Student Success Stories
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
              Hear from our successful students who achieved their APTIS certification goals
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                name: 'Sarah Johnson',
                role: 'Professional - Dubai',
                testimonial: 'APTIS helped me achieve my certification in just 3 months. The course material is comprehensive and the instructors are very supportive.',
                rating: 5
              },
              {
                name: 'Ahmed Hassan',
                role: 'Student - Cairo',
                testimonial: 'The interactive lessons and practice tests were exactly what I needed. I passed with flying colors thanks to this platform!',
                rating: 5
              },
              {
                name: 'Maria Garcia',
                role: 'Business Owner - Madrid',
                testimonial: 'Excellent learning experience. The flexible schedule allowed me to study while running my business. Highly recommended!',
                rating: 5
              }
            ].map((testimonial, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Card 
                  sx={{ 
                    p: 4, 
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid #E0E0E0',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': { 
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', mb: 3 }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Typography key={i} sx={{ color: '#FFB800', fontSize: '1.5rem' }}>★</Typography>
                    ))}
                  </Box>
                  <Typography variant="body1" sx={{ mb: 4, color: '#666666', lineHeight: 1.8, fontStyle: 'italic' }}>
                    "{testimonial.testimonial}"
                  </Typography>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333333' }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1976D2' }}>
                      {testimonial.role}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: '#FFFFFF' }}>
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
              Affordable Pricing Plans
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
              Choose the plan that works best for you
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {[
              {
                name: 'Basic',
                price: 'Free',
                period: 'Forever',
                features: ['Access to sample lessons', 'Basic practice exercises', 'Community support', 'Email support'],
                highlighted: false
              },
              {
                name: 'Professional',
                price: '$49',
                period: 'Per month',
                features: ['All Basic features', 'Full course access', 'Mock exams', 'Progress tracking', 'Priority support', 'Certificate included'],
                highlighted: true
              },
              {
                name: 'Premium',
                price: '$99',
                period: 'Per month',
                features: ['All Professional features', '1-on-1 tutoring sessions', 'Advanced analytics', 'Custom study plans', 'Lifetime access', '24/7 Support'],
                highlighted: false
              }
            ].map((plan, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Card 
                  sx={{ 
                    p: 4, 
                    height: '100%',
                    borderRadius: 3,
                    border: plan.highlighted ? '2px solid #1976D2' : '1px solid #E0E0E0',
                    position: 'relative',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  {plan.highlighted && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#1976D2',
                        color: 'white',
                        px: 3,
                        py: 0.5,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}
                    >
                      MOST POPULAR
                    </Box>
                  )}
                  
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#333333' }}>
                    {plan.name}
                  </Typography>
                  
                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="h3" 
                      sx={{ fontWeight: 'bold', color: '#1976D2', mb: 1 }}
                    >
                      {plan.price}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666666' }}>
                      {plan.period}
                    </Typography>
                  </Box>

                  <Button 
                    variant={plan.highlighted ? "contained" : "outlined"}
                    fullWidth
                    onClick={handleGetStartedClick}
                    sx={{ 
                      mb: 4,
                      backgroundColor: plan.highlighted ? '#1976D2' : 'transparent',
                      borderColor: '#1976D2',
                      color: plan.highlighted ? 'white' : '#1976D2',
                      textTransform: 'none',
                      py: 1.5,
                      fontWeight: '600',
                      '&:hover': { 
                        backgroundColor: plan.highlighted ? '#1565C0' : '#1976D2',
                        color: 'white'
                      }
                    }}
                  >
                    Get Started
                  </Button>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {plan.features.map((feature, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ color: '#1976D2', fontWeight: 'bold' }}>✓</Box>
                        <Typography variant="body2" sx={{ color: '#666666' }}>
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: '#F8F9FA' }}>
        <Container maxWidth="md">
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
              Frequently Asked Questions
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                question: 'What is APTIS certification?',
                answer: 'APTIS is a global English language test created by the British Council that measures English language skills used in business and professional contexts.'
              },
              {
                question: 'How long does the course take?',
                answer: 'The duration varies depending on your current level and learning pace. Most students complete the course in 8-12 weeks with consistent study.'
              },
              {
                question: 'Can I access the course on mobile?',
                answer: 'Yes, our platform is fully responsive and optimized for all devices including smartphones and tablets.'
              },
              {
                question: 'Is there a money-back guarantee?',
                answer: 'We offer a 30-day money-back guarantee if you are not satisfied with our courses.'
              },
              {
                question: 'Do you provide a certificate?',
                answer: 'Yes, upon completing the course, you receive a certificate of completion that you can share with employers.'
              },
              {
                question: 'Can I upgrade my plan anytime?',
                answer: 'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
              }
            ].map((faq, idx) => (
              <Grid item xs={12} key={idx}>
                <Card 
                  sx={{ 
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid #E0E0E0',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333333' }}>
                    Q: {faq.question}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666666', lineHeight: 1.6, pl: 2 }}>
                    A: {faq.answer}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Blog/News Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: '#FFFFFF' }}>
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
              Latest News & Resources
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
              Stay updated with the latest tips, news, and resources for APTIS preparation
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                date: 'Jan 15, 2025',
                title: 'Top 5 Tips to Pass APTIS Speaking Test',
                description: 'Learn proven strategies from our expert instructors to ace the speaking component of APTIS.',
                category: 'Tips & Tricks'
              },
              {
                date: 'Jan 10, 2025',
                title: 'Understanding the APTIS Grammar Section',
                description: 'A comprehensive guide to mastering grammar questions in the APTIS examination.',
                category: 'Study Guide'
              },
              {
                date: 'Jan 5, 2025',
                title: 'Success Story: From Zero to Hero',
                description: 'Read how Samantha improved her English score by 40 points in just 2 months.',
                category: 'Success Stories'
              }
            ].map((article, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Card 
                  sx={{ 
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid #E0E0E0',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <Box 
                    sx={{
                      height: 200,
                      background: `linear-gradient(135deg, #1976D2 0%, #1565C0 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '3rem'
                    }}
                  >
                    📰
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#1976D2', fontWeight: '600' }}>
                        {article.category}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#999999' }}>
                        {article.date}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333333' }}>
                      {article.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666666', lineHeight: 1.6 }}>
                      {article.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button 
              variant="outlined"
              sx={{ 
                borderColor: '#1976D2',
                color: '#1976D2',
                px: 4,
                py: 1.5,
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: '600',
                '&:hover': { 
                  backgroundColor: '#1976D2', 
                  color: 'white' 
                }
              }}
            >
              View All Articles
            </Button>
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