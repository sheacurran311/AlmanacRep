import './utils/setupEnv';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

// Create React root with error boundary wrapper
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Setup Vite HMR
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    console.log('[HMR] About to update');
  });

  import.meta.hot.on('vite:afterUpdate', () => {
    console.log('[HMR] Updated modules');
  });
}