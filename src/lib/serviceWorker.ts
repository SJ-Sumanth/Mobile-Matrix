'use client';

/**
 * Service Worker registration and management utilities
 */

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register service worker with configuration options
 */
export async function registerServiceWorker(config: ServiceWorkerConfig = {}): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content is available
          config.onUpdate?.(registration);
        }
      });
    });

    // Check for existing service worker
    if (registration.active) {
      config.onSuccess?.(registration);
    }

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('Cache updated:', event.data.payload);
      }
    });

  } catch (error) {
    console.error('Service Worker registration failed:', error);
    config.onError?.(error as Error);
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    }
    return false;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Update service worker
 */
export async function updateServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('Service Worker update check completed');
    }
  } catch (error) {
    console.error('Service Worker update failed:', error);
  }
}

/**
 * Skip waiting and activate new service worker
 */
export function skipWaiting(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Clear all caches
 */
export function clearCaches(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });
}

/**
 * Check if app is running in standalone mode (PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check network status
 */
export function getNetworkStatus(): {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
} {
  if (typeof window === 'undefined') {
    return { online: true };
  }

  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
  };
}

/**
 * Listen for network status changes
 */
export function onNetworkStatusChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window === 'undefined' || !('storage' in navigator)) {
    return false;
  }

  try {
    const persistent = await navigator.storage.persist();
    console.log('Persistent storage:', persistent);
    return persistent;
  } catch (error) {
    console.error('Failed to request persistent storage:', error);
    return false;
  }
}

/**
 * Get storage usage estimate
 */
export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (typeof window === 'undefined' || !('storage' in navigator)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    console.log('Storage estimate:', estimate);
    return estimate;
  } catch (error) {
    console.error('Failed to get storage estimate:', error);
    return null;
  }
}

/**
 * Service Worker hook for React components
 */
export function useServiceWorker(config: ServiceWorkerConfig = {}) {
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      isRegistered: false,
      isOnline: true,
      register: () => Promise.resolve(),
      unregister: () => Promise.resolve(false),
      update: () => Promise.resolve(),
      skipWaiting: () => {},
      clearCaches: () => {},
    };
  }

  const isSupported = 'serviceWorker' in navigator;
  const [isRegistered, setIsRegistered] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (!isSupported) return;

    // Register service worker
    registerServiceWorker({
      ...config,
      onSuccess: (registration) => {
        setIsRegistered(true);
        config.onSuccess?.(registration);
      },
      onError: (error) => {
        setIsRegistered(false);
        config.onError?.(error);
      },
    });

    // Listen for network changes
    const cleanup = onNetworkStatusChange(setIsOnline);

    return cleanup;
  }, []);

  return {
    isSupported,
    isRegistered,
    isOnline,
    register: () => registerServiceWorker(config),
    unregister: unregisterServiceWorker,
    update: updateServiceWorker,
    skipWaiting,
    clearCaches,
  };
}

// Import React hooks for the useServiceWorker hook
import { useState, useEffect } from 'react';