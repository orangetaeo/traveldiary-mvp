/**
 * sitemap.xml — 시나리오 C Phase C3 SEO.
 *
 * Next.js App Router 네이티브. 정적 페이지 + 동적 도시 페이지.
 * /sitemap.xml 자동 서빙.
 */

import type { MetadataRoute } from "next";
import { listCities } from "@/lib/seed/cities";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://traveldiary-mvp-production.up.railway.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const cities = listCities();
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/trips`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/onboarding`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/translate`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/guide`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  const cityPages: MetadataRoute.Sitemap = cities.flatMap((city) => [
    {
      url: `${BASE}/city/${city.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE}/city/${city.slug}/emergency`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ]);

  return [...staticPages, ...cityPages];
}
