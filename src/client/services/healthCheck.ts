import { fetchWithRetry } from '../utils/fetchWithRetry';
import { RetryManager } from '../../utils/retry';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
  services?: {
    database: 'connected' | 'disconnected';
    api: 'running' | 'stopped';
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
  private checkInterval: number = 30000; // 30 seconds
  private intervalId?: NodeJS.Timeout;
  private lastStatus: HealthStatus | null = null;
  private retryManager: RetryManager;

  private constructor() {
    this.retryManager = new RetryManager({
      maxRetries: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      onRetry: (attempt, error) => {
        console.log(`[${new Date().toISOString()}] [Health Check] Retry attempt ${attempt}:`, {
          error: error.message,
          nextAttemptIn: Math.min(1000 * Math.pow(2, attempt), 30000)
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

  async checkHealth(): Promise<HealthStatus> {
    try {
      const health = await fetchWithRetry<HealthStatus>('/api/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 30000
      });
      
      this.lastStatus = health;
      return health;
    } catch (error) {
      const unhealthyStatus: HealthStatus = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      this.lastStatus = unhealthyStatus;
      return unhealthyStatus;
    }
  }

  async checkReadiness(): Promise<ReadinessStatus> {
    try {
      return await fetchWithRetry<ReadinessStatus>('/api/ready', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000
      });
    } catch (error) {
      return {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  startMonitoring(onStatusChange?: (status: HealthStatus) => void) {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(async () => {
      try {
        const status = await this.retryManager.execute(() => this.checkHealth());
        if (onStatusChange && JSON.stringify(status) !== JSON.stringify(this.lastStatus)) {
          onStatusChange(status);
        }
      } catch (error) {
        console.error('[Health Check] Monitoring error:', error);
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
