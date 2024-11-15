import { EventEmitter } from 'events';

// Browser-specific Stream implementation with improved error handling
class BrowserStream extends EventEmitter {
  readable: boolean = true;
  writable: boolean = true;
  private destroyed: boolean = false;

  constructor() {
    super();
    this.setMaxListeners(0);
  }

  pipe<T extends NodeJS.WritableStream>(destination: T): T {
    if (this.destroyed) {
      throw new Error('Cannot pipe after stream is destroyed');
    }

    this.on('data', (chunk: any) => {
      try {
        const canContinue = destination.write(chunk);
        if (!canContinue) {
          this.pause();
        }
      } catch (error) {
        this.destroy(error as Error);
      }
    });

    destination.on('drain', () => {
      this.resume();
    });

    this.on('end', () => {
      try {
        destination.end();
      } catch (error) {
        this.destroy(error as Error);
      }
    });

    return destination;
  }

  write(chunk: any): boolean {
    if (this.destroyed) return false;
    try {
      this.emit('data', chunk);
      return true;
    } catch (error) {
      this.destroy(error as Error);
      return false;
    }
  }

  end(): void {
    if (!this.destroyed) {
      this.emit('end');
      this.destroy();
    }
  }

  destroy(error?: Error): void {
    if (!this.destroyed) {
      this.destroyed = true;
      if (error) {
        this.emit('error', error);
      }
      this.emit('close');
    }
  }

  pause(): void {
    this.emit('pause');
  }

  resume(): void {
    this.emit('resume');
  }
}

// Browser-specific Readable implementation with improved error handling
class BrowserReadable extends BrowserStream {
  private buffer: any[] = [];
  private flowing: boolean = false;
  private ended: boolean = false;

  constructor() {
    super();
    this.readable = true;
    this.writable = false;
  }

  push(chunk: any): boolean {
    if (this.ended) return false;

    if (chunk === null) {
      this.ended = true;
      process.nextTick(() => {
        this.emit('end');
      });
      return false;
    }

    this.buffer.push(chunk);
    if (this.flowing) {
      process.nextTick(() => {
        this.emit('data', chunk);
      });
    }
    return true;
  }

  read(): any {
    return this.buffer.shift() || null;
  }

  resume(): this {
    if (!this.flowing) {
      this.flowing = true;
      process.nextTick(() => {
        while (this.buffer.length && this.flowing) {
          const chunk = this.buffer.shift();
          this.emit('data', chunk);
        }
        if (this.ended && !this.buffer.length) {
          this.emit('end');
        }
      });
    }
    return this;
  }

  pause(): this {
    this.flowing = false;
    return this;
  }

  isPaused(): boolean {
    return !this.flowing;
  }
}

// Browser-specific Writable implementation with improved error handling
class BrowserWritable extends BrowserStream {
  private finished: boolean = false;

  constructor() {
    super();
    this.readable = false;
    this.writable = true;
  }

  write(chunk: any, encoding?: string | Function, callback?: Function): boolean {
    if (this.finished) return false;

    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = undefined;
    }

    try {
      this.emit('data', chunk);
      if (typeof callback === 'function') {
        process.nextTick(() => callback());
      }
      return true;
    } catch (error) {
      if (typeof callback === 'function') {
        process.nextTick(() => callback(error));
      }
      this.destroy(error as Error);
      return false;
    }
  }

  end(chunk?: any, encoding?: string | Function, callback?: Function): void {
    if (this.finished) return;

    if (typeof chunk === 'function') {
      callback = chunk;
      chunk = null;
    } else if (typeof encoding === 'function') {
      callback = encoding;
      encoding = undefined;
    }

    if (chunk) {
      this.write(chunk);
    }

    this.finished = true;
    process.nextTick(() => {
      this.emit('finish');
      if (typeof callback === 'function') {
        callback();
      }
    });
  }
}

// Browser-specific Transform implementation with improved error handling
class BrowserTransform extends BrowserStream {
  constructor() {
    super();
    this.readable = true;
    this.writable = true;
  }

  _transform(chunk: any, encoding: string, callback: Function): void {
    try {
      this.push(chunk);
      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback: Function): void {
    try {
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

// Safe browser-specific pipeline implementation with error handling
function browserPipeline(...streams: BrowserStream[]): BrowserStream {
  if (streams.length === 0) {
    throw new Error('Pipeline requires at least one stream');
  }

  return streams.reduce((source, dest) => {
    source.pipe(dest);
    source.on('error', (err) => dest.destroy(err));
    dest.on('error', (err) => source.destroy(err));
    return dest;
  });
}

// Create browser-safe stream API with improved error handling
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
      stream.removeListener('close', onclose);
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

    const onclose = () => {
      cleanup();
      callback();
    };

    stream.once('end', onend);
    stream.once('finish', onfinish);
    stream.once('error', onerror);
    stream.once('close', onclose);
  }
};

export default streamAPI;
export { BrowserStream, BrowserReadable, BrowserWritable, BrowserTransform };
export type { BrowserStream as StreamType };
