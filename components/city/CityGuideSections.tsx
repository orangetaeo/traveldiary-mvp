/**
 * City Guide 페이지 — 섹션 컴포넌트 4종.
 * CityMedicalSection / CitySafetySection / CityPracticalSection / CityWeatherSection.
 *
 * app/city/[slug]/page.tsx에서 추출 — 순수 서버 컴포넌트 (상태 없음).
 */

import type { MedicalFacility, PracticalTips, SafetyTips } from "@/lib/types";

// ═══════════════════════════════════════════════════════════
// Medical (F2)
// ═══════════════════════════════════════════════════════════

export function CityMedicalSection({
  facilities,
}: {
  facilities: MedicalFacility[];
}) {
  return (
    <section id="medical" className="mb-td-lg scroll-mt-24">
      <h3 className="text-td-card-title text-ink mb-td-sm">약국·병원</h3>
      <div className="space-y-td-sm">
        {facilities.map((fac, i) => (
          <div
            key={i}
            className="bg-surface-card border border-divider rounded-md p-td-md"
          >
            <div className="flex items-start gap-td-sm">
              <span
                className={`material-symbols-outlined text-td-icon-lg shrink-0 ${
                  fac.type === "pharmacy"
                    ? "text-success"
                    : fac.type === "hospital"
                      ? "text-danger"
                      : "text-purple"
                }`}
                aria-hidden
              >
                {fac.type === "pharmacy"
                  ? "local_pharmacy"
                  : fac.type === "hospital"
                    ? "local_hospital"
                    : fac.type === "dental"
                      ? "dentistry"
                      : "medical_services"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-td-xs mb-td-xxs">
                  <p className="text-td-body text-ink font-semibold">{fac.label}</p>
                  <span className={`text-td-badge px-1.5 py-0.5 rounded-full font-bold ${
                    fac.type === "pharmacy"
                      ? "bg-success-soft text-success-deep"
                      : fac.type === "hospital"
                        ? "bg-danger-soft text-danger-deep"
                        : "bg-purple-soft text-purple-deep"
                  }`}>
                    {fac.type === "pharmacy" ? "약국" : fac.type === "hospital" ? "병원" : fac.type === "dental" ? "치과" : "클리닉"}
                  </span>
                </div>
                <p className="text-td-meta text-ink-soft">{fac.address}</p>
                {fac.hours && (
                  <p className="text-td-meta text-ink-mute">{fac.hours}</p>
                )}
                {fac.notes && (
                  <p className="text-td-meta text-ink-soft mt-td-xxs">{fac.notes}</p>
                )}
              </div>
              {fac.phone && (
                <a
                  href={`tel:${fac.phone.replace(/\s/g, "")}`}
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-success-soft hover:bg-success/20 transition-colors"
                  aria-label={`${fac.label} 전화`}
                >
                  <span className="material-symbols-outlined text-success-deep text-td-icon">call</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// Safety (F3)
// ═══════════════════════════════════════════════════════════

export function CitySafetySection({
  safetyTips,
}: {
  safetyTips: SafetyTips;
}) {
  return (
    <section id="safety" className="mb-td-lg scroll-mt-24">
      <h3 className="text-td-card-title text-ink mb-td-sm">안전 정보</h3>
      <div className="space-y-td-sm">
        {/* 사기·바가지 주의 */}
        {safetyTips.scamWarnings.length > 0 && (
          <div className="bg-amber-soft border border-amber/30 rounded-md p-td-md">
            <div className="flex items-center gap-td-xs mb-td-xs">
              <span className="material-symbols-outlined text-amber-deep text-td-icon" aria-hidden>report</span>
              <p className="text-td-body font-semibold text-amber-deep">사기·바가지 주의</p>
            </div>
            <ul className="space-y-td-xxs">
              {safetyTips.scamWarnings.map((w, i) => (
                <li key={i} className="flex items-start gap-td-xs">
                  <span className="text-amber-deep text-td-meta mt-0.5">•</span>
                  <p className="text-td-meta text-ink">{w}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* 일반 안전 수칙 */}
        {safetyTips.safetyNotes.length > 0 && (
          <div className="bg-surface-card border border-divider rounded-md p-td-md">
            <div className="flex items-center gap-td-xs mb-td-xs">
              <span className="material-symbols-outlined text-purple text-td-icon" aria-hidden>shield</span>
              <p className="text-td-body font-semibold text-ink">안전 수칙</p>
            </div>
            <ul className="space-y-td-xxs">
              {safetyTips.safetyNotes.map((n, i) => (
                <li key={i} className="flex items-start gap-td-xs">
                  <span className="text-purple text-td-meta mt-0.5">•</span>
                  <p className="text-td-meta text-ink-soft">{n}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* 야간 안전 */}
        {safetyTips.nightSafety && (
          <div className="bg-surface-card border border-divider rounded-md p-td-sm flex items-start gap-td-xs">
            <span className="material-symbols-outlined text-ink-soft text-td-icon shrink-0" aria-hidden>dark_mode</span>
            <div>
              <p className="text-td-meta text-ink-soft font-medium">야간 안전</p>
              <p className="text-td-meta text-ink-soft">{safetyTips.nightSafety}</p>
            </div>
          </div>
        )}
        {/* 관광 경찰 */}
        {safetyTips.touristPolice && (
          <div className="bg-surface-card border border-divider rounded-md p-td-sm flex items-center justify-between">
            <div className="flex items-center gap-td-xs">
              <span className="material-symbols-outlined text-purple text-td-icon" aria-hidden>local_police</span>
              <div>
                <p className="text-td-meta text-ink font-medium">관광 경찰</p>
                {safetyTips.touristPolice.notes && (
                  <p className="text-td-caption text-ink-mute">{safetyTips.touristPolice.notes}</p>
                )}
              </div>
            </div>
            <a
              href={`tel:${safetyTips.touristPolice.phone.replace(/\s/g, "")}`}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-purple-soft hover:bg-purple/20 transition-colors"
              aria-label="관광 경찰 전화"
            >
              <span className="material-symbols-outlined text-purple-deep text-td-icon">call</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// Practical Tips (B7)
// ═══════════════════════════════════════════════════════════

export function CityPracticalSection({
  practicalTips,
}: {
  practicalTips: PracticalTips;
}) {
  return (
    <section id="practical" className="mb-td-lg scroll-mt-24">
      <h3 className="text-td-card-title text-ink mb-td-sm">생활 팁</h3>
      <div className="space-y-td-sm">
        {/* 물 안전 */}
        <div className="bg-surface-card border border-divider rounded-md p-td-sm flex items-start gap-td-xs">
          <span className="material-symbols-outlined text-accent text-td-icon shrink-0" aria-hidden>water_drop</span>
          <div>
            <p className="text-td-meta text-ink font-medium">물 안전</p>
            <p className="text-td-meta text-ink-soft">{practicalTips.waterSafety}</p>
          </div>
        </div>
        {/* 화장실 */}
        <div className="bg-surface-card border border-divider rounded-md p-td-sm flex items-start gap-td-xs">
          <span className="material-symbols-outlined text-ink-soft text-td-icon shrink-0" aria-hidden>wc</span>
          <div>
            <p className="text-td-meta text-ink font-medium">화장실</p>
            <p className="text-td-meta text-ink-soft">{practicalTips.toiletInfo}</p>
          </div>
        </div>
        {/* 모기 */}
        {practicalTips.mosquito && (
          <div className="bg-surface-card border border-divider rounded-md p-td-sm flex items-start gap-td-xs">
            <span className="material-symbols-outlined text-amber-deep text-td-icon shrink-0" aria-hidden>pest_control</span>
            <div>
              <p className="text-td-meta text-ink font-medium">모기·벌레</p>
              <p className="text-td-meta text-ink-soft">{practicalTips.mosquito}</p>
            </div>
          </div>
        )}
        {/* 자외선 */}
        {practicalTips.sunProtection && (
          <div className="bg-surface-card border border-divider rounded-md p-td-sm flex items-start gap-td-xs">
            <span className="material-symbols-outlined text-amber text-td-icon shrink-0" aria-hidden>wb_sunny</span>
            <div>
              <p className="text-td-meta text-ink font-medium">자외선 차단</p>
              <p className="text-td-meta text-ink-soft">{practicalTips.sunProtection}</p>
            </div>
          </div>
        )}
        {/* 흥정 */}
        {practicalTips.haggling && (
          <div className="bg-surface-card border border-divider rounded-md p-td-sm flex items-start gap-td-xs">
            <span className="material-symbols-outlined text-purple text-td-icon shrink-0" aria-hidden>storefront</span>
            <div>
              <p className="text-td-meta text-ink font-medium">흥정 문화</p>
              <p className="text-td-meta text-ink-soft">{practicalTips.haggling}</p>
            </div>
          </div>
        )}
        {/* 기타 생활 수칙 */}
        {practicalTips.customs && practicalTips.customs.length > 0 && (
          <div className="bg-surface-card border border-divider rounded-md p-td-md">
            <div className="flex items-center gap-td-xs mb-td-xs">
              <span className="material-symbols-outlined text-ink-soft text-td-icon" aria-hidden>info</span>
              <p className="text-td-meta text-ink font-medium">알아두면 좋은 것</p>
            </div>
            <ul className="space-y-td-xxs">
              {practicalTips.customs.map((c, i) => (
                <li key={i} className="flex items-start gap-td-xs">
                  <span className="text-ink-mute text-td-meta mt-0.5">•</span>
                  <p className="text-td-meta text-ink-soft">{c}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// Weather + Clothing (B6)
// ═══════════════════════════════════════════════════════════

interface WeatherData {
  season: string;
  avgTempC?: { min: number; max: number };
  notes?: string;
  clothing?: string[];
}

export function CityWeatherSection({
  weather,
}: {
  weather: WeatherData;
}) {
  return (
    <section id="weather" className="mb-td-lg scroll-mt-24">
      <h3 className="text-td-card-title text-ink mb-td-sm">날씨·복장</h3>
      <div className="bg-surface-card border border-divider rounded-md p-td-md space-y-td-xs">
        <div className="flex items-center gap-td-xs">
          <span className="material-symbols-outlined text-amber-deep text-td-icon" aria-hidden>thermostat</span>
          <p className="text-td-body text-ink">{weather.season}</p>
        </div>
        {weather.avgTempC && (
          <p className="text-td-meta text-ink-soft">
            평균 기온 {weather.avgTempC.min}°C ~ {weather.avgTempC.max}°C
          </p>
        )}
        {weather.notes && (
          <p className="text-td-meta text-ink-soft">{weather.notes}</p>
        )}
      </div>
      {weather.clothing && weather.clothing.length > 0 && (
        <div className="mt-td-sm bg-surface-card border border-divider rounded-md p-td-md">
          <div className="flex items-center gap-td-xs mb-td-sm">
            <span className="material-symbols-outlined text-purple text-td-icon" aria-hidden>checkroom</span>
            <p className="text-td-body text-ink font-semibold">복장 추천</p>
          </div>
          <ul className="space-y-td-xs">
            {weather.clothing.map((item, i) => (
              <li key={i} className="flex items-start gap-td-xs">
                <span className="text-purple text-td-meta mt-0.5">•</span>
                <p className="text-td-meta text-ink-soft">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
