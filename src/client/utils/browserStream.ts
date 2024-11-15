import { PolyfillError } from './initPolyfills';

export interface StreamOptions {
  highWaterMark?: number;
  encoding?: string;
  objectMode?: boolean;
}

interface StreamDestination {
  write(chunk: any): boolean;
  end(): void;
  on(event: string, listener: () => void): void;
}

export class BrowserReadableStream {
  private buffer: Array<Uint8Array | string>;
  private ended: boolean;
  private errorState: Error | null;
  private highWaterMark: number;
  private objectMode: boolean;
  private encoding: string | null;
  private listeners: { [key: string]: Array<(...args: any[]) => void> };

  constructor(options: StreamOptions = {}) {
    this.buffer = [];
    this.ended = false;
    this.errorState = null;
    this.highWaterMark = options.highWaterMark || 16384; // 16KB default
    this.objectMode = options.objectMode || false;
    this.encoding = options.encoding || null;
    this.listeners = {
      data: [],
      end: [],
      error: [],
      close: [],
    };
  }

  push(chunk: Uint8Array | string | null): boolean {
    if (chunk === null) {
      this.ended = true;
      this.emit('end');
      return false;
    }

    if (this.ended) {
      throw new PolyfillError('Stream has ended, cannot push more data');
    }

    if (typeof chunk === 'string' && !this.objectMode) {
      chunk = new TextEncoder().encode(chunk);
    }

    this.buffer.push(chunk);
    this.emit('data', chunk);

    return this.buffer.length < this.highWaterMark;
  }

  read(size?: number): Uint8Array | string | null {
    if (this.errorState) {
      throw this.errorState;
    }

    if (this.buffer.length === 0) {
      if (this.ended) {
        return null;
      }
      return undefined as any;
    }

    const chunk = this.buffer.shift();
    if (!chunk) return null;

    if (size && !this.objectMode && chunk instanceof Uint8Array) {
      if (chunk.length > size) {
        const remainingChunk = chunk.slice(size);
        this.buffer.unshift(remainingChunk);
        return chunk.slice(0, size);
      }
    }

    if (this.encoding && chunk instanceof Uint8Array) {
      return new TextDecoder(this.encoding).decode(chunk);
    }

    return chunk;
  }

  pipe(destination: StreamDestination): StreamDestination {
    if (!destination || typeof destination.write !== 'function') {
      throw new PolyfillError('Invalid destination for pipe');
    }

    const onData = (chunk: any) => {
      try {
        const canContinue = destination.write(chunk);
        if (!canContinue) {
          this.pause();
        }
      } catch (error) {
        this.destroy(error as Error);
      }
    };

    const onEnd = () => {
      try {
        destination.end();
      } catch (error) {
        this.destroy(error as Error);
      }
    };

    const onDrain = () => {
      this.resume();
    };

    this.on('data', onData);
    this.on('end', onEnd);
    destination.on('drain', onDrain);

    return destination;
  }

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
    return this;
  }

  removeListener(event: string, listener: (...args: any[]) => void): this {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
    return this;
  }

  private emit(event: string, ...args: any[]): boolean {
    const listeners = this.listeners[event] || [];
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in stream ${event} listener:`, error);
      }
    });
    return listeners.length > 0;
  }

  pause(): this {
    // Implementation can be expanded based on needs
    return this;
  }

  resume(): this {
    // Implementation can be expanded based on needs
    return this;
  }

  destroy(error?: Error): void {
    if (error) {
      this.errorState = error;
      this.emit('error', error);
    }
    this.buffer = [];
    this.ended = true;
    this.emit('close');
  }
}

export class BrowserWritableStream implements StreamDestination {
  private chunks: Array<Uint8Array | string>;
  private encoding: string | null;
  private objectMode: boolean;
  private finished: boolean;
  private errorState: Error | null;
  private listeners: { [key: string]: Array<(...args: any[]) => void> };

  constructor(options: StreamOptions = {}) {
    this.chunks = [];
    this.encoding = options.encoding || null;
    this.objectMode = options.objectMode || false;
    this.finished = false;
    this.errorState = null;
    this.listeners = {
      drain: [],
      finish: [],
      error: [],
      close: [],
    };
  }

  write(chunk: Uint8Array | string): boolean {
    if (this.finished) {
      throw new PolyfillError('Stream is finished, cannot write');
    }

    if (this.errorState) {
      throw this.errorState;
    }

    if (typeof chunk === 'string' && !this.objectMode) {
      chunk = new TextEncoder().encode(chunk);
    }

    this.chunks.push(chunk);
    this.emit('drain');
    return true;
  }

  end(): void {
    this.finished = true;
    this.emit('finish');
    this.emit('close');
  }

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
    return this;
  }

  getContents(): Uint8Array | string {
    if (this.objectMode) {
      return this.chunks as any;
    }

    const concatenated = BrowserWritableStream.concat(
      this.chunks as Uint8Array[]
    );

    if (this.encoding) {
      return new TextDecoder(this.encoding).decode(concatenated);
    }

    return concatenated;
  }

  private static concat(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    
    return result;
  }

  removeListener(event: string, listener: (...args: any[]) => void): this {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
    return this;
  }

  private emit(event: string, ...args: any[]): boolean {
    const listeners = this.listeners[event] || [];
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in stream ${event} listener:`, error);
      }
    });
    return listeners.length > 0;
  }

  destroy(error?: Error): void {
    if (error) {
      this.errorState = error;
      this.emit('error', error);
    }
    this.chunks = [];
    this.finished = true;
    this.emit('close');
  }
}

// Helper function to convert Blob/File to ReadableStream
export const createBrowserStreamFromBlob = (
  blob: Blob,
  options: StreamOptions = {}
): BrowserReadableStream => {
  const stream = new BrowserReadableStream(options);
  const reader = new FileReader();

  reader.onload = () => {
    if (reader.result instanceof ArrayBuffer) {
      stream.push(new Uint8Array(reader.result));
      stream.push(null);
    }
  };

  reader.onerror = () => {
    stream.destroy(reader.error || new Error('Failed to read blob'));
  };

  reader.readAsArrayBuffer(blob);
  return stream;
};

// Helper function to create a stream from fetch response
export const createBrowserStreamFromResponse = async (
  response: Response,
  options: StreamOptions = {}
): Promise<BrowserReadableStream> => {
  const stream = new BrowserReadableStream(options);

  try {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        stream.push(null);
        break;
      }
      stream.push(value);
    }
  } catch (error) {
    stream.destroy(error as Error);
  }

  return stream;
};
