declare module 'stream-browserify' {
  export class EventEmitter {
    on(event: string, listener: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;
    removeListener(event: string, listener: (...args: any[]) => void): void;
  }

  export class Stream extends EventEmitter {
    readable: boolean;
    writable: boolean;
    pipe<T extends Stream>(destination: T): T;
    write(chunk: any): boolean;
    end(chunk?: any): void;
    destroy(): void;
  }

  export class Readable extends Stream {
    push(chunk: any): void;
  }

  export class Writable extends Stream {}

  export class Transform extends Stream {
    _transform(chunk: any): void;
  }

  const StreamModule: {
    Stream: typeof Stream;
    Readable: typeof Readable;
    Writable: typeof Writable;
    Transform: typeof Transform;
    EventEmitter: typeof EventEmitter;
  };

  export default StreamModule;
}
