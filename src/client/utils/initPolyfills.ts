import './processPolyfill';
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
    // Setup stream polyfill with proper prototype chain
    if (!globalThis.stream) {
      const streamDescriptor = {
        value: Object.freeze(streamAPI),
        writable: false,
        configurable: false,
        enumerable: false
      };

      // Ensure proper prototype chain
      Object.defineProperties(streamAPI.Stream.prototype, {
        pipe: {
          value: Stream.prototype.pipe,
          writable: true,
          configurable: true
        },
        pause: {
          value: Stream.prototype.pause,
          writable: true,
          configurable: true
        },
        resume: {
          value: Stream.prototype.resume,
          writable: true,
          configurable: true
        }
      });

      Object.defineProperty(globalThis, 'stream', streamDescriptor);
    }

    // Setup util polyfill
    if (!globalThis.util) {
      const utilDescriptor = {
        value: Object.freeze(utilAPI),
        writable: false,
        configurable: false,
        enumerable: false
      };

      Object.defineProperty(globalThis, 'util', utilDescriptor);
    }

    // Ensure process is available
    if (!globalThis.process) {
      const processDescriptor = {
        value: window.process || {},
        writable: true,
        configurable: true,
        enumerable: true
      };

      Object.defineProperty(globalThis, 'process', processDescriptor);
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
