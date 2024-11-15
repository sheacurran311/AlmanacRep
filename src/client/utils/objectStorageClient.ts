import type { ApiError } from './api';

interface ObjectStorageOptions {
  bucketId: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  maxRetries?: number;
  initialRetryDelay?: number;
  maxCacheSize?: number;
  cacheDuration?: number;
}

interface SignedUrlCache {
  [key: string]: {
    url: string;
    expiry: number;
    eTag?: string;
  };
}

interface CacheConfig {
  version: string;
  lastCleanup: number;
  urls: SignedUrlCache;
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
  private cacheDuration: number;
  private cacheVersion = '1.0';
  private lastCleanup: number = Date.now();
  private cleanupInterval: number = 300000; // 5 minutes
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(options: ObjectStorageOptions) {
    this.bucketId = options.bucketId;
    this.maxFileSize = options.maxFileSize || 5 * 1024 * 1024;
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    this.maxRetries = options.maxRetries || 3;
    this.initialRetryDelay = options.initialRetryDelay || 1000;
    this.maxCacheSize = options.maxCacheSize || 100;
    this.cacheDuration = options.cacheDuration || 3600000; // 1 hour default

    this.loadCacheFromStorage();
    this.setupCacheCleanup();

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }

  private cleanup(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    this.saveCacheToStorage();
  }

  private setupCacheCleanup(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanCache(), this.cleanupInterval);
    }
  }

  private loadCacheFromStorage(): void {
    try {
      const storedCache = localStorage.getItem('objectStorageCache');
      if (storedCache) {
        const parsed: CacheConfig = JSON.parse(storedCache);
        if (parsed.version === this.cacheVersion) {
          // Validate cached entries before restoring
          Object.entries(parsed.urls).forEach(([key, value]) => {
            if (value.expiry <= Date.now()) {
              delete parsed.urls[key];
            }
          });
          this.urlCache = parsed.urls;
          this.lastCleanup = parsed.lastCleanup;
          console.debug('[ObjectStorage] Cache loaded from storage');
        }
      }
    } catch (error) {
      console.warn('[ObjectStorage] Failed to load cache from storage:', error);
      this.urlCache = {};
    }
  }

  private saveCacheToStorage(): void {
    try {
      // Clean expired entries before saving
      this.cleanCache();
      
      const cacheConfig: CacheConfig = {
        version: this.cacheVersion,
        lastCleanup: this.lastCleanup,
        urls: this.urlCache
      };
      localStorage.setItem('objectStorageCache', JSON.stringify(cacheConfig));
    } catch (error) {
      console.warn('[ObjectStorage] Failed to save cache to storage:', error);
    }
  }

  private getCachedUrl(objectPath: string): string | null {
    // Normalize path
    const normalizedPath = this.normalizePath(objectPath);
    
    if (this.failedPaths.has(normalizedPath)) {
      console.debug(`[ObjectStorage] Skipping known failed path: ${normalizedPath}`);
      return null;
    }

    const cached = this.urlCache[normalizedPath];
    if (cached) {
      if (cached.expiry > Date.now()) {
        return cached.url;
      }
      delete this.urlCache[normalizedPath];
      this.saveCacheToStorage();
    }
    return null;
  }

  private cleanCache(): void {
    const now = Date.now();
    let entriesRemoved = 0;

    // Remove expired entries
    Object.entries(this.urlCache).forEach(([key, value]) => {
      if (value.expiry <= now) {
        delete this.urlCache[key];
        entriesRemoved++;
      }
    });

    // Remove excess entries if cache is too large
    const entries = Object.entries(this.urlCache);
    if (entries.length > this.maxCacheSize) {
      entries
        .sort(([, a], [, b]) => a.expiry - b.expiry)
        .slice(0, entries.length - this.maxCacheSize)
        .forEach(([key]) => {
          delete this.urlCache[key];
          entriesRemoved++;
        });
    }

    // Clear failed paths older than 5 minutes
    const fiveMinutesAgo = now - 300000;
    this.failedPaths.forEach(path => {
      const failedTime = parseInt(path.split('_')[1] || '0');
      if (failedTime < fiveMinutesAgo) {
        this.failedPaths.delete(path);
      }
    });

    if (entriesRemoved > 0) {
      console.debug(`[ObjectStorage] Cleaned ${entriesRemoved} cache entries`);
      this.saveCacheToStorage();
    }

    this.lastCleanup = now;
  }

  private async validateCacheEntry(objectPath: string, url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const eTag = response.headers.get('etag');
      if (eTag && this.urlCache[objectPath]?.eTag !== eTag) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private setCachedUrl(objectPath: string, url: string, eTag?: string | null): void {
    const normalizedPath = this.normalizePath(objectPath);
    
    this.urlCache[normalizedPath] = {
      url,
      expiry: Date.now() + this.cacheDuration,
      eTag: eTag || undefined
    };
    
    if (Object.keys(this.urlCache).length >= this.maxCacheSize) {
      this.cleanCache();
    }
    
    this.saveCacheToStorage();
  }

  private markPathAsFailed(objectPath: string, error: Error): void {
    const normalizedPath = this.normalizePath(objectPath);
    const timestamp = Date.now();
    const failedKey = `${normalizedPath}_${timestamp}`;
    
    console.error(`[ObjectStorage] Marking path as failed: ${normalizedPath}`, error);
    this.failedPaths.add(failedKey);
    
    // Remove from cache if exists
    delete this.urlCache[normalizedPath];
    this.saveCacheToStorage();
  }

  private normalizePath(path: string): string {
    // Remove leading/trailing slashes and normalize to forward slashes
    return path.replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');
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
        signal: controller.signal,
        cache: 'no-cache' // Ensure we don't use browser's cache
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout: ${url}`);
        }

        if (retryCount >= this.maxRetries) {
          throw new Error(`Max retries reached for ${url}: ${error.message}`);
        }
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
      const normalizedPath = this.normalizePath(objectPath);
      const cachedUrl = this.getCachedUrl(normalizedPath);
      
      if (cachedUrl && await this.validateCacheEntry(normalizedPath, cachedUrl)) {
        return cachedUrl;
      }

      const apiUrl = typeof window !== 'undefined' ? 
        `${window.location.protocol}//${window.location.host}` : 
        'http://localhost:3001';
      
      const response = await this.fetchWithRetry(
        `${apiUrl}/api/storage/signed-url?` + new URLSearchParams({
          bucketId: this.bucketId,
          objectPath: normalizedPath
        }),
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        },
        0,
        normalizedPath
      );

      const data = await this.parseResponse(response);
      if (!data?.url) {
        throw new Error('Invalid response format');
      }

      // Verify the URL is accessible and get eTag
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const headResponse = await fetch(data.url, { 
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!headResponse.ok) {
          throw new Error(`URL verification failed: ${headResponse.status}`);
        }

        const eTag = headResponse.headers.get('etag');
        this.setCachedUrl(normalizedPath, data.url, eTag);
        return data.url;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        this.markPathAsFailed(objectPath, error);
      }
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

      // Clear any cached URL for this path
      delete this.urlCache[path];
      this.failedPaths.delete(path);
      this.saveCacheToStorage();

      return path;
    } catch (error) {
      if (error instanceof Error) {
        this.markPathAsFailed(path, error);
      }
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
      if (error instanceof Error) {
        this.markPathAsFailed(path, error);
      }
      throw error;
    }
  }
}

export const createObjectStorageClient = (options: ObjectStorageOptions) => {
  return new BrowserObjectStorageClient(options);
};
