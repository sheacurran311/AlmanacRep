import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { Box } from '@mui/material';
import AppRoutes from './routes';
import theme from './theme';
import { AuthProvider } from '@client/hooks/useAuth';
import { Header, Footer } from './components/layout';
import './styles/globals.css';

const App: React.FC = () => {
  return (
    <StyledEngineProvider injectFirst>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh'
              }}
            >
              <Header />
              <Box sx={{ flexGrow: 1 }}>
                <AppRoutes />
              </Box>
              <Footer />
            </Box>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </StyledEngineProvider>
  );
};

export default App;
