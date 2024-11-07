import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { Box, Snackbar, Alert } from '@mui/material';
import AppRoutes from './routes';
import theme from './theme';
import { AuthProvider } from '@client/hooks/useAuth';
import { Header, Footer } from './components/layout';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';

const App: React.FC = () => {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setConnectionError(null);
      setIsReconnecting(false);
    };

    const handleOffline = () => {
      setConnectionError('Connection lost. Attempting to reconnect...');
      setIsReconnecting(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionError) {
        // Check connection when tab becomes visible
        fetch('/health')
          .then(() => {
            setConnectionError(null);
            setIsReconnecting(false);
          })
          .catch(() => {
            setConnectionError('Connection issues persist. Please check your network.');
          });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Check if it's a connection-related error
      if (event.reason?.message?.includes('Failed to fetch') ||
          event.reason?.message?.includes('NetworkError') ||
          event.reason?.message?.includes('Network request failed')) {
        setConnectionError('Connection issue detected. Please check your network connection.');
        setIsReconnecting(true);
      }
      
      // Prevent the default browser handling
      event.preventDefault();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial connection check
    fetch('/health').catch(() => {
      setConnectionError('Unable to connect to server');
      setIsReconnecting(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectionError]);

  const handleErrorBoundaryReset = () => {
    // Trigger a health check when error boundary resets
    fetch('/health')
      .then(() => {
        setConnectionError(null);
        setIsReconnecting(false);
      })
      .catch(() => {
        setConnectionError('Connection issues persist. Please check your network.');
      });
  };

  return (
    <StyledEngineProvider injectFirst>
      <ErrorBoundary onReset={handleErrorBoundaryReset}>
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
                <Snackbar
                  open={!!connectionError}
                  autoHideDuration={isReconnecting ? null : 6000}
                  onClose={() => !isReconnecting && setConnectionError(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                  <Alert 
                    severity={isReconnecting ? "warning" : "error"}
                    variant="filled"
                    onClose={() => !isReconnecting && setConnectionError(null)}
                  >
                    {connectionError}
                    {isReconnecting && ' Attempting to reconnect...'}
                  </Alert>
                </Snackbar>
              </Box>
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StyledEngineProvider>
  );
};

export default App;
