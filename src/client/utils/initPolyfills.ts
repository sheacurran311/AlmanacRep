import './processPolyfill';
import utilAPI from './utilPolyfill';

declare global {
  interface Window {
    process: NodeJS.Process;
  }
  var util: typeof utilAPI;
  var Buffer: typeof global.Buffer;
  interface ReadableStream {
    _readableState?: any;
  }
}

export class PolyfillError extends Error {
  constructor(message: string, public originalError?: Error, public context?: string) {
    super(message);
    this.name = 'PolyfillError';
    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

const initializeStreamPolyfills = () => {
  if (typeof window === 'undefined') return;

  try {
    // Initialize Buffer polyfill if not available
    if (!globalThis.Buffer) {
      const BufferPolyfill = {
        from: (data: string | ArrayBuffer | Uint8Array): Uint8Array => {
          if (data instanceof Uint8Array) return data;
          if (typeof data === 'string') {
            return new TextEncoder().encode(data);
          }
          return new Uint8Array(data);
        },
        alloc: (size: number, fill?: number): Uint8Array => {
          const buffer = new Uint8Array(size);
          if (typeof fill === 'number') {
            buffer.fill(fill);
          }
          return buffer;
        },
        isBuffer: (obj: any): boolean => obj instanceof Uint8Array,
        concat: (list: Uint8Array[], totalLength?: number): Uint8Array => {
          if (totalLength === undefined) {
            totalLength = list.reduce((acc, buf) => acc + buf.length, 0);
          }
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const buf of list) {
            result.set(buf, offset);
            offset += buf.length;
          }
          return result;
        }
      };

      Object.defineProperty(globalThis, 'Buffer', {
        value: BufferPolyfill,
        writable: false,
        configurable: false,
        enumerable: true,
      });
    }

    // Initialize stream polyfills with enhanced error handling
    if (!globalThis.ReadableStream.prototype._readableState) {
      try {
        Object.defineProperty(ReadableStream.prototype, '_readableState', {
          get() {
            try {
              return this._controller?.desiredSize ?? null;
            } catch (error) {
              console.warn('[Polyfills] Stream state access error:', error);
              return null;
            }
          },
          configurable: true,
        });
      } catch (error) {
        throw new PolyfillError(
          'Failed to initialize ReadableStream polyfill',
          error as Error,
          'stream'
        );
      }
    }

    console.log('[Polyfills] Successfully initialized stream polyfills');
  } catch (error) {
    console.error('[Polyfills] Stream initialization error:', error);
    throw new PolyfillError(
      'Failed to initialize stream polyfills',
      error as Error,
      'stream'
    );
  }
};

const initializeProcessPolyfill = () => {
  if (typeof window === 'undefined') return;

  try {
    if (!globalThis.process) {
      const processDescriptor = {
        value: {
          ...window.process,
          env: window.process?.env || {},
          nextTick: (fn: Function, ...args: any[]) => {
            try {
              queueMicrotask(() => {
                try {
                  fn(...args);
                } catch (error) {
                  console.error('[Polyfills] Process nextTick execution error:', error);
                }
              });
            } catch (error) {
              console.error('[Polyfills] Process nextTick scheduling error:', error);
              setTimeout(() => fn(...args), 0);
            }
          },
          _tickCallback: () => {},
          browser: true,
          version: '',
          versions: { node: '0.0.0' },
        },
        writable: true,
        configurable: true,
        enumerable: true,
      };
      Object.defineProperty(globalThis, 'process', processDescriptor);
    }
    console.log('[Polyfills] Successfully initialized process polyfill');
  } catch (error) {
    console.error('[Polyfills] Process initialization error:', error);
    throw new PolyfillError(
      'Failed to initialize process polyfill',
      error as Error,
      'process'
    );
  }
};

const initializeUtilPolyfill = () => {
  if (typeof window === 'undefined') return;

  try {
    if (!globalThis.util) {
      const utilDescriptor = {
        value: {
          ...utilAPI,
          inherits: function(ctor: any, superCtor: any) {
            if (ctor === undefined || ctor === null)
              throw new PolyfillError(
                'The constructor to inherit from must not be null',
                undefined,
                'util'
              );
            if (superCtor === undefined || superCtor === null)
              throw new PolyfillError(
                'The super constructor to inherit from must not be null',
                undefined,
                'util'
              );
            
            try {
              ctor.super_ = superCtor;
              Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
            } catch (error) {
              throw new PolyfillError(
                'Failed to set up inheritance',
                error as Error,
                'util'
              );
            }
          },
        },
        writable: false,
        configurable: false,
        enumerable: true,
      };

      Object.defineProperty(globalThis, 'util', utilDescriptor);
    }
    console.log('[Polyfills] Successfully initialized util polyfill');
  } catch (error) {
    console.error('[Polyfills] Util initialization error:', error);
    throw new PolyfillError(
      'Failed to initialize util polyfill',
      error as Error,
      'util'
    );
  }
};

const initializePolyfills = () => {
  const errors: PolyfillError[] = [];

  try {
    // Try to initialize each polyfill independently
    try {
      initializeProcessPolyfill();
    } catch (error) {
      errors.push(error as PolyfillError);
    }

    try {
      initializeUtilPolyfill();
    } catch (error) {
      errors.push(error as PolyfillError);
    }

    try {
      initializeStreamPolyfills();
    } catch (error) {
      errors.push(error as PolyfillError);
    }
    
    // Add global error handler for polyfill-related errors
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason instanceof PolyfillError) {
          console.error('[Polyfills] Unhandled polyfill error:', {
            message: event.reason.message,
            context: event.reason.context,
            originalError: event.reason.originalError
          });
          event.preventDefault();
        }
      });

      window.addEventListener('error', (event) => {
        if (event.error instanceof PolyfillError) {
          console.error('[Polyfills] Uncaught polyfill error:', {
            message: event.error.message,
            context: event.error.context,
            originalError: event.error.originalError
          });
          event.preventDefault();
        }
      });
    }

    if (errors.length > 0) {
      console.warn('[Polyfills] Some polyfills failed to initialize:', errors);
    } else {
      console.log('[Polyfills] Successfully initialized all polyfills');
    }
  } catch (error) {
    console.error('[Polyfills] Critical error initializing polyfills:', error);
    if (error instanceof PolyfillError) {
      throw error;
    }
    throw new PolyfillError(
      'Failed to initialize polyfills',
      error as Error,
      'initialization'
    );
  }
};

// Initialize polyfills immediately
initializePolyfills();

// Export util and remove the redundant PolyfillError export
export { utilAPI as util };
