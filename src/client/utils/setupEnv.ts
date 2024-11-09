// Enhanced type declarations for Process interface
interface Process {
  env: Record<string, string>;
  title: string;
  version: string;
  versions: Record<string, string>;
  argv: string[];
  execArgv: string[];
  pid: number;
  ppid: number;
  platform: string;
  arch: string;
  execPath: string;
  debugPort: number;
  argv0: string;
  browser: boolean;
  _startProfilerIdleNotifier: () => void;
  _stopProfilerIdleNotifier: () => void;
  _getActiveRequests: () => any[];
  _getActiveHandles: () => any[];
  reallyExit: () => void;
  abort: () => void;
  chdir: () => void;
  cwd: () => string;
  exit: (code?: number) => void;
  kill: (pid: number, signal?: string | number) => boolean;
  memoryUsage: () => {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  hrtime: (time?: [number, number]) => [number, number];
  umask: (mask?: number) => number;
  stdout: any;
  stderr: any;
  stdin: any;
  openStdin: () => any;
  initgroups: () => number;
  setuid: (id: number | string) => void;
  setgid: (id: number | string) => void;
  getuid: () => number;
  getgid: () => number;
  getgroups: () => number[];
  getegid: () => number;
  geteuid: () => number;
  setgroups: (groups: number[]) => void;
  setegid: (id: number | string) => void;
  seteuid: (id: number | string) => void;
  emit: (event: string, ...args: any[]) => boolean;
  on: (event: string, listener: (...args: any[]) => void) => Process;
  once: (event: string, listener: (...args: any[]) => void) => Process;
  off: (event: string, listener: (...args: any[]) => void) => Process;
  removeListener: (event: string, listener: (...args: any[]) => void) => Process;
  removeAllListeners: (event?: string) => Process;
  listeners: (event: string) => Function[];
  addListener: (event: string, listener: (...args: any[]) => void) => Process;
  prependListener: (event: string, listener: (...args: any[]) => void) => Process;
  prependOnceListener: (event: string, listener: (...args: any[]) => void) => Process;
  eventNames: () => (string | symbol)[];
  listenerCount: (type: string | symbol) => number;
  _events: Record<string, Function | Function[]>;
  _eventsCount: number;
  _maxListeners: number | undefined;
  domain: null;
  _exiting: boolean;
  config: Record<string, any>;
  dlopen: () => void;
  emitWarning: (warning: string | Error, type?: string, code?: string, ctor?: Function) => void;
  maxTickDepth: number;
  moduleLoadList: string[];
  features: Record<string, any>;
  _rawDebug: (...args: any[]) => void;
  binding: (name: string) => any;
  _linkedBinding: (name: string) => any;
  _tickCallback: () => void;
  _fatalException: (error: Error) => boolean;
  _immediateCallback: () => void;
  _makeCallback: () => () => void;
  _processNextTick: () => void;
  nextTick: (callback: Function, ...args: any[]) => void;
  allowedNodeEnvironmentFlags: Set<string>;
  uptime: () => number;
}

// Enhanced type declarations for Vite's import.meta.env
declare global {
  interface ImportMetaEnv {
    MODE: string;
    DEV: boolean;
    PROD: boolean;
    SSR: boolean;
    BASE_URL: string;
    VITE_REPL_SLUG?: string;
    VITE_REPL_OWNER?: string;
    VITE_DEV_SERVER_PORT?: string;
    VITE_API_SERVER_PORT?: string;
    VITE_EXTERNAL_PORT?: string;
    VITE_HMR_TIMEOUT?: string;
    VITE_HMR_MAX_RETRIES?: string;
    VITE_HMR_RECONNECT_DELAY_MIN?: string;
    VITE_HMR_RECONNECT_DELAY_MAX?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
    readonly hot?: {
      readonly accept: Function;
      readonly dispose: Function;
      readonly invalidate: Function;
      readonly on: Function;
      readonly send: Function;
      readonly data: any;
      readonly socket?: WebSocket;
    }
  }

  interface Window {
    process: Process;
  }
}

// Environment configuration interface
interface EnvConfig {
  NODE_ENV: string;
  isDev: boolean;
  isProduction: boolean;
  host: string;
  ports: {
    frontend: number;
    api: number;
    external: number;
  };
  ws: {
    protocol: string;
    host: string;
    port: number;
    reconnect: {
      maxRetries: number;
      minDelay: number;
      maxDelay: number;
      timeout: number;
    };
  };
  api: {
    protocol: string;
    host: string;
    port: number;
  };
}

// Enhanced domain configuration
const getReplitDomain = (): string => {
  try {
    const replSlug = import.meta.env.VITE_REPL_SLUG;
    const replOwner = import.meta.env.VITE_REPL_OWNER;
    
    if (replSlug && replOwner) {
      return `${replSlug}.${replOwner}.repl.co`;
    }
    return '0.0.0.0';
  } catch (error) {
    console.error('[Environment] Error getting Replit domain:', error);
    return '0.0.0.0';
  }
};

// Initialize environment configuration
const initializeConfig = (): EnvConfig => {
  const isDev = import.meta.env.DEV;
  const domain = getReplitDomain();
  const isLocalhost = domain === '0.0.0.0';

  // Parse environment variables with fallbacks
  const devServerPort = parseInt(import.meta.env.VITE_DEV_SERVER_PORT || '5173');
  const apiServerPort = parseInt(import.meta.env.VITE_API_SERVER_PORT || '3001');
  const externalPort = parseInt(import.meta.env.VITE_EXTERNAL_PORT || '5000');

  // WebSocket reconnection configuration
  const wsMaxRetries = parseInt(import.meta.env.VITE_HMR_MAX_RETRIES || '100');
  const wsMinDelay = parseInt(import.meta.env.VITE_HMR_RECONNECT_DELAY_MIN || '1000');
  const wsMaxDelay = parseInt(import.meta.env.VITE_HMR_RECONNECT_DELAY_MAX || '30000');
  const wsTimeout = parseInt(import.meta.env.VITE_HMR_TIMEOUT || '30000');

  return {
    NODE_ENV: import.meta.env.MODE || 'development',
    isDev,
    isProduction: !isDev,
    host: domain,
    ports: {
      frontend: devServerPort,
      api: apiServerPort,
      external: externalPort
    },
    ws: {
      protocol: isLocalhost ? 'ws' : 'wss',
      host: domain,
      port: isLocalhost ? devServerPort : 443,
      reconnect: {
        maxRetries: wsMaxRetries,
        minDelay: wsMinDelay,
        maxDelay: wsMaxDelay,
        timeout: wsTimeout
      }
    },
    api: {
      protocol: isLocalhost ? 'http' : 'https',
      host: domain,
      port: isLocalhost ? apiServerPort : 80
    }
  };
};

// Initialize configuration
let config: EnvConfig;
try {
  config = initializeConfig();
} catch (error) {
  console.error('[Environment] Critical initialization error:', error);
  throw error;
}

// Initialize process.env in browser environment
if (typeof window !== 'undefined') {
  try {
    const processEnv: Record<string, string> = {
      NODE_ENV: import.meta.env.MODE || 'development',
      DEV: String(import.meta.env.DEV),
      PROD: String(import.meta.env.PROD),
      SSR: String(import.meta.env.SSR),
      BASE_URL: import.meta.env.BASE_URL || '/',
      MODE: import.meta.env.MODE || 'development',
      VITE_WS_PROTOCOL: config.ws.protocol,
      VITE_API_URL: `${config.api.protocol}://${config.api.host}:${config.api.port}`,
      VITE_WS_HOST: config.host,
      VITE_WS_PORT: String(config.ws.port),
      VITE_EXTERNAL_PORT: String(config.ports.external),
      VITE_DEV_SERVER_PORT: String(config.ports.frontend),
      VITE_API_SERVER_PORT: String(config.ports.api),
      VITE_HMR_TIMEOUT: String(config.ws.reconnect.timeout),
      VITE_HMR_MAX_RETRIES: String(config.ws.reconnect.maxRetries),
      VITE_HMR_RECONNECT_DELAY_MIN: String(config.ws.reconnect.minDelay),
      VITE_HMR_RECONNECT_DELAY_MAX: String(config.ws.reconnect.maxDelay)
    };

    if (!window.process) {
      const browserProcess: Process = {
        env: processEnv,
        title: 'browser',
        version: '',
        versions: {},
        argv: [],
        execArgv: [],
        pid: -1,
        ppid: -1,
        platform: 'browser',
        arch: '',
        execPath: '',
        debugPort: -1,
        argv0: '',
        browser: true,
        _startProfilerIdleNotifier: () => {},
        _stopProfilerIdleNotifier: () => {},
        _getActiveRequests: () => [],
        _getActiveHandles: () => [],
        reallyExit: () => {},
        abort: () => {},
        chdir: () => {},
        cwd: () => '/',
        exit: () => {},
        kill: () => false,
        memoryUsage: () => ({ heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0, rss: 0 }),
        hrtime: () => [0, 0],
        umask: () => 0,
        uptime: () => 0,
        stdout: null,
        stderr: null,
        stdin: null,
        openStdin: () => null,
        initgroups: () => -1,
        setuid: () => {},
        setgid: () => {},
        getuid: () => -1,
        getgid: () => -1,
        getgroups: () => [],
        getegid: () => -1,
        geteuid: () => -1,
        setgroups: () => {},
        setegid: () => {},
        seteuid: () => {},
        emit: () => false,
        on: function() { return this; },
        once: function() { return this; },
        off: function() { return this; },
        removeListener: function() { return this; },
        removeAllListeners: function() { return this; },
        listeners: () => [],
        addListener: function() { return this; },
        prependListener: function() { return this; },
        prependOnceListener: function() { return this; },
        eventNames: () => [],
        listenerCount: () => 0,
        _events: {},
        _eventsCount: 0,
        _maxListeners: undefined,
        domain: null,
        _exiting: false,
        config: {},
        dlopen: () => {},
        emitWarning: () => {},
        maxTickDepth: -1,
        moduleLoadList: [],
        features: {},
        _rawDebug: () => {},
        binding: () => ({}),
        _linkedBinding: () => ({}),
        _tickCallback: () => {},
        _fatalException: () => false,
        _immediateCallback: () => {},
        _makeCallback: () => () => {},
        _processNextTick: () => {},
        nextTick: (callback: Function) => setTimeout(callback, 0),
        allowedNodeEnvironmentFlags: new Set()
      };

      window.process = browserProcess;
    } else {
      window.process.env = { ...window.process.env, ...processEnv };
    }
  } catch (error) {
    console.error('[Environment] Error initializing process.env:', error);
    throw error;
  }
}

// Export environment helpers
export const isDevelopment = config.isDev;
export const isProduction = config.isProduction;
export const getWebSocketUrl = () => `${config.ws.protocol}://${config.ws.host}:${config.ws.port}`;
export const getApiUrl = () => `${config.api.protocol}://${config.api.host}:${config.api.port}`;

// Export environment configuration
export const env = {
  ...config,
  ...(typeof window !== 'undefined' ? window.process.env : {})
};
