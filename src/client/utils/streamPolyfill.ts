import { EventEmitter } from 'events';
import type { Transform as TransformType, Readable as ReadableType, Writable as WritableType } from 'stream';

interface StreamOptions {
  highWaterMark?: number;
  objectMode?: boolean;
}

// Base Stream class with proper inheritance
class Stream extends EventEmitter {
  readable: boolean;
  writable: boolean;
  protected _options: StreamOptions;

  constructor(options: StreamOptions = {}) {
    super();
    this.readable = false;
    this.writable = false;
    this._options = {
      highWaterMark: 16384,
      objectMode: false,
      ...options
    };
  }

  pipe<T extends NodeJS.WritableStream>(destination: T): T {
    if (!destination || typeof destination.write !== 'function') {
      throw new Error('Invalid destination stream');
    }

    this.on('data', (chunk: any) => {
      destination.write(chunk);
    });

    this.on('end', () => {
      destination.end?.();
    });

    return destination;
  }
}

// Browser-compatible implementations
class Readable extends Stream implements ReadableType {
  constructor(options?: StreamOptions) {
    super(options);
    this.readable = true;
  }

  _read(_size?: number): void {
    // Implementation for browser environment
  }

  read(_size?: number): any {
    return null;
  }

  pipe<T extends NodeJS.WritableStream>(destination: T): T {
    return super.pipe(destination);
  }
}

class Writable extends Stream implements WritableType {
  constructor(options?: StreamOptions) {
    super(options);
    this.writable = true;
  }

  _write(chunk: any, _encoding: string, callback: (error?: Error | null) => void): void {
    this.emit('data', chunk);
    callback();
  }

  write(chunk: any, encoding?: string | ((error?: Error | null) => void), callback?: (error?: Error | null) => void): boolean {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = undefined;
    }

    this._write(chunk, encoding as string, callback || (() => {}));
    return true;
  }

  end(chunk?: any, encoding?: string | (() => void), callback?: () => void): void {
    if (typeof chunk === 'function') {
      callback = chunk;
      chunk = null;
    }
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = undefined;
    }

    if (chunk != null) {
      this.write(chunk, encoding as string);
    }

    this.emit('finish');
    this.emit('end');
    if (callback) callback();
  }
}

class Transform extends Stream implements TransformType {
  constructor(options?: StreamOptions) {
    super(options);
    this.readable = true;
    this.writable = true;
  }

  _transform(chunk: any, _encoding: string, callback: (error?: Error | null, data?: any) => void): void {
    callback(null, chunk);
  }

  _flush(callback: (error?: Error | null, data?: any) => void): void {
    callback();
  }
}

// Create streamAPI with proper inheritance
const streamAPI = {
  Stream,
  Readable,
  Writable,
  Transform,
  // Implement basic stream utilities
  pipeline: (source: Stream, ...transforms: Stream[]): Stream => {
    return transforms.reduce((prev, next) => prev.pipe(next), source);
  },
  finished: (stream: Stream, callback: (error?: Error) => void): void => {
    stream.on('end', () => callback());
    stream.on('error', (err) => callback(err));
  }
};

export default streamAPI;
export { Stream, Readable, Writable, Transform };
export type { StreamOptions };
