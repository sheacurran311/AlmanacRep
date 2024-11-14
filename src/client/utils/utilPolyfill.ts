import type { InspectOptions } from 'util';

const createDebugLog = (section: string) => {
  return (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${section}]`, ...args);
    }
  };
};

const createInspect = () => {
  return (obj: any, options?: InspectOptions): string => {
    try {
      if (obj === null) return 'null';
      if (obj === undefined) return 'undefined';
      if (typeof obj === 'function') return obj.toString();
      if (typeof obj !== 'object') return String(obj);
      
      const seen = new WeakSet();
      const inspect = (val: any, depth: number): string => {
        if (depth < 0) return '...';
        if (val === null) return 'null';
        if (val === undefined) return 'undefined';
        if (typeof val === 'function') return val.toString();
        if (typeof val !== 'object') return String(val);
        if (seen.has(val)) return '[Circular]';
        
        seen.add(val);
        
        if (Array.isArray(val)) {
          return `[ ${val.map(v => inspect(v, depth - 1)).join(', ')} ]`;
        }
        
        const entries = Object.entries(val)
          .map(([k, v]) => `${k}: ${inspect(v, depth - 1)}`);
        return `{ ${entries.join(', ')} }`;
      };
      
      return inspect(obj, options?.depth ?? 2);
    } catch (error) {
      return String(obj);
    }
  };
};

const utilAPI = {
  // Basic utility functions
  format: (format: string, ...args: any[]): string => {
    try {
      let i = 0;
      return format.replace(/%[sdj%]/g, (match: string): string => {
        if (match === '%%') return '%';
        if (i >= args.length) return match;
        switch (match) {
          case '%s': return String(args[i++]);
          case '%d': return String(Number(args[i++]));
          case '%j':
            try {
              return JSON.stringify(args[i++]);
            } catch (_) {
              return '[Circular]';
            }
          default: return match;
        }
      });
    } catch (error) {
      return format;
    }
  },

  // Type checking utilities
  types: {
    isArray: Array.isArray,
    isBoolean: (obj: any): obj is boolean => typeof obj === 'boolean',
    isBuffer: (_obj: any): boolean => false,
    isDate: (obj: any): obj is Date => obj instanceof Date,
    isError: (obj: any): obj is Error => obj instanceof Error,
    isFunction: (obj: any): obj is Function => typeof obj === 'function',
    isNull: (obj: any): obj is null => obj === null,
    isNullOrUndefined: (obj: any): obj is null | undefined => obj == null,
    isNumber: (obj: any): obj is number => typeof obj === 'number' && !isNaN(obj),
    isObject: (obj: any): obj is object => obj !== null && typeof obj === 'object',
    isPrimitive: (obj: any): obj is string | number | boolean | null | undefined => 
      obj === null || (typeof obj !== 'object' && typeof obj !== 'function'),
    isRegExp: (obj: any): obj is RegExp => obj instanceof RegExp,
    isString: (obj: any): obj is string => typeof obj === 'string',
    isSymbol: (obj: any): obj is symbol => typeof obj === 'symbol',
    isUndefined: (obj: any): obj is undefined => obj === undefined
  },

  // Safe implementations of commonly used util functions
  debuglog: createDebugLog,
  inspect: createInspect(),

  // Additional utility functions
  inherits: (ctor: any, superCtor: any): void => {
    if (!ctor || !superCtor) {
      throw new TypeError('Cannot set prototype to undefined');
    }
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
  },

  promisify: (fn: Function) => {
    return (...args: any[]): Promise<any> => {
      return new Promise((resolve, reject) => {
        fn(...args, (err: Error | null, ...result: any[]) => {
          if (err) reject(err);
          else resolve(result.length === 1 ? result[0] : result);
        });
      });
    };
  }
};

export default Object.freeze(utilAPI);

export const {
  debuglog,
  inspect,
  inherits,
  promisify,
  format,
  types
} = utilAPI;
