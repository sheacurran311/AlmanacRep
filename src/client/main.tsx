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
    // Exponential backoff with jitter
    const exponentialDelay = baseReconnectDelay * Math.pow(1.5, reconnectAttempts);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, maxReconnectDelay);
  };

  const attemptReconnect = () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error(`[HMR] Max reconnection attempts (${maxReconnectAttempts}) reached. Please refresh the page.`, {
        attempts: reconnectAttempts,
        wsUrl
      });
      return;
    }

    reconnectAttempts++;
    const nextDelay = getReconnectDelay();
    
    console.log(`[HMR] Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts}`, {
      wsUrl,
      nextDelay
    });
    
    clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
      if (!isConnected) {
        console.debug('[HMR] Triggering reconnection...');
        try {
          import.meta.hot?.send('vite:reconnect');
        } catch (error) {
          console.error('[HMR] Failed to send reconnect signal:', error);
        }
        attemptReconnect();
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
    console.debug('[HMR] Update pending:', payload);
  });

  import.meta.hot.on('vite:afterUpdate', (payload: any) => {
    console.log('[HMR] Update applied successfully:', payload);
    resetConnection();
  });

  import.meta.hot.on('vite:error', (err: Error) => {
    console.error('[HMR] Update error:', err);
    if (!isConnected) {
      attemptReconnect();
    }
  });

  import.meta.hot.on('vite:disconnect', () => {
    console.warn(`[HMR] Server disconnected. Attempting to reconnect to ${wsUrl}`);
    isConnected = false;
    attemptReconnect();
  });

  import.meta.hot.on('vite:connect', () => {
    console.log('[HMR] Server connected successfully');
    resetConnection();
  });

  // Global error handlers with detailed logging
  window.addEventListener('error', (event) => {
    console.error('[Error] Uncaught error:', {
      error: event.error,
      message: event.message,
      filename: event.filename,
      lineNo: event.lineno,
      colNo: event.colno,
      timestamp: new Date().toISOString()
    });
    event.preventDefault();
  });

  // Global Promise rejection handler with enhanced logging
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Error] Unhandled promise rejection:', {
      reason: event.reason,
      env: env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    // Prevent default handling
    event.preventDefault();

    // If it's a network-related error or WebSocket error, trigger reconnection
    const isNetworkError = event.reason?.message?.includes('Failed to fetch') ||
                          event.reason?.message?.includes('NetworkError') ||
                          event.reason?.message?.includes('Network request failed') ||
                          event.reason?.message?.includes('WebSocket') ||
                          event.reason?.message?.includes('ws://');

    if (isNetworkError && !isConnected) {
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
