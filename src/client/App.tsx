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

    const setupConnectionMonitoring = async () => {
      if (!mounted) return;

      const isConnected = await checkConnection();

      if (!isConnected && mounted && connection.retryCount < 5) {
        // Exponential backoff for retries
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
    };
  }, [connection.retryCount]);

  const handleErrorBoundaryReset = () => {
    setConnection({
      status: 'connecting',
      lastError: null,
      retryCount: 0
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
              </Box>
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StyledEngineProvider>
  );
};

export default App;
