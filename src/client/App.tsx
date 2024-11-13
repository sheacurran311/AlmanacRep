import React, { useState, useEffect, useCallback } from 'react';
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

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

const App: React.FC = () => {
  const [connection, setConnection] = useState<ConnectionState>({
    status: 'connecting',
    lastError: null,
    retryCount: 0
  });

  const [globalError, setGlobalError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${getApiUrl()}/api/health`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
      if (error instanceof Error) {
        const errorMessage = error.name === 'AbortError' 
          ? 'Connection timeout' 
          : error.message;
        
        setConnection(prev => ({
          status: 'disconnected',
          lastError: errorMessage,
          retryCount: prev.retryCount + 1
        }));
      }
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      console.error('Unhandled promise rejection:', event.reason);
      const errorMessage = event.reason?.message || 'An unexpected error occurred';
      setGlobalError(errorMessage);

      // If it's a connection-related error, trigger a connection check
      if (errorMessage.toLowerCase().includes('network') || 
          errorMessage.toLowerCase().includes('connection')) {
        checkConnection();
      }
    };

    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      console.error('Global error:', event.error);
      setGlobalError(event.error?.message || 'An unexpected error occurred');
    };

    const setupConnectionMonitoring = async () => {
      if (!mounted) return;

      const isConnected = await checkConnection();

      if (!isConnected && mounted && connection.retryCount < MAX_RETRIES) {
        const delay = Math.min(RETRY_DELAY * Math.pow(2, connection.retryCount), 30000);
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

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setupConnectionMonitoring();

    return () => {
      mounted = false;
      clearTimeout(retryTimeout);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connection.retryCount, checkConnection]);

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
