interface ObjectStorageOptions {
  bucketId: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  maxRetries?: number;
  initialRetryDelay?: number;
  maxCacheSize?: number;
}

interface SignedUrlCache {
  [key: string]: {
    url: string;
    expiry: number;
  };
}

class BrowserObjectStorageClient {
  private bucketId: string;
  private maxFileSize: number;
  private allowedTypes: string[];
  private maxRetries: number;
  private initialRetryDelay: number;
  private urlCache: SignedUrlCache = {};
  private failedPaths: Set<string> = new Set();
  private maxCacheSize: number;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(options: ObjectStorageOptions) {
    this.bucketId = options.bucketId;
    this.maxFileSize = options.maxFileSize || 5 * 1024 * 1024;
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    this.maxRetries = options.maxRetries || 3;
    this.initialRetryDelay = options.initialRetryDelay || 1000;
    this.maxCacheSize = options.maxCacheSize || 100;

    // Handle beforeunload to cleanup any pending requests
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }

  private cleanup(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  private getCachedUrl(objectPath: string): string | null {
    if (this.failedPaths.has(objectPath)) {
      console.debug(`[ObjectStorage] Skipping known failed path: ${objectPath}`);
      return null;
    }

    const cached = this.urlCache[objectPath];
    if (cached && cached.expiry > Date.now()) {
      return cached.url;
    }
    delete this.urlCache[objectPath];
    return null;
  }

  private cleanCache(): void {
    const cacheEntries = Object.entries(this.urlCache);
    if (cacheEntries.length > this.maxCacheSize) {
      cacheEntries
        .sort(([, a], [, b]) => a.expiry - b.expiry)
        .slice(0, cacheEntries.length - this.maxCacheSize)
        .forEach(([key]) => delete this.urlCache[key]);
    }
  }

  private setCachedUrl(objectPath: string, url: string, ttl: number = 3600000): void {
    this.cleanCache();
    this.urlCache[objectPath] = {
      url,
      expiry: Date.now() + ttl
    };
  }

  private markPathAsFailed(objectPath: string, error: Error): void {
    console.error(`[ObjectStorage] Marking path as failed: ${objectPath}`, error);
    this.failedPaths.add(objectPath);
    setTimeout(() => {
      this.failedPaths.delete(objectPath);
      console.debug(`[ObjectStorage] Cleared failed status for: ${objectPath}`);
    }, 300000);
  }

  private async parseResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('[ObjectStorage] Error parsing response:', error);
      throw error;
    }
  }

  private createAbortController(objectPath: string): AbortController {
    // Cleanup existing controller if any
    this.abortControllers.get(objectPath)?.abort();
    const controller = new AbortController();
    this.abortControllers.set(objectPath, controller);
    return controller;
  }

  private async fetchWithRetry(
    url: string, 
    options: RequestInit = {}, 
    retryCount: number = 0,
    objectPath?: string
  ): Promise<Response> {
    const controller = objectPath ? this.createAbortController(objectPath) : new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout: ${url}`);
      }

      if (retryCount >= this.maxRetries) {
        throw new Error(`Max retries reached for ${url}: ${error.message}`);
      }

      const delay = this.initialRetryDelay * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.fetchWithRetry(url, options, retryCount + 1, objectPath);
    } finally {
      clearTimeout(timeoutId);
      if (objectPath) {
        this.abortControllers.delete(objectPath);
      }
    }
  }

  async getSignedUrl(objectPath: string): Promise<string | null> {
    try {
      const cachedUrl = this.getCachedUrl(objectPath);
      if (cachedUrl) {
        return cachedUrl;
      }

      const apiUrl = typeof window !== 'undefined' ? 
        `${window.location.protocol}//${window.location.host}` : 
        'http://localhost:3001';
      
      const response = await this.fetchWithRetry(
        `${apiUrl}/api/storage/signed-url?` + new URLSearchParams({
          bucketId: this.bucketId,
          objectPath
        }),
        {},
        0,
        objectPath
      );

      const data = await this.parseResponse(response);
      if (!data?.url) {
        throw new Error('Invalid response format');
      }

      // Verify the URL is accessible
      try {
        const headResponse = await fetch(data.url, { method: 'HEAD' });
        if (!headResponse.ok) {
          throw new Error(`URL verification failed: ${headResponse.status}`);
        }
      } catch (error) {
        throw new Error(`URL verification failed: ${error.message}`);
      }

      this.setCachedUrl(objectPath, data.url);
      return data.url;
    } catch (error) {
      this.markPathAsFailed(objectPath, error as Error);
      throw error;
    }
  }

  async uploadFile(file: File, path: string): Promise<string | null> {
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
    }

    if (!this.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    try {
      const apiUrl = typeof window !== 'undefined' ? 
        `${window.location.protocol}//${window.location.host}` : 
        'http://localhost:3001';

      const response = await this.fetchWithRetry(
        `${apiUrl}/api/storage/upload-url`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucketId: this.bucketId,
            path,
            contentType: file.type
          })
        },
        0,
        path
      );

      const data = await this.parseResponse(response);
      if (!data?.url || !data?.fields) {
        throw new Error('Invalid upload response format');
      }

      const formData = new FormData();
      Object.entries(data.fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', file);

      await this.fetchWithRetry(data.url, {
        method: 'POST',
        body: formData
      }, 0, path);

      this.failedPaths.delete(path);
      return path;
    } catch (error) {
      this.markPathAsFailed(path, error as Error);
      throw error;
    }
  }

  async downloadFile(path: string): Promise<Blob | null> {
    try {
      const signedUrl = await this.getSignedUrl(path);
      if (!signedUrl) {
        throw new Error('Failed to get signed URL');
      }

      const response = await this.fetchWithRetry(signedUrl, {}, 0, path);
      return await response.blob();
    } catch (error) {
      this.markPathAsFailed(path, error as Error);
      throw error;
    }
  }
}

export const createObjectStorageClient = (options: ObjectStorageOptions) => {
  return new BrowserObjectStorageClient(options);
};
