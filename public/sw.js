/* Splitzy service worker.
 *
 * Deliberately small and dependency-free:
 *   - navigations  -> network first, falling back to the cached app shell, so
 *                     opening the app with no signal still gets you a UI
 *   - static files -> cache first (Vite fingerprints them, so they never go
 *                     stale under the same URL)
 *   - everything else (Firestore, Cloudinary, auth) is left alone
 *
 * Bump CACHE whenever the shell handling changes; old caches are dropped on
 * activate.
 */
const CACHE = "splitzy-shell-v1";
const SHELL_URL = "/index.html";
const PRECACHE = [
  "/",
  SHELL_URL,
  "/manifest.webmanifest",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

const STATIC_PATTERN = /\.(?:js|css|png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // One missing file should not fail the whole install.
      .then((cache) =>
        Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Firestore, Cloudinary, ...

  // App shell: always try the network so deploys are picked up straight away.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(SHELL_URL, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(SHELL_URL)
            .then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  if (!STATIC_PATTERN.test(url.pathname)) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
