import React, { useState, useEffect } from 'react';
import { getSignedUrl } from '../../utils/setupEnv';
import { PolyfillError } from '../../utils/initPolyfills';

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

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Image load timeout')), 10000);
        });

        if (src.startsWith('http') || src.startsWith('/')) {
          // For direct URLs, verify accessibility with timeout
          const fetchPromise = fetch(src, { signal: abortController.signal });
          const response = await Promise.race([fetchPromise, timeoutPromise]);
          
          if (!response.ok) {
            throw new Error(`Failed to verify image URL: ${response.status}`);
          }
          
          if (mounted) setCurrentSrc(src);
        } else {
          try {
            const signedUrl = await getSignedUrl(src);
            if (!signedUrl) {
              throw new Error('Failed to get signed URL');
            }

            if (!mounted) return;

            // Verify signed URL is accessible
            const fetchPromise = fetch(signedUrl, { 
              method: 'HEAD',
              signal: abortController.signal 
            });
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (!response.ok) {
              throw new Error(`Failed to verify signed URL: ${response.status}`);
            }

            if (mounted) setCurrentSrc(signedUrl);
          } catch (err) {
            if (err instanceof PolyfillError) {
              console.error('[ImageComponent] Polyfill error:', err);
              throw err;
            }
            throw new Error(`Failed to load signed URL: ${err.message}`);
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.warn(`[ImageComponent] Load error (attempt ${retryCount + 1}/${maxRetries}):`, {
          src,
          error: error.message,
          stack: error.stack
        });

        if (mounted) {
          setError(error);
          if (retryCount < maxRetries && !(error instanceof PolyfillError)) {
            // Don't retry on polyfill errors
            setRetryCount(prev => prev + 1);
          } else {
            onError?.(error);
            setCurrentSrc(fallbackSrc);
          }
        }
      } finally {
        if (mounted) {
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
