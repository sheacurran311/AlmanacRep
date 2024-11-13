import { RetryManager } from '../../utils/retry';

interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

const defaultRetryManager = new RetryManager({
  maxRetries: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  onRetry: (attempt, error) => {
    console.log(`[${new Date().toISOString()}] [Fetch] Retry attempt ${attempt}:`, {
      error: error.message,
      nextAttemptIn: Math.min(1000 * Math.pow(2, attempt), 30000)
    });
  }
});

export const fetchWithRetry = async <T>(
  url: string, 
  options: FetchWithRetryOptions = {}
): Promise<T> => {
  const { maxRetries, initialDelay, maxDelay, ...fetchOptions } = options;
  
  const retryManager = new RetryManager({
    maxRetries: maxRetries || 5,
    initialDelay: initialDelay || 1000,
    maxDelay: maxDelay || 30000,
    onRetry: (attempt, error) => {
      console.log(`[${new Date().toISOString()}] [Fetch] Retry attempt ${attempt}:`, {
        url,
        error: error.message,
        nextAttemptIn: Math.min(1000 * Math.pow(2, attempt), 30000)
      });
    }
  });

  return retryManager.execute(async () => {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }
    
    return response.json();
  });
};

export const createRetryFetch = (baseOptions: FetchWithRetryOptions = {}) => {
  return <T>(url: string, options: FetchWithRetryOptions = {}): Promise<T> => {
    return fetchWithRetry<T>(url, { ...baseOptions, ...options });
  };
};
