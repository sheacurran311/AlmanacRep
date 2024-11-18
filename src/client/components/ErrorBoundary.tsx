import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container, Alert, CircularProgress, Snackbar } from '@mui/material';
import { env } from '../utils/setupEnv';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
  networkErrors: Array<{
    id: string;
    message: string;
    timestamp: number;
  }>;
  showNetworkError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private reconnectTimeout: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isRecovering: false,
    networkErrors: [],
    showNetworkError: false
  };

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
  }

  private addNetworkError = (message: string) => {
    const newError = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      timestamp: Date.now()
    };

    this.setState(prev => ({
      networkErrors: [...prev.networkErrors, newError],
      showNetworkError: true
    }));
  };

  private handlePromiseRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    
    const isNetworkError = 
      event.reason?.message?.includes('Failed to fetch') ||
      event.reason?.message?.includes('NetworkError') ||
      event.reason?.message?.includes('Network request failed');

    if (isNetworkError) {
      this.addNetworkError(event.reason?.message || 'Network connection error');
    }
  };

  private handleOnline = () => {
    this.setState({
      networkErrors: [],
      showNetworkError: false
    });
  };

  private handleOffline = () => {
    this.addNetworkError('Internet connection lost');
  };

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', {
      error,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV
    });

    this.setState({
      hasError: true,
      error,
      errorInfo
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReload = () => {
    this.setState({ isRecovering: true });
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ isRecovering: true });
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false,
        networkErrors: [],
        showNetworkError: false
      });
      if (this.props.onReset) {
        this.props.onReset();
      }
    }, 500);
  };

  private handleDismissNetworkError = () => {
    this.setState({ showNetworkError: false });
  };

  public render() {
    const { hasError, error, errorInfo, isRecovering, networkErrors, showNetworkError } = this.state;

    if (hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="md">
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            py: 4
          }}>
            <Alert 
              severity="error" 
              variant="filled"
              sx={{ mb: 4, width: '100%' }}
            >
              <Typography variant="h6" gutterBottom>
                An error occurred
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {error?.message || 'An unexpected error occurred'}
              </Typography>
              {env.NODE_ENV === 'development' && errorInfo?.componentStack && (
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                    maxHeight: '200px',
                    bgcolor: 'rgba(0,0,0,0.1)',
                    p: 2,
                    borderRadius: 1,
                    fontSize: '0.75rem'
                  }}
                >
                  {errorInfo.componentStack}
                </Typography>
              )}
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={this.handleReset}
                disabled={isRecovering}
                startIcon={isRecovering && <CircularProgress size={20} color="inherit" />}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleReload}
                disabled={isRecovering}
              >
                Reload Page
              </Button>
            </Box>
          </Box>
        </Container>
      );
    }

    return (
      <>
        {this.props.children}
        <Snackbar
          open={showNetworkError}
          autoHideDuration={6000}
          onClose={this.handleDismissNetworkError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="warning" 
            variant="filled"
            onClose={this.handleDismissNetworkError}
          >
            {networkErrors[networkErrors.length - 1]?.message}
          </Alert>
        </Snackbar>
      </>
    );
  }
}

export default ErrorBoundary;
