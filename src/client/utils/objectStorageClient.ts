interface ObjectStorageOptions {
  bucketId: string;
  baseUrl?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  uploadTimeout?: number;
}

class BrowserObjectStorageClient {
  private bucketId: string;
  private baseUrl: string;
  private maxFileSize: number;
  private allowedTypes: string[];
  private uploadTimeout: number;

  constructor(options: ObjectStorageOptions) {
    this.bucketId = options.bucketId;
    this.baseUrl = options.baseUrl || '';
    this.maxFileSize = options.maxFileSize || 5 * 1024 * 1024; // 5MB default
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    this.uploadTimeout = options.uploadTimeout || 30000; // 30s default
  }

  async getSignedUrl(objectPath: string): Promise<string> {
    try {
      const apiUrl = typeof window !== 'undefined' ? 
        `${window.location.protocol}//${window.location.host}` : 
        'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/storage/signed-url?` + new URLSearchParams({
        bucketId: this.bucketId,
        objectPath
      }));

      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('[ObjectStorage] Error getting signed URL:', error);
      return `/${objectPath}`;
    }
  }

  async uploadFile(file: File, path: string): Promise<string> {
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

      // Get signed URL for upload
      const response = await fetch(`${apiUrl}/api/storage/upload-url`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucketId: this.bucketId,
          path,
          contentType: file.type
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { url, fields } = await response.json();

      // Prepare form data for upload
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', file);

      // Upload directly to storage
      const uploadResponse = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      return path;
    } catch (error) {
      console.error('[ObjectStorage] Upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  async downloadFile(path: string): Promise<Blob> {
    try {
      const signedUrl = await this.getSignedUrl(path);
      const response = await fetch(signedUrl);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      return await response.blob();
    } catch (error) {
      console.error('[ObjectStorage] Download error:', error);
      throw new Error('Failed to download file');
    }
  }
}

export const createObjectStorageClient = (options: ObjectStorageOptions) => {
  return new BrowserObjectStorageClient(options);
};
