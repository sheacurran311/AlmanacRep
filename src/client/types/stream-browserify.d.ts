declare module 'stream-browserify' {
  import { EventEmitter } from 'events';

  class Stream extends EventEmitter {
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T;
    read(size?: number): string | Buffer | null;
    write(chunk: any, encoding?: BufferEncoding, callback?: (error: Error | null | undefined) => void): boolean;
    end(chunk?: any, encoding?: BufferEncoding, callback?: () => void): void;
  }

  class Readable extends Stream implements NodeJS.ReadableStream {
    readable: boolean;
    readonly readableHighWaterMark: number;
    readonly readableLength: number;
    _read(size: number): void;
    read(size?: number): any;
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T;
    unpipe(destination?: NodeJS.WritableStream): this;
    push(chunk: any, encoding?: BufferEncoding): boolean;
  }

  class Writable extends Stream implements NodeJS.WritableStream {
    writable: boolean;
    readonly writableHighWaterMark: number;
    readonly writableLength: number;
    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void;
    write(chunk: any, encoding?: BufferEncoding, callback?: (error: Error | null | undefined) => void): boolean;
    end(callback?: () => void): void;
  }

  class Transform extends Stream implements NodeJS.ReadWriteStream {
    _transform(chunk: any, encoding: string, callback: Function): void;
    _flush(callback: Function): void;
  }

  export { Stream, Readable, Writable, Transform };
}
