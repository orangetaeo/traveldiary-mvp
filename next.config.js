/** @type {import('next').NextConfig} */

// 사이클 11d/B (S-11 §5) — 보안 헤더
// CSP 정책 (v2.1 보안 강화)
// - 'unsafe-inline' for scripts: SW 등록 inline + Next.js hydration
// - 'unsafe-inline' for styles: Tailwind + style prop
// - 외부 출처: Google Maps embed, CDN 폰트, picsum(시드 이미지)
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
  "font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://picsum.photos https://fastly.picsum.photos https://maps.googleapis.com",
  "frame-src https://www.google.com https://maps.google.com",
  "connect-src 'self' https://maps.googleapis.com https://openapi.naver.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // ADR-017 — geolocation은 self-only (5b-4 자동 모드 전환)
    // ADR-019 — camera는 self-only (M4 카메라 번역, 5b-5+)
    value: "camera=(self), geolocation=(self), microphone=()",
  },
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
