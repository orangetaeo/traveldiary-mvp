"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";
import {
  AllergenFilterChips,
  type AllergenChipItem,
} from "@/components/allergen/AllergenFilterChips";
import { useToast } from "@/lib/hooks/useToast";
import {
  ALLERGEN_CHIPS,
  matchAllergens,
  type AllergenMatch,
} from "@/lib/allergens";
import {
  PHU_QUOC_MENU_VENUE,
  phuQuocMenu,
  type MenuItem,
} from "@/lib/seed/menu-phu-quoc";
import { translateMenuPhotoAction } from "@/actions/translate";

/**
 * ALLERGEN_CHIPS(label/raw) → AllergenFilterChips 입력 변환.
 *
 * 모든 ALLERGEN_CHIPS 항목은 severity="danger" (알레르기·식이 제한).
 * 아이콘 매핑(시안 spec sheet 5종): block / hot_tub / eco / egg / opacity.
 */
const ALLERGEN_CHIP_ICON: Record<string, string> = {
  "새우 알레르기": "block",
  "갑각류 알레르기": "block",
  "조개 알레르기": "block",
  "땅콩 알레르기": "block",
  "우유 알레르기": "opacity",
  돼지고기: "block",
  비건: "eco",
};

const ALLERGEN_CHIP_ITEMS: AllergenChipItem[] = ALLERGEN_CHIPS.map((c) => ({
  raw: c.raw,
  label: c.label,
  severity: "danger",
  icon: ALLERGEN_CHIP_ICON[c.label] ?? "block",
}));

/**
 * 카메라 번역 (M4) — Stitch #9 + #10 매핑.
 *
 * Stitch screens:
 *   #9  Camera Translator - Capturing (Pretendard) — 셔터 단계
 *   #10 Camera Translator - Results (Pretendard) — 결과 + 알레르기 필터
 *
 * 사이클 5b 옵션 C (2026-04-30): Stitch HTML → React 변환.
 *
 * 데모 (ADR-015): 정적 베트남어 메뉴 시드.
 * 사이클 5에서 사진 업로드 + Google Vision + Claude API + writeAuditLog.
 */
export function TranslateView({ tripId }: { tripId?: string }) {
  const [step, setStep] = useState<"capturing" | "results">("capturing");

  if (step === "capturing") {
    return (
      <CapturingView
        tripId={tripId}
        onShutter={() => setStep("results")}
      />
    );
  }

  return <ResultsView tripId={tripId} onRetake={() => setStep("capturing")} />;
}

// ═══════════════════════════════════════════════════════════
// Step 1: Capturing
// ═══════════════════════════════════════════════════════════

