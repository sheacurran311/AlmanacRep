// Import browser-compatible utility functions
import { debuglog, inspect, inherits, promisify } from './browserUtils';

// Create frozen util implementation with proper type checking
const utilAPI = Object.freeze({
  // Core utility functions
  debuglog: (section: string) => debuglog(section),
  inspect: (obj: any, options?: any) => inspect(obj, options),
  inherits: (ctor: any, superCtor: any) => inherits(ctor, superCtor),
  promisify: (fn: Function) => promisify(fn),
  
  // Type checking utilities
  types: {
    isArray: Array.isArray,
    isBoolean: (obj: any): obj is boolean => typeof obj === 'boolean',
    isBuffer: (obj: any): boolean => false, // Browser doesn't have Buffer
    isDate: (obj: any): obj is Date => obj instanceof Date,
    isError: (obj: any): obj is Error => obj instanceof Error,
    isFunction: (obj: any): obj is Function => typeof obj === 'function',
    isNull: (obj: any): obj is null => obj === null,
    isNullOrUndefined: (obj: any): obj is null | undefined => obj == null,
    isNumber: (obj: any): obj is number => typeof obj === 'number',
    isObject: (obj: any): obj is object => obj !== null && typeof obj === 'object',
    isPrimitive: (obj: any): obj is string | number | boolean | null | undefined => 
      obj === null || (typeof obj !== 'object' && typeof obj !== 'function'),
    isRegExp: (obj: any): obj is RegExp => obj instanceof RegExp,
    isString: (obj: any): obj is string => typeof obj === 'string',
    isSymbol: (obj: any): obj is symbol => typeof obj === 'symbol',
    isUndefined: (obj: any): obj is undefined => obj === undefined,
  },

  // Additional browser-safe implementations
  format: (format: string, ...args: any[]): string => {
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
  }
});

// Export the frozen API and named exports
export default utilAPI;
export const {
  debuglog: utilDebuglog,
  inspect: utilInspect,
  inherits: utilInherits,
  promisify: utilPromisify,
  format: utilFormat,
  types
} = utilAPI;
