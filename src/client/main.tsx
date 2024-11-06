import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    console.log('[HMR] About to update...');
  });

  import.meta.hot.on('vite:afterUpdate', () => {
    console.log('[HMR] Updated!');
  });

  import.meta.hot.on('vite:error', (err) => {
    console.error('[HMR] Error:', err);
  });
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
