import { setTimeout } from 'timers/promises';

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export class RetryManager {
  private maxRetries: number;
  private initialDelay: number;
  private maxDelay: number;
  private factor: number;
  private onRetry?: (attempt: number, error: Error) => void;

  constructor({
    maxRetries = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry
  }: RetryConfig = {}) {
    this.maxRetries = maxRetries;
    this.initialDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.factor = factor;
    this.onRetry = onRetry;
  }

  private calculateDelay(attempt: number): number {
    const delay = this.initialDelay * Math.pow(this.factor, attempt);
    return Math.min(delay, this.maxDelay);
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === this.maxRetries) {
          break;
        }

        const delay = this.calculateDelay(attempt);
        
        if (this.onRetry) {
          this.onRetry(attempt + 1, lastError);
        }
        
        await setTimeout(delay);
      }
    }

    throw new Error(`Operation failed after ${this.maxRetries} retries. Last error: ${lastError?.message}`);
  }
}
