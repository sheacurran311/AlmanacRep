import './processPolyfill';
import { EventEmitter } from 'events';
import streamAPI, { Stream, Readable, Writable, Transform } from './streamPolyfill';
import utilAPI from './utilPolyfill';

declare global {
  interface Window {
    process: NodeJS.Process;
  }
  var stream: typeof streamAPI;
  var util: typeof utilAPI;
}

// Initialize polyfills with proper prototype chain
const initializePolyfills = () => {
  if (typeof window === 'undefined') return;

  try {
    // Define non-enumerable properties on globalThis
    if (!globalThis.stream) {
      Object.defineProperty(globalThis, 'stream', {
        value: Object.freeze(streamAPI),
        writable: false,
        configurable: false,
        enumerable: false
      });
    }

    if (!globalThis.util) {
      Object.defineProperty(globalThis, 'util', {
        value: Object.freeze(utilAPI),
        writable: false,
        configurable: false,
        enumerable: false
      });
    }

    // Ensure process is available
    if (!globalThis.process) {
      Object.defineProperty(globalThis, 'process', {
        value: window.process || {},
        writable: true,
        configurable: true,
        enumerable: true
      });
    }

    console.log('[Polyfills] Successfully initialized stream and util polyfills');
  } catch (error) {
    console.error('[Polyfills] Error initializing polyfills:', error);
    throw error;
  }
};

// Initialize polyfills immediately
initializePolyfills();

// Export enhanced API
export { streamAPI as stream, utilAPI as util };
export type { Stream, Readable, Writable, Transform };