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

// Create base class for all stream types
class BaseStream extends EventEmitter {
  protected options: any;
  
  constructor(options: any = {}) {
    super();
    this.options = options;
  }
}

// Initialize polyfills with proper prototype chain
const initializePolyfills = () => {
  if (typeof window === 'undefined') return;

  try {
    // Initialize EventEmitter first
    const eventEmitter = new EventEmitter();
    if (!eventEmitter || typeof eventEmitter.emit !== 'function') {
      throw new Error('EventEmitter initialization failed');
    }

    // Create stream implementations with proper inheritance
    const createStreamClass = (name: string, Base = BaseStream) => {
      return class extends Base {
        constructor(options?: any) {
          super(options);
          // Set proper name for debugging
          Object.defineProperty(this, 'name', {
            value: name,
            configurable: true,
            writable: false
          });
        }
      };
    };

    // Initialize stream module with proper prototype chain
    const StreamImpl = createStreamClass('Stream');
    const ReadableImpl = createStreamClass('Readable', StreamImpl);
    const WritableImpl = createStreamClass('Writable', StreamImpl);
    const TransformImpl = createStreamClass('Transform', StreamImpl);

    // Create stream module with proper implementations
    const streamModule = {
      Stream: StreamImpl,
      Readable: ReadableImpl,
      Writable: WritableImpl,
      Transform: TransformImpl,
      pipeline: streamAPI.pipeline,
      finished: streamAPI.finished,
      EventEmitter
    };

    // Define non-enumerable globals
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

    // Define stream and util globals with proper prototype chains
    defineGlobal('stream', streamModule);
    defineGlobal('util', utilAPI);

    // Ensure process is available
    if (!globalThis.process) {
      globalThis.process = window.process;
    }

    console.log('[Polyfills] Successfully initialized stream and util polyfills');
  } catch (error) {
    console.error('[Polyfills] Error initializing polyfills:', error);
    
    // Provide minimal fallback implementation
    const fallbackStream = {
      ...streamAPI,
      Stream: class extends EventEmitter {
        constructor() {
          super();
          console.warn('[Polyfills] Using fallback Stream implementation');
        }
      }
    };
    
    if (!globalThis.stream) globalThis.stream = fallbackStream;
    if (!globalThis.util) globalThis.util = utilAPI;
  }
};

// Initialize polyfills immediately
initializePolyfills();

// Export enhanced API
export { streamAPI as stream, utilAPI as util };
export type { Stream, Readable, Writable, Transform };
