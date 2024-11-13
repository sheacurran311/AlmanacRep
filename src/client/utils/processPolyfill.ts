interface ProcessEnv {
  NODE_ENV: string;
  VITE_DEV_SERVER_PORT?: string;
  VITE_API_SERVER_PORT?: string;
  VITE_API_BASE_URL?: string;
  VITE_WS_PROTOCOL?: string;
  VITE_WS_HOST?: string;
  VITE_WS_PORT?: string;
  VITE_OBJECT_STORAGE_URL?: string;
  [key: string]: string | undefined;
}

// Initialize process object for browser environment
if (typeof window !== 'undefined' && !window.process) {
  const processEnv: ProcessEnv = {
    NODE_ENV: import.meta.env.MODE || 'development',
    VITE_DEV_SERVER_PORT: import.meta.env.VITE_DEV_SERVER_PORT,
    VITE_API_SERVER_PORT: import.meta.env.VITE_API_SERVER_PORT,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_WS_PROTOCOL: import.meta.env.VITE_WS_PROTOCOL,
    VITE_WS_HOST: import.meta.env.VITE_WS_HOST,
    VITE_WS_PORT: import.meta.env.VITE_WS_PORT,
    VITE_OBJECT_STORAGE_URL: import.meta.env.VITE_OBJECT_STORAGE_URL
  };

  // Create global process object
  const process = {
    env: processEnv,
    browser: true,
    version: '1.0.0',
    title: 'browser',
    platform: 'browser',
    nextTick: (fn: () => void) => setTimeout(fn, 0)
  };

  // Add process to window
  Object.defineProperty(window, 'process', {
    value: Object.freeze(process),
    enumerable: true,
    configurable: false,
    writable: false
  });
}