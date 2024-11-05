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
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = import.meta.env.DEV ? window.location.hostname : window.location.host;
  const wsPort = import.meta.env.DEV ? '3001' : window.location.port;
  const wsUrl = `${wsProtocol}//${wsHost}${wsPort ? `:${wsPort}` : ''}/_hmr`;
  
  console.log('[HMR] Initial connection attempt to:', wsUrl);
  
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  let reconnectTimeout: number | null = null;
  
  const handleConnectionError = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 5000);
      console.log(`[HMR] Reconnection attempt ${reconnectAttempts} of ${maxReconnectAttempts} in ${delay}ms`);
      
      reconnectTimeout = window.setTimeout(() => {
        console.log('[HMR] Attempting to reconnect...');
        if (import.meta.hot) {
          import.meta.hot.send('ping');
        }
      }, delay);
    } else {
      console.error('[HMR] Maximum reconnection attempts reached');
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        z-index: 9999;
      `;
      overlay.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h2>Development Server Connection Lost</h2>
          <p>The connection to the development server was lost.</p>
          <button onclick="window.location.reload()" style="
            padding: 10px 20px;
            background: #646cff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">Reload Page</button>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  };

  import.meta.hot.on('vite:beforeUpdate', () => {
    console.log('[HMR] Update received');
    reconnectAttempts = 0;
  });

  import.meta.hot.on('vite:error', (err: any) => {
    console.error('[HMR] Error:', err);
    handleConnectionError();
  });

  import.meta.hot.on('vite:ws:disconnect', () => {
    console.log('[HMR] WebSocket disconnected');
    handleConnectionError();
  });

  import.meta.hot.on('vite:ws:connect', () => {
    console.log('[HMR] WebSocket connected');
    reconnectAttempts = 0;
    // Remove any existing overlay
    const overlay = document.querySelector('div[style*="position: fixed"]');
    if (overlay) {
      overlay.remove();
    }
  });
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
