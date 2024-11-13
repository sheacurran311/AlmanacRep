import { EventEmitter } from 'events';

interface StreamOptions {
  highWaterMark?: number;
  objectMode?: boolean;
}

class BaseStream extends EventEmitter {
  protected _options: StreamOptions;
  readable: boolean;
  writable: boolean;

  constructor(options: StreamOptions = {}) {
    super();
    this._options = {
      highWaterMark: 16384,
      objectMode: false,
      ...options
    };
    this.readable = false;
    this.writable = false;
  }

  pipe<T extends NodeJS.WritableStream>(dest: T): T {
    if (!dest || typeof dest.write !== 'function' || typeof dest.end !== 'function') {
      throw new Error('Invalid destination stream');
    }
    
    this.on('data', (chunk: any) => {
      const canContinue = dest.write(chunk);
      if (!canContinue) {
        this.pause();
      }
    });

    dest.on('drain', () => {
      this.resume();
    });

    this.on('end', () => {
      dest.end();
    });

    return dest;
  }

  pause(): this {
    this.emit('pause');
    return this;
  }

  resume(): this {
    this.emit('resume');
    return this;
  }

  write(chunk: any): boolean {
    this.emit('data', chunk);
    return true;
  }

  end(): void {
    this.emit('end');
  }
}

class Stream extends BaseStream {}

class Readable extends BaseStream {
  constructor(options: StreamOptions = {}) {
    super(options);
    this.readable = true;
    this.writable = false;
  }

  read(): any {
    return null;
  }
}

class Writable extends BaseStream {
  constructor(options: StreamOptions = {}) {
    super(options);
    this.readable = false;
    this.writable = true;
  }
}

class Transform extends BaseStream {
  constructor(options: StreamOptions = {}) {
    super(options);
    this.readable = true;
    this.writable = true;
  }
}

const streamAPI = Object.freeze({
  Stream,
  Readable,
  Writable,
  Transform,
  pipeline(...args: any[]): Stream {
    if (args.length < 2) {
      throw new Error('Pipeline requires at least 2 streams');
    }

    const streams = args.slice(0, -1);
    const callback = args[args.length - 1];

    if (typeof callback !== 'function') {
      throw new Error('Last argument must be a callback');
    }

    let current = streams[0];
    try {
      for (let i = 1; i < streams.length; i++) {
        if (!streams[i] || typeof streams[i].write !== 'function' || typeof streams[i].end !== 'function') {
          throw new Error(`Invalid stream at position ${i}`);
        }
        current = current.pipe(streams[i]);
      }
      current.on('error', callback);
      current.on('end', () => callback());
      return current;
    } catch (error) {
      callback(error);
      return current;
    }
  },

  finished(stream: Stream, callback: (error?: Error) => void): void {
    if (!stream || (!stream.readable && !stream.writable)) {
      callback(new Error('Invalid stream'));
      return;
    }

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
