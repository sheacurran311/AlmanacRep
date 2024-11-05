import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

if (import.meta.hot) {
  const maxRetries = 10;
  let retryCount = 0;
  let reconnectTimer: number | null = null;
  let isConnected = false;
  let lastConnectedTime = Date.now();
  let isReconnecting = false;

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const shouldAttemptReconnect = () => {
    if (isReconnecting) return false;
    const timeSinceLastConnection = Date.now() - lastConnectedTime;
    return timeSinceLastConnection > 3000; // Only attempt reconnect if more than 3 seconds since last connection
  };

  const reconnect = async () => {
    if (retryCount >= maxRetries) {
      console.warn('[HMR] Max retries reached, waiting for server...');
      retryCount = 0;
      return;
    }

    if (!isConnected && shouldAttemptReconnect() && !isReconnecting) {
      isReconnecting = true;
      clearReconnectTimer();
      
      const backoffDelay = Math.min(1000 * Math.pow(1.5, retryCount), 10000);
      console.log(`[HMR] Attempting to reconnect (${retryCount + 1}/${maxRetries}) in ${backoffDelay}ms`);
      
      reconnectTimer = window.setTimeout(async () => {
        try {
          console.log('[HMR] Sending ping...');
          await import.meta.hot?.send('ping');
          retryCount++;
        } catch (error) {
          console.error('[HMR] Failed to send ping:', error);
        } finally {
          isReconnecting = false;
          if (!isConnected) {
            reconnect();
          }
        }
      }, backoffDelay);
    }
  };

  // Handle successful connection
  import.meta.hot.on('vite:connect', () => {
    console.log('[HMR] Connected successfully');
    isConnected = true;
    retryCount = 0;
    lastConnectedTime = Date.now();
    clearReconnectTimer();
  });

  // Handle before update
  import.meta.hot.on('vite:beforeUpdate', (payload: any) => {
    console.log('[HMR] Applying update:', payload);
  });

  // Handle prune
  import.meta.hot.on('vite:prune', (data: any) => {
    console.log('[HMR] Module pruned:', data);
  });

  // Handle disconnect
  import.meta.hot.on('vite:disconnect', () => {
    console.log('[HMR] Disconnected');
    isConnected = false;
    reconnect();
  });

  // Handle errors
  import.meta.hot.on('vite:error', (err: Error) => {
    console.error('[HMR] Error:', err);
    isConnected = false;
    reconnect();
  });

  // Handle WebSocket related errors
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || '';
    const isWebSocketError = 
      errorMessage.includes('WebSocket') || 
      errorMessage.includes('Failed to fetch') || 
      errorMessage.includes('_hmr') ||
      errorMessage.includes('connection lost') ||
      errorMessage.includes('network error');

    if (isWebSocketError) {
      console.warn('[HMR] Connection issue:', event.reason);
      event.preventDefault();
      isConnected = false;
      reconnect();
    }
  });

  // Initialize connection status
  console.log('[HMR] Initializing connection...');
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
