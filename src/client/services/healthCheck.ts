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

  private constructor() {}

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      const health: HealthStatus = await response.json();
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
      const response = await fetch('/api/ready', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Readiness check failed: ${response.statusText}`);
      }

      return await response.json();
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
      const status = await this.checkHealth();
      if (onStatusChange && JSON.stringify(status) !== JSON.stringify(this.lastStatus)) {
        onStatusChange(status);
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
