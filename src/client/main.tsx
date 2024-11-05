import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

if (import.meta.hot) {
  const maxRetries = 3;
  let retryCount = 0;
  let reconnectTimer: number | null = null;

  const reconnect = () => {
    if (retryCount >= maxRetries) {
      console.warn('[HMR] Max retries reached, performing full reload...');
      window.location.reload();
      return;
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    console.log(`[HMR] Attempting to reconnect (${retryCount + 1}/${maxRetries})`);
    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
    
    reconnectTimer = window.setTimeout(() => {
      try {
        import.meta.hot?.send('ping');
        retryCount++;
      } catch (error) {
        console.error('[HMR] Failed to send ping:', error);
        reconnect();
      }
    }, delay);
  };

  const clearReconnectState = () => {
    retryCount = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  import.meta.hot.on('vite:beforeUpdate', () => {
    console.log('[HMR] Update received');
    clearReconnectState();
  });

  import.meta.hot.on('vite:connect', () => {
    console.log('[HMR] Connected');
    clearReconnectState();
  });

  import.meta.hot.on('vite:disconnect', () => {
    console.log('[HMR] Disconnected');
    reconnect();
  });

  import.meta.hot.on('vite:error', (err: Error) => {
    console.warn('[HMR] Error:', err);
    reconnect();
  });

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
