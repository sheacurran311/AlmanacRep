import './utils/setupEnv';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { getWebSocketUrl, env } from './utils/setupEnv';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

// Enhanced WebSocket and HMR handling with proper error recovery and logging
if (import.meta.hot) {
  let isConnected = true;
  let reconnectAttempts = 0;
  let reconnectTimeout: NodeJS.Timeout;
  const maxReconnectAttempts = env.HMR_MAX_RETRIES;
  const baseReconnectDelay = env.HMR_RECONNECT_DELAY_MIN;
  const maxReconnectDelay = env.HMR_RECONNECT_DELAY_MAX;
  const wsUrl = getWebSocketUrl();

  const getReconnectDelay = () => {
    // Exponential backoff with jitter and capped maximum
    const exponentialDelay = baseReconnectDelay * Math.pow(1.5, reconnectAttempts);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, maxReconnectDelay);
  };

  const attemptReconnect = () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error(`[HMR] Max reconnection attempts (${maxReconnectAttempts}) reached.`, {
        attempts: reconnectAttempts,
        wsUrl,
        timestamp: new Date().toISOString()
      });
      return;
    }

    reconnectAttempts++;
    const nextDelay = getReconnectDelay();
    
    console.log(`[HMR] Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts}`, {
      wsUrl,
      nextDelay,
      timestamp: new Date().toISOString()
    });
    
    clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
      if (!isConnected) {
        console.debug('[HMR] Attempting reconnection...', {
          attempt: reconnectAttempts,
          timestamp: new Date().toISOString()
        });
        
        try {
          // Try to close existing connection if any
          if (import.meta.hot?.socket) {
            import.meta.hot.socket.close();
          }
          
          // Attempt reconnection
          import.meta.hot?.send('vite:reconnect');
          
          // Setup new connection timeout
          setTimeout(() => {
            if (!isConnected) {
              attemptReconnect();
            }
          }, env.HMR_TIMEOUT);
        } catch (error) {
          console.error('[HMR] Failed to initiate reconnection:', error);
          attemptReconnect();
        }
      }
    }, nextDelay);
  };

  const resetConnection = () => {
    console.debug('[HMR] Resetting connection state');
    isConnected = true;
    reconnectAttempts = 0;
    clearTimeout(reconnectTimeout);
  };

  // Enhanced error and event handlers with better logging
  import.meta.hot.on('vite:beforeUpdate', (payload: any) => {
    console.debug('[HMR] Update pending:', { 
      type: payload?.type,
      timestamp: new Date().toISOString()
    });
  });

  import.meta.hot.on('vite:afterUpdate', (payload: any) => {
    console.log('[HMR] Update applied successfully:', {
      type: payload?.type,
      timestamp: new Date().toISOString()
    });
    resetConnection();
  });

  import.meta.hot.on('vite:error', (err: Error) => {
    console.error('[HMR] Update error:', {
      error: err,
      timestamp: new Date().toISOString()
    });
    if (!isConnected) {
      attemptReconnect();
    }
  });

  import.meta.hot.on('vite:disconnect', () => {
    console.warn(`[HMR] Server disconnected. Attempting to reconnect to ${wsUrl}`, {
      timestamp: new Date().toISOString()
    });
    isConnected = false;
    attemptReconnect();
  });

  import.meta.hot.on('vite:connect', () => {
    console.log('[HMR] Server connected successfully', {
      wsUrl,
      timestamp: new Date().toISOString()
    });
    resetConnection();
  });

  // Global error handlers with enhanced WebSocket error handling
  window.addEventListener('error', (event) => {
    console.error('[Error] Uncaught error:', {
      error: event.error,
      message: event.message,
      filename: event.filename,
      lineNo: event.lineno,
      colNo: event.colno,
      timestamp: new Date().toISOString()
    });
    
    // Check if it's a WebSocket-related error
    if (event.message?.includes('WebSocket') || event.message?.includes('ws://')) {
      attemptReconnect();
    }
    
    event.preventDefault();
  });

  // Global Promise rejection handler with enhanced WebSocket handling
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Error] Unhandled promise rejection:', {
      reason: event.reason,
      env: env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    event.preventDefault();

    const isWebSocketError = 
      event.reason?.message?.includes('WebSocket') ||
      event.reason?.message?.includes('ws://') ||
      event.reason?.message?.includes('wss://');
    
    if (isWebSocketError && !isConnected) {
      attemptReconnect();
    }
  });
}

// Create React root with error boundary wrapper
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
