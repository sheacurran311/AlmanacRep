import { EventEmitter } from 'events';

// Stream interfaces
interface StreamOptions {
  highWaterMark?: number;
  objectMode?: boolean;
}

interface IStream extends EventEmitter {
  readable: boolean;
  writable: boolean;
  pipe<T extends NodeJS.WritableStream>(destination: T): T;
  read?(size?: number): any;
  write?(chunk: any, encoding?: string, callback?: (error?: Error | null) => void): boolean;
  end?(): void;
}

class BaseStream implements IStream {
  protected _options: StreamOptions;
  readable: boolean = false;
  writable: boolean = false;
  private readonly eventEmitter: EventEmitter;

  constructor(options: StreamOptions = {}) {
    this.eventEmitter = new EventEmitter();
    this._options = {
      highWaterMark: 16384,
      objectMode: false,
      ...options
    };
  }

  // EventEmitter implementation
  addListener(event: string | symbol, listener: (...args: any[]) => void): this {
    this.eventEmitter.addListener(event, listener);
    return this;
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this {
    this.eventEmitter.on(event, listener);
    return this;
  }

  once(event: string | symbol, listener: (...args: any[]) => void): this {
    this.eventEmitter.once(event, listener);
    return this;
  }

  removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
    this.eventEmitter.removeListener(event, listener);
    return this;
  }

  off(event: string | symbol, listener: (...args: any[]) => void): this {
    this.eventEmitter.off(event, listener);
    return this;
  }

  removeAllListeners(event?: string | symbol): this {
    this.eventEmitter.removeAllListeners(event);
    return this;
  }

  setMaxListeners(n: number): this {
    this.eventEmitter.setMaxListeners(n);
    return this;
  }

  getMaxListeners(): number {
    return this.eventEmitter.getMaxListeners();
  }

  listeners(event: string | symbol): Function[] {
    return this.eventEmitter.listeners(event);
  }

  rawListeners(event: string | symbol): Function[] {
    return this.eventEmitter.rawListeners(event);
  }

  emit(event: string | symbol, ...args: any[]): boolean {
    return this.eventEmitter.emit(event, ...args);
  }

  listenerCount(event: string | symbol): number {
    return this.eventEmitter.listenerCount(event);
  }

  prependListener(event: string | symbol, listener: (...args: any[]) => void): this {
    this.eventEmitter.prependListener(event, listener);
    return this;
  }

  prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this {
    this.eventEmitter.prependOnceListener(event, listener);
    return this;
  }

  eventNames(): Array<string | symbol> {
    return this.eventEmitter.eventNames();
  }

  pipe<T extends NodeJS.WritableStream>(destination: T): T {
    if (!destination || typeof destination.write !== 'function' || typeof destination.end !== 'function') {
      throw new Error('Invalid destination stream');
    }

    const ondata = (chunk: any): void => {
      if (destination.write(chunk) === false) {
        this.pause();
      }
    };

    this.on('data', ondata);

    const ondrain = (): void => {
      if (typeof (this as any).resume === 'function') {
        (this as any).resume();
      }
    };

    destination.on('drain', ondrain);

    let didOnEnd = false;
    const onend = (): void => {
      if (didOnEnd) return;
      didOnEnd = true;

      destination.end();
    };

    const onclose = (): void => {
      if (didOnEnd) return;
      didOnEnd = true;

      if (typeof destination.destroy === 'function') destination.destroy();
    };

    const onerror = (er: Error): void => {
      cleanup();
      if (this.listenerCount('error') === 0) {
        throw er;
      }
    };

    const cleanup = (): void => {
      this.removeListener('data', ondata);
      destination.removeListener('drain', ondrain);
      this.removeListener('end', onend);
      this.removeListener('close', onclose);
      this.removeListener('error', onerror);
      destination.removeListener('error', onerror);
    };

    this.on('error', onerror);
    destination.on('error', onerror);
    this.on('end', onend);
    this.on('close', onclose);

    return destination;
  }
}

class Stream extends BaseStream {}

class Readable extends BaseStream {
  constructor(options?: StreamOptions) {
    super(options);
    this.readable = true;
  }

  read(size?: number): any {
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

  pipe<T extends NodeJS.WritableStream>(dest: T): T {
    return super.pipe(dest);
  }
}

class Writable extends BaseStream {
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

  end(callback?: () => void): void {
    if (callback) this.once('finish', callback);
    this.emit('finish');
    this.emit('end');
  }
}

class Transform extends BaseStream {
  constructor(options?: StreamOptions) {
    super(options);
    this.readable = true;
    this.writable = true;
  }
}

// Stream utility functions with proper error handling
function pipeline(...streams: Array<IStream | ((error?: Error) => void)>): IStream {
  if (streams.length < 2) {
    throw new Error('Pipeline requires at least 2 streams');
  }

  const callback = streams[streams.length - 1];
  if (typeof callback !== 'function') {
    throw new Error('Last argument must be a callback');
  }

  const streamArray = streams.slice(0, -1) as IStream[];
  let current = streamArray[0];

  try {
    for (let i = 1; i < streamArray.length; i++) {
      if (!streamArray[i]) {
        throw new Error(`Invalid stream at position ${i}`);
      }
      current = current.pipe(streamArray[i]);
    }

    current.on('error', callback);
    current.on('end', () => callback());
    return current;
  } catch (error) {
    callback(error as Error);
    return current;
  }
}

function finished(stream: IStream, callback: (error?: Error) => void): void {
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
export { Stream, Readable, Writable, Transform, pipeline, finished };
export type { IStream, StreamOptions };
