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

// Enhanced HMR setup with simplified WebSocket handling
if (import.meta.hot) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = '3000';  // Force using port 3000
  
  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  
  const connect = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    
    const wsUrl = `${protocol}//${host}:${port}/_hmr`;
    console.log('[HMR] Connecting to', wsUrl);
    
    try {
      ws = new WebSocket(wsUrl);
      
      ws.addEventListener('open', () => {
        console.log('[HMR] Connected');
        reconnectAttempts = 0;
      });
      
      ws.addEventListener('error', (error) => {
        console.error('[HMR] WebSocket error:', error);
      });
      
      ws.addEventListener('close', () => {
        console.log('[HMR] Disconnected');
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          setTimeout(connect, 1000 * Math.min(reconnectAttempts, 3));
        }
      });
    } catch (error) {
      console.error('[HMR] Failed to create WebSocket:', error);
    }
  };
  
  connect();
}
