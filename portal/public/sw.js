const CACHE_NAME = 'dojolab-v1.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/logo.png'
];

const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(STATIC_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(n => n.startsWith('dojolab-') && n !== STATIC_CACHE && n !== DYNAMIC_CACHE)
        .map(n => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

// --------- helpers ----------
function shouldBypass(request) {
  const url = new URL(request.url);

  // Solo GET
  if (request.method !== 'GET') return true;

  // Solo http/https
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;

  // Evitar extensiones, data, blob, etc.
  if (url.protocol.startsWith('chrome-extension')) return true;

  // En localhost, no interceptar nada del dev server/Vite/HMR
  const isLocal = (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  if (isLocal) {
    if (
      url.pathname.startsWith('/@vite') ||
      url.pathname.startsWith('/@react-refresh') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.startsWith('/node_modules/') ||
      url.pathname.includes('__vite') ||
      url.pathname.endsWith('.map')
    ) {
      return true;
    }
    // Evitar websockets/event streams del HMR
    const accept = request.headers.get('accept') || '';
    if (accept.includes('text/event-stream')) return true;
  }

  return false;
}

async function safeResponseFallback() {
  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

// --------- estrategias ----------
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
    }
    return response || await safeResponseFallback();
  } catch {
    if (request.destination === 'document') {
      const home = await caches.match('/');
      if (home) return home;
    }
    return safeResponseFallback();
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
    }
    return response || await safeResponseFallback();
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.destination === 'document') {
      const home = await caches.match('/');
      if (home) return home;
    }
    return safeResponseFallback();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  // Lanza actualización en background, pero asegúrate de NO romper si falla
  const update = (async () => {
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        await cache.put(request, response.clone()); // <- CLON correcto
      }
      return response;
    } catch {
      return null; // importante: no lances error; deja que responda el cached
    }
  })();

  // Siempre devolver Response válida
  if (cached) return cached;

  const netRes = await update;
  return netRes || safeResponseFallback();
}

// --------- fetch handler ----------
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar si debemos dejar pasar
  if (shouldBypass(request)) return;

  // No tocar llamadas externas a tu API/Directus (deja que el navegador haga fetch normal)
  if (url.hostname.includes('directus') || url.hostname.includes('api')) {
    return; // sin respondWith -> comportamiento por defecto
  }

  // Rutas internas
  if (url.origin === location.origin) {
    // Íconos
    if (url.pathname.startsWith('/icons/')) {
      event.respondWith(cacheFirst(request));
      return;
    }

    // HTML / navegación -> network first
    const accept = request.headers.get('accept') || '';
    const isHTML = accept.includes('text/html') || url.pathname === '/' || url.pathname.endsWith('.html');
    if (isHTML) {
      event.respondWith(networkFirst(request));
      return;
    }

    // JS/CSS -> S-W-R (en producción)
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
      event.respondWith(staleWhileRevalidate(request));
      return;
    }

    // Por defecto interno -> cache first
    event.respondWith(cacheFirst(request));
    return;
  }

  // Externos (CDN, etc.) -> network first (o ajusta a tu gusto)
  event.respondWith(networkFirst(request));
});

// --------- otros eventos ----------
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('push', event => {
  if (!event.data) return;
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now(), primaryKey: 1 },
    actions: [
      { action: 'explore', title: 'Ver detalles', icon: '/icons/icon-192x192.png' },
      { action: 'close', title: 'Cerrar', icon: '/icons/icon-192x192.png' }
    ]
  };
  event.waitUntil(self.registration.showNotification('The Dojo Lab', options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  }
});
