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
  // Create environment object with proper type checking
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

  // Create process prototype
  const processProto = {
    title: 'browser',
    platform: 'browser',
    browser: true,
    version: '1.0.0',
    stdout: null,
    stderr: null,
    stdin: null,
    argv: [],
    argv0: '',
    execArgv: [],
    execPath: '',
    debugPort: -1,
    abort: () => {},
    chdir: () => {},
    cwd: () => '/',
    exit: () => {},
    pid: -1,
    ppid: -1,
    umask: () => 0,
    uptime: () => 0,
    hrtime: () => [0, 0],
    arch: 'web',
    type: 'browser',
    nextTick: (fn: () => void) => setTimeout(fn, 0),
    emitWarning: (warning: string | Error) => {
      console.warn(warning);
    },
    env: processEnv
  };

  // Create process object with proper prototype chain
  const processObj = Object.create(processProto);

  // Define non-enumerable properties
  Object.defineProperties(processObj, {
    env: {
      value: processEnv,
      enumerable: true,
      configurable: true,
      writable: true
    }
  });

  // Set process on window
  Object.defineProperty(window, 'process', {
    value: processObj,
    enumerable: true,
    writable: false,
    configurable: true
  });
}
