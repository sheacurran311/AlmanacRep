import { EventEmitter } from 'events';

interface StreamOptions {
  highWaterMark?: number;
  objectMode?: boolean;
}

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

    const ondata = (chunk: any): void => {
      if (destination.write(chunk) === false) {
        this.pause();
      }
    };

    this.on('data', ondata);

    const ondrain = (): void => {
      this.resume();
    };

    destination.on('drain', ondrain);

    let didOnEnd = false;
    const onend = (): void => {
      if (didOnEnd) return;
      didOnEnd = true;
      destination.end?.();
    };

    const cleanup = (): void => {
      this.removeListener('data', ondata);
      destination.removeListener('drain', ondrain);
      this.removeListener('end', onend);
      this.removeListener('error', onerror);
      destination.removeListener('error', onerror);
    };

    const onerror = (err: Error): void => {
      cleanup();
      this.emit('error', err);
    };

    this.on('error', onerror);
    destination.on('error', onerror);
    this.on('end', onend);

    return destination;
  }

  pause(): this {
    return this;
  }

  resume(): this {
    return this;
  }
}

class Readable extends Stream {
  constructor(options?: StreamOptions) {
    super(options);
    this.readable = true;
  }

  pause(): this {
    this.emit('pause');
    return this;
  }

  resume(): this {
    this.emit('resume');
    return this;
  }

  read(_size?: number): any {
    return null;
  }
}

class Writable extends Stream {
  constructor(options?: StreamOptions) {
    super(options);
    this.writable = true;
  }

  write(chunk: any, encoding?: string, callback?: (error?: Error | null) => void): boolean {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = undefined;
    }
    if (callback) callback(null);
    this.emit('data', chunk);
    return true;
  }

  end(chunk?: any, encoding?: string | (() => void), callback?: () => void): void {
    if (typeof chunk === 'function') {
      callback = chunk;
      chunk = null;
    } else if (typeof encoding === 'function') {
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

class Transform extends Stream {
  constructor(options?: StreamOptions) {
    super(options);
    this.readable = true;
    this.writable = true;
  }
}

const streamAPI = {
  Stream,
  Readable,
  Writable,
  Transform,
  pipeline: (source: Stream, ...transforms: Stream[]): Stream => {
    return transforms.reduce((prev: any, next) => prev.pipe(next), source);
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

    const onerror = (err: Error) => {
      cleanup();
      callback(err);
    };

    const onfinish = () => {
      cleanup();
      callback();
    };

    stream.on('end', onend);
    stream.on('error', onerror);
    stream.on('finish', onfinish);
  }
};

export default streamAPI;
export { Stream, Readable, Writable, Transform };
export type { StreamOptions };
