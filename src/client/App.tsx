import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import theme from './theme';
import { AuthProvider } from '@client/hooks/useAuth';
import './styles/globals.css';

const App: React.FC = () => {
  return (
    <StyledEngineProvider injectFirst>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppRoutes />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </StyledEngineProvider>
  );
};

export default App;
