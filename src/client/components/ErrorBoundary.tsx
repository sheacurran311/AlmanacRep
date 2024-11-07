import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { Box, Typography, Button, Container, Alert, CircularProgress, Snackbar } from '@mui/material';
import { getWebSocketUrl } from '../utils/setupEnv';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
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
  wsRetryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private wsConnection: WebSocket | null = null;
  private maxReconnectAttempts = 50;
  private baseDelay = 1000;
  private maxDelay = 30000;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isRecovering: false,
    networkErrors: [],
    showNetworkError: false,
    wsRetryCount: 0
  };

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    this.initializeWebSocket();
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.cleanupWebSocket();
  }

  private cleanupWebSocket = () => {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  };

  private initializeWebSocket = () => {
    try {
      const wsUrl = getWebSocketUrl();
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.onopen = () => {
        console.debug('[WebSocket] Connection established');
        this.setState({ wsRetryCount: 0 });
      };

      this.wsConnection.onclose = () => {
        console.debug('[WebSocket] Connection closed');
        this.handleWebSocketReconnect();
      };

      this.wsConnection.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.handleWebSocketError(error);
      };
    } catch (error) {
      console.error('[WebSocket] Setup error:', error);
      this.handleWebSocketError(error);
    }
  };

  private handleWebSocketError = (error: any) => {
    const errorMessage = error instanceof Error ? error.message : 'WebSocket connection error';
    this.addNetworkError(errorMessage);
    this.handleWebSocketReconnect();
  };

  private handleWebSocketReconnect = () => {
    if (this.state.wsRetryCount >= this.maxReconnectAttempts) {
      this.addNetworkError('Max WebSocket reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.baseDelay * Math.pow(1.5, this.state.wsRetryCount),
      this.maxDelay
    );

    this.setState(
      prev => ({ wsRetryCount: prev.wsRetryCount + 1 }),
      () => {
        this.reconnectTimeout = setTimeout(() => {
          this.cleanupWebSocket();
          this.initializeWebSocket();
        }, delay);
      }
    );
  };

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
      showNetworkError: false,
      wsRetryCount: 0
    });
    this.initializeWebSocket();
  };

  private handleOffline = () => {
    this.addNetworkError('Internet connection lost');
    this.cleanupWebSocket();
  };

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', {
      error,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    this.setState({
      hasError: true,
      error,
      errorInfo
    });
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
        showNetworkError: false,
        wsRetryCount: 0
      });
      if (this.props.onReset) {
        this.props.onReset();
      }
      this.initializeWebSocket();
    }, 500);
  };

  private handleDismissNetworkError = () => {
    this.setState({ showNetworkError: false });
  };

  public render() {
    const { hasError, error, errorInfo, isRecovering, networkErrors, showNetworkError, wsRetryCount } = this.state;

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
              {errorInfo?.componentStack && (
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
            {wsRetryCount > 0 && wsRetryCount < this.maxReconnectAttempts && (
              <Typography variant="caption" display="block">
                Reconnection attempt {wsRetryCount} of {this.maxReconnectAttempts}
              </Typography>
            )}
          </Alert>
        </Snackbar>
      </>
    );
  }
}

export default ErrorBoundary;
