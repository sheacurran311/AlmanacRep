import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

// Global error handling
window.addEventListener('error', (event) => {
  if (event.message.includes('WebSocket') || 
      event.message.includes('Failed to fetch')) {
    console.warn('Connection error:', event);
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('WebSocket') || 
      event.reason?.message?.includes('Failed to fetch')) {
    console.warn('Connection error:', event.reason);
    event.preventDefault();
  }
});

// Create root and render app
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log initial HMR connection
console.log('[HMR] Waiting for connection...');
