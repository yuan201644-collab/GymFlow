/* ============================================
   Service Worker — 离线缓存
   ============================================ */

const CACHE_NAME = 'fitness-v7';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/utils.js',
  './js/data.js',
  './js/training.js',
  './js/weight.js',
  './js/stats.js',
  './js/app.js',
  './js/ai.js',
  './js/exercises.js',
  './js/posture.js',
  './js/tutorial.js',
  './js/chart.min.js',
];

// 安装：预缓存所有资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching app assets');
      return cache.addAll(ASSETS).catch(err => {
        console.log('Cache addAll error (some may fail gracefully):', err);
      });
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：缓存优先，网络回退
self.addEventListener('fetch', event => {
  // 跳过非 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // 缓存命中，返回缓存
      if (cached) return cached;

      // 否则请求网络
      return fetch(event.request).then(response => {
        // 缓存成功的响应
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        // 网络失败，返回离线页面（对于 HTML 请求）
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
