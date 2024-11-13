import './processPolyfill';
import { EventEmitter } from 'events';
import streamAPI, { Stream, Readable, Writable, Transform } from './streamPolyfill';
import utilAPI from './utilPolyfill';

// Initialize stream polyfills
if (typeof window !== 'undefined') {
  // Create EventEmitter instance first
  const eventEmitter = new EventEmitter();
  
  // Create proper prototype chain for Stream classes
  const streamImpl = {
    Stream,
    Readable,
    Writable,
    Transform,
    pipeline: streamAPI.pipeline,
    finished: streamAPI.finished,
    EventEmitter
  };

  // Ensure proper prototype inheritance with safe checks
  if (Stream?.prototype && eventEmitter) {
    Object.setPrototypeOf(Stream.prototype, EventEmitter.prototype);
  }
  if (Readable?.prototype && Stream?.prototype) {
    Object.setPrototypeOf(Readable.prototype, Stream.prototype);
  }
  if (Writable?.prototype && Stream?.prototype) {
    Object.setPrototypeOf(Writable.prototype, Stream.prototype);
  }
  if (Transform?.prototype && Stream?.prototype) {
    Object.setPrototypeOf(Transform.prototype, Stream.prototype);
  }

  // Define stream module globally with safe assignment
  if (!globalThis.stream) {
    Object.defineProperty(globalThis, 'stream', {
      value: Object.freeze(streamImpl),
      enumerable: true,
      configurable: false,
      writable: false
    });
  }

  // Initialize util polyfills
  if (!globalThis.util) {
    Object.defineProperty(globalThis, 'util', {
      value: Object.freeze(utilAPI),
      enumerable: true,
      configurable: false,
      writable: false
    });
  }

  // Ensure process is initialized
  if (!globalThis.process) {
    globalThis.process = window.process;
  }
}

export { streamAPI, utilAPI };
