// Load polyfills and initialize environment
import './utils/initPolyfills';

import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './styles/globals.css';

// Initialize logging
const logError = (error: Error, info: { componentStack: string }) => {
  console.error('Application Error:', error);
  console.error('Component Stack:', info.componentStack);
};

// Mount application with proper error handling
const mountApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Failed to find root element. Please check your HTML template.');
  }

  const root = createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <ErrorBoundary onError={logError}>
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Enhanced HMR configuration
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    console.log('[HMR] Preparing to update modules...');
  });

  import.meta.hot.on('vite:afterUpdate', (updatedModules) => {
    console.log('[HMR] Updated modules:', updatedModules);
  });

  // Handle HMR errors
  import.meta.hot.on('vite:error', (error) => {
    console.error('[HMR] Update failed:', error);
  });
}

// Initialize the application
try {
  mountApp();
} catch (error) {
  console.error('Failed to mount application:', error);
  // Display a user-friendly error message
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Failed to load application. Please refresh the page.</div>';
}
