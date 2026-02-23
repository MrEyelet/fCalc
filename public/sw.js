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

// On install: fetch index.html, detect referenced assets (scripts/styles/icons)
// and pre-cache them so the app shell is available fully offline.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    try {
      // cache known static assets first
      await cache.addAll(ASSETS)

      // fetch index.html and parse for additional assets (script/src, link/href)
      const indexResp = await fetch(BASE + 'index.html')
      if (indexResp && indexResp.ok) {
        const text = await indexResp.text()
        const urls = new Set()
        const attrRe = /(?:src|href)\s*=\s*"([^"]+)"/g
        let m
        while ((m = attrRe.exec(text)) !== null) {
          let u = m[1]
          // ignore absolute external URLs
          if (/^https?:\/\//.test(u)) continue
          if (u.startsWith('/')) u = BASE.replace(/\/$/, '') + u
          else u = BASE + u
          urls.add(u)
        }
        if (urls.size) {
          await Promise.all(Array.from(urls).map(u => cache.add(u).catch(()=>{})))
        }
      }
    } catch (e) {
      // ignore install failures — still attempt to activate
    }
    await self.skipWaiting()
  })())
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

  // Navigation requests: serve cached app shell (cache-first), but try
  // network in background to update cache for next load.
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME)
      const cached = await cache.match(cleanUrl(request))

      const networkPromise = fetch(request).then(response => {
        if (response && response.status < 400) {
          const copy = response.clone()
          cache.put(cleanUrl(request), copy).catch(()=>{})
        }
        return response
      }).catch(()=>null)

      // Prefer cache if available so app loads offline immediately,
      // otherwise wait for network, finally fallback to offline.html
      return cached || await networkPromise || await cache.match(BASE + 'offline.html')
    })())
    return
  }

  // Other GET requests: cache-first then network; cache only successful responses
  if (request.method === 'GET') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME)
      const cached = await cache.match(request)
      if (cached) return cached
      try {
        const response = await fetch(request)
        if (response && response.status < 400) {
          const copy = response.clone()
          cache.put(request, copy).catch(()=>{})
        }
        return response
      } catch (e) {
        return cache.match(request)
      }
    })())
  }
})
