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
  private chunks: any[] = [];
  private ended = false;
  private destroyed = false;
  private error: Error | null = null;

  constructor(private options: StreamOptions = {}) {}

  push(chunk: any): void {
    if (this.destroyed) return;
    if (chunk === null) {
      this.ended = true;
      return;
    }
    this.chunks.push(chunk);
  }

  destroy(error?: Error): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (error) {
      this.error = error;
    }
  }

  async *[Symbol.asyncIterator]() {
    while (!this.ended && !this.destroyed) {
      if (this.chunks.length > 0) {
        yield this.chunks.shift();
      } else {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    if (this.error) {
      throw this.error;
    }
  }
}

export class BrowserWritableStream {
  private destroyed = false;
  private error: Error | null = null;
  
  constructor(private destination: StreamDestination, private options: StreamOptions = {}) {}

  write(chunk: any): boolean {
    if (this.destroyed) return false;
    try {
      return this.destination.write(chunk);
    } catch (error) {
      this.destroy(error as Error);
      return false;
    }
  }

  end(): void {
    if (this.destroyed) return;
    try {
      this.destination.end();
    } catch (error) {
      this.destroy(error as Error);
    }
  }

  destroy(error?: Error): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (error) {
      this.error = error;
    }
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
