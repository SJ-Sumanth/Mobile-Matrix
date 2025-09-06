/**
 * Custom image loader for CDN integration and optimization
 */

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * CDN configuration
 */
const CDN_CONFIG = {
  baseUrl: process.env.CDN_URL || '',
  imageOptimization: process.env.ENABLE_IMAGE_OPTIMIZATION === 'true',
  defaultQuality: 75,
  formats: ['webp', 'avif', 'jpg'],
};

/**
 * Custom image loader for production CDN
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  // For development or when CDN is not configured, return original src
  if (process.env.NODE_ENV === 'development' || !CDN_CONFIG.baseUrl) {
    return src;
  }

  // Handle external URLs (don't process through CDN)
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  const params = new URLSearchParams();
  
  // Set width
  params.set('w', width.toString());
  
  // Set quality
  const imageQuality = quality || CDN_CONFIG.defaultQuality;
  params.set('q', imageQuality.toString());
  
  // Enable format optimization if supported
  if (CDN_CONFIG.imageOptimization) {
    params.set('f', 'auto'); // Auto-detect best format
  }
  
  // Construct CDN URL
  const cdnUrl = `${CDN_CONFIG.baseUrl}/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
  
  return cdnUrl;
}

/**
 * Generate responsive image URLs for different screen sizes
 */
export function generateResponsiveUrls(
  src: string,
  sizes: number[] = [640, 750, 828, 1080, 1200, 1920],
  quality?: number
): { src: string; width: number }[] {
  return sizes.map(width => ({
    src: imageLoader({ src, width, quality }),
    width,
  }));
}

/**
 * Generate srcSet string for responsive images
 */
export function generateSrcSet(
  src: string,
  sizes: number[] = [640, 750, 828, 1080, 1200, 1920],
  quality?: number
): string {
  const urls = generateResponsiveUrls(src, sizes, quality);
  return urls.map(({ src, width }) => `${src} ${width}w`).join(', ');
}

/**
 * Optimize image URL for specific use case
 */
export function optimizeImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  } = {}
): string {
  const {
    width = 800,
    height,
    quality = CDN_CONFIG.defaultQuality,
    format,
    fit = 'cover',
  } = options;

  // For development or external URLs
  if (process.env.NODE_ENV === 'development' || src.startsWith('http')) {
    return src;
  }

  const params = new URLSearchParams();
  params.set('w', width.toString());
  params.set('q', quality.toString());
  
  if (height) {
    params.set('h', height.toString());
  }
  
  if (format) {
    params.set('f', format);
  }
  
  if (fit) {
    params.set('fit', fit);
  }

  return `${CDN_CONFIG.baseUrl}/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, options?: { width?: number; quality?: number }): void {
  if (typeof window === 'undefined') return;

  const optimizedSrc = optimizeImageUrl(src, options);
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = optimizedSrc;
  
  document.head.appendChild(link);
}

/**
 * Lazy load images with intersection observer
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private images: Set<HTMLImageElement> = new Set();

  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window === 'undefined') return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          this.loadImage(img);
          this.observer?.unobserve(img);
          this.images.delete(img);
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });
  }

  observe(img: HTMLImageElement): void {
    if (!this.observer) return;
    
    this.images.add(img);
    this.observer.observe(img);
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      
      // Add loaded class for animations
      img.addEventListener('load', () => {
        img.classList.add('loaded');
      });
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.images.clear();
    }
  }
}

/**
 * Image cache management
 */
export class ImageCache {
  private cache: Map<string, string> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: string): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Global image cache instance
 */
export const globalImageCache = new ImageCache();

/**
 * Phone image optimization utilities
 */
export const PhoneImageOptimizer = {
  /**
   * Optimize phone thumbnail
   */
  thumbnail(src: string): string {
    return optimizeImageUrl(src, {
      width: 200,
      height: 280,
      quality: 80,
      format: 'webp',
      fit: 'cover',
    });
  },

  /**
   * Optimize phone card image
   */
  card(src: string): string {
    return optimizeImageUrl(src, {
      width: 300,
      height: 400,
      quality: 85,
      format: 'webp',
      fit: 'cover',
    });
  },

  /**
   * Optimize phone detail image
   */
  detail(src: string): string {
    return optimizeImageUrl(src, {
      width: 600,
      height: 800,
      quality: 90,
      format: 'webp',
      fit: 'contain',
    });
  },

  /**
   * Optimize phone gallery image
   */
  gallery(src: string): string {
    return optimizeImageUrl(src, {
      width: 800,
      height: 600,
      quality: 95,
      format: 'webp',
      fit: 'contain',
    });
  },

  /**
   * Generate responsive phone image URLs
   */
  responsive(src: string): {
    thumbnail: string;
    card: string;
    detail: string;
    gallery: string;
  } {
    return {
      thumbnail: this.thumbnail(src),
      card: this.card(src),
      detail: this.detail(src),
      gallery: this.gallery(src),
    };
  },
};