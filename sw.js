const CACHE_NAME = 'productivity-calculator-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './app.js', // 追加
  // アイコンファイル（後述）
  './icon-192x192.png',
  './icon-512x512.png'
];

// インストール: キャッシュを開き、必要なリソースを保存する
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
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

// アクティベート: 古いキャッシュをクリアする
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});