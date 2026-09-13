// المستشار الزراعي — Service Worker
// يخزّن التطبيق وقواعد البيانات محليًا ليعمل بدون إنترنت بعد أول زيارة.
// عند رفع نسخة جديدة: غيّر رقم CACHE_NAME أدناه حتى يحدّث المتصفح الملفات المخزّنة.

const CACHE_NAME = 'agri-advisor-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './data/libya-248.json',
  './data/libya-500.json',
  './data/eu-pesticides.json',
  './data/usa-epa.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ملف التحديثات (version.json) دائمًا من الشبكة مباشرة وبدون تخزين — حتى يعمل فحص التحديث بدقة
  if (url.pathname.endsWith('version.json')) {
    event.respondWith(fetch(event.request).catch(() => new Response('{}', { status: 200 })));
    return;
  }

  // باقي الملفات: من الكاش أولًا (يعمل أوفلاين)، وتحديث الكاش في الخلفية عند توفر إنترنت
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok && event.request.method === 'GET') {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
