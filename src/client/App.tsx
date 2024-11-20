import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider } from '@mui/material/styles';
import { Box, Snackbar, Alert, CircularProgress } from '@mui/material';
import AppRoutes from './routes';
import theme from './theme';
import { AuthProvider } from './hooks/useAuth';
import { Header, Footer } from './components/layout';
import ErrorBoundary from './components/ErrorBoundary';
import { healthCheckService, type HealthStatus } from './services/healthCheck';
import './styles/globals.css';

interface ConnectionState {
  status: 'connected' | 'disconnected' | 'connecting';
  lastError: string | null;
  retryCount: number;
}

const App: React.FC = () => {
  const [connection, setConnection] = useState<ConnectionState>({
    status: 'connecting',
    lastError: null,
    retryCount: 0
  });

  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleHealthStatusChange = useCallback((status: HealthStatus) => {
    setConnection(prev => ({
      status: status.status === 'healthy' ? 'connected' : 'disconnected',
      lastError: status.error || null,
      retryCount: prev.retryCount + (status.status === 'healthy' ? 0 : 1)
    }));
  }, []);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      console.error('Unhandled promise rejection:', event.reason);
      const errorMessage = event.reason?.message || 'An unexpected error occurred';
      setGlobalError(errorMessage);
    };

    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      console.error('Global error:', event.error);
      setGlobalError(event.error?.message || 'An unexpected error occurred');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Start health monitoring with a delay to allow router initialization
    setTimeout(() => {
      healthCheckService.startMonitoring(handleHealthStatusChange);
    }, 1000);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      healthCheckService.stopMonitoring();
    };
  }, [handleHealthStatusChange]);

  const handleErrorBoundaryReset = () => {
    setConnection({
      status: 'connecting',
      lastError: null,
      retryCount: 0
    });
    setGlobalError(null);
  };

  const handleCloseGlobalError = () => {
    setGlobalError(null);
  };

  return (
    <StyledEngineProvider injectFirst>
      <ErrorBoundary onReset={handleErrorBoundaryReset}>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                opacity: connection.status === 'connected' ? 1 : 0.7,
                transition: 'opacity 0.3s ease'
              }}
            >
              <Header />
              <Box sx={{ flexGrow: 1, position: 'relative' }}>
                {connection.status !== 'connected' && (
                  <Box
                    sx={{
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 1000,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}
                <AppRoutes />
              </Box>
              <Footer />
              <Snackbar
                open={connection.status !== 'connected'}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              >
                <Alert 
                  severity={connection.status === 'connecting' ? 'warning' : 'error'}
                  variant="filled"
                >
                  {connection.status === 'connecting' 
                    ? 'Connecting to server...' 
                    : connection.lastError || 'Connection lost'}
                </Alert>
              </Snackbar>
              <Snackbar
                open={!!globalError}
                autoHideDuration={6000}
                onClose={handleCloseGlobalError}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              >
                <Alert 
                  onClose={handleCloseGlobalError}
                  severity="error"
                  variant="filled"
                >
                  {globalError}
                </Alert>
              </Snackbar>
            </Box>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </StyledEngineProvider>
  );
};

export default App;
