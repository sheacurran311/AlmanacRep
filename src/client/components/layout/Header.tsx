import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Button,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { objectStorage } from '../../utils/setupEnv';

const pages = [
  { title: 'Home', path: '/' },
  { title: 'About', path: '/about' },
  { title: 'Register', path: '/register' },
  { title: 'Login', path: '/login' }
];

const Header: React.FC = () => {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchLogo = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        setError(null);
        const url = await objectStorage.getSignedUrl('almanaclogo.png');
        if (mounted) {
          setLogoUrl(url);
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
        if (mounted) {
          setError('Failed to load logo');
          setLogoUrl('/placeholder-logo.png');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchLogo();

    return () => {
      mounted = false;
    };
  }, []);

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

  const handleCloseError = () => {
    setError(null);
  };

  const renderLogo = () => (
    loading ? (
      <CircularProgress size={24} sx={{ color: 'white' }} />
    ) : (
      <img
        src={logoUrl || '/placeholder-logo.png'}
        alt="Almanac Labs"
        style={{
          height: '40px',
          width: 'auto',
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))'
        }}
        loading="lazy"
        onError={(e) => {
          console.error('Error loading logo:', e);
          const target = e.currentTarget;
          target.src = '/placeholder-logo.png';
          target.onerror = null;
        }}
      />
    )
  );

  return (
    <>
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
                  <MenuItem 
                    key={page.title} 
                    onClick={() => handleNavigation(page.path)}
                  >
                    <Typography textAlign="center">{page.title}</Typography>
                  </MenuItem>
                ))}
                {user && (
                  <MenuItem onClick={logout}>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
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
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Header;