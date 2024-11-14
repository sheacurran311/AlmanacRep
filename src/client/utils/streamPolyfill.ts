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
      try {
        const canContinue = destination.write(chunk);
        if (!canContinue) {
          this.pause?.();
        }
      } catch (error) {
        this.emit('error', error);
      }
    });

    destination.on('drain', () => {
      this.resume?.();
    });

    this.on('end', () => {
      try {
        destination.end?.();
      } catch (error) {
        this.emit('error', error);
      }
    });

    return destination;
  }

  pause(): this {
    this.emit('pause');
    return this;
  }

  resume(): this {
    this.emit('resume');
    return this;
  }
}

// Ensure proper prototype chain for browser environment
class Readable extends Stream implements ReadableType {
  private _reading: boolean;
  private _ended: boolean;

  constructor(options?: StreamOptions) {
    super(options);
    this.readable = true;
    this._reading = false;
    this._ended = false;
  }

  _read(_size?: number): void {
    if (!this._reading) {
      this._reading = true;
      Promise.resolve().then(() => {
        this._reading = false;
        this.emit('readable');
      });
    }
  }

  read(_size?: number): any {
    return null;
  }

  pipe<T extends NodeJS.WritableStream>(destination: T): T {
    return super.pipe(destination);
  }

  isPaused(): boolean {
    return false;
  }

  unpipe(dest?: NodeJS.WritableStream): this {
    this.removeAllListeners('data');
    this.removeAllListeners('end');
    if (dest) {
      dest.removeAllListeners('drain');
    }
    return this;
  }
}

class Writable extends Stream implements WritableType {
  constructor(options?: StreamOptions) {
    super(options);
    this.writable = true;
  }

  _write(chunk: any, _encoding: string, callback: (error?: Error | null) => void): void {
    try {
      this.emit('data', chunk);
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
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

// Create streamAPI with proper inheritance and prototype chain
const streamAPI = Object.create(null, {
  Stream: { value: Stream },
  Readable: { value: Readable },
  Writable: { value: Writable },
  Transform: { value: Transform },
  pipeline: {
    value: (source: Stream, ...transforms: Stream[]): Stream => {
      return transforms.reduce((prev, next) => prev.pipe(next), source);
    }
  },
  finished: {
    value: (stream: Stream, callback: (error?: Error) => void): void => {
      stream.on('end', () => callback());
      stream.on('error', (err) => callback(err));
    }
  }
});

// Freeze the API to prevent modifications
Object.freeze(streamAPI);

export default streamAPI;
export { Stream, Readable, Writable, Transform };
export type { StreamOptions };
