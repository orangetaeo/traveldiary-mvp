/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Prisma 7 driver adapter 패키지들은 Node-only — webpack 번들 외부로.
  // ADR-013 후속: Railway 빌드에서 클라이언트 번들 webpack 에러 차단.
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@prisma/adapter-pg",
      "pg",
      "pg-native",
    ],
  },
};

module.exports = nextConfig;
