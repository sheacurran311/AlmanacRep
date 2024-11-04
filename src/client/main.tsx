import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Enhanced HMR setup
if (import.meta.hot) {
  const maxReconnectAttempts = 10;
  let reconnectCount = 0;
  let reconnectTimeout: number | null = null;

  const reconnect = () => {
    if (reconnectCount >= maxReconnectAttempts) {
      console.error('[HMR] Max reconnection attempts reached');
      return;
    }

    reconnectCount++;
    console.log(`[HMR] Attempting to reconnect (${reconnectCount}/${maxReconnectAttempts})`);
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    reconnectTimeout = window.setTimeout(() => {
      window.location.reload();
    }, 1000 * Math.min(reconnectCount, 5));
  };

  import.meta.hot.on('vite:beforeUpdate', (payload: any) => {
    console.log('[HMR] Update received:', payload.type);
  });

  import.meta.hot.on('vite:error', (err: Error) => {
    console.warn('[HMR] Error occurred:', err);
    reconnect();
  });

  import.meta.hot.on('vite:ws:disconnect', () => {
    console.log('[HMR] WebSocket disconnected');
    reconnect();
  });

  import.meta.hot.on('vite:ws:connect', () => {
    console.log('[HMR] WebSocket connected');
    reconnectCount = 0;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  });
}
