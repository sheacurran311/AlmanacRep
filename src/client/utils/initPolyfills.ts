import './processPolyfill';
import utilAPI from './utilPolyfill';

declare global {
  interface Window {
    process: NodeJS.Process;
  }
  var util: typeof utilAPI;
}

const initializePolyfills = () => {
  if (typeof window === 'undefined') return;

  try {
    // Initialize process polyfill
    if (!globalThis.process) {
      const processDescriptor = {
        value: window.process || {},
        writable: true,
        configurable: true,
        enumerable: true
      };
      Object.defineProperty(globalThis, 'process', processDescriptor);
    }

    // Initialize util polyfill
    if (!globalThis.util) {
      try {
        const utilDescriptor = {
          value: utilAPI,
          writable: false,
          configurable: false,
          enumerable: true
        };

        Object.defineProperty(globalThis, 'util', utilDescriptor);
      } catch (error) {
        console.error('[Polyfills] Util initialization error:', error);
        throw new Error('Failed to initialize util polyfill');
      }
    }

    console.log('[Polyfills] Successfully initialized polyfills');
  } catch (error) {
    console.error('[Polyfills] Critical error initializing polyfills:', error);
    throw error;
  }
};

// Initialize polyfills immediately
initializePolyfills();

// Export enhanced API
export { utilAPI as util };