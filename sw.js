// オフラインでも ひらけるように、いちど よみこんだ ファイルを とっておく
const APP_CACHE = 'sansu-app-v1';
const MEDIA_CACHE = 'sansu-media-v1';
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(APP_CACHE).then((c) => c.addAll(APP_FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== APP_CACHE && k !== MEDIA_CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // アプリ ほんたい：さいしんを とりにいき、つながらない ときは とっておいた ものを つかう
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(APP_CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html'))));
    return;
  }
  // ポケモンの え・なきごえ・3Dの えもじ・フォント：いちど よんだら とっておいた ものを つかう
  if (['raw.githubusercontent.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
    e.respondWith(caches.open(MEDIA_CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }))));
  }
});
