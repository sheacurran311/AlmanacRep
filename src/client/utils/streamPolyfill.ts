import { EventEmitter } from 'events';

// Browser-specific stream implementation
class BrowserStream extends EventEmitter {
  private destroyed: boolean = false;

  constructor() {
    super();
    this.setMaxListeners(0);
  }

  destroy(error?: Error): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (error) {
      this.emit('error', error);
    }
    this.emit('close');
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }
}

// Browser-specific Readable implementation
class BrowserReadable extends BrowserStream {
  readable: boolean;
  private _readableState: {
    flowing: boolean | null;
    ended: boolean;
    length: number;
    buffer: any[];
    objectMode: boolean;
  };

  constructor(options: any = {}) {
    super();
    this.readable = true;
    this._readableState = {
      flowing: null,
      ended: false,
      length: 0,
      buffer: [],
      objectMode: !!options.objectMode
    };
  }

  read(size?: number): any {
    try {
      const state = this._readableState;
      
      if (state.buffer.length === 0) {
        return null;
      }

      if (size === undefined || size >= state.length) {
        const ret = state.objectMode ? state.buffer : Buffer.concat(state.buffer);
        state.buffer = [];
        state.length = 0;
        return ret;
      }

      return state.buffer.splice(0, size);
    } catch (error) {
      console.error('[BrowserReadable] Read error:', error);
      this.emit('error', error);
      return null;
    }
  }

  push(chunk: any): boolean {
    try {
      if (chunk === null) {
        this._readableState.ended = true;
        this.emit('end');
        return false;
      }

      if (this._readableState.flowing) {
        this.emit('data', chunk);
      } else {
        this._readableState.buffer.push(chunk);
        this._readableState.length += 1;
      }
      return true;
    } catch (error) {
      console.error('[BrowserReadable] Push error:', error);
      this.emit('error', error);
      return false;
    }
  }

  pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T {
    try {
      const shouldEnd = options?.end !== false;
      const source = this;

      function ondata(chunk: any) {
        if (destination.write(chunk) === false) {
          source.pause?.();
        }
      }

      source.on('data', ondata);

      function ondrain() {
        if (source.readable && source.resume) {
          source.resume();
        }
      }

      destination.on('drain', ondrain);

      const cleanup = () => {
        destination.removeListener('drain', ondrain);
        source.removeListener('data', ondata);
      };

      source.on('end', () => {
        cleanup();
        if (shouldEnd) {
          destination.end();
        }
      });

      source.on('close', cleanup);

      destination.on('error', (err: Error) => {
        cleanup();
        source.emit('error', err);
      });

      return destination;
    } catch (error) {
      console.error('[BrowserReadable] Pipe error:', error);
      this.emit('error', error);
      return destination;
    }
  }

  pause(): this {
    this._readableState.flowing = false;
    this.emit('pause');
    return this;
  }

  resume(): this {
    if (!this._readableState.flowing) {
      this._readableState.flowing = true;
      while (this._readableState.buffer.length) {
        const chunk = this.read();
        this.emit('data', chunk);
      }
    }
    return this;
  }

  isPaused(): boolean {
    return this._readableState.flowing === false;
  }
}

// Browser-specific Writable implementation
class BrowserWritable extends BrowserStream {
  writable: boolean;
  private _writableState: {
    ended: boolean;
    finishing: boolean;
    length: number;
    objectMode: boolean;
  };

  constructor(options: any = {}) {
    super();
    this.writable = true;
    this._writableState = {
      ended: false,
      finishing: false,
      length: 0,
      objectMode: !!options.objectMode
    };
  }

  write(chunk: any, encoding?: string | ((error?: Error | null) => void), cb?: (error?: Error | null) => void): boolean {
    try {
      if (typeof encoding === 'function') {
        cb = encoding;
        encoding = undefined;
      }

      if (this._writableState.ended) {
        const error = new Error('write after end');
        if (typeof cb === 'function') cb(error);
        this.emit('error', error);
        return false;
      }

      this._writableState.length += 1;
      this.emit('data', chunk);

      if (typeof cb === 'function') {
        cb();
      }

      return true;
    } catch (error) {
      console.error('[BrowserWritable] Write error:', error);
      if (typeof cb === 'function') cb(error as Error);
      this.emit('error', error);
      return false;
    }
  }

  end(chunk?: any, encoding?: string | (() => void), cb?: () => void): void {
    try {
      if (typeof chunk === 'function') {
        cb = chunk;
        chunk = null;
        encoding = undefined;
      }
      if (typeof encoding === 'function') {
        cb = encoding;
        encoding = undefined;
      }

      if (chunk !== undefined && chunk !== null) {
        this.write(chunk, encoding as string);
      }

      this._writableState.ended = true;
      this._writableState.finishing = true;
      this.emit('finish');
      
      if (typeof cb === 'function') {
        cb();
      }
    } catch (error) {
      console.error('[BrowserWritable] End error:', error);
      if (typeof cb === 'function') cb();
      this.emit('error', error);
    }
  }
}

// Browser-specific Transform implementation
class BrowserTransform extends BrowserStream {
  readable: boolean;
  writable: boolean;
  private _transformState: {
    objectMode: boolean;
  };

  constructor(options: any = {}) {
    super();
    this.readable = true;
    this.writable = true;
    this._transformState = {
      objectMode: !!options.objectMode
    };
  }

  _transform(chunk: any, encoding: string, callback: (error?: Error | null, data?: any) => void): void {
    try {
      callback(null, chunk);
    } catch (error) {
      console.error('[BrowserTransform] Transform error:', error);
      callback(error as Error);
    }
  }

  _flush(callback: (error?: Error | null) => void): void {
    try {
      callback();
    } catch (error) {
      console.error('[BrowserTransform] Flush error:', error);
      callback(error as Error);
    }
  }
}

// Create browser-compatible stream API
const browserStreamAPI = {
  Stream: BrowserStream,
  Readable: BrowserReadable,
  Writable: BrowserWritable,
  Transform: BrowserTransform,
  pipeline: (source: BrowserStream, ...transforms: BrowserStream[]): BrowserStream => {
    try {
      if (!source || !transforms.length) return source;
      return transforms.reduce((prev, next) => {
        if (prev && typeof prev.pipe === 'function') {
          return prev.pipe(next);
        }
        return prev;
      }, source);
    } catch (error) {
      console.error('[BrowserStream] Pipeline error:', error);
      throw error;
    }
  },
  finished: (stream: BrowserStream, callback: (error?: Error) => void): void => {
    try {
      const cleanup = () => {
        stream.removeListener('end', onend);
        stream.removeListener('error', onerror);
        stream.removeListener('finish', onfinish);
      };

      const onend = () => {
        cleanup();
        callback();
      };

      const onfinish = () => {
        cleanup();
        callback();
      };

      const onerror = (err: Error) => {
        cleanup();
        callback(err);
      };

      stream.on('end', onend);
      stream.on('finish', onfinish);
      stream.on('error', onerror);
    } catch (error) {
      console.error('[BrowserStream] Finished error:', error);
      callback(error as Error);
    }
  }
};

export default browserStreamAPI;
export { BrowserStream, BrowserReadable, BrowserWritable, BrowserTransform };
export type { BrowserStream as StreamType };
