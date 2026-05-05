/**
 * Google Cloud Vision API — Image Annotation (TEXT_DETECTION).
 * 사이클 5b-5 (ADR-019). 5b-3 외부 API 표준 패턴 답습.
 */

import "server-only";

import {
  getEvidenceCache,
  setEvidenceCache,
} from "@/lib/repositories/evidence-cache.repository";
import {
  checkQuotaOrBlock,
  recordExternalCall,
} from "@/lib/usage-quota";
import { getEnvKey } from "@/lib/utils/env";
import { hashCacheKey } from "@/lib/utils/cache-key";

const VISION_URL = "https://vision.googleapis.com/v1/images:annotate";
const VISION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일
const VISION_PLATFORM = "vision.ocr";

export type VisionOcrOutcome =
  | { mode: "demo" }
  | { mode: "ok"; text: string; cached: boolean; fetchDurationMs: number }
  | { mode: "no_text"; cached: boolean; fetchDurationMs: number }
  | {
      mode: "error";
      code: "vision_api_error" | "network" | "quota_exceeded";
      message?: string;
    };

function getApiKey(): string | null {
  return getEnvKey("GOOGLE_VISION_API_KEY");
}

export const visionAvailable = (): boolean => getApiKey() !== null;

export async function ocrFromBase64Image(
  imageBase64: string,
): Promise<VisionOcrOutcome> {
  const apiKey = getApiKey();
  if (!apiKey) return { mode: "demo" };
  const startedAt = Date.now();

  // 캐시 키: 이미지 해시
  const cacheKey = hashCacheKey(imageBase64);

  const cached = await getEvidenceCache<{ text: string | null }>(
    cacheKey,
    VISION_PLATFORM,
  );
  if (cached) {
    if (cached.data.text) {
      return {
        mode: "ok",
        text: cached.data.text,
        cached: true,
        fetchDurationMs: Date.now() - startedAt,
      };
    }
    return {
      mode: "no_text",
      cached: true,
      fetchDurationMs: Date.now() - startedAt,
    };
  }

  const quotaBlocked = checkQuotaOrBlock("google-vision");
  if (quotaBlocked) return quotaBlocked;

  try {
    const resp = await fetch(`${VISION_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: "TEXT_DETECTION", maxResults: 50 }],
          },
        ],
      }),
    });

    recordExternalCall("google-vision");

    if (!resp.ok) {
      return {
        mode: "error",
        code: "vision_api_error",
        message: `HTTP ${resp.status}`,
      };
    }

    const json = (await resp.json()) as {
      responses?: Array<{
        textAnnotations?: Array<{ description?: string }>;
        error?: { message?: string };
      }>;
    };

    const r = json.responses?.[0];
    if (r?.error?.message) {
      return { mode: "error", code: "vision_api_error", message: r.error.message };
    }

    const text = r?.textAnnotations?.[0]?.description;
    if (!text) {
      await setEvidenceCache({
        placeId: cacheKey,
        platform: VISION_PLATFORM,
        data: { text: null },
        ttlMs: VISION_TTL_MS,
      });
      return {
        mode: "no_text",
        cached: false,
        fetchDurationMs: Date.now() - startedAt,
      };
    }

    await setEvidenceCache({
      placeId: cacheKey,
      platform: VISION_PLATFORM,
      data: { text },
      ttlMs: VISION_TTL_MS,
    });

    return {
      mode: "ok",
      text,
      cached: false,
      fetchDurationMs: Date.now() - startedAt,
    };
  } catch (err) {
    return {
      mode: "error",
      code: "network",
      message: err instanceof Error ? err.message : "unknown",
    };
  }
}
