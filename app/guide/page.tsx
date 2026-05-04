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
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-br from-purple to-purple-deep text-white px-td-md py-td-xl">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-white/70 text-td-caption hover:text-white transition-colors"
          >
            ← 홈
          </Link>
          <h1 className="text-2xl font-bold mt-td-sm tracking-tight">
            베트남 여행 가이드
          </h1>
          <p className="text-white/80 text-td-body mt-td-xs">
            {guideCities.length}개 도시, {totalGuides}개 시그니처 코스
          </p>
        </div>
      </header>

      {/* 도시별 가이드 카드 */}
      <main className="max-w-2xl mx-auto px-td-md pt-td-lg">
        <div className="space-y-td-lg">
          {guideCities.map((city) => {
            if (!city) return null;
            const guides = city.curatedGuides ?? [];
            return (
              <section key={city.slug}>
                <div className="flex items-center justify-between mb-td-sm">
                  <h2 className="text-td-title text-ink font-bold">
                    {city.name}
                  </h2>
                  <Link
                    href={`/city/${city.slug}`}
                    className="text-td-caption text-purple hover:underline"
                  >
                    도시 정보 →
                  </Link>
                </div>
                <div className="space-y-td-sm">
                  {guides.map((guide) => (
                    <Link
                      key={guide.id}
                      href={`/city/${city.slug}#curated`}
                      className="block bg-surface-card border border-divider rounded-xl p-td-md hover:border-purple/40 transition-colors"
                    >
                      <div className="flex items-start gap-td-sm">
                        <span className="text-2xl">{guide.hero?.emoji ?? "📍"}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-td-card-title text-ink font-medium">
                            {guide.title}
                          </h3>
                          <p className="text-td-caption text-ink-soft mt-td-xxs">
                            {guide.subtitle}
                          </p>
                          <p className="text-td-meta text-ink-mute mt-td-xs">
                            {guide.sections.length}단계 코스
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* SEO 보조 텍스트 */}
        <section className="mt-td-xl border-t border-divider pt-td-lg">
          <h2 className="text-td-card-title text-ink mb-td-sm">
            베트남 자유여행, 어디서 시작할까?
          </h2>
          <p className="text-td-body text-ink-soft leading-relaxed">
            다낭의 호이안 등불부터 호치민의 분짜 거리, 하노이의 하롱베이 크루즈,
            푸꾸옥의 야시장까지 — TravelDiary가 AI 검증으로 엄선한 시그니처 코스를
            따라가 보세요. 각 코스는 교통비·영업시간·현지 팁까지 포함하여
            첫 베트남 여행자도 바로 따라갈 수 있습니다.
          </p>
        </section>

        <p className="text-td-caption text-ink-mute text-center mt-td-lg pb-td-md">
          시나리오 C Phase C3 — SEO 콘텐츠
        </p>
      </main>

      <BottomNav active="trips" />
    </div>
  );
}
