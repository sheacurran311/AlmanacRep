import { RetryManager } from '../../utils/retry';
import { env } from './setupEnv';
import { PolyfillError } from './initPolyfills';

interface ApiRequestConfig extends RequestInit {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  skipHealthCheck?: boolean;
}

class ApiError extends Error {
  constructor(message: string, public statusCode?: number, public originalError?: Error) {
    super(message);
    this.name = 'ApiError';
    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

export class ApiService {
  private static instance: ApiService;
  private retryManager: RetryManager;
  private healthCheckPromise: Promise<boolean> | null = null;
  private isHealthy: boolean = false;

  private constructor() {
    this.retryManager = new RetryManager({
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      factor: 2,
      onRetry: (attempt, error) => {
        console.log(`[${new Date().toISOString()}] [API] Retry attempt ${attempt}:`, {
          error: error.message,
          nextAttemptIn: Math.min(1000 * Math.pow(2, attempt), 10000)
        });
      }
    });

    // Initialize health check
    if (typeof window !== 'undefined') {
      this.checkHealth().catch(error => {
        console.error('[API] Initial health check failed:', error);
      });

      // Set up periodic health checks
      setInterval(() => {
        this.checkHealth().catch(error => {
          console.error('[API] Periodic health check failed:', error);
        });
      }, 30000);
    }
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async checkHealth(): Promise<boolean> {
    if (this.healthCheckPromise) {
      return this.healthCheckPromise;
    }

    this.healthCheckPromise = (async () => {
      try {
        const response = await fetch(`${env.api.baseUrl}/health`);
        this.isHealthy = response.ok;
        return this.isHealthy;
      } catch (error) {
        this.isHealthy = false;
        throw new ApiError('Health check failed', undefined, error as Error);
      } finally {
        this.healthCheckPromise = null;
      }
    })();

    return this.healthCheckPromise;
  }

  async request<T>(endpoint: string, config: ApiRequestConfig = {}): Promise<T> {
    const { maxRetries, initialDelay, maxDelay, skipHealthCheck = false, ...fetchConfig } = config;

    if (!skipHealthCheck && !this.isHealthy) {
      try {
        await this.checkHealth();
      } catch (error) {
        throw new ApiError('API is not healthy', undefined, error as Error);
      }
    }

    if (maxRetries || initialDelay || maxDelay) {
      this.retryManager = new RetryManager({
        maxRetries: maxRetries || 3,
        initialDelay: initialDelay || 1000,
        maxDelay: maxDelay || 10000,
        factor: 2,
        onRetry: (attempt, error) => {
          console.log(`[${new Date().toISOString()}] [API] Retry attempt ${attempt}:`, {
            endpoint,
            error: error.message,
            nextAttemptIn: Math.min((initialDelay || 1000) * Math.pow(2, attempt), maxDelay || 10000)
          });
        }
      });
    }

    const url = endpoint.startsWith('http') ? endpoint : `${env.api.baseUrl}${endpoint}`;

    return this.retryManager.execute(async () => {
      try {
        const response = await fetch(url, {
          ...fetchConfig,
          headers: {
            'Content-Type': 'application/json',
            ...fetchConfig.headers,
          }
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new ApiError(
            `HTTP error! status: ${response.status}, body: ${errorBody}`,
            response.status
          );
        }

        return response.json();
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError('Request failed', undefined, error as Error);
      }
    });
  }

  async get<T>(endpoint: string, config: Omit<ApiRequestConfig, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data: any, config: Omit<ApiRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put<T>(endpoint: string, data: any, config: Omit<ApiRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete<T>(endpoint: string, config: Omit<ApiRequestConfig, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const apiService = ApiService.getInstance();
export default apiService;
