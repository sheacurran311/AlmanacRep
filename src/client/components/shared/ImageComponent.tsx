import React, { useState, useEffect } from 'react';
import { getSignedUrl } from '../../utils/setupEnv';
import { PolyfillError } from '../../utils/initPolyfills';
import { createBrowserStreamFromResponse } from '../../utils/browserStream';

interface ImageComponentProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  maxRetries?: number;
  loadingComponent?: React.ReactNode;
  onError?: (error: Error) => void;
}

const ImageComponent: React.FC<ImageComponentProps> = ({
  src,
  fallbackSrc = '/assets/default-logo.svg',
  alt,
  maxRetries = 2,
  loadingComponent,
  onError,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(fallbackSrc);
  const [loading, setLoading] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let abortController: AbortController | null = null;
    let blobUrl: string | null = null;

    const loadImage = async () => {
      if (!src) {
        setLoading(false);
        return;
      }

      if (retryCount >= maxRetries) {
        const finalError = new Error(`Failed to load image after ${maxRetries} attempts`);
        console.error('[ImageComponent] Max retries reached:', finalError);
        onError?.(finalError);
        setCurrentSrc(fallbackSrc);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        abortController = new AbortController();

        // Cleanup previous blob URL if exists
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          blobUrl = null;
        }

        const targetUrl = src.startsWith('http') || src.startsWith('/') ? src : await getSignedUrl(src);
        if (!targetUrl) {
          throw new Error('Failed to get image URL');
        }

        const response = await fetch(targetUrl, { signal: abortController.signal });
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        // Use our custom stream implementation
        const stream = await createBrowserStreamFromResponse(response);
        const chunks: Uint8Array[] = [];
        
        stream.on('data', (chunk: Uint8Array) => {
          chunks.push(chunk);
        });

        await new Promise<void>((resolve, reject) => {
          stream.on('end', () => resolve());
          stream.on('error', (err) => reject(err));
        });

        const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'image/jpeg' });
        blobUrl = URL.createObjectURL(blob);

        if (!mounted) return;
        setCurrentSrc(blobUrl);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;

        const error = err instanceof Error ? err : new Error(String(err));
        console.warn(`[ImageComponent] Load error (attempt ${retryCount + 1}/${maxRetries}):`, {
          src,
          error: error.message,
          stack: error.stack
        });

        setError(error);
        if (retryCount < maxRetries && !(error instanceof PolyfillError)) {
          setRetryCount(prev => prev + 1);
        } else {
          onError?.(error);
          setCurrentSrc(fallbackSrc);
          setLoading(false);
        }
      }
    };

    loadImage().catch(err => {
      console.error('[ImageComponent] Unhandled error in loadImage:', err);
      if (mounted) {
        setCurrentSrc(fallbackSrc);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      abortController?.abort();
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src, retryCount, maxRetries, fallbackSrc, onError]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgError = new Error(`Image load error: ${(e.target as HTMLImageElement).src}`);
    console.error('[ImageComponent] Image error:', imgError);
    
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      onError?.(imgError);
    }
  };

  if (loading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      onError={handleImageError}
      loading="lazy"
      style={{
        ...props.style,
        opacity: loading ? 0 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
};

export default ImageComponent;
