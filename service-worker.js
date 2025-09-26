const CACHE_NAME = "citas-v2";
const urlsToCache = [
  "/",
  "/index.html",
  "/css/citas.css",
  "/js/citas.js",
  "/icon/icon-192.png",
  "/icon/icon-512.png",
];

// Instalación del Service Worker y cacheo de recursos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        urlsToCache.map((url) =>
          cache
            .add(url)
            .catch((err) => console.warn("No se pudo cachear:", url, err))
        )
      );
    })
  );
  self.skipWaiting(); // fuerza activación inmediata
});

// Activación y limpieza de caches antiguos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim(); // toma control de las páginas abiertas
});

// Intercepción de peticiones
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🚫 No cachear nada que sea de Supabase (API o imágenes)
  if (url.hostname.includes("supabase.co")) {
    return; // deja que vaya directo a la red
  }

  // Estrategia cache-first para recursos locales
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(
          () => caches.match("/index.html") // fallback offline
        )
      );
    })
  );
});
