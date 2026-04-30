/**
 * 어필리에이트 URL 헬퍼 — 사이클 12a M8 (ADR-025).
 *
 * 환경변수 (server-only — 키 클라이언트 노출 금지):
 *   KLOOK_AFFILIATE_ID
 *   KKDAY_AFFILIATE_ID
 *   AGODA_AFFILIATE_ID
 *
 * 미설정 시 OTA 직접 URL fallback (수익 0이지만 사용자 경험은 동일).
 */

import "server-only";

import type { OtaProvider } from "../types";

function getAffiliateId(ota: OtaProvider): string | null {
  switch (ota) {
    case "klook":
      return process.env.KLOOK_AFFILIATE_ID || null;
    case "kkday":
      return process.env.KKDAY_AFFILIATE_ID || null;
    case "agoda":
      return process.env.AGODA_AFFILIATE_ID || null;
  }
}

/**
 * Klook: ?aid=
 * KKday: ?cid=
 * Agoda: ?cid=
 */
export function buildAffiliateUrl(
  ota: OtaProvider,
  baseUrl: string,
): { url: string; tracked: boolean } {
  const id = getAffiliateId(ota);
  if (!id) return { url: baseUrl, tracked: false };

  try {
    const u = new URL(baseUrl);
    switch (ota) {
      case "klook":
        u.searchParams.set("aid", id);
        break;
      case "kkday":
      case "agoda":
        u.searchParams.set("cid", id);
        break;
    }
    return { url: u.toString(), tracked: true };
  } catch {
    return { url: baseUrl, tracked: false };
  }
}
