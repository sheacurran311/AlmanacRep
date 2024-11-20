import { fetchWithRetry } from '../utils/fetchWithRetry';
import { RetryManager } from '../../utils/retry';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
  services?: {
    database: 'connected' | 'disconnected';
    api: 'running' | 'stopped';
    frontend: 'running' | 'stopped';
  };
  ports?: {
    api: {
      port: number;
      status: 'available' | 'unavailable';
    };
    frontend: {
      port: number;
      status: 'available' | 'unavailable';
    };
  };
  uptime?: number;
  environment?: string;
  error?: string;
}

interface ReadinessStatus {
  status: 'ready' | 'not ready';
  timestamp: string;
  error?: string;
}

class HealthCheckService {
  private static instance: HealthCheckService;
  private checkInterval: number = 10000; // 10 seconds for more responsive health checks
  private maxRetries: number = 3;
  private baseDelay: number = 1000;
  private intervalId?: NodeJS.Timeout;
  private lastStatus: HealthStatus | null = null;
  private retryManager: RetryManager;
  private apiBase: string;

  private constructor() {
    const apiPort = import.meta.env.VITE_API_SERVER_PORT || '3001';
    const isDev = import.meta.env.DEV;
    
    // In development, use the full URL with port, but remove /api prefix
    this.apiBase = isDev ? `http://localhost:${apiPort}` : '';
    
    this.retryManager = new RetryManager({
      maxRetries: 3, // Reduced from 5 to prevent excessive retries
      initialDelay: 1000,
      maxDelay: 5000,
      onRetry: (attempt, error) => {
        console.log(`[${new Date().toISOString()}] [Health Check] Retry attempt ${attempt}:`, {
          error: error.message,
          nextAttemptIn: Math.min(1000 * Math.pow(2, attempt), 5000)
        });
      }
    });
  }

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  private handleFetchError(error: any): HealthStatus {
    let errorMessage = 'Unknown error occurred';
    let status: HealthStatus['status'] = 'unhealthy';

    if (error instanceof Response) {
      if (error.status === 404) {
        errorMessage = 'Health check endpoint not found';
        // Don't retry on 404s
        this.retryManager.reset();
      } else {
        errorMessage = `HTTP error! status: ${error.status}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const unhealthyStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      error: errorMessage,
      services: {
        database: 'disconnected',
        api: 'stopped',
        frontend: 'running'
      }
    };

    this.lastStatus = unhealthyStatus;
    return unhealthyStatus;
  }

  async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await fetchWithRetry<HealthStatus>(`${this.apiBase}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 5000
      });

      if (!response || typeof response.status !== 'string') {
        throw new Error('Invalid health check response format');
      }

      this.lastStatus = response;
      return response;
    } catch (error) {
      return this.handleFetchError(error);
    }
  }

  async checkReadiness(): Promise<ReadinessStatus> {
    try {
      const response = await fetchWithRetry<ReadinessStatus>(`${this.apiBase}/ready`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        maxRetries: 2,
        initialDelay: 1000,
        maxDelay: 5000
      });

      if (!response || typeof response.status !== 'string') {
        throw new Error('Invalid readiness check response format');
      }

      return response;
    } catch (error) {
      return {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error during readiness check'
      };
    }
  }

  startMonitoring(onStatusChange?: (status: HealthStatus) => void) {
    if (this.intervalId) {
      return;
    }

    // Initial check
    this.checkHealth().then(status => {
      if (onStatusChange) {
        onStatusChange(status);
      }
    });

    this.intervalId = setInterval(async () => {
      try {
        const status = await this.retryManager.execute(() => this.checkHealth());
        if (onStatusChange && JSON.stringify(status) !== JSON.stringify(this.lastStatus)) {
          onStatusChange(status);
        }
      } catch (error) {
        console.error('[Health Check] Monitoring error:', error);
        if (onStatusChange) {
          onStatusChange(this.handleFetchError(error));
        }
      }
    }, this.checkInterval);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  getLastStatus(): HealthStatus | null {
    return this.lastStatus;
  }
}

export const healthCheckService = HealthCheckService.getInstance();
export type { HealthStatus, ReadinessStatus };
