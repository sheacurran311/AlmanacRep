import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';

const About: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box py={8}>
        <Typography variant="h2" align="center" gutterBottom>
          About Almanac Labs
        </Typography>
        <Typography variant="h5" align="center" color="textSecondary" paragraph>
          Next-Generation Loyalty & Rewards Platform
        </Typography>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom>
                Our Mission
              </Typography>
              <Typography paragraph>
                At Almanac Labs, we're revolutionizing customer loyalty programs by combining
                traditional reward systems with cutting-edge blockchain technology and augmented reality experiences.
              </Typography>
              <Typography paragraph>
                Our platform enables businesses to create engaging, personalized loyalty programs
                that drive customer retention and brand advocacy through innovative digital experiences.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom>
                Technology
              </Typography>
              <Typography paragraph>
                Built on modern web technologies and blockchain infrastructure, our platform offers:
              </Typography>
              <ul>
                <li>Multi-tenant architecture for scalability</li>
                <li>NFT-based rewards and collectibles</li>
                <li>Augmented reality experiences</li>
                <li>Real-time analytics and insights</li>
                <li>Secure blockchain integration</li>
              </ul>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom>
                Features
              </Typography>
              <Grid container spacing={2}>
                {[
                  {
                    title: 'NFT Rewards',
                    description: 'Create unique digital collectibles as rewards'
                  },
                  {
                    title: 'AR Integration',
                    description: 'Engage customers with immersive AR experiences'
                  },
                  {
                    title: 'Analytics Dashboard',
                    description: 'Track engagement and program performance'
                  },
                  {
                    title: 'Multi-tenant Support',
                    description: 'Scale across multiple brands and businesses'
                  }
                ].map((feature) => (
                  <Grid item xs={12} md={6} key={feature.title}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography color="textSecondary">
                        {feature.description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default About;
