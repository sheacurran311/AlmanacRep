import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { Box, Snackbar, Alert, CircularProgress } from '@mui/material';
import AppRoutes from './routes';
import theme from './theme';
import { AuthProvider } from './hooks/useAuth';
import { Header, Footer } from './components/layout';
import ErrorBoundary from './components/ErrorBoundary';
import { getApiUrl } from './utils/setupEnv';
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

  const checkConnection = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/health`);
      if (response.ok) {
        setConnection({
          status: 'connected',
          lastError: null,
          retryCount: 0
        });
        return true;
      }
      throw new Error('Health check failed');
    } catch (error) {
      setConnection(prev => ({
        status: 'disconnected',
        lastError: error instanceof Error ? error.message : 'Connection failed',
        retryCount: prev.retryCount + 1
      }));
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    // Global unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      console.error('Unhandled promise rejection:', event.reason);
      setGlobalError(event.reason?.message || 'An unexpected error occurred');
    };

    // Global error handler
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      console.error('Global error:', event.error);
      setGlobalError(event.error?.message || 'An unexpected error occurred');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    const setupConnectionMonitoring = async () => {
      if (!mounted) return;

      const isConnected = await checkConnection();

      if (!isConnected && mounted && connection.retryCount < 5) {
        const delay = Math.min(1000 * Math.pow(2, connection.retryCount), 30000);
        retryTimeout = setTimeout(setupConnectionMonitoring, delay);
      }
    };

    const handleOnline = () => {
      if (mounted) {
        setConnection(prev => ({
          ...prev,
          status: 'connecting'
        }));
        setupConnectionMonitoring();
      }
    };

    const handleOffline = () => {
      if (mounted) {
        setConnection(prev => ({
          ...prev,
          status: 'disconnected',
          lastError: 'Internet connection lost'
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setupConnectionMonitoring();

    return () => {
      mounted = false;
      clearTimeout(retryTimeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [connection.retryCount]);

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
        <BrowserRouter>
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
        </BrowserRouter>
      </ErrorBoundary>
    </StyledEngineProvider>
  );
};

export default App;
