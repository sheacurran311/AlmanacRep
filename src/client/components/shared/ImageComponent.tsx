import React, { useState, useEffect } from 'react';
import { getSignedUrl } from '../../utils/setupEnv';

interface ImageComponentProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  maxRetries?: number;
  loadingComponent?: React.ReactNode;
}

const ImageComponent: React.FC<ImageComponentProps> = ({
  src,
  fallbackSrc = '/public/assets/default-logo.svg',
  alt,
  maxRetries = 2,
  loadingComponent,
  onError,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src || '');
  const [loading, setLoading] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      if (!src || retryCount >= maxRetries) return;

      try {
        setLoading(true);
        if (src.startsWith('http') || src.startsWith('/')) {
          // Direct URL or local path
          setCurrentSrc(src);
        } else {
          // Try to get signed URL
          const signedUrl = await getSignedUrl(src);
          if (mounted && signedUrl) {
            setCurrentSrc(signedUrl);
          } else if (mounted) {
            throw new Error('Failed to get signed URL');
          }
        }
      } catch (error) {
        console.warn(`[ImageComponent] Failed to load image: ${error.message}`);
        if (mounted && retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
        } else if (mounted) {
          setCurrentSrc(fallbackSrc);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [src, retryCount, maxRetries, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (currentSrc !== fallbackSrc) {
      console.warn('[ImageComponent] Image load error, falling back to default');
      setCurrentSrc(fallbackSrc);
    }
    if (onError) {
      onError(e);
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
      onError={handleError}
      loading="lazy"
    />
  );
};

export default ImageComponent;
