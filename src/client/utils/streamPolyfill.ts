import { EventEmitter } from 'events';

interface StreamOptions {
  highWaterMark?: number;
  objectMode?: boolean;
}

interface IStream {
  readable: boolean;
  writable: boolean;
  pipe<T extends NodeJS.WritableStream>(destination: T): T;
  read?(size?: number): any;
  write?(chunk: any, encoding?: string, callback?: (error?: Error | null) => void): boolean;
  end?(): void;
}

class BaseStream extends EventEmitter {
  protected _options: StreamOptions;
  readable: boolean = false;
  writable: boolean = false;

  constructor(options: StreamOptions = {}) {
    super();
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
        this.emit('pause');
      }
    };

    this.on('data', ondata);

    const ondrain = (): void => {
      this.emit('resume');
    };

    destination.on('drain', ondrain);

    let didOnEnd = false;
    const onend = (): void => {
      if (didOnEnd) return;
      didOnEnd = true;
      if (typeof destination.end === 'function') {
        destination.end();
      }
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
}

export class Stream extends BaseStream {}

export class Readable extends BaseStream {
  constructor(options?: StreamOptions) {
    super(options);
    this.readable = true;
  }

  read(_size?: number): any {
    return null;
  }

  pause(): this {
    this.emit('pause');
    return this;
  }

  resume(): this {
    this.emit('resume');
    return this;
  }

  isPaused(): boolean {
    return false;
  }
}

export class Writable extends BaseStream {
  constructor(options?: StreamOptions) {
    super(options);
    this.writable = true;
  }

  write(chunk: any, encoding?: string, callback?: (error?: Error | null) => void): boolean {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = undefined;
    }
    
    if (!callback) callback = () => {};
    
    this.emit('data', chunk);
    callback();
    return true;
  }

  end(chunk?: any, encoding?: string, callback?: () => void): void {
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
    
    if (callback) {
      this.once('finish', callback);
    }
    
    this.emit('finish');
    this.emit('end');
  }
}

export class Transform extends BaseStream {
  constructor(options?: StreamOptions) {
    super(options);
    this.readable = true;
    this.writable = true;
  }
}

export function pipeline(...streams: Array<BaseStream | ((error?: Error) => void)>): BaseStream {
  if (streams.length < 2) {
    throw new Error('Pipeline requires at least 2 streams');
  }

  const callback = streams[streams.length - 1];
  if (typeof callback !== 'function') {
    throw new Error('Last argument must be a callback');
  }

  const streamArray = streams.slice(0, -1) as BaseStream[];
  let current = streamArray[0];

  for (let i = 1; i < streamArray.length; i++) {
    if (!streamArray[i]) {
      throw new Error(`Invalid stream at position ${i}`);
    }
    current = current.pipe(streamArray[i] as any);
  }

  current.on('error', callback);
  current.on('end', () => callback());

  return current;
}

export function finished(stream: BaseStream, callback: (error?: Error) => void): void {
  let ended = false;

  function onend() {
    if (ended) return;
    ended = true;
    stream.removeListener('error', onerror);
    stream.removeListener('end', onend);
    stream.removeListener('finish', onend);
    callback();
  }

  function onerror(err: Error) {
    if (ended) return;
    ended = true;
    stream.removeListener('error', onerror);
    stream.removeListener('end', onend);
    stream.removeListener('finish', onend);
    callback(err);
  }

  stream.on('error', onerror);
  stream.on('end', onend);
  stream.on('finish', onend);
}

const streamAPI = Object.freeze({
  Stream,
  Readable,
  Writable,
  Transform,
  pipeline,
  finished
});

export default streamAPI;
export type { IStream, StreamOptions };
