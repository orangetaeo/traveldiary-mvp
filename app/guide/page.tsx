/**
 * 도시 여행 가이드 목록 페이지 — 시나리오 C Phase C3.
 *
 * SEO 랜딩: "베트남 여행 가이드", "다낭 여행 코스" 등 검색 유입.
 * 각 도시의 curatedGuides를 카드로 나열 → /city/[slug]#curated로 링크.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { listVietnamCities, resolveCity } from "@/lib/seed/cities";
import { BottomNav } from "@/components/ui/BottomNav";

export const metadata: Metadata = {
  title: "베트남 여행 가이드 — 도시별 코스 추천 | TravelDiary",
  description:
    "베트남 다낭, 호치민, 하노이, 푸꾸옥, 호이안, 나트랑, 달랏, 껀터 — 도시별 시그니처 여행 코스를 AI가 검증한 근거와 함께.",
  openGraph: {
    title: "베트남 여행 가이드 — 도시별 코스 추천",
    description:
      "베트남 8개 도시 시그니처 여행 코스. 첫날 동선부터 야시장, 맛집, 일출 명소까지.",
    type: "website",
  },
};

export default function GuidePage() {
  const cities = listVietnamCities();

  // 가이드가 있는 도시만 (resolveCity로 풀 데이터)
  const guideCities = cities
    .map((c) => {
      const resolved = resolveCity(c.slug);
      if (!resolved || !resolved.curatedGuides?.length) return null;
      return resolved;
    })
    .filter(Boolean);

  const totalGuides = guideCities.reduce(
    (sum, c) => sum + (c!.curatedGuides?.length ?? 0),
    0,
  );

  return (
    <div className="min-h-screen bg-surface text-ink pb-24">
      {/* Hero Header */}
      <section className="relative w-full bg-gradient-to-br from-purple to-purple-deep text-white px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-white/80 text-td-meta mb-3 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          홈
        </Link>
        <h1 className="text-[28px] font-bold leading-tight mb-1">
          베트남 여행 가이드
        </h1>
        <p className="text-white/80 text-td-body">
          {guideCities.length}개 도시, {totalGuides}개 시그니처 코스
        </p>
      </section>

      {/* 도시별 가이드 카드 */}
      <main className="bg-surface-card max-w-md mx-auto w-full">
        {guideCities.map((city) => {
          if (!city) return null;
          const guides = city.curatedGuides ?? [];
          return (
            <section key={city.slug} className="px-4 pt-6">
              <div className="flex justify-between items-end mb-3">
                <h2 className="text-td-title text-ink">
                  {city.name}
                </h2>
                <Link
                  href={`/city/${city.slug}`}
                  className="text-td-meta text-purple flex items-center gap-1 hover:underline"
                >
                  도시 정보
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
              <div className="space-y-2">
                {guides.map((guide) => (
                  <Link
                    key={guide.id}
                    href={`/city/${city.slug}#curated`}
                    className="block p-3 bg-surface-soft border border-divider rounded-md hover:border-purple/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{guide.hero?.emoji ?? "📍"}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-td-card-title text-ink mb-0.5">
                          {guide.title}
                        </h3>
                        <p className="text-td-caption text-ink-soft mb-1.5">
                          {guide.subtitle}
                        </p>
                        <div className="flex items-center gap-1 text-ink-mute">
                          <span className="material-symbols-outlined text-[14px]">route</span>
                          <span className="text-td-meta">{guide.sections.length}개 스팟</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* SEO 보조 텍스트 */}
        <section className="px-4 mt-8 border-t border-divider pt-6">
          <h2 className="text-td-card-title text-ink mb-2">
            베트남 자유여행, 어디서 시작할까?
          </h2>
          <p className="text-td-body text-ink-soft leading-relaxed">
            다낭의 호이안 등불부터 호치민의 분짜 거리, 하노이의 하롱베이 크루즈,
            푸꾸옥의 야시장까지 — TravelDiary가 AI 검증으로 엄선한 시그니처 코스를
            따라가 보세요. 각 코스는 교통비·영업시간·현지 팁까지 포함하여
            첫 베트남 여행자도 바로 따라갈 수 있습니다.
          </p>
        </section>

        <p className="text-td-caption text-ink-mute text-center mt-6 pb-4 opacity-60">
          베트남 우선 출시 정책 적용 중
        </p>
      </main>

      <BottomNav active="trips" />
    </div>
  );
}
