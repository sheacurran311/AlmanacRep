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

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const reconnect = () => {
    if (retryCount >= maxRetries) {
      console.warn('[HMR] Max retries reached, performing page reload...');
      window.location.reload();
      return;
    }

    clearReconnectTimer();
    const backoffDelay = Math.min(1000 * Math.pow(1.5, retryCount), 10000);
    
    reconnectTimer = window.setTimeout(() => {
      retryCount++;
      console.log(`[HMR] Attempting to reconnect (${retryCount}/${maxRetries})...`);
      import.meta.hot?.send('ping');
    }, backoffDelay);
  };

  import.meta.hot.on('vite:connect', () => {
    console.log('[HMR] Connected');
    retryCount = 0;
    clearReconnectTimer();
  });

  import.meta.hot.on('vite:disconnect', () => {
    console.log('[HMR] Disconnected');
    reconnect();
  });

  import.meta.hot.on('vite:error', (err: Error) => {
    console.error('[HMR] Error:', err);
    reconnect();
  });
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
