import { EventEmitter } from 'events';

// Define interfaces for type safety
interface StreamOptions {
  highWaterMark?: number;
  objectMode?: boolean;
}

// Base Stream class implementation
class Stream extends EventEmitter {
  protected _options: StreamOptions;

  constructor(options: StreamOptions = {}) {
    super();
    this._options = {
      highWaterMark: 16384,
      objectMode: false,
      ...options
    };
  }

  pipe<T extends Stream>(dest: T): T {
    this.on('data', (chunk: any) => dest.write(chunk));
    this.on('end', () => dest.end());
    return dest;
  }

  write(chunk: any): boolean {
    this.emit('data', chunk);
    return true;
  }

  end(): void {
    this.emit('end');
  }
}

// Readable stream implementation
class Readable extends Stream {
  readonly readable: boolean;

  constructor(options: StreamOptions = {}) {
    super(options);
    this.readable = true;
  }

  read(): any {
    return null;
  }
}

// Writable stream implementation
class Writable extends Stream {
  readonly writable: boolean;

  constructor(options: StreamOptions = {}) {
    super(options);
    this.writable = true;
  }
}

// Transform stream implementation
class Transform extends Stream {
  readonly readable: boolean;
  readonly writable: boolean;

  constructor(options: StreamOptions = {}) {
    super(options);
    this.readable = true;
    this.writable = true;
  }
}

// Create frozen stream API
const streamAPI = Object.freeze({
  Stream,
  Readable,
  Writable,
  Transform,
  pipeline(...args: any[]): Stream {
    const streams = args.slice(0, -1) as Stream[];
    const callback = args[args.length - 1] as (error?: Error) => void;

    let current = streams[0];
    for (let i = 1; i < streams.length; i++) {
      current = current.pipe(streams[i]);
    }

    current.on('error', callback);
    current.on('end', () => callback());
    return current;
  },
  finished(stream: Stream, callback: (error?: Error) => void): void {
    let ended = false;
    
    function onend() {
      if (ended) return;
      ended = true;
      stream.removeListener('error', onerror);
      stream.removeListener('end', onend);
      callback();
    }

    function onerror(err: Error) {
      if (ended) return;
      ended = true;
      stream.removeListener('error', onerror);
      stream.removeListener('end', onend);
      callback(err);
    }

    stream.on('error', onerror);
    stream.on('end', onend);
  }
});

export default streamAPI;
export { Stream, Readable, Writable, Transform };
