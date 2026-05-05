/**
 * Naver Search API — Local + Blog (사이클 5b-6, ADR-020).
 * 5b-3 외부 API 표준 패턴 답습.
 */

import "server-only";

import {
  getEvidenceCache,
  setEvidenceCache,
} from "@/lib/repositories/evidence-cache.repository";
import {
  assertQuota,
  recordExternalCall,
  QuotaExceededError,
} from "@/lib/usage-quota";
import { hashCacheKey } from "@/lib/utils/cache-key";

const LOCAL_URL = "https://openapi.naver.com/v1/search/local.json";
const BLOG_URL = "https://openapi.naver.com/v1/search/blog.json";

const LOCAL_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const BLOG_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const LOCAL_PLATFORM = "naver.local";
const BLOG_PLATFORM = "naver.blog";

function getCredentials(): { id: string; secret: string } | null {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return null;
  return { id, secret };
}

export const naverAvailable = (): boolean => getCredentials() !== null;

// ═══════════════════════════════════════════════════════════════════
// Local Search
// ═══════════════════════════════════════════════════════════════════

export interface NaverLocalItem {
  title: string;       // HTML strip 후
  link: string;
  category: string;
  address: string;
  roadAddress: string;
  telephone?: string;
}

export type NaverLocalOutcome =
  | { mode: "demo" }
  | { mode: "ok"; items: NaverLocalItem[]; cached: boolean }
  | {
      mode: "error";
      code: "naver_api_error" | "network" | "quota_exceeded";
      message?: string;
    };

export async function searchNaverLocal(
  query: string,
): Promise<NaverLocalOutcome> {
  const cred = getCredentials();
  if (!cred) return { mode: "demo" };

  const cacheKey = hashCacheKey(`local:${query}`);

  const cached = await getEvidenceCache<{ items: NaverLocalItem[] }>(
    cacheKey,
    LOCAL_PLATFORM,
  );
  if (cached) return { mode: "ok", items: cached.data.items, cached: true };

  try {
    assertQuota("naver-search");
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      recordExternalCall("naver-search", { blockedBy: "quota" });
      return {
        mode: "error",
        code: "quota_exceeded",
        message: `cap=${err.cap}, resetAt=${new Date(err.resetAt).toISOString()}`,
      };
    }
    throw err;
  }

  try {
    const params = new URLSearchParams({ query, display: "5" });
    const resp = await fetch(`${LOCAL_URL}?${params.toString()}`, {
      headers: {
        "X-Naver-Client-Id": cred.id,
        "X-Naver-Client-Secret": cred.secret,
      },
      cache: "no-store",
    });

    recordExternalCall("naver-search");

    if (!resp.ok) {
      return { mode: "error", code: "naver_api_error", message: `HTTP ${resp.status}` };
    }

    const json = (await resp.json()) as {
      items?: Array<{
        title?: string;
        link?: string;
        category?: string;
        address?: string;
        roadAddress?: string;
        telephone?: string;
      }>;
    };

    const items: NaverLocalItem[] = (json.items ?? [])
      .filter((it) => it.title && it.address)
      .map((it) => ({
        title: stripHtml(it.title!),
        link: it.link ?? "",
        category: it.category ?? "",
        address: it.address!,
        roadAddress: it.roadAddress ?? "",
        telephone: it.telephone,
      }));

    await setEvidenceCache({
      placeId: cacheKey,
      platform: LOCAL_PLATFORM,
      data: { items },
      ttlMs: LOCAL_TTL_MS,
    });

    return { mode: "ok", items, cached: false };
  } catch (err) {
    return {
      mode: "error",
      code: "network",
      message: err instanceof Error ? err.message : "unknown",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Blog Search
// ═══════════════════════════════════════════════════════════════════

export interface NaverBlogItem {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  postdate: string; // YYYYMMDD
}

export type NaverBlogOutcome =
  | { mode: "demo" }
  | {
      mode: "ok";
      items: NaverBlogItem[];
      total: number;
      positiveHeuristic: number; // 0~100
      cached: boolean;
    }
  | {
      mode: "error";
      code: "naver_api_error" | "network" | "quota_exceeded";
      message?: string;
    };

const POSITIVE_KEYWORDS = [
  "추천", "맛있", "최고", "강추", "감동", "분위기", "인생", "JMT",
  "재방문", "행복", "예쁘", "친절", "꼭", "선물",
];
const NEGATIVE_KEYWORDS = [
  "별로", "최악", "후회", "비싸", "맛없", "실망", "더럽", "불친절",
  "다신 안", "다시는",
];

export async function searchNaverBlog(
  query: string,
): Promise<NaverBlogOutcome> {
  const cred = getCredentials();
  if (!cred) return { mode: "demo" };

  const cacheKey = hashCacheKey(`blog:${query}`);

  const cached = await getEvidenceCache<{
    items: NaverBlogItem[];
    total: number;
    positiveHeuristic: number;
  }>(cacheKey, BLOG_PLATFORM);
  if (cached) {
    return {
      mode: "ok",
      items: cached.data.items,
      total: cached.data.total,
      positiveHeuristic: cached.data.positiveHeuristic,
      cached: true,
    };
  }

  try {
    assertQuota("naver-search");
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      recordExternalCall("naver-search", { blockedBy: "quota" });
      return {
        mode: "error",
        code: "quota_exceeded",
        message: `cap=${err.cap}, resetAt=${new Date(err.resetAt).toISOString()}`,
      };
    }
    throw err;
  }

  try {
    const params = new URLSearchParams({
      query,
      display: "10",
      sort: "sim", // 정확도순
    });
    const resp = await fetch(`${BLOG_URL}?${params.toString()}`, {
      headers: {
        "X-Naver-Client-Id": cred.id,
        "X-Naver-Client-Secret": cred.secret,
      },
      cache: "no-store",
    });

    recordExternalCall("naver-search");

    if (!resp.ok) {
      return { mode: "error", code: "naver_api_error", message: `HTTP ${resp.status}` };
    }

    const json = (await resp.json()) as {
      total?: number;
      items?: Array<{
        title?: string;
        link?: string;
        description?: string;
        bloggername?: string;
        postdate?: string;
      }>;
    };

    const items: NaverBlogItem[] = (json.items ?? [])
      .slice(0, 5)
      .filter((it) => it.title && it.description)
      .map((it) => ({
        title: stripHtml(it.title!),
        link: it.link ?? "",
        description: stripHtml(it.description!),
        bloggername: it.bloggername ?? "",
        postdate: it.postdate ?? "",
      }));

    // heuristic 긍정율: title + description에 긍정/부정 키워드 카운트
    let positive = 0;
    let negative = 0;
    for (const it of (json.items ?? [])) {
      const text = `${it.title ?? ""} ${it.description ?? ""}`;
      for (const k of POSITIVE_KEYWORDS) if (text.includes(k)) positive += 1;
      for (const k of NEGATIVE_KEYWORDS) if (text.includes(k)) negative += 1;
    }
    const total = json.total ?? items.length;
    const positiveHeuristic =
      positive + negative === 0
        ? 80 // 기본 (한국 블로그는 대체로 긍정적)
        : Math.round((positive / (positive + negative)) * 100);

    await setEvidenceCache({
      placeId: cacheKey,
      platform: BLOG_PLATFORM,
      data: { items, total, positiveHeuristic },
      ttlMs: BLOG_TTL_MS,
    });

    return { mode: "ok", items, total, positiveHeuristic, cached: false };
  } catch (err) {
    return {
      mode: "error",
      code: "network",
      message: err instanceof Error ? err.message : "unknown",
    };
  }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}
