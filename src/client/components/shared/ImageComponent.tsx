import React, { useState, useEffect, useRef } from 'react';
import { getSignedUrl } from '../../utils/setupEnv';
import { getAssetPath, validateAssetExists, ASSETS } from '../../utils/assets';

interface ImageComponentProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  maxRetries?: number;
  loadingComponent?: React.ReactNode;
  onError?: (error: Error) => void;
  useLocalAsset?: boolean;
  assetKey?: keyof typeof ASSETS.logos | keyof typeof ASSETS.images;
}

const ImageComponent: React.FC<ImageComponentProps> = ({
  src,
  fallbackSrc = ASSETS.logos.placeholder,
  alt,
  maxRetries = 2,
  loadingComponent,
  onError,
  useLocalAsset = false,
  assetKey,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(
    assetKey ? 
      (ASSETS as any)[assetKey] : 
      (useLocalAsset ? getAssetPath(src) : fallbackSrc)
  );
  const [loading, setLoading] = useState<boolean>(!useLocalAsset && !assetKey);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs for cleanup
  const mounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const blobUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      mounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (blobUrl.current) {
        URL.revokeObjectURL(blobUrl.current);
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (blobUrl.current) {
        URL.revokeObjectURL(blobUrl.current);
        blobUrl.current = null;
      }
    };

    const loadImage = async () => {
      // If using asset key or no source provided, skip loading
      if (assetKey || !src) {
        setLoading(false);
        return;
      }

      // If it's a local asset, validate and use it
      if (useLocalAsset) {
        const assetPath = getAssetPath(src);
        const exists = await validateAssetExists(assetPath);
        if (exists) {
          setCurrentSrc(assetPath);
        } else {
          console.warn(`[ImageComponent] Local asset not found: ${assetPath}`);
          setCurrentSrc(fallbackSrc);
        }
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

      cleanup();

      try {
        setLoading(true);
        setError(null);
        abortController.current = new AbortController();

        // Set a timeout for the entire operation
        const timeout = new Promise((_, reject) => {
          timeoutRef.current = window.setTimeout(() => {
            reject(new Error('Image load timeout'));
          }, 10000); // 10 second timeout
        });

        const targetUrl = src.startsWith('http') || src.startsWith('/') ? 
          src : 
          await Promise.race([
            getSignedUrl(src),
            timeout
          ]);

        if (!targetUrl) {
          throw new Error('Failed to get image URL');
        }

        const response = await fetch(targetUrl, { 
          signal: abortController.current.signal,
          cache: 'no-cache'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const blob = await response.blob();
        const newBlobUrl = URL.createObjectURL(blob);

        // Test if the image can be loaded
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = () => reject(new Error('Invalid image data'));
          img.src = newBlobUrl;
        });

        if (!mounted.current) return;

        if (blobUrl.current) {
          URL.revokeObjectURL(blobUrl.current);
        }

        blobUrl.current = newBlobUrl;
        setCurrentSrc(newBlobUrl);
        setLoading(false);
      } catch (err) {
        if (!mounted.current) return;

        const error = err instanceof Error ? err : new Error(String(err));
        console.warn(`[ImageComponent] Load error (attempt ${retryCount + 1}/${maxRetries}):`, {
          src,
          error: error.message
        });

        setError(error);
        
        // Immediately use fallback for network errors
        if (error.name === 'AbortError' || error.message.includes('network error')) {
          onError?.(error);
          setCurrentSrc(fallbackSrc);
          setLoading(false);
        } else if (retryCount < maxRetries) {
          timeoutRef.current = window.setTimeout(() => {
            if (mounted.current) {
              setRetryCount(prev => prev + 1);
            }
          }, Math.min(1000 * Math.pow(2, retryCount), 5000)); // Exponential backoff
        } else {
          onError?.(error);
          setCurrentSrc(fallbackSrc);
          setLoading(false);
        }
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    };

    loadImage().catch(err => {
      console.error('[ImageComponent] Unhandled error in loadImage:', err);
      if (mounted.current) {
        setCurrentSrc(fallbackSrc);
        setLoading(false);
      }
    });

    return cleanup;
  }, [src, retryCount, maxRetries, fallbackSrc, onError, useLocalAsset, assetKey]);

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
