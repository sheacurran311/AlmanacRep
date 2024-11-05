import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', (payload: { type: string }) => {
    console.log('[HMR] Update received:', payload.type);
  });

  import.meta.hot.on('vite:error', (err: Error) => {
    console.warn('[HMR] Error:', err);
  });

  // Handle HMR connection status
  let isConnected = false;
  
  import.meta.hot.on('vite:connect', () => {
    isConnected = true;
    console.log('[HMR] Connected');
  });

  import.meta.hot.on('vite:disconnect', () => {
    isConnected = false;
    console.log('[HMR] Disconnected');
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('WebSocket') || 
        event.reason?.message?.includes('Failed to fetch')) {
      console.warn('[HMR] Network-related rejection:', event.reason);
      event.preventDefault();
      
      // Attempt to reconnect if disconnected
      if (!isConnected && import.meta.hot) {
        console.log('[HMR] Attempting to reconnect...');
        import.meta.hot.send('ping');
      }
    }
  });
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
