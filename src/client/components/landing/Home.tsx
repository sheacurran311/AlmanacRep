import React from 'react';
import { Box, Container, Typography, Button, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section with gradient background */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #101636, #5384c8)',
          color: 'white',
          py: { xs: 6, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h2" 
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  background: 'linear-gradient(135deg, #ffffff, #e0e0e0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Almanac Labs
              </Typography>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  mb: 3,
                  fontSize: { xs: '1.2rem', md: '1.5rem' },
                  color: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                Revolutionizing Loyalty & Rewards Programs
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 4,
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  lineHeight: 1.6
                }}
              >
                Build powerful loyalty programs for sports teams, leagues, events, musicians, 
                and artists with blockchain technology and Web3 integration.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  background: 'linear-gradient(135deg, #dd20be, #5384c8)',
                  color: 'white',
                  py: { xs: 1, md: 1.5 },
                  px: { xs: 3, md: 4 },
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #c01ba7, #4773b1)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                Get Started
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  textAlign: 'center',
                  transform: { md: 'translateY(-20px)' },
                  transition: 'transform 0.5s ease'
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '400px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #dd20be, #5384c8)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="h3" color="white" align="center">
                    Almanac Labs Platform
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Offering Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography 
          variant="h3" 
          align="center" 
          gutterBottom
          sx={{
            fontWeight: 700,
            fontSize: { xs: '2rem', md: '2.5rem' },
            mb: 4,
            background: 'linear-gradient(135deg, #101636, #5384c8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Who We Help
        </Typography>
        <Typography 
          variant="body1" 
          align="center" 
          sx={{ 
            maxWidth: 800, 
            mx: 'auto', 
            mb: 6,
            fontSize: { xs: '1rem', md: '1.1rem' }
          }}
        >
          Our platform helps sports teams, leagues, events, musicians, and artists engage their fans 
          with unique and innovative loyalty programs that offer more than just points.
        </Typography>
        <Grid container spacing={4}>
          {[
            {
              title: 'Sports Teams & Leagues',
              description: 'Reward your fans with exclusive NFTs and live event moments. Create loyalty programs that foster deeper engagement.'
            },
            {
              title: 'Musicians & Artists',
              description: 'Connect with your audience through collectible NFTs and exclusive AR experiences to build lifelong fan loyalty.'
            },
            {
              title: 'Live Events',
              description: 'Capture and distribute memorable moments as NFTs to attendees, creating lasting connections with fans.'
            }
          ].map((offering) => (
            <Grid item xs={12} md={4} key={offering.title}>
              <Paper 
                elevation={2}
                sx={{
                  p: 4,
                  height: '100%',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                  background: 'linear-gradient(135deg, #ffffff, #f5f5f5)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                    background: 'linear-gradient(135deg, #f8f8f8, #ffffff)'
                  }
                }}
              >
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: '#101636',
                    fontSize: { xs: '1.25rem', md: '1.5rem' }
                  }}
                >
                  {offering.title}
                </Typography>
                <Typography 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    lineHeight: 1.6
                  }}
                >
                  {offering.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
        py: { xs: 6, md: 10 }
      }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            align="center" 
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '2.5rem' },
              mb: 4,
              background: 'linear-gradient(135deg, #101636, #5384c8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Features
          </Typography>
          <Grid container spacing={4}>
            {[
              {
                title: 'NFT Rewards',
                description: 'Create unique digital collectibles as rewards that can be traded and shared'
              },
              {
                title: 'AR Experiences',
                description: 'Engage users with immersive augmented reality experiences'
              },
              {
                title: 'Multi-tenant Platform',
                description: 'Scale your loyalty program across multiple brands with ease'
              },
              {
                title: 'Real-time Analytics',
                description: 'Track engagement metrics and program performance in real-time'
              },
              {
                title: 'Campaign Management',
                description: 'Create and manage targeted promotional campaigns'
              },
              {
                title: 'Blockchain Security',
                description: 'Ensure data integrity with secure blockchain technology'
              }
            ].map((feature) => (
              <Grid item xs={12} sm={6} md={4} key={feature.title}>
                <Paper 
                  elevation={2}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                    background: 'linear-gradient(135deg, #ffffff, #f5f5f5)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                      background: 'linear-gradient(135deg, #f8f8f8, #ffffff)'
                    }
                  }}
                >
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      color: '#101636',
                      fontSize: { xs: '1.25rem', md: '1.5rem' }
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      lineHeight: 1.6
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #dd20be, #5384c8)',
          color: 'white',
          py: { xs: 6, md: 8 },
          mt: 8
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              mb: 3
            }}
          >
            Ready to transform your loyalty program?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', md: '1.1rem' },
              mb: 4,
              opacity: 0.9
            }}
          >
            Join Almanac Labs today and start creating experiences your fans will love.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              mt: 4,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              py: { xs: 1, md: 1.5 },
              px: { xs: 3, md: 4 },
              fontSize: { xs: '1rem', md: '1.1rem' },
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
                transform: 'scale(1.05)'
              }
            }}
          >
            Get Started Now
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
