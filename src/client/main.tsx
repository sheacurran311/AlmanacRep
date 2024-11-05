import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

// Enhanced WebSocket error handling and reconnection logic
if (import.meta.hot) {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsHost = import.meta.env.DEV ? window.location.hostname : window.location.host;
  const wsPort = import.meta.env.DEV && !window.location.hostname.includes('.repl.co') ? ':3001' : '';
  const wsUrl = `${wsProtocol}//${wsHost}${wsPort}/_hmr`;
  
  console.log('[HMR] Configuring WebSocket connection:', wsUrl);
  
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  let reconnectTimeout: number | undefined;
  
  const handleConnectionError = () => {
    if (reconnectTimeout) {
      window.clearTimeout(reconnectTimeout);
    }

    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 10000);
      console.log(`[HMR] Reconnection attempt ${reconnectAttempts} of ${maxReconnectAttempts} in ${delay}ms`);
      
      reconnectTimeout = window.setTimeout(() => {
        console.log('[HMR] Attempting to reconnect...');
        if (import.meta.hot) {
          import.meta.hot.send('ping');
        }
      }, delay);
    } else {
      console.error('[HMR] Maximum reconnection attempts reached');
      // Only reload if we're not in a Replit environment
      if (!window.location.hostname.includes('.repl.co')) {
        window.location.reload();
      }
    }
  };

  import.meta.hot.on('vite:beforeUpdate', (payload: any) => {
    console.log('[HMR] Update received:', payload.type);
    reconnectAttempts = 0;
  });

  import.meta.hot.on('vite:error', (err: Error) => {
    console.error('[HMR] Error:', err);
    handleConnectionError();
  });

  import.meta.hot.on('vite:ws:disconnect', () => {
    console.log('[HMR] WebSocket disconnected');
    handleConnectionError();
  });

  import.meta.hot.on('vite:ws:connect', () => {
    console.log('[HMR] WebSocket connected successfully');
    reconnectAttempts = 0;
    if (reconnectTimeout) {
      window.clearTimeout(reconnectTimeout);
      reconnectTimeout = undefined;
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[HMR] Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
