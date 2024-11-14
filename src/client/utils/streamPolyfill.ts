import { EventEmitter } from 'events';

// Base Stream implementation
class Stream extends EventEmitter {
  pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T {
    const shouldEnd = options?.end !== false;
    const source = this;

    function ondata(chunk: any) {
      if (destination.write(chunk) === false) {
        source.pause?.();
      }
    }

    source.on('data', ondata);

    function ondrain() {
      if ((source as any).readable && source.resume) {
        source.resume();
      }
    }

    destination.on('drain', ondrain);

    function cleanup() {
      destination.removeListener('drain', ondrain);
      source.removeListener('data', ondata);
    }

    function onend() {
      cleanup();
      if (shouldEnd) {
        destination.end();
      }
    }

    source.on('end', onend);
    source.on('close', cleanup);

    destination.on('error', (err: Error) => {
      cleanup();
      source.emit('error', err);
    });

    return destination;
  }

  pause?(): this {
    return this;
  }

  resume?(): this {
    return this;
  }
}

// Readable implementation
class Readable extends Stream {
  readable: boolean;
  private _readableState: {
    flowing: boolean | null;
    ended: boolean;
    length: number;
    buffer: any[];
  };

  constructor(options: any = {}) {
    super();
    this.readable = true;
    this._readableState = {
      flowing: null,
      ended: false,
      length: 0,
      buffer: []
    };
  }

  read(size?: number): any {
    const state = this._readableState;
    
    if (state.buffer.length === 0) {
      return null;
    }

    if (size === undefined || size >= state.length) {
      const ret = state.buffer;
      state.buffer = [];
      state.length = 0;
      return ret;
    }

    return state.buffer.splice(0, size);
  }

  push(chunk: any): boolean {
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

// Writable implementation
class Writable extends Stream {
  writable: boolean;
  private _writableState: {
    ended: boolean;
    finishing: boolean;
    length: number;
  };

  constructor(options: any = {}) {
    super();
    this.writable = true;
    this._writableState = {
      ended: false,
      finishing: false,
      length: 0
    };
  }

  write(chunk: any, encoding?: string | ((error?: Error | null) => void), cb?: (error?: Error | null) => void): boolean {
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
  }

  end(chunk?: any, encoding?: string | (() => void), cb?: () => void): void {
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
  }
}

// Transform implementation
class Transform extends Stream {
  readable: boolean;
  writable: boolean;

  constructor(options: any = {}) {
    super();
    this.readable = true;
    this.writable = true;
  }

  _transform(chunk: any, encoding: string, callback: (error?: Error | null, data?: any) => void): void {
    callback(null, chunk);
  }

  _flush(callback: (error?: Error | null) => void): void {
    callback();
  }
}

// Helper function for prototype inheritance
function inherits(ctor: any, superCtor: any) {
  if (superCtor) {
    ctor.super_ = superCtor;
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
  }
}

// Create stream API
const streamAPI = {
  Stream,
  Readable,
  Writable,
  Transform,
  inherits,
  pipeline: (source: Stream, ...transforms: Stream[]): Stream => {
    if (!source || !transforms.length) return source;
    return transforms.reduce((prev, next) => {
      if (prev && typeof prev.pipe === 'function') {
        return prev.pipe(next);
      }
      return prev;
    }, source);
  },
  finished: (stream: Stream, callback: (error?: Error) => void): void => {
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
  }
};

export default streamAPI;
export { Stream, Readable, Writable, Transform };
export type { Stream as StreamType };
