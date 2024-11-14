import { EventEmitter } from 'events';
import type { Transform as TransformType, Readable as ReadableType, Writable as WritableType } from 'stream';

interface StreamOptions {
  highWaterMark?: number;
  objectMode?: boolean;
}

// Base Stream class with proper prototype chain
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

  pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T {
    if (!destination || typeof destination.write !== 'function') {
      throw new Error('Invalid destination stream');
    }

    const shouldEndOnFinish = options?.end !== false;

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

    if (shouldEndOnFinish) {
      this.on('end', () => {
        try {
          if (typeof destination.end === 'function') {
            destination.end();
          }
        } catch (error) {
          this.emit('error', error);
        }
      });
    }

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

// Create prototype chain manually for browser compatibility
const ReadableProto = Object.create(Stream.prototype);
const WritableProto = Object.create(Stream.prototype);
const TransformProto = Object.create(Stream.prototype);

class Readable extends Stream implements ReadableType {
  private _reading: boolean;
  private _ended: boolean;
  private _readableState: { length: number; flowing: boolean | null };

  constructor(options?: StreamOptions) {
    super(options);
    this.readable = true;
    this._reading = false;
    this._ended = false;
    this._readableState = {
      length: 0,
      flowing: null
    };
    Object.setPrototypeOf(this, ReadableProto);
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

  pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T {
    return super.pipe(destination, options);
  }

  isPaused(): boolean {
    return this._readableState.flowing === false;
  }

  unpipe(dest?: NodeJS.WritableStream): this {
    this.removeAllListeners('data');
    this.removeAllListeners('end');
    if (dest) {
      dest.removeAllListeners('drain');
    }
    return this;
  }

  push(chunk: any, encoding?: BufferEncoding): boolean {
    if (chunk === null) {
      this._ended = true;
      this.emit('end');
      return false;
    }
    this.emit('data', chunk);
    return true;
  }
}

class Writable extends Stream implements WritableType {
  private _writableState: { ended: boolean; finishing: boolean };

  constructor(options?: StreamOptions) {
    super(options);
    this.writable = true;
    this._writableState = {
      ended: false,
      finishing: false
    };
    Object.setPrototypeOf(this, WritableProto);
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

    if (!this._writableState.ending && !this._writableState.finished) {
      if (chunk != null) {
        this.write(chunk, encoding as string);
      }
      
      this._writableState.ending = true;
      this._writableState.finished = true;
      this.emit('finish');
      this.emit('end');
    }

    if (callback) {
      callback();
    }
  }
}

class Transform extends Stream implements TransformType {
  constructor(options?: StreamOptions) {
    super(options);
    this.readable = true;
    this.writable = true;
    Object.setPrototypeOf(this, TransformProto);
  }

  _transform(chunk: any, _encoding: string, callback: (error?: Error | null, data?: any) => void): void {
    callback(null, chunk);
  }

  _flush(callback: (error?: Error | null, data?: any) => void): void {
    callback();
  }
}

// Create streamAPI with proper prototype inheritance
const streamAPI = {
  Stream,
  Readable,
  Writable,
  Transform,
  pipeline: (source: Stream, ...transforms: Stream[]): Stream => {
    return transforms.reduce((prev, next) => prev.pipe(next), source);
  },
  finished: (stream: Stream, callback: (error?: Error) => void): void => {
    stream.on('end', () => callback());
    stream.on('error', (err) => callback(err));
  }
};

// Ensure proper prototype chain is maintained
Object.setPrototypeOf(Readable.prototype, Stream.prototype);
Object.setPrototypeOf(Writable.prototype, Stream.prototype);
Object.setPrototypeOf(Transform.prototype, Stream.prototype);

export default streamAPI;
export { Stream, Readable, Writable, Transform };
export type { StreamOptions };
