/**
 * Korean Evidence Aggregator — 사이클 5b-6 (ADR-020).
 *
 * Naver Local + Blog 결과를 Evidence 형식으로 통합.
 * verifyPlaceAction 후속 단계 또는 별도 Server Action에서 호출.
 */

import "server-only";

import { searchNaverLocal, searchNaverBlog } from "./naver-search";
import type { Evidence, EvidenceSource } from "@/lib/types";

export type KoreanEvidenceOutcome =
  | { mode: "demo" }
  | { mode: "ok"; evidence: Evidence; cached: boolean }
  | { mode: "no_data" }
  | { mode: "error"; message?: string };

export async function gatherKoreanEvidence(
  query: string,
): Promise<KoreanEvidenceOutcome> {
  const [localRes, blogRes] = await Promise.all([
    searchNaverLocal(query),
    searchNaverBlog(query),
  ]);

  // 둘 다 demo면 결과 X
  if (localRes.mode === "demo" && blogRes.mode === "demo") {
    return { mode: "demo" };
  }

  const reasons: string[] = [];
  const sources: EvidenceSource[] = [];
  const cached =
    (localRes.mode === "ok" ? localRes.cached : true) &&
    (blogRes.mode === "ok" ? blogRes.cached : true);

  if (localRes.mode === "ok" && localRes.items[0]) {
    const top = localRes.items[0];
    reasons.push(`네이버 지도 "${top.title}" 등록됨`);
    sources.push({
      platform: "naver",
      url: top.link || `https://map.naver.com/v5/search/${encodeURIComponent(query)}`,
      lastVerified: new Date().toISOString(),
    });
  }

  if (blogRes.mode === "ok" && blogRes.items.length > 0) {
    reasons.push(
      `네이버 블로그 ${blogRes.total.toLocaleString()}건 — 한국인 ${blogRes.positiveHeuristic}% 긍정 (heuristic)`,
    );
    sources.push({
      platform: "naver",
      url: `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent(query)}`,
      reviewCount: blogRes.total,
      positiveRate: blogRes.positiveHeuristic,
      lastVerified: new Date().toISOString(),
    });
  }

  if (sources.length === 0) {
    return { mode: "no_data" };
  }

  return {
    mode: "ok",
    cached,
    evidence: {
      reasons,
      sources,
      verifiedAt: new Date().toISOString(),
    },
  };
}
