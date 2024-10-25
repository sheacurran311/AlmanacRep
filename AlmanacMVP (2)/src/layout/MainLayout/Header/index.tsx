import React from 'react';
import { AppBar, IconButton, Toolbar, useMediaQuery, Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const Header = ({ open, handleDrawerToggle }) => {
  const theme = useTheme();
  const matchDownMd = useMediaQuery(theme.breakpoints.down('lg'));
  const { signOut, client } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: theme.palette.background.default,
        transition: open ? theme.transitions.create('width') : 'none'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerToggle}
          edge="start"
          sx={{
            marginRight: '36px',
            ...(open && { display: 'none' })
          }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: theme.palette.primary.main }}>
          Almanac Labs
        </Typography>
        {client && (
          <Typography variant="subtitle1" sx={{ mr: 2, color: theme.palette.secondary.main }}>
            {client.companyName}
          </Typography>
        )}
        <Button 
          color="primary" 
          variant="contained" 
          onClick={handleLogout}
          sx={{ 
            bgcolor: theme.palette.accent.main,
            '&:hover': {
              bgcolor: theme.palette.accent.dark,
            }
          }}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;