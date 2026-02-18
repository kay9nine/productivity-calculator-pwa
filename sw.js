const CACHE_NAME = 'productivity-calculator-v2'; // 更新時にここを書き換える
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './app.js',
  './icon-192x192.png',
  './icon-512x512.png'
];

// インストール: キャッシュを開き、必要なリソースを保存する
self.addEventListener('install', event => {
  // 新しいService Workerがインストールされたら、待機せずに即座に有効化する
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
});

// アクティベート: 古いキャッシュをクリアし、即座にページを制御下に置く
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // 他のタブも含めて即座にこのService Workerで制御を開始する
      clients.claim(),
      // 古いバージョンのキャッシュを削除
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// フェッチ: ネットワークリクエストに対してキャッシュから応答する
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュ内にリソースがあればそれを使用
        if (response) {
          return response;
        }
        // なければ通常通りネットワークから取得
        return fetch(event.request);
      })
  );
});