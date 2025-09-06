'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';
import { cn } from '../../utils/cn.js';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with lazy loading, error handling, and performance optimizations
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate blur placeholder for better UX
  const generateBlurDataURL = (w: number, h: number) => {
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect width="100%" height="100%" fill="url(#gradient)"/>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#e5e7eb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#d1d5db;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>`
    ).toString('base64')}`;
  };

  // Error fallback component
  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}
        style={{ width, height }}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const imageProps = {
    src,
    alt,
    onLoad: handleLoad,
    onError: handleError,
    priority,
    quality,
    placeholder: placeholder as 'blur' | 'empty',
    blurDataURL: blurDataURL || (width && height ? generateBlurDataURL(width, height) : undefined),
    sizes: sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    className: cn(
      'transition-opacity duration-300',
      isLoading ? 'opacity-0' : 'opacity-100',
      className
    ),
    style: {
      objectFit,
      objectPosition,
    },
  };

  if (fill) {
    return (
      <div className="relative overflow-hidden">
        <Image
          {...imageProps}
          fill
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Image
        {...imageProps}
        width={width}
        height={height}
      />
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
    </div>
  );
}

/**
 * Phone image component with optimized loading and fallbacks
 */
interface PhoneImageProps {
  src: string | string[];
  alt: string;
  className?: string;
  priority?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function PhoneImage({
  src,
  alt,
  className,
  priority = false,
  size = 'md',
}: PhoneImageProps) {
  const [currentSrc, setCurrentSrc] = useState(Array.isArray(src) ? src[0] : src);
  const [imageIndex, setImageIndex] = useState(0);

  const sizeConfig = {
    sm: { width: 120, height: 160 },
    md: { width: 200, height: 280 },
    lg: { width: 300, height: 420 },
    xl: { width: 400, height: 560 },
  };

  const { width, height } = sizeConfig[size];

  const handleError = useCallback(() => {
    if (Array.isArray(src) && imageIndex < src.length - 1) {
      const nextIndex = imageIndex + 1;
      setImageIndex(nextIndex);
      setCurrentSrc(src[nextIndex]);
    }
  }, [src, imageIndex]);

  return (
    <OptimizedImage
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn('rounded-lg shadow-md', className)}
      priority={priority}
      quality={85}
      placeholder="blur"
      onError={handleError}
      sizes={`(max-width: 640px) ${width}px, ${width}px`}
    />
  );
}

/**
 * Lazy loading image gallery component
 */
interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main image */}
      <OptimizedImage
        src={images[selectedIndex]}
        alt={`${alt} - Image ${selectedIndex + 1}`}
        width={400}
        height={300}
        className="w-full rounded-lg"
        priority={selectedIndex === 0}
        quality={90}
        placeholder="blur"
      />

      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'flex-shrink-0 rounded border-2 transition-colors',
                selectedIndex === index
                  ? 'border-orange-500'
                  : 'border-transparent hover:border-gray-300'
              )}
            >
              <OptimizedImage
                src={image}
                alt={`${alt} - Thumbnail ${index + 1}`}
                width={80}
                height={60}
                className="rounded"
                quality={60}
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}