/**
 * 최소 서비스 워커 — PWA 설치 가능성(installability) 충족.
 *
 * 오프라인 캐싱은 Phase C2+ 에서 확장.
 * 현재는 install prompt 활성화 + 기본 네트워크 패스스루.
 */

const CACHE_NAME = "traveldiary-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // 네트워크 우선 — 오프라인 캐싱은 추후 확장
  event.respondWith(fetch(event.request));
});
