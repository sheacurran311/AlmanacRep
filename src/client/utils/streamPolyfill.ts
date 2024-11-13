// Browser-specific stream implementation
type Listener = (...args: any[]) => void;

interface EventMap {
  [event: string]: Listener[];
}

class EventEmitter {
  private events: EventMap = {};

  on(event: string, listener: Listener): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.events[event];
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  removeListener(event: string, listener: Listener): void {
    const listeners = this.events[event];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

class Stream extends EventEmitter {
  readable: boolean;
  writable: boolean;
  protected destroyed: boolean;

  constructor() {
    super();
    this.readable = true;
    this.writable = true;
    this.destroyed = false;
  }

  pipe<T extends Stream>(destination: T): T {
    if (this.destroyed) return destination;

    this.on('data', (chunk) => {
      if (destination.writable) {
        const canContinue = destination.write(chunk);
        if (!canContinue) {
          this.emit('pause');
        }
      }
    });

    destination.on('drain', () => {
      this.emit('resume');
    });

    this.on('end', () => {
      destination.end();
    });

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
  }
}

class Readable extends Stream {
  constructor() {
    super();
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

class Writable extends Stream {
  constructor() {
    super();
    this.readable = false;
  }
}

class Transform extends Stream {
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

// Export as a namespace-like object
const StreamModule = {
  Stream,
  Readable,
  Writable,
  Transform,
  EventEmitter
};

export default StreamModule;
