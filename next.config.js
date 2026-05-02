/** @type {import('next').NextConfig} */

// 사이클 11d/B (S-11 §5) — 보안 헤더
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
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
