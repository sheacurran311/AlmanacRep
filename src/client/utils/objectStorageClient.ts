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

  constructor(options: ObjectStorageOptions) {
    this.bucketId = options.bucketId;
    this.maxFileSize = options.maxFileSize || 5 * 1024 * 1024;
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    this.maxRetries = options.maxRetries || 3;
    this.initialRetryDelay = options.initialRetryDelay || 1000;
    this.maxCacheSize = options.maxCacheSize || 100;
  }

  private getCachedUrl(objectPath: string): string | null {
    // Return null immediately if path is known to fail
    if (this.failedPaths.has(objectPath)) {
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
      // Sort by expiry and remove oldest entries
      cacheEntries.sort(([, a], [, b]) => a.expiry - b.expiry);
      const entriesToRemove = cacheEntries.slice(0, cacheEntries.length - this.maxCacheSize);
      entriesToRemove.forEach(([key]) => delete this.urlCache[key]);
    }
  }

  private setCachedUrl(objectPath: string, url: string, ttl: number = 3600000): void {
    this.cleanCache();
    this.urlCache[objectPath] = {
      url,
      expiry: Date.now() + ttl
    };
  }

  private markPathAsFailed(objectPath: string): void {
    this.failedPaths.add(objectPath);
    // Clean up failed paths after 5 minutes to allow retry
    setTimeout(() => {
      this.failedPaths.delete(objectPath);
    }, 300000);
  }

  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        return await response.json();
      } catch (error) {
        console.error('[ObjectStorage] Error parsing JSON response:', error);
        return null;
      }
    }
    return null;
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}, retryCount: number = 0): Promise<Response | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('[ObjectStorage] Request timeout:', url);
        return null;
      }

      if (retryCount >= this.maxRetries) {
        console.error('[ObjectStorage] Max retries reached:', error);
        return null;
      }

      const delay = this.initialRetryDelay * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.fetchWithRetry(url, options, retryCount + 1);
    }
  }

  async getSignedUrl(objectPath: string): Promise<string | null> {
    try {
      // Check failed paths first
      if (this.failedPaths.has(objectPath)) {
        console.debug(`[ObjectStorage] Skipping known failed path: ${objectPath}`);
        return null;
      }

      // Check cache
      const cachedUrl = this.getCachedUrl(objectPath);
      if (cachedUrl) {
        return cachedUrl;
      }

      const apiUrl = typeof window !== 'undefined' ? 
        `${window.location.protocol}//${window.location.host}` : 
        'http://localhost:3001';
      
      const response = await this.fetchWithRetry(`${apiUrl}/api/storage/signed-url?` + new URLSearchParams({
        bucketId: this.bucketId,
        objectPath
      }));

      if (!response) {
        this.markPathAsFailed(objectPath);
        return null;
      }

      const data = await this.parseResponse(response);
      if (data?.url) {
        // Verify the URL is accessible
        const headResponse = await fetch(data.url, { method: 'HEAD' }).catch(() => null);
        if (headResponse?.ok) {
          this.setCachedUrl(objectPath, data.url);
          return data.url;
        }
      }

      this.markPathAsFailed(objectPath);
      return null;
    } catch (error) {
      console.error('[ObjectStorage] Error getting signed URL:', error);
      this.markPathAsFailed(objectPath);
      return null;
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

      const response = await this.fetchWithRetry(`${apiUrl}/api/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucketId: this.bucketId,
          path,
          contentType: file.type
        })
      });

      if (!response) {
        return null;
      }

      const data = await this.parseResponse(response);
      if (!data?.url || !data?.fields) {
        return null;
      }

      const formData = new FormData();
      Object.entries(data.fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', file);

      const uploadResponse = await this.fetchWithRetry(data.url, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse) {
        return null;
      }

      // Clear from failed paths if it was there
      this.failedPaths.delete(path);
      return path;
    } catch (error) {
      console.error('[ObjectStorage] Upload error:', error);
      return null;
    }
  }

  async downloadFile(path: string): Promise<Blob | null> {
    try {
      if (this.failedPaths.has(path)) {
        return null;
      }

      const signedUrl = await this.getSignedUrl(path);
      if (!signedUrl) {
        return null;
      }

      const response = await this.fetchWithRetry(signedUrl);
      if (!response) {
        return null;
      }

      return await response.blob();
    } catch (error) {
      console.error('[ObjectStorage] Download error:', error);
      this.markPathAsFailed(path);
      return null;
    }
  }
}

export const createObjectStorageClient = (options: ObjectStorageOptions) => {
  return new BrowserObjectStorageClient(options);
};
