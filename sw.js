/* СКТО | Дневник конькобежца: service worker.
   ВАЖНО: при выпуске новой версии измените номер VERSION — тогда у пользователей появится «Доступно обновление».
   Service worker НЕ трогает IndexedDB, данные пользователя при обновлении сохраняются. */
const VERSION = '2.2.0';
const CACHE = 'skto-diary-' + VERSION;
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png', 'icons/favicon.ico'];

self.addEventListener('install', e => {
  // новая версия ждёт подтверждения пользователя (skipWaiting только по сообщению)
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('skto-diary-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => { if (e.data === 'SKIP') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // страница: сначала сеть (свежая версия), при отсутствии интернета — кэш
    e.respondWith(
      fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put('index.html', c)); } return r; })
        .catch(() => caches.match('index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  // остальные файлы: из кэша текущей версии, иначе сеть
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(n => {
    if (n.ok) { const c = n.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return n;
  })));
});
