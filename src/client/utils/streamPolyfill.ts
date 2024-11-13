import { EventEmitter } from 'events';
import * as streamBrowserify from 'stream-browserify';

// Create factory functions that wrap stream-browserify functionality
export function createStream(options?: any) {
  return new streamBrowserify.Stream(options);
}

export function createReadableStream(options?: any) {
  return new streamBrowserify.Readable(options);
}

export function createWritableStream(options?: any) {
  return new streamBrowserify.Writable(options);
}

export function createTransformStream(options?: any) {
  return new streamBrowserify.Transform(options);
}

// Export stream constructors for direct usage if needed
export const Stream = streamBrowserify.Stream;
export const Readable = streamBrowserify.Readable;
export const Writable = streamBrowserify.Writable;
export const Transform = streamBrowserify.Transform;

// Default export for compatibility
export default {
  createStream,
  createReadableStream,
  createWritableStream,
  createTransformStream,
  Stream,
  Readable,
  Writable,
  Transform
};