function CapturingView({
  tripId,
  onShutter,
}: {
  tripId?: string;
  onShutter: () => void;
}) {
  // 사이클 5b-5 (ADR-019): 파일 업로드 → Vision OCR + Claude 번역
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast, show: showToast } = useToast(5000);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("이미지가 너무 큽니다 (10MB 이내).", { variant: "warning" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // "data:image/jpeg;base64,..." → base64만 추출
      const base64 = dataUrl.split(",")[1] ?? "";
      if (!base64) {
        showToast("이미지를 읽지 못했어요.", { variant: "warning" });
        return;
      }

      startTransition(async () => {
        const result = await translateMenuPhotoAction({
          imageBase64: base64,
          contextId: tripId,
        });

        if (result.mode === "demo") {
          showToast("API 키 미설정 — 정적 시드로 시연됩니다.", { variant: "info" });
          onShutter(); // 정적 시드 ResultsView로
        } else if (result.mode === "ok") {
          showToast(
            `실 번역 ${result.items.length}건 (OCR ${
              result.ocrCached ? "캐시" : "신선"
            } · Claude ${result.claudeCached ? "캐시" : "신선"} · ${
              result.totalMs
            }ms)`,
            { variant: "success" },
          );
          // 5b-5에선 결과를 sessionStorage에 저장 → 사이클 5b-5.5에서 ResultsView 통합
          sessionStorage.setItem(
            "td-menu-translation",
            JSON.stringify(result.items),
          );
          onShutter();
        } else if (result.mode === "no_text") {
          showToast("이미지에서 텍스트를 찾지 못했어요.", { variant: "warning" });
        } else {
          showToast(
            `실패: ${result.stage} ${result.code} (${result.message ?? ""})`,
            { variant: "danger" },
          );
        }
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col relative overflow-hidden">
      {/* TopAppBar */}
      <header className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-td-md h-14 bg-black/30 backdrop-blur-md">
        <div className="flex items-center gap-td-sm">
          <Link
            href={tripId ? `/travel/${tripId}` : "/"}
            aria-label="닫기"
            className="p-2 rounded-full hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </Link>
          <h1 className="text-td-body font-semibold tracking-tight text-white">
            Camera Translator
          </h1>
        </div>
        <button
          type="button"
          aria-label="설정"
          className="p-2 rounded-full hover:bg-white/10"
        >
          <span className="material-symbols-outlined text-white">settings</span>
        </button>
      </header>

      {/* Faux camera viewport — 그라디언트 + 메뉴판 placeholder */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-amber-deep via-ink to-purple-deep">
        <div className="absolute inset-0 flex items-center justify-center opacity-15">
          <span className="material-symbols-outlined hero-icon text-white" aria-hidden>
            menu_book
          </span>
        </div>
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-between pt-20 pb-10">
        {/* 안내 pill */}
        <div className="bg-accent text-white px-td-md py-td-xs rounded-full shadow-lg">
          <span className="text-td-body font-bold">메뉴판을 비춰보세요</span>
        </div>

        {/* Scanner viewfinder brackets */}
        <div className="relative w-64 h-80 flex items-center justify-center">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-white/80 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-white/80 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-white/80 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-white/80 rounded-br-lg" />
          <div className="w-full h-[2px] bg-white/40 absolute top-1/2 -translate-y-1/2 animate-pulse" />
        </div>

        {/* Camera Controls */}
        <div className="flex flex-col items-center gap-td-md">
          <button
            type="button"
            onClick={onShutter}
            aria-label="촬영"
            className="w-20 h-20 rounded-full border-[6px] border-white/50 flex items-center justify-center bg-transparent active:scale-90 transition-transform"
          >
            <span className="w-14 h-14 bg-white rounded-full shadow-xl" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="flex items-center gap-td-xxs text-white/90 hover:text-white transition-colors disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[20px]">photo_library</span>
            <span className="text-td-meta font-semibold uppercase tracking-wide">
              {isPending ? "번역 중…" : "갤러리에서 사진 선택"}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="메뉴 사진 업로드"
          />
        </div>
      </main>

      <Toast
        toast={toast}
        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 w-[min(420px,90vw)]"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Step 2: Results
// ═══════════════════════════════════════════════════════════

function ResultsView({
  tripId,
  onRetake,
}: {
  tripId?: string;
  onRetake: () => void;
}) {
  const [excludes, setExcludes] = useState<string[]>([]);
  // 사이클 5b-5.5: sessionStorage 실 결과 우선, 없으면 정적 시드
  const [liveItems, setLiveItems] = useState<MenuItem[] | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("td-menu-translation");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<{
        vn: string;
        ko: string;
        allergens: string[];
      }>;
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      const items: MenuItem[] = parsed.map((t, i) => ({
        id: `live-${i}`,
        original: t.vn,
        phonetic: "",
        translated: t.ko,
        price: { vnd: 0, krw: 0 },
        koreanPopularity: 0,
        ingredients: [],
        allergens: t.allergens as MenuItem["allergens"],
      }));
      setLiveItems(items);
    } catch {
      // ignore
    }
  }, []);

  function toggle(raw: string) {
    setExcludes((prev) =>
      prev.includes(raw) ? prev.filter((x) => x !== raw) : [...prev, raw]
    );
  }

  function handleRetake() {
    sessionStorage.removeItem("td-menu-translation");
    onRetake();
  }

  const sourceMenu = liveItems ?? phuQuocMenu;

  const annotated = useMemo(() => {
    const list = sourceMenu.map((item) => {
      const haystack = [
        item.original,
        item.translated,
        item.phonetic,
        item.ingredients.join(" "),
        item.allergens.join(" "),
      ].join(" ");
      return { item, matches: matchAllergens(haystack, excludes) };
    });
    list.sort(
      (a, b) =>
        (b.item.koreanPopularity ?? 0) - (a.item.koreanPopularity ?? 0)
    );
    return list;
  }, [excludes, sourceMenu]);

  const dangerCount = annotated.filter((a) =>
    a.matches.some((m) => m.severity === "critical")
  ).length;

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-32">
      {/* TopAppBar */}
      <header className="bg-surface-card/95 backdrop-blur-md border-b border-divider sticky top-0 z-50 flex justify-between items-center w-full px-td-md h-14">
        <div className="flex items-center gap-td-sm">
          <Link
            href={tripId ? `/travel/${tripId}` : "/"}
            aria-label="닫기"
            className="p-2 rounded-full hover:bg-surface-soft"
          >
            <span className="material-symbols-outlined text-ink-soft">close</span>
          </Link>
          <h1 className="text-td-body font-bold tracking-tight text-ink">
            Camera Translator
          </h1>
        </div>
        <button
          type="button"
          onClick={handleRetake}
          aria-label="다시 촬영"
          className="p-2 rounded-full hover:bg-surface-soft"
        >
          <span className="material-symbols-outlined text-purple">photo_camera</span>
        </button>
      </header>

      {/* Photo Section (top 30%) */}
      <div className="h-56 relative w-full overflow-hidden bg-gradient-to-br from-amber-deep via-ink to-purple-deep">
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <span className="material-symbols-outlined hero-icon text-white" aria-hidden>
            menu_book
          </span>
        </div>
        <div className="absolute inset-0 bg-purple/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 border-purple border-dashed rounded-lg flex items-center justify-center">
          <p className="text-white text-td-meta font-medium bg-black/40 px-2 py-1 rounded">
            {PHU_QUOC_MENU_VENUE.name}
          </p>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="bg-surface-card rounded-t-[24px] -mt-6 relative z-10 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
        <div className="w-12 h-1 bg-divider rounded-full mx-auto mt-3 mb-td-sm" />

        <main className="px-td-md pb-td-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-td-sm">
            <div>
              <h2 className="text-td-card-title text-ink">
                {liveItems ? "실시간 번역" : "번역된 메뉴 (데모)"}
              </h2>
              <p className="text-td-caption text-ink-soft mt-td-xxs">
                {annotated.length}개 항목
                {liveItems ? " · Vision + Claude" : " · 한국인 인기순"}
              </p>
            </div>
            {dangerCount > 0 && (
              <Badge tone="danger">{dangerCount}개 위험</Badge>
            )}
          </div>

          {/* Allergy Chips — AllergenFilterChips 통합 (시안 매칭) */}
          <div className="-mx-td-md mb-td-md">
            <AllergenFilterChips
              items={ALLERGEN_CHIP_ITEMS}
              selected={excludes}
              onToggle={toggle}
              ariaLabel="알레르기·식이 필터"
            />
          </div>

          {/* Result List */}
          <section className="space-y-td-xs">
            {annotated.map(({ item, matches }) => (
              <MenuRow key={item.id} item={item} matches={matches} />
            ))}
          </section>
        </main>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[420px] w-full p-td-md bg-surface-card/95 backdrop-blur-md border-t border-divider z-50">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-td-xs px-td-lg py-3 bg-surface-card border border-divider text-ink rounded-full text-td-body font-bold transition-all active:scale-[0.98] shadow-sm hover:bg-surface-soft"
        >
          <span className="material-symbols-outlined text-amber">share</span>
          친구에게 카카오톡으로 보내기
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MenuRow — Stitch #10 row 디자인
// ═══════════════════════════════════════════════════════════

function MenuRow({
  item,
  matches,
}: {
  item: MenuItem;
  matches: AllergenMatch[];
}) {
  const critical = matches.some((m) => m.severity === "critical");
  const isBest = (item.koreanPopularity ?? 0) >= 80;

  return (
    <article
      className={`flex items-center gap-td-sm p-td-sm rounded-xl border transition-all hover:shadow-sm ${
        critical
          ? "bg-danger-soft/30 border-l-[3px] border-l-danger border-divider"
          : "bg-surface-card border-divider"
      }`}
    >
      {/* Thumbnail (icon) */}
      <div
        className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
          critical ? "bg-danger-soft" : "bg-surface-soft"
        }`}
        aria-hidden
      >
        <span
          className={`material-symbols-outlined ${
            critical ? "text-danger-deep" : "text-ink-soft"
          }`}
        >
          restaurant_menu
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-td-meta text-ink-soft truncate">{item.original}</p>
        <h3 className="text-td-body font-medium text-ink truncate">
          {item.translated}
        </h3>
        {item.culturalNote && (
          <p className="text-td-caption text-ink-soft line-clamp-1 mt-td-xxs">
            {item.culturalNote}
          </p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="text-td-caption text-ink-mute tabular-nums">
          {item.price.krw.toLocaleString()}원
        </span>
        {critical ? (
          <span className="bg-danger text-white px-td-xs py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">warning</span>
            <span className="text-[10px] font-bold uppercase">위험</span>
          </span>
        ) : isBest ? (
          <span className="bg-amber text-white px-td-xs py-0.5 rounded-full">
            <span className="text-[10px] font-bold uppercase tracking-tight">
              한국인 BEST
            </span>
          </span>
        ) : null}
      </div>
    </article>
  );
}
