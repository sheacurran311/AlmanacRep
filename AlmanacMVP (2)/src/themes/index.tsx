import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Define your color palette
const colors = {
  primary: {
    main: '#101636',
    light: '#2c3a5c',
    dark: '#000014',
    contrastText: '#fff'
  },
  secondary: {
    main: '#5384c8',
    light: '#84b3fb',
    dark: '#215897',
    contrastText: '#fff'
  },
  accent: {
    main: '#dd20be',
    light: '#ff5cf1',
    dark: '#a7008d',
    contrastText: '#fff'
  }
};

const theme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

interface ThemeCustomizationProps {
  children: React.ReactNode;
}

const ThemeCustomization: React.FC<ThemeCustomizationProps> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ThemeCustomization;