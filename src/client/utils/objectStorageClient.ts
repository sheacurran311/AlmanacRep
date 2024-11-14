interface ObjectStorageOptions {
  bucketId: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  maxRetries?: number;
  initialRetryDelay?: number;
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

  constructor(options: ObjectStorageOptions) {
    this.bucketId = options.bucketId;
    this.maxFileSize = options.maxFileSize || 5 * 1024 * 1024; // 5MB default
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    this.maxRetries = options.maxRetries || 3;
    this.initialRetryDelay = options.initialRetryDelay || 1000;
  }

  private getCachedUrl(objectPath: string): string | null {
    const cached = this.urlCache[objectPath];
    if (cached && cached.expiry > Date.now()) {
      return cached.url;
    }
    delete this.urlCache[objectPath];
    return null;
  }

  private setCachedUrl(objectPath: string, url: string, ttl: number = 3600000): void {
    this.urlCache[objectPath] = {
      url,
      expiry: Date.now() + ttl
    };
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
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
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
        return null;
      }

      const data = await this.parseResponse(response);
      if (data?.url) {
        this.setCachedUrl(objectPath, data.url);
        return data.url;
      }

      return null;
    } catch (error) {
      console.error('[ObjectStorage] Error getting signed URL:', error);
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

      return path;
    } catch (error) {
      console.error('[ObjectStorage] Upload error:', error);
      return null;
    }
  }

  async downloadFile(path: string): Promise<Blob | null> {
    try {
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
      return null;
    }
  }
}

export const createObjectStorageClient = (options: ObjectStorageOptions) => {
  return new BrowserObjectStorageClient(options);
};
