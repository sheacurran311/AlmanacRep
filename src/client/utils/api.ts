import { RetryManager } from '../../utils/retry';
import { env } from './setupEnv';

interface ApiRequestConfig extends RequestInit {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

export class ApiService {
  private static instance: ApiService;
  private retryManager: RetryManager;

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
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async request<T>(endpoint: string, config: ApiRequestConfig = {}): Promise<T> {
    const { maxRetries, initialDelay, maxDelay, ...fetchConfig } = config;

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
      const response = await fetch(url, {
        ...fetchConfig,
        headers: {
          'Content-Type': 'application/json',
          ...fetchConfig.headers,
        }
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }

      return response.json();
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
