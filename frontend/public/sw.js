const CACHE_NAME = "doorriing-seller-cache-v1";
const ASSETS_TO_PRECACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo.png",
  "/Doorriing-seller.png"
];

// Install event: Precache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_PRECACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Stale-While-Revalidate strategy
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  // Skip caching for API calls (Supabase/Firebase/Railway) to ensure data freshness
  const url = new URL(event.request.url);
  if (
    url.origin.includes("supabase.co") ||
    url.origin.includes("firebaseio.com") ||
    url.origin.includes("up.railway.app") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Cache the new response if it's valid
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
            // If fetch fails (offline), return the cached response if available
            return cachedResponse;
        });

        // Return the cached response if available, else wait for the network
        return cachedResponse || fetchPromise;
      });
    })
  );
});

