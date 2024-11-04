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

// Enhanced HMR setup with better error handling
if (import.meta.hot) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = window.location.protocol === 'https:' ? '443' : '3000';
  const path = '/_hmr';

  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  const reconnectBackoff = 1000;

  const connect = () => {
    if (ws) {
      ws.close();
      ws = null;
    }

    const wsUrl = `${protocol}//${host}:${port}${path}`;
    console.log('[HMR] Connecting to', wsUrl);
    
    try {
      ws = new WebSocket(wsUrl);

      ws.addEventListener('open', () => {
        console.log('[HMR] Connected');
        reconnectAttempts = 0;
      });

      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            console.log('[HMR] Server acknowledged connection');
          }
        } catch (error) {
          console.warn('[HMR] Failed to parse message:', error);
        }
      });

      ws.addEventListener('close', () => {
        console.log('[HMR] Disconnected');
        ws = null;

        if (reconnectAttempts < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          console.log(`[HMR] Reconnecting in ${timeout}ms...`);
          setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, timeout);
        } else {
          console.error('[HMR] Max reconnection attempts reached');
        }
      });

      ws.addEventListener('error', (error) => {
        console.error('[HMR] WebSocket error:', error);
      });

    } catch (error) {
      console.error('[HMR] Failed to create WebSocket:', error);
    }
  };

  connect();

  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !ws) {
      console.log('[HMR] Page became visible, attempting to reconnect');
      reconnectAttempts = 0;
      connect();
    }
  });
}
