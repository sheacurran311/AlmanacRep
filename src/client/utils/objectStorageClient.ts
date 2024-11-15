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
    contentType?: string;
    size?: number;
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
  private failedPaths: Map<string, { timestamp: number; retries: number }> = new Map();
  private maxCacheSize: number;
  private cacheDuration: number;
  private cacheVersion = '1.1';
  private lastCleanup: number = Date.now();
  private cleanupInterval: number = 300000; // 5 minutes
  private abortControllers: Map<string, AbortController> = new Map();
  private preloadQueue: Set<string> = new Set();
  private isPreloading: boolean = false;

  constructor(options: ObjectStorageOptions) {
    this.bucketId = options.bucketId;
    this.maxFileSize = options.maxFileSize || 5 * 1024 * 1024;
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    this.maxRetries = options.maxRetries || 3;
    this.initialRetryDelay = options.initialRetryDelay || 1000;
    this.maxCacheSize = options.maxCacheSize || 100;
    this.cacheDuration = options.cacheDuration || 3600000; // 1 hour default

    this.loadCacheFromStorage();
    this.setupCacheCleanup();
    this.setupPreloader();

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  private handleOnline(): void {
    console.debug('[ObjectStorage] Network is online, resuming operations');
    this.retryFailedPaths();
  }

  private handleOffline(): void {
    console.debug('[ObjectStorage] Network is offline, pausing operations');
  }

  private setupPreloader(): void {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const processPreloadQueue = async () => {
        if (this.isPreloading || this.preloadQueue.size === 0) return;

        this.isPreloading = true;
        const paths = Array.from(this.preloadQueue);
        this.preloadQueue.clear();

        for (const path of paths) {
          try {
            await this.preloadAsset(path);
          } catch (error) {
            console.warn(`[ObjectStorage] Failed to preload: ${path}`, error);
          }
        }

        this.isPreloading = false;
      };

      setInterval(() => {
        (window as any).requestIdleCallback(() => processPreloadQueue(), { timeout: 2000 });
      }, 5000);
    }
  }

  private async preloadAsset(path: string): Promise<void> {
    try {
      const url = await this.getSignedUrl(path);
      if (!url) return;

      // Create a hidden image to trigger browser caching
      const img = new Image();
      img.style.display = 'none';
      img.src = url;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    } catch (error) {
      console.warn(`[ObjectStorage] Preload failed for ${path}:`, error);
    }
  }

  private cleanup(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    this.saveCacheToStorage();
  }

  private setupCacheCleanup(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        try {
          this.cleanCache();
        } catch (error) {
          console.error('[ObjectStorage] Cache cleanup error:', error);
        }
      }, this.cleanupInterval);
    }
  }

  private loadCacheFromStorage(): void {
    try {
      const storedCache = localStorage.getItem('objectStorageCache');
      if (storedCache) {
        const parsed: CacheConfig = JSON.parse(storedCache);
        if (parsed.version === this.cacheVersion) {
          const now = Date.now();
          Object.entries(parsed.urls).forEach(([key, value]) => {
            if (value.expiry > now) {
              this.urlCache[key] = value;
            }
          });
          this.lastCleanup = parsed.lastCleanup;
          console.debug('[ObjectStorage] Cache loaded:', Object.keys(this.urlCache).length, 'items');
        } else {
          console.debug('[ObjectStorage] Cache version mismatch, clearing cache');
          this.clearCache();
        }
      }
    } catch (error) {
      console.warn('[ObjectStorage] Failed to load cache:', error);
      this.clearCache();
    }
  }

  private clearCache(): void {
    this.urlCache = {};
    this.failedPaths.clear();
    localStorage.removeItem('objectStorageCache');
  }

  private saveCacheToStorage(): void {
    try {
      this.cleanCache();
      
      const cacheConfig: CacheConfig = {
        version: this.cacheVersion,
        lastCleanup: this.lastCleanup,
        urls: this.urlCache
      };
      localStorage.setItem('objectStorageCache', JSON.stringify(cacheConfig));
    } catch (error) {
      console.warn('[ObjectStorage] Failed to save cache:', error);
    }
  }

  private getCachedUrl(objectPath: string): string | null {
    const normalizedPath = this.normalizePath(objectPath);
    
    const failedEntry = this.failedPaths.get(normalizedPath);
    if (failedEntry) {
      const { timestamp, retries } = failedEntry;
      const backoffTime = this.initialRetryDelay * Math.pow(2, retries);
      if (Date.now() - timestamp < backoffTime) {
        return null;
      }
      // Clear failed entry if backoff time has passed
      this.failedPaths.delete(normalizedPath);
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

  private async validateCacheEntry(objectPath: string, url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const eTag = response.headers.get('etag');
      const cached = this.urlCache[objectPath];
      if (eTag && cached?.eTag !== eTag) {
        return false;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !this.allowedTypes.includes(contentType)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
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

    // Clear old failed paths
    this.failedPaths.forEach((entry, path) => {
      if (now - entry.timestamp > 300000) { // 5 minutes
        this.failedPaths.delete(path);
      }
    });

    if (entriesRemoved > 0) {
      console.debug(`[ObjectStorage] Cleaned ${entriesRemoved} cache entries`);
      this.saveCacheToStorage();
    }

    this.lastCleanup = now;
  }

  private setCachedUrl(objectPath: string, url: string, metadata?: { eTag?: string; contentType?: string; size?: number }): void {
    const normalizedPath = this.normalizePath(objectPath);
    
    this.urlCache[normalizedPath] = {
      url,
      expiry: Date.now() + this.cacheDuration,
      ...metadata
    };
    
    if (Object.keys(this.urlCache).length >= this.maxCacheSize) {
      this.cleanCache();
    }
    
    this.saveCacheToStorage();
  }

  private markPathAsFailed(objectPath: string, error: Error): void {
    const normalizedPath = this.normalizePath(objectPath);
    const existingEntry = this.failedPaths.get(normalizedPath);
    
    this.failedPaths.set(normalizedPath, {
      timestamp: Date.now(),
      retries: (existingEntry?.retries || 0) + 1
    });
    
    console.error(`[ObjectStorage] Path failed: ${normalizedPath}`, {
      error: error.message,
      retries: this.failedPaths.get(normalizedPath)?.retries
    });
    
    delete this.urlCache[normalizedPath];
    this.saveCacheToStorage();
  }

  private retryFailedPaths(): void {
    const now = Date.now();
    this.failedPaths.forEach((entry, path) => {
      const backoffTime = this.initialRetryDelay * Math.pow(2, entry.retries - 1);
      if (now - entry.timestamp >= backoffTime) {
        this.preloadQueue.add(path);
      }
    });
  }

  private normalizePath(path: string): string {
    return path.replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');
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
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
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

      const data = await response.json();
      if (!data?.url) {
        throw new Error('Invalid response format');
      }

      // Verify the URL is accessible and get metadata
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const headResponse = await fetch(data.url, { 
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (!headResponse.ok) {
          throw new Error(`URL verification failed: ${headResponse.status}`);
        }

        const metadata = {
          eTag: headResponse.headers.get('etag') || undefined,
          contentType: headResponse.headers.get('content-type') || undefined,
          size: parseInt(headResponse.headers.get('content-length') || '0', 10) || undefined
        };

        this.setCachedUrl(normalizedPath, data.url, metadata);
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
