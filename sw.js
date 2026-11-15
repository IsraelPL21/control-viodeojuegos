const CACHE = "controlvideojuegos-v31-historial-alarma-1";
const ASSETS = [
  "./", "./index.html", "./app.js", "./mejoras-v31.js", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-180.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("controlvideojuegos-") && key !== CACHE)
      .map(key => caches.delete(key))
  )));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  // Primero buscar una versión nueva del código, pero mantener modo sin conexión.
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copia = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copia)));
    }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html"))));
});
