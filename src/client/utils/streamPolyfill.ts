// Browser-specific stream implementation
type Listener = (...args: any[]) => void;

interface EventMap {
  [event: string]: Listener[];
}

class EventEmitter {
  private events: EventMap = {};

  constructor() {
    if (Object.getPrototypeOf(this) === undefined) {
      Object.setPrototypeOf(this, EventEmitter.prototype);
    }
  }

  on(event: string, listener: Listener): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events[event];
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener.apply(this, args);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
      return true;
    }
    return false;
  }

  removeListener(event: string, listener: Listener): this {
    const listeners = this.events[event];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }
}

// First establish the prototype chain
Object.setPrototypeOf(EventEmitter.prototype, Object.prototype);

class Stream extends EventEmitter {
  readable: boolean;
  writable: boolean;
  protected destroyed: boolean;

  constructor() {
    super();
    if (Object.getPrototypeOf(this) === undefined) {
      Object.setPrototypeOf(this, Stream.prototype);
    }
    
    this.readable = true;
    this.writable = true;
    this.destroyed = false;
  }

  pipe<T extends Stream>(destination: T): T {
    if (this.destroyed) return destination;

    const ondata = (chunk: any) => {
      if (destination.writable) {
        const canContinue = destination.write(chunk);
        if (!canContinue) {
          this.emit('pause');
        }
      }
    };

    const ondrain = () => {
      if (this.readable) {
        this.emit('resume');
      }
    };

    const onend = () => {
      destination.end();
    };

    const cleanup = () => {
      this.removeListener('data', ondata);
      destination.removeListener('drain', ondrain);
      this.removeListener('end', onend);
    };

    this.on('data', ondata);
    destination.on('drain', ondrain);
    this.on('end', onend);
    this.on('close', cleanup);
    destination.on('close', cleanup);

    return destination;
  }

  write(chunk: any): boolean {
    if (!this.writable || this.destroyed) return false;
    this.emit('data', chunk);
    return true;
  }

  end(chunk?: any): void {
    if (this.destroyed) return;
    if (chunk !== undefined && this.writable) {
      this.write(chunk);
    }
    this.writable = false;
    this.emit('end');
    this.destroy();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.readable = false;
    this.writable = false;
    this.emit('close');
    this.removeAllListeners();
  }
}

Object.setPrototypeOf(Stream.prototype, EventEmitter.prototype);

class Readable extends Stream {
  constructor() {
    super();
    if (Object.getPrototypeOf(this) === undefined) {
      Object.setPrototypeOf(this, Readable.prototype);
    }
    this.writable = false;
  }

  push(chunk: any): void {
    if (chunk === null) {
      this.readable = false;
      this.emit('end');
    } else if (this.readable) {
      this.emit('data', chunk);
    }
  }
}

Object.setPrototypeOf(Readable.prototype, Stream.prototype);

class Writable extends Stream {
  constructor() {
    super();
    if (Object.getPrototypeOf(this) === undefined) {
      Object.setPrototypeOf(this, Writable.prototype);
    }
    this.readable = false;
  }
}

Object.setPrototypeOf(Writable.prototype, Stream.prototype);

class Transform extends Stream {
  constructor() {
    super();
    if (Object.getPrototypeOf(this) === undefined) {
      Object.setPrototypeOf(this, Transform.prototype);
    }
  }

  _transform(chunk: any): void {
    if (this.writable) {
      this.emit('data', chunk);
    }
  }

  write(chunk: any): boolean {
    if (!this.writable) return false;
    this._transform(chunk);
    return true;
  }
}

Object.setPrototypeOf(Transform.prototype, Stream.prototype);

const StreamModule = {
  Stream,
  Readable,
  Writable,
  Transform,
  EventEmitter
};

export default StreamModule;
