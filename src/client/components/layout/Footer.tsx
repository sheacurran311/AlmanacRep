import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  IconButton,
} from '@mui/material';
import { Link } from 'react-router-dom';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import { getSignedUrl } from '../../utils/setupEnv';

const Footer: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState('/almanaclogo.png');

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const url = await getSignedUrl('almanaclogo.png');
        setLogoUrl(url);
      } catch (error) {
        console.error('Error loading logo:', error);
        // Keep the default local path
      }
    };
    loadLogo();
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#101636',
        color: 'white',
        py: 6,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ mb: 2 }}>
              <img
                src={logoUrl}
                alt="Almanac Labs"
                style={{
                  height: '50px',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))'
                }}
                loading="lazy"
                onError={(e) => {
                  console.error('Error loading logo:', e);
                  const target = e.currentTarget as HTMLImageElement;
                  target.src = '/placeholder-logo.png';
                  target.onerror = null;
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Revolutionizing loyalty and rewards programs with blockchain technology
              and Web3 integration.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                component="a"
                href="https://twitter.com/almanaclabs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                sx={{ 
                  color: 'white',
                  '&:hover': { 
                    color: '#1DA1F2',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://linkedin.com/company/almanaclabs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                sx={{ 
                  color: 'white',
                  '&:hover': { 
                    color: '#0A66C2',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://github.com/almanaclabs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                sx={{ 
                  color: 'white',
                  '&:hover': { 
                    color: '#6e5494',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <GitHubIcon />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { title: 'Home', path: '/' },
                { title: 'About', path: '/about' },
                { title: 'Register', path: '/register' },
                { title: 'Login', path: '/login' }
              ].map((link) => (
                <Link
                  key={link.title}
                  to={link.path}
                  style={{ 
                    color: 'white',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                >
                  <Typography 
                    variant="body2"
                    sx={{ 
                      '&:hover': { 
                        color: '#5384c8'
                      }
                    }}
                  >
                    {link.title}
                  </Typography>
                </Link>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Contact Us
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Email: contact@almanaclabs.com
            </Typography>
            <Typography variant="body2">
              Location: San Francisco, CA
            </Typography>
          </Grid>
        </Grid>

        <Box
          sx={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            mt: 4,
            pt: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="rgba(255, 255, 255, 0.6)">
            © {new Date().getFullYear()} Almanac Labs. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
