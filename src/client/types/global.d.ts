declare global {
  interface ProcessEnv {
    NODE_ENV: string;
    VITE_DEV_SERVER_PORT?: string;
    VITE_API_SERVER_PORT?: string;
    VITE_API_BASE_URL?: string;
    VITE_WS_PROTOCOL?: string;
    VITE_WS_HOST?: string;
    VITE_WS_PORT?: string;
    [key: string]: string | undefined;
  }

  interface Process {
    env: ProcessEnv;
    title?: string;
  }

  interface Window {
    process: Process & NodeJS.Process;
  }
}

export {};
