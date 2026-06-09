// CloudDesktop Service Worker — enables PWA install prompt
const CACHE = 'clouddesktop-v1'

// Cache the shell assets on install
self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(['/', '/mobile', '/manifest.json', '/logo.png'])
        .catch(() => {}) // don't fail install if a resource is missing
    )
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first: always try network, fall back to cache
self.addEventListener('fetch', e => {
  // Only handle GET requests for same-origin or navigation
  if (e.request.method !== 'GET') return
  if (e.request.url.startsWith('chrome-extension://')) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful navigation responses
        if (res.ok && (e.request.mode === 'navigate' || e.request.destination === 'document')) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
