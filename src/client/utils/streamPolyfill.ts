import { EventEmitter } from 'events';

// Browser-specific Stream implementation
class BrowserStream extends EventEmitter {
  readable: boolean = true;
  writable: boolean = true;

  constructor() {
    super();
    this.setMaxListeners(0); // Prevent memory leaks in browser environment
  }

  pipe<T extends NodeJS.WritableStream>(destination: T): T {
    this.on('data', (chunk: any) => {
      destination.write(chunk);
    });

    this.on('end', () => {
      destination.end();
    });

    return destination;
  }

  write(chunk: any): boolean {
    this.emit('data', chunk);
    return true;
  }

  end(): void {
    this.emit('end');
  }
}

// Browser-specific Readable implementation
class BrowserReadable extends BrowserStream {
  private buffer: any[] = [];
  private flowing: boolean = false;

  constructor() {
    super();
    this.readable = true;
    this.writable = false;
  }

  push(chunk: any): boolean {
    if (chunk === null) {
      this.emit('end');
      return false;
    }

    this.buffer.push(chunk);
    if (this.flowing) {
      this.emit('data', chunk);
    }
    return true;
  }

  read(): any {
    return this.buffer.shift() || null;
  }

  resume(): this {
    this.flowing = true;
    while (this.buffer.length) {
      this.emit('data', this.buffer.shift());
    }
    return this;
  }

  pause(): this {
    this.flowing = false;
    return this;
  }
}

// Browser-specific Writable implementation
class BrowserWritable extends BrowserStream {
  constructor() {
    super();
    this.readable = false;
    this.writable = true;
  }

  write(chunk: any, encoding?: string | Function, callback?: Function): boolean {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = undefined;
    }

    this.emit('data', chunk);

    if (typeof callback === 'function') {
      callback();
    }

    return true;
  }

  end(chunk?: any, encoding?: string | Function, callback?: Function): void {
    if (chunk) {
      this.write(chunk);
    }
    this.emit('finish');
    if (typeof callback === 'function') {
      callback();
    }
  }
}

// Browser-specific Transform implementation
class BrowserTransform extends BrowserStream {
  constructor() {
    super();
    this.readable = true;
    this.writable = true;
  }

  _transform(chunk: any, _encoding: string, callback: Function): void {
    this.push(chunk);
    callback();
  }

  _flush(callback: Function): void {
    callback();
  }
}

// Safe browser-specific pipeline implementation
function browserPipeline(...streams: BrowserStream[]): BrowserStream {
  return streams.reduce((source, dest) => source.pipe(dest));
}

// Create browser-safe stream API
const streamAPI = {
  Stream: BrowserStream,
  Readable: BrowserReadable,
  Writable: BrowserWritable,
  Transform: BrowserTransform,
  pipeline: browserPipeline,
  finished: (stream: BrowserStream, callback: (error?: Error) => void): void => {
    const cleanup = () => {
      stream.removeListener('end', onend);
      stream.removeListener('finish', onfinish);
      stream.removeListener('error', onerror);
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

    stream.once('end', onend);
    stream.once('finish', onfinish);
    stream.once('error', onerror);
  }
};

export default streamAPI;
export { BrowserStream, BrowserReadable, BrowserWritable, BrowserTransform };
export type { BrowserStream as StreamType };