import './processPolyfill';
import { EventEmitter } from 'events';
import streamAPI, { Stream, Readable, Writable, Transform } from './streamPolyfill';
import utilAPI from './utilPolyfill';

declare global {
  interface Window {
    process: any;
  }
  var stream: any;
  var util: any;
}

// Initialize polyfills with proper prototype chain
const initializePolyfills = () => {
  if (typeof window === 'undefined') return;

  try {
    // Create and validate EventEmitter
    const eventEmitter = new EventEmitter();
    if (!eventEmitter || typeof eventEmitter.emit !== 'function') {
      throw new Error('EventEmitter not properly initialized');
    }

    // Create stream classes with proper prototype chain
    class StreamBase extends EventEmitter {
      protected options: any;
      
      constructor(options: any = {}) {
        super();
        this.options = options;
      }

      pipe<T extends NodeJS.WritableStream>(destination: T): T {
        return streamAPI.Stream.prototype.pipe.call(this, destination);
      }
    }

    // Initialize stream implementations
    const streamModule = {
      Stream: class extends StreamBase {},
      Readable: class extends StreamBase {
        constructor(options?: any) {
          super(options);
          Object.setPrototypeOf(this, Readable.prototype);
        }
      },
      Writable: class extends StreamBase {
        constructor(options?: any) {
          super(options);
          Object.setPrototypeOf(this, Writable.prototype);
        }
      },
      Transform: class extends StreamBase {
        constructor(options?: any) {
          super(options);
          Object.setPrototypeOf(this, Transform.prototype);
        }
      },
      pipeline: streamAPI.pipeline,
      finished: streamAPI.finished,
      EventEmitter
    };

    // Ensure proper prototype chain for stream classes
    [streamModule.Readable, streamModule.Writable, streamModule.Transform].forEach(Cls => {
      if (Cls?.prototype) {
        Object.setPrototypeOf(Cls.prototype, streamModule.Stream.prototype);
      }
    });

    // Define non-enumerable globals with proper descriptors
    const defineGlobal = (key: string, value: any) => {
      if (!globalThis[key]) {
        Object.defineProperty(globalThis, key, {
          value: Object.freeze(value),
          writable: false,
          configurable: false,
          enumerable: false
        });
      }
    };

    // Define stream and util globals
    defineGlobal('stream', streamModule);
    defineGlobal('util', utilAPI);

    // Initialize process if needed
    if (!globalThis.process) {
      globalThis.process = window.process;
    }

    console.log('[Polyfills] Successfully initialized stream and util polyfills');
  } catch (error) {
    console.error('[Polyfills] Error initializing polyfills:', error);
    
    // Provide basic fallback implementation
    if (!globalThis.stream || !globalThis.util) {
      console.warn('[Polyfills] Using fallback implementation');
      const fallbackStream = {
        ...streamAPI,
        Stream: class extends EventEmitter {},
        Readable: class extends EventEmitter {},
        Writable: class extends EventEmitter {},
        Transform: class extends EventEmitter {}
      };
      
      if (!globalThis.stream) globalThis.stream = fallbackStream;
      if (!globalThis.util) globalThis.util = utilAPI;
    }
  }
};

// Initialize polyfills immediately
initializePolyfills();

// Export enhanced API
export { streamAPI as stream, utilAPI as util };
export type { Stream, Readable, Writable, Transform };
