// Import browser-compatible utility functions
import { debuglog, inspect, inherits } from './browserUtils';

// Create frozen util implementation
const util = Object.freeze({
  debuglog,
  inspect,
  inherits
});

// Make util available globally with proper property descriptors
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'util', {
    value: util,
    writable: false,
    configurable: false,
    enumerable: true
  });
}

export default util;