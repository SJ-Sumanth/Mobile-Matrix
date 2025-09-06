// Service Worker for MobileMatrix
// Provides offline functionality and caching strategies

const CACHE_NAME = 'mobile-matrix-v1';
const STATIC_CACHE_NAME = 'mobile-matrix-static-v1';
const DYNAMIC_CACHE_NAME = 'mobile-matrix-dynamic-v1';
const API_CACHE_NAME = 'mobile-matrix-api-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
  // Add other critical static assets
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/phones',
  '/api/brands',
  '/api/comparison',
];

// Cache duration in milliseconds
const CACHE_DURATION = {
  STATIC: 30 * 24 * 60 * 60 * 1000, // 30 days
  DYNAMIC: 24 * 60 * 60 * 1000,     // 1 day
  API: 60 * 60 * 1000,              // 1 hour
  IMAGES: 7 * 24 * 60 * 60 * 1000,  // 7 days
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== API_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  event.respondWith(handleRequest(request, url));
});

// Main request handler with different strategies
async function handleRequest(request, url) {
  try {
    // Strategy 1: Static assets - Cache First
    if (isStaticAsset(url)) {
      return await cacheFirst(request, STATIC_CACHE_NAME);
    }

    // Strategy 2: API requests - Network First with cache fallback
    if (isApiRequest(url)) {
      return await networkFirstWithCache(request, API_CACHE_NAME);
    }

    // Strategy 3: Images - Cache First with network fallback
    if (isImageRequest(url)) {
      return await cacheFirst(request, DYNAMIC_CACHE_NAME);
    }

    // Strategy 4: HTML pages - Network First with cache fallback
    if (isHtmlRequest(request)) {
      return await networkFirstWithCache(request, DYNAMIC_CACHE_NAME);
    }

    // Strategy 5: Other resources - Network First
    return await networkFirst(request);

  } catch (error) {
    console.error('Service Worker: Request failed', error);
    return await handleOffline(request, url);
  }
}

// Cache First strategy - good for static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && !isExpired(cachedResponse)) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse; // Return expired cache as fallback
    }
    throw error;
  }
}

// Network First strategy - good for dynamic content
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Network First with cache strategy - good for API requests
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone the response before caching
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse && !isExpired(cachedResponse)) {
      return cachedResponse;
    }
    throw error;
  }
}

// Check if response is expired
function isExpired(response) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;

  const responseDate = new Date(dateHeader);
  const now = new Date();
  const age = now.getTime() - responseDate.getTime();

  // Determine cache duration based on content type
  let maxAge = CACHE_DURATION.DYNAMIC;
  
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('image/')) {
    maxAge = CACHE_DURATION.IMAGES;
  } else if (response.url.includes('/api/')) {
    maxAge = CACHE_DURATION.API;
  }

  return age > maxAge;
}

// Handle offline scenarios
async function handleOffline(request, url) {
  // For HTML requests, return offline page
  if (isHtmlRequest(request)) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }

  // For API requests, return cached data if available
  if (isApiRequest(url)) {
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  // Return a generic offline response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'You are currently offline. Please check your internet connection.',
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// Helper functions to identify request types
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname === '/manifest.json' ||
         url.pathname === '/favicon.ico';
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

function isImageRequest(url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
  return imageExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext)) ||
         url.hostname.includes('gsmarena.com');
}

function isHtmlRequest(request) {
  const acceptHeader = request.headers.get('accept') || '';
  return acceptHeader.includes('text/html');
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Service Worker: Performing background sync');
  
  // Retry failed API requests
  const cache = await caches.open(API_CACHE_NAME);
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
    } catch (error) {
      console.log('Service Worker: Background sync failed for', request.url);
    }
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icon-explore.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-close.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/comparison')
    );
  }
});

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('Service Worker: All caches cleared');
}