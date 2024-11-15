import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Button,
  CircularProgress,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ImageComponent from '../shared/ImageComponent';

const pages = [
  { title: 'Home', path: '/' },
  { title: 'About', path: '/about' },
  { title: 'Register', path: '/register' },
  { title: 'Login', path: '/login' }
];

const Header: React.FC = () => {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleNavigation = (path: string) => {
    handleCloseNavMenu();
    navigate(path);
  };

  const handleLogoError = (error: Error) => {
    console.warn('[Header] Logo load error:', error.message);
  };

  const renderLogo = () => (
    <ImageComponent
      src="/assets/almanac-logo.svg"
      fallbackSrc="/assets/default-logo.svg"
      alt="Almanac Labs"
      style={{
        height: '40px',
        width: 'auto',
        objectFit: 'contain',
        filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))'
      }}
      loadingComponent={<CircularProgress size={24} />}
      onError={handleLogoError}
    />
  );

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: 'linear-gradient(135deg, #101636, #5384c8)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box 
            sx={{ 
              display: { xs: 'none', md: 'flex' },
              mr: 2,
              alignItems: 'center'
            }}
          >
            <Link to="/" aria-label="Home">
              {renderLogo()}
            </Link>
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pages.map((page) => (
                <Button
                  key={page.title}
                  onClick={() => handleNavigation(page.path)}
                  sx={{ 
                    color: 'text.primary',
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    px: 2
                  }}
                >
                  {page.title}
                </Button>
              ))}
              {user && (
                <Button
                  onClick={logout}
                  sx={{ 
                    color: 'text.primary',
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    px: 2
                  }}
                >
                  Logout
                </Button>
              )}
            </Menu>
          </Box>

          <Box 
            sx={{ 
              flexGrow: 1,
              display: { xs: 'flex', md: 'none' },
              justifyContent: 'center'
            }}
          >
            <Link to="/" aria-label="Home">
              {renderLogo()}
            </Link>
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end' }}>
            {pages.map((page) => (
              <Button
                key={page.title}
                onClick={() => handleNavigation(page.path)}
                sx={{ 
                  my: 2, 
                  color: 'white', 
                  display: 'block',
                  mx: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {page.title}
              </Button>
            ))}
            {user && (
              <Button
                onClick={logout}
                sx={{ 
                  my: 2, 
                  color: 'white', 
                  display: 'block',
                  mx: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Logout
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
