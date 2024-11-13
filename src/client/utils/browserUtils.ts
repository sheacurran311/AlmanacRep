// Type definitions for better type safety
type DebugLogFunc = (...args: any[]) => void;
type InspectOptions = { depth?: number; colors?: boolean };

// Browser-compatible utility functions
const debuglog = (section: string): DebugLogFunc => {
  const DEBUG = process.env.NODE_ENV === 'development';
  return (...args: any[]): void => {
    if (DEBUG) {
      console.log(`[${section}]`, ...args);
    }
  };
};

const inspect = (obj: any, options?: InspectOptions): string => {
  const opts = { depth: 2, colors: false, ...options };
  
  try {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj === 'function') return obj.toString();
    if (typeof obj !== 'object') return String(obj);
    
    const seen = new WeakSet();
    const stringify = (val: any, depth: number): string => {
      if (depth < 0) return '...';
      if (val === null) return 'null';
      if (val === undefined) return 'undefined';
      if (typeof val === 'function') return val.toString();
      if (typeof val !== 'object') return String(val);
      if (seen.has(val)) return '[Circular]';
      
      seen.add(val);
      
      if (Array.isArray(val)) {
        return `[ ${val.map(v => stringify(v, depth - 1)).join(', ')} ]`;
      }
      
      const entries = Object.entries(val)
        .map(([k, v]) => `${k}: ${stringify(v, depth - 1)}`);
      return `{ ${entries.join(', ')} }`;
    };
    
    return stringify(obj, opts.depth);
  } catch (error) {
    return String(obj);
  }
};

const inherits = (ctor: Function, superCtor: Function): void => {
  if (!ctor || !superCtor) {
    throw new TypeError('Cannot set prototype to undefined');
  }

  if (typeof ctor !== 'function') {
    throw new TypeError('The constructor must be a function');
  }

  if (typeof superCtor !== 'function') {
    throw new TypeError('The super constructor must be a function');
  }

  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  Object.defineProperty(ctor, 'super_', {
    value: superCtor,
    writable: false,
    configurable: false,
    enumerable: false
  });
};

const promisify = <T extends Function>(fn: T) => {
  return (...args: any[]): Promise<any> => {
    return new Promise((resolve, reject) => {
      fn(...args, (err: Error | null, ...result: any[]) => {
        if (err) reject(err);
        else resolve(result.length === 1 ? result[0] : result);
      });
    });
  };
};

export { debuglog, inspect, inherits, promisify };
