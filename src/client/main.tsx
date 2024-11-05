import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

if (import.meta.hot) {
  const maxRetries = 5;
  let retryCount = 0;
  let reconnectTimer: number | null = null;
  let isConnected = false;
  let lastConnectedTime = Date.now();

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const shouldAttemptReconnect = () => {
    const timeSinceLastConnection = Date.now() - lastConnectedTime;
    return !isConnected && timeSinceLastConnection > 2000;
  };

  const reconnect = () => {
    if (retryCount >= maxRetries) {
      console.warn('[HMR] Max retries reached, performing page reload...');
      window.location.reload();
      return;
    }

    if (shouldAttemptReconnect()) {
      clearReconnectTimer();
      
      const backoffDelay = Math.min(1000 * Math.pow(1.5, retryCount), 5000);
      console.log(`[HMR] Attempting to reconnect (${retryCount + 1}/${maxRetries}) in ${backoffDelay}ms`);
      
      reconnectTimer = window.setTimeout(() => {
        try {
          import.meta.hot?.send('ping');
          retryCount++;
        } catch (error) {
          console.error('[HMR] Failed to send ping:', error);
          reconnect();
        }
      }, backoffDelay);
    }
  };

  // Handle successful connection
  import.meta.hot.on('vite:connect', () => {
    console.log('[HMR] Connected');
    isConnected = true;
    retryCount = 0;
    lastConnectedTime = Date.now();
    clearReconnectTimer();
  });

  // Handle before update
  import.meta.hot.on('vite:beforeUpdate', (payload: any) => {
    console.log('[HMR] Applying update:', payload);
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
    reconnect();
  });

  // Handle WebSocket related errors
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('WebSocket') || 
        event.reason?.message?.includes('Failed to fetch') ||
        event.reason?.message?.includes('_hmr')) {
      console.warn('[HMR] Connection issue:', event.reason);
      event.preventDefault();
      reconnect();
    }
  });
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
