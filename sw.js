// sw.js - Service Worker para optimización de cache
const CACHE_NAME = 'salon-melon-v1';
const STATIC_CACHE = 'static-v1';
const IMAGE_CACHE = 'images-v1';

// Recursos estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/css.css',
  '/app.js',
  '/images/logo.jpg',
  '/images/whatsapp-icon.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache de recursos estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache de imágenes
      caches.open(IMAGE_CACHE)
    ]).then(() => {
      console.log('Service Worker installed successfully');
      // Forzar activación inmediata
      return self.skipWaiting();
    })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    // Limpiar caches antiguos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== IMAGE_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control inmediatamente
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Solo manejar peticiones del mismo origen
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Estrategia para imágenes: Cache First con compresión
    if (pathname.includes('/images/') || pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return handleImageRequest(request);
    }
    
    // Estrategia para recursos estáticos: Cache First
    if (pathname.match(/\.(css|js)$/) || pathname === '/') {
      return handleStaticRequest(request);
    }
    
    // Para todo lo demás: Network First
    return handleNetworkFirst(request);
    
  } catch (error) {
    console.error('Error handling request:', error);
    // Fallback a la red si hay error
    return fetch(request);
  }
}

// Manejo de imágenes con cache inteligente
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('Image served from cache:', request.url);
    // Actualizar en segundo plano si es vieja (más de 1 hora)
    const cachedDate = new Date(cachedResponse.headers.get('date'));
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    
    if (now - cachedDate > oneHour) {
      // Actualizar en background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(console.error);
    }
    
    return cachedResponse;
  }
  
  try {
    console.log('Fetching image from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear imagen optimizada
      const responseToCache = networkResponse.clone();
      
      // Comprimir imagen si es muy grande
      const imageSize = networkResponse.headers.get('content-length');
      if (imageSize && parseInt(imageSize) > 500000) { // 500KB
        console.log('Large image detected, considering compression...');
      }
      
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch image:', error);
    
    // Retornar imagen placeholder si hay error
    return new Response(
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#333"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">🍈 Imagen no disponible</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Manejo de recursos estáticos
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('Static resource served from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch static resource:', error);
    throw error;
  }
}

// Estrategia Network First para contenido dinámico
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Intentar desde cache como fallback
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Serving from cache as fallback:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// Limpiar cache cuando se llena mucho
async function cleanupImageCache() {
  const cache = await caches.open(IMAGE_CACHE);
  const requests = await cache.keys();
  
  if (requests.length > 50) { // Límite de 50 imágenes
    console.log('Cleaning up image cache...');
    // Eliminar las más antiguas
    const toDelete = requests.slice(0, 10);
    await Promise.all(toDelete.map(request => cache.delete(request)));
  }
}

// Ejecutar limpieza periódicamente
setInterval(cleanupImageCache, 5 * 60 * 1000); // cada 5 minutos

// Mensajes desde la página principal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'PRELOAD_IMAGES') {
    const imageUrls = event.data.urls;
    preloadImages(imageUrls);
  }
});

// Precargar imágenes en background
async function preloadImages(urls) {
  const cache = await caches.open(IMAGE_CACHE);
  
  for (const url of urls) {
    try {
      const cachedResponse = await cache.match(url);
      if (!cachedResponse) {
        console.log('Preloading image:', url);
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      }
    } catch (error) {
      console.error('Failed to preload image:', url, error);
    }
    
      // Pequeña pausa entre cargas para no saturar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }