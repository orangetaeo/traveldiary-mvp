/**
 * 서비스 워커 — PWA installability + 오프라인 fallback.
 *
 * 전략: Network-first + offline.html fallback (navigation 요청만).
 * 정적 assets(아이콘 등)은 install 시 pre-cache.
 */

const CACHE_NAME = "traveldiary-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // navigation 요청만 오프라인 fallback 적용
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
  // 기타 요청은 네트워크 우선, 캐시 fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
