/**
 * robots.txt — 시나리오 C Phase C3 SEO.
 *
 * Next.js App Router 네이티브. /robots.txt 자동 서빙.
 */

import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://traveldiary-mvp-production.up.railway.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/shared"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
