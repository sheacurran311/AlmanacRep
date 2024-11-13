import { EventEmitter } from 'events';

// Create base Stream class
class Stream extends EventEmitter {
  constructor() {
    super();
    // Define non-enumerable properties
    Object.defineProperties(this, {
      _readableState: {
        value: { objectMode: false, highWaterMark: 16384 },
        writable: true,
        configurable: false
      },
      _writableState: {
        value: { objectMode: false, highWaterMark: 16384 },
        writable: true,
        configurable: false
      }
    });
  }

  pipe(dest: any) {
    this.on('data', (chunk: any) => dest.write(chunk));
    this.on('end', () => dest.end());
    return dest;
  }

  read() {
    return null;
  }

  write(chunk: any) {
    this.emit('data', chunk);
    return true;
  }

  end() {
    this.emit('end');
  }
}

// Readable implementation
class Readable extends Stream {
  constructor() {
    super();
    Object.defineProperty(this, 'readable', {
      value: true,
      writable: false,
      configurable: false,
      enumerable: true
    });
  }
}

// Writable implementation
class Writable extends Stream {
  constructor() {
    super();
    Object.defineProperty(this, 'writable', {
      value: true,
      writable: false,
      configurable: false,
      enumerable: true
    });
  }
}

// Transform implementation
class Transform extends Stream {
  constructor() {
    super();
    Object.defineProperties(this, {
      readable: {
        value: true,
        writable: false,
        configurable: false,
        enumerable: true
      },
      writable: {
        value: true,
        writable: false,
        configurable: false,
        enumerable: true
      }
    });
  }
}

// Create frozen stream API with method implementations
const streamAPI = Object.freeze({
  Stream,
  Readable,
  Writable,
  Transform,
  // Add static methods
  finished(stream: any, callback: (error?: Error) => void) {
    stream.on('end', () => callback());
    stream.on('error', (err: Error) => callback(err));
  },
  pipeline(...args: any[]) {
    const streams = args.slice(0, -1);
    const callback = args[args.length - 1];
    
    let current = streams[0];
    for (let i = 1; i < streams.length; i++) {
      current = current.pipe(streams[i]);
    }
    
    streamAPI.finished(current, callback);
    return current;
  }
});

// Make stream available globally
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'stream', {
    value: streamAPI,
    writable: false,
    configurable: false,
    enumerable: true
  });
}

export default streamAPI;
export { Stream, Readable, Writable, Transform };
