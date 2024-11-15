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

// Removed BrowserReadableStream class

// Removed BrowserWritableStream class

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