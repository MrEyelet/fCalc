const CACHE_NAME = 'fcalc-cache-v1'

// Compute base path dynamically so the service worker works when the app
// is served from a subpath (e.g. GitHub Pages) or from root.
const BASE = self.location.pathname.replace(/\/sw\.js$/, '/')
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'offline.html',
  BASE + 'manifest.webmanifest',
  BASE + 'icons/icon-192.svg',
  BASE + 'icons/icon-512.svg'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => {
      if (key !== CACHE_NAME) return caches.delete(key)
    }))).then(() => self.clients.claim())
  )
})

function cleanUrl(request) {
  const url = new URL(request.url)
  url.search = ''
  return url.toString()
}

self.addEventListener('fetch', event => {
  const request = event.request

  // For navigation requests, try network first, fallback to cached offline page
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(cleanUrl(request), copy)).catch(()=>{})
        return response
      }).catch(() => caches.match(BASE + 'index.html').then(r => r || caches.match(BASE)))
    )
    return
  }

  // For other GET requests, use cache-first then network fallback
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(()=>{})
        return response
      }).catch(() => caches.match(request)))
    )
  }
})
