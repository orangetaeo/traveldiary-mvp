/**
 * Item Detail (Place Detail & Evidence) — Stitch #5 + #6 매핑
 *
 * Stitch screens:
 *   #5 14215a0f6a68497cb2bd4db33ed40eef (Place Detail & Evidence)
 *   #6 128c4b1eea194bd4bd13b75c1ba500e4 (Item Detail - Pretendard)
 *
 * Magic Moment: M1 추천 근거 패널 — 우리 정체성의 핵심 화면.
 * 사이클 5b 옵션 C (2026-04-30): Stitch HTML 통합 → React 변환.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { EvidencePanel } from "@/components/ui/EvidencePanel";
import { getDemoItem } from "@/lib/seed";
import { resolveTripBundle } from "@/lib/repositories/trip.repository";
import { validateItemAction } from "@/actions/place";
import type { VerifyPlaceResult } from "@/lib/services/place-verification";
import { hasValidCoords } from "@/lib/utils/geo";
import { ValidationBadges } from "@/components/itinerary/ValidationBadges";
import { OtaCompareSection } from "@/components/itinerary/OtaCompareSection";
import { aggregateOffersForItem } from "@/lib/services/ota-aggregator";
import { ItineraryMap } from "@/components/itinerary/ItineraryMap";
import { ItineraryMapWithDirections } from "@/components/itinerary/ItineraryMapWithDirections";
import { gatherKoreanEvidenceAction } from "@/actions/evidence";
import { GoogleVerificationBadge } from "@/components/itinerary/GoogleVerificationBadge";
import { DirectionsGrid } from "@/components/itinerary/DirectionsGrid";
import {
  splitName,
  formatTime,
  durationLabel,
  priceLevelOf,
  flexibilityKr,
  CATEGORY_LABEL,
  CATEGORY_ICON,
  CATEGORY_GRADIENT,
} from "@/lib/utils/item-display";
import type { Evidence } from "@/lib/types";

export default async function ItineraryItemPage({
  params,
}: {
  params: { id: string; itemId: string };
}) {
  const bundle = await resolveTripBundle(params.id);
  const item =
    bundle?.items.find((it) => it.id === params.itemId) ??
    getDemoItem(params.id, params.itemId);
  if (!item || !bundle) notFound();

  const { ko, en } = splitName(item.name);
  const categoryLabel = CATEGORY_LABEL[item.category] ?? item.category;
  const categoryIcon = CATEGORY_ICON[item.category] ?? "place";
  const heroGradient = CATEGORY_GRADIENT[item.category] ?? CATEGORY_GRADIENT.spot;
  const warning = item.evidence.warnings?.[0];
  const naverSource = item.evidence.sources.find((s) => s.platform === "naver");
  const verifiedReviews = naverSource?.reviewCount ?? 0;
  const priceLevel = priceLevelOf(item.estimatedPrice?.amount);

  // 다음 일정 lookup (사이클 M · ADR-030) — 같은 dayIndex 안에서 scheduledAt 기준 다음 노드.
  // 마지막 일정·미지정이면 null → distance.status = "no_next" (검증 면제).
  const sameDay = bundle.items
    .filter((it) => it.dayIndex === item.dayIndex)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const idx = sameDay.findIndex((it) => it.id === item.id);
  const nextItem =
    idx >= 0 && idx + 1 < sameDay.length
      ? {
          scheduledAt: sameDay[idx + 1].scheduledAt,
          location: sameDay[idx + 1].location,
        }
      : null;

  // 5단계 검증 종합 (사이클 L+N · ADR-029 + M · ADR-030 + E · ADR-031 통합)
  // 1·2·3·4·5단계 종합 + DB 영속화 + verifyPlace 결과(googleResult) 통합.
  const validationResult = await validateItemAction({ item, nextItem });
  // 사이클 E (ADR-031) — validateItemAction이 google 결과 통합 노출 (googleResult).
  const googleResult: VerifyPlaceResult =
    validationResult.mode === "ok"
      ? validationResult.googleResult
      : { mode: "demo" };

  // OTA Offer 매칭 (M8, 사이클 12a 시드 + 12b 실 API aggregator, ADR-027).
  // 모든 OTA 키 미설정 → 시드만 (12a 회귀 0). 일부 설정 → 해당 OTA만 실 API.
  const otaOffers = await aggregateOffersForItem(item);

  // Naver Korean evidence (5b-6.5, ADR-020) — 시드 evidence와 합침
  const naverResult = await gatherKoreanEvidenceAction({
    itemId: item.id,
    query: ko,
  });
  const mergedEvidence: Evidence =
    naverResult.mode === "ok"
      ? {
          reasons: [...item.evidence.reasons, ...naverResult.evidence.reasons],
          sources: [...item.evidence.sources, ...naverResult.evidence.sources],
          warnings: item.evidence.warnings,
          verifiedAt: naverResult.evidence.verifiedAt,
        }
      : item.evidence;

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-32">
      {/* TopAppBar */}
      <header className="bg-surface-card/90 backdrop-blur-md border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
        <div className="flex items-center gap-td-sm">
          <Link
            href={`/itinerary/${params.id}`}
            aria-label="뒤로"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <h1 className="text-td-title font-bold text-ink tracking-tight">TravelDiary</h1>
        </div>
        <div className="flex items-center gap-td-xs">
          <Link
            href={`/trips/${params.id}?focus=itinerary`}
            aria-label="여행 대시보드 — 일정 카드 강조"
            className="p-2 rounded-full text-ink-soft hover:text-ink hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined" aria-hidden>dashboard</span>
          </Link>
          <Link
            href="/notifications"
            aria-label="알림"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-purple">notifications</span>
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto">
        {/* Hero — 사진 우선, 없으면 카테고리 그라디언트 (ADR-023) */}
        <section className={`relative h-56 w-full overflow-hidden ${item.photos?.[0] ? "bg-ink" : heroGradient}`}>
          {item.photos?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.photos[0]}
              alt={ko}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-25">
              <span
                className="material-symbols-outlined hero-icon filled text-white"
                aria-hidden
              >
                {categoryIcon}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 w-full p-td-md bg-gradient-to-t from-black/70 to-transparent">
            <div className="inline-flex items-center gap-td-xxs px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg mb-td-xs">
              <span className="material-symbols-outlined text-td-icon-sm text-white" aria-hidden>
                {categoryIcon}
              </span>
              <span className="text-td-meta text-white">{categoryLabel}</span>
            </div>
            <h2 className="text-td-title text-white leading-tight">
              {ko}
              {en && (
                <span className="text-td-meta font-normal opacity-90 ml-2">({en})</span>
              )}
            </h2>
            <p className="text-td-caption text-white/80 mt-td-xxs">
              Day {item.dayIndex + 1} · {formatTime(item.scheduledAt)}
            </p>
          </div>
        </section>

        {/* 추가 사진 갤러리 (photos 2장 이상일 때만) */}
        {item.photos && item.photos.length > 1 && (
          <section className="px-td-md pt-td-sm">
            <div className="flex gap-td-xs overflow-x-auto touch-pan-x overscroll-x-contain hide-scrollbar -mx-td-md px-td-md">
              {item.photos.slice(1).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`${ko} 사진 ${i + 2}`}
                  className="flex-shrink-0 h-24 w-32 object-cover rounded-lg"
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        )}

        {/* Verification & Alerts */}
        <section className="px-td-md py-td-sm space-y-td-xs">
          {/* 시드/Naver 후기 검증 — M1 정체성 */}
          <div className="flex items-center gap-td-xs p-td-sm bg-success-soft border border-success-soft rounded-md">
            <span className="material-symbols-outlined filled text-success-deep">check_circle</span>
            <span className="text-td-body text-success-deep">
              추천 근거 검증 완료
              {verifiedReviews > 0 && (
                <>
                  {" "}
                  · 후기 <span className="font-bold">{verifiedReviews.toLocaleString()}건</span>
                </>
              )}
            </span>
          </div>

          {/* Google Places 검증 (5b-3, S-03 1~2단계) */}
          <GoogleVerificationBadge result={googleResult} />

          {/* 5단계 검증 종합 뱃지 (사이클 L+N · D · ADR-029) */}
          <ValidationBadges result={validationResult} />

          {warning && (
            <div className="flex items-start gap-td-xs p-td-sm bg-danger-soft border border-danger-soft rounded-md">
              <span className="material-symbols-outlined filled text-danger">warning</span>
              <div className="flex flex-col">
                <span className="text-td-body text-danger-deep font-semibold">주의</span>
                <span className="text-td-caption text-danger-deep">{warning}</span>
              </div>
            </div>
          )}
        </section>

        {/* EvidencePanel — M1 정체성 (펼친 상태) */}
        <section className="px-td-md py-td-sm">
          <EvidencePanel evidence={mergedEvidence} defaultOpen />
        </section>

        {/* Details Grid */}
        <section className="px-td-md py-td-sm grid grid-cols-2 gap-td-sm">
          <div className="p-td-sm border border-divider rounded-md bg-surface-card">
            <p className="text-td-caption text-ink-soft mb-td-xxs uppercase">소요 시간</p>
            <div className="flex items-center gap-td-xxs">
              <div className="w-2 h-2 rounded-full bg-amber" aria-hidden />
              <p className="text-td-card-title text-ink">
                {durationLabel(item.durationMinutes)}
              </p>
            </div>
          </div>
          <div className="p-td-sm border border-divider rounded-md bg-surface-card">
            <p className="text-td-caption text-ink-soft mb-td-xxs uppercase">비용 수준</p>
            <div className="flex items-center gap-td-xxs">
              <div className={`w-2 h-2 rounded-full ${priceLevel.dotClass}`} aria-hidden />
              <p className="text-td-card-title text-ink">
                {priceLevel.label}
                {item.estimatedPrice && item.estimatedPrice.amount > 0 && (
                  <span className="text-td-caption text-ink-soft ml-1">
                    · {item.estimatedPrice.amount.toLocaleString()} {item.estimatedPrice.currency}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* 위치 (full row) */}
          <div className="col-span-2 p-td-sm border border-divider rounded-md bg-surface-card">
            <p className="text-td-caption text-ink-soft mb-td-xxs uppercase">위치</p>
            <p className="text-td-body text-ink">{item.location.address}</p>
            <p className="text-td-caption text-ink-mute mt-td-xxs tabular-nums">
              {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
            </p>
          </div>

          {/* Live Replan 정보 (full row) */}
          <div className="col-span-2 p-td-sm border border-divider rounded-md bg-surface-card">
            <p className="text-td-caption text-ink-soft mb-td-xs uppercase">
              Live Replan 정보
            </p>
            <div className="grid grid-cols-3 gap-td-xs text-center">
              <Mini label="우선순위" value={`${item.priority}/5`} />
              <Mini label="유연성" value={flexibilityKr(item.flexibility)} />
              <Mini
                label="이동 가능"
                value={item.flexMinutes > 0 ? `±${item.flexMinutes}분` : "—"}
              />
            </div>
          </div>
        </section>

        {/* OTA 가격 비교 (M8, 사이클 12a) */}
        {otaOffers.length > 0 && (
          <OtaCompareSection itemId={item.id} offers={otaOffers} />
        )}

        {/* 인라인 지도 (사이클 7.5+, ADR-028 + Geolocation directions) */}
        {hasValidCoords(item.location) ? (
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ? (
            <ItineraryMapWithDirections
              lat={item.location.lat}
              lng={item.location.lng}
              placeName={ko}
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY}
            />
          ) : (
            <ItineraryMap
              lat={item.location.lat}
              lng={item.location.lng}
              placeName={ko}
            />
          )
        ) : null}

        {/* 길찾기 deeplink (사이클 7 D1·D2 + G 카카오맵) */}
        {hasValidCoords(item.location) && (
          <DirectionsGrid location={item.location} placeName={ko} />
        )}
      </main>

      {/* Bottom Action Bar (Fixed) — 옵션 T: dead button 활성화 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[420px] w-full p-td-md bg-surface-card/90 backdrop-blur-md border-t border-divider z-50 flex gap-td-sm">
        <Link
          href={`/itinerary/${params.id}`}
          aria-label="이 일정의 대안 — 일정 목록으로"
          className="flex-1 py-3 border border-divider rounded-md text-td-body text-ink font-semibold text-center hover:bg-surface-soft transition-colors"
        >
          대안 보기
        </Link>
        <Link
          href={`/trips/${params.id}?focus=itinerary`}
          aria-label="이 일정 유지 — 여행 대시보드로 돌아가기"
          className="flex-[2] py-3 bg-purple text-white rounded-md text-td-body font-bold text-center hover:opacity-90 active:scale-95 transition-all shadow-lg"
        >
          이 일정 유지
        </Link>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-td-caption text-ink-mute">{label}</p>
      <p className="text-td-meta text-ink font-medium mt-0.5">{value}</p>
    </div>
  );
}
