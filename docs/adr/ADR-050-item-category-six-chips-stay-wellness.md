---
id: ADR-050
title: ItemCategory 6칩 확장 — stay/wellness 신설 + subCategory 일등시민화
status: Accepted
date: 2026-05-10
accepted_date: 2026-05-14
decider: R1 CTO (self-sign-off, schema 무변경 — S-18 경량 게이트)
proposer: T8 PM + T17 UX + T14 DB + T1 Trip Architect
related: ADR-022 (Checklist/Cost), ADR-029 (Validation 3·5), 사이클 ZZ (베트남 단일 국가), 4-Part 1 (마사지·호텔 카테고리), CLAUDE.md M5/M6 차별화
supersedes_proposal: 핸드오프 메모 "ADR-046 후보"는 ADR-046 점유로 인해 본 ADR로 재번호
stitch_mockups:
  - "AddItemModal — 카테고리 6 칩 확장 (screenId 7d310f106e1a41da889c357878c8e781)"
  - "Discover 카드 — 숙소 및 마사지 추가 (screenId df849e691b6c458e8e509329f16285ef)"
---

# ADR-050: ItemCategory 6칩 확장 — stay/wellness 신설 + subCategory 일등시민화

## 컨텍스트

CLAUDE.md M1(추천 근거) + M3(Live Replan)의 1차 분류 축 `ItemCategory`는 4값 — `"food" | "spot" | "shopping" | "rest"`. 사용자 노출은 `CATEGORY_OPTIONS` ([components/itinerary/add-item-utils.ts:23-28](components/itinerary/add-item-utils.ts#L23-L28))에서 4 칩.

### 기존 한계 (T8 PM 진단, 2026-05-09)

1. **rest 카테고리가 사용자에게 의미 손실**
   - 시드 4,324 places 중 "숙소" 433 + "마사지" 408 = **841건 (전체 19%)**이 rest 1 카테고리에 묶임
   - 사용자가 "마사지 받고 싶어"·"호텔 찾고 싶어"를 선택할 진입점 부재
   - 모닝 브리핑·Discover에서 마사지·호텔이 "휴식"으로 통합 노출 → 추천 의도 실종

2. **scripts/seed-pipeline/06-export-discover.ts:61-62 강제 매핑** — 의도적 통합으로 rest를 spot으로 매핑
   ```ts
   if (category === "rest" && (subCategory === "스파/마사지" || subCategory === "뷰티")) return "spot";
   if (category === "rest") return "spot"; // 숙소/리조트 → spot으로
   ```
   결과: Discover 화면에서 마사지·호텔이 "관광"으로 노출 — 카테고리 아이덴티티 완전 실종.

3. **잘못 분류 294건 발견** (T14 DB 진단, 2026-05-09)
   - 호텔/리조트/스파 키워드 632건 중 main `category` 잘못 분류:
     - food 79건, spot 212건, shopping 3건 — 합계 **294건**
   - subCategory는 정확하지만 main category가 잘못된 상태 → 칩 필터 적용 시 누락

4. **subCategory 인프라는 100% 갖춰져 있음**
   - [prisma/schema.prisma:390](prisma/schema.prisma#L390) `subCategory String?` (이미 존재)
   - 시드 4,324 places 모두 subCategory 적재됨 (관광 1184 / 식당 625 / 카페 460 / 숙소 433 / 바·펍 428 / 마사지 408 — 핸드오프 메모 분포)
   - **저장은 이미 한국어 의미 단위, 사용자 노출만 4축에 압축**되어 있음

### 차별화 손실

CLAUDE.md "한국인 특화" 차별화 축에서 **마사지는 한국인 자유여행 핵심 컨텐츠**(베트남 마사지 가성비). 6 칩 분리 시 즉각 ROI:
- 일정 자동 생성에 마사지 슬롯 자동 삽입 가능 (Part 2 — 본 ADR 범위 외)
- 호텔/숙소 별 카테고리 → booking 모델 후속 ADR과 자연 호환

---

## 결정

### A. `ItemCategory`를 4 → **6**으로 확장

```ts
// lib/types.ts:41 (BEFORE)
export type ItemCategory = "food" | "spot" | "shopping" | "rest";

// AFTER
export type ItemCategory =
  | "food"      // 음식점 (cafe·nightlife 흡수, 기존 동일)
  | "spot"      // 관광 (nature·activity 흡수, 기존 동일)
  | "shopping"  // 쇼핑 (기존 동일)
  | "stay"      // 숙소 (NEW — 호텔·리조트·게스트하우스)
  | "wellness"  // 마사지 (NEW — 스파·뷰티)
  | "rest";     // 휴식 (그 외 — 카페 휴식·공원 산책 등 보존)
```

**rest 보존 이유** (T1 의견): 카테고리 분류 외 "그 외 휴식" 폴백이 필요. 즉시 폐지 시 기존 데이터·BC 충돌. **rest는 의미 좁히기**(stay/wellness 빠진 잔여) — 사용자 칩에서 "기타 휴식"으로 라벨링.

### B. `CATEGORY_OPTIONS` 6칩 + 가로 스크롤

[components/itinerary/add-item-utils.ts:23-28](components/itinerary/add-item-utils.ts#L23-L28):

```ts
export const CATEGORY_OPTIONS: { id: ItemCategory; label: string; icon: string }[] = [
  { id: "food",     label: "음식점",   icon: "restaurant" },
  { id: "spot",     label: "관광",     icon: "photo_camera" },
  { id: "shopping", label: "쇼핑",     icon: "shopping_bag" },
  { id: "stay",     label: "숙소",     icon: "hotel" },        // NEW
  { id: "wellness", label: "마사지",   icon: "spa" },          // NEW
  { id: "rest",     label: "기타 휴식", icon: "park" },        // 라벨 변경 (휴식 → 기타 휴식)
];
```

**`AddItemModal` 칩 컨테이너에 가로 스크롤 강제** (T17 UX 의견 — 5칩 이상 mobile 360px viewport에서 wrap 발생):

```tsx
<div
  className="flex gap-2 overflow-x-auto touch-pan-x overscroll-x-contain scrollbar-none"
  role="radiogroup"
  aria-label="카테고리 선택"
>
  {CATEGORY_OPTIONS.map(...)}
</div>
```

`touch-pan-x` 패턴은 사이클 BB(PR #352, 2026-05-08, 17 곳 일괄)에서 정착. 회귀 가드 패턴 답습.

### C. CategoryBadge·CATEGORY_LABEL·ICON·GRADIENT 6 항목 갱신

**R1 본 판단 (2026-05-14, S-18 self-sign-off)** — Badge tone 충돌 해결:

기존 Badge tone은 `info|amber|danger|success|neutral` 5개. ADR Proposed 단계 제안(`stay→info, wellness→amber`)은 spot·food와 색 충돌. 디자인 토큰 분석 결과 [tailwind.config.ts:21-25](tailwind.config.ts#L21-L25) `accent` (코랄 #F97316) 미사용 발견 → Badge에 신규 tone 1개 추가로 해결.

**최종 색 매핑** (Stitch mockup [`7d310f106e1a41da889c357878c8e781`](https://stitch.withgoogle.com) 시각 검토 통과):

| Category | Tone | 색 (soft / deep) | 아이콘 | 라벨 | 비고 |
|----------|------|-------------------|--------|------|------|
| food | amber | #FFDDB8 / #704500 | restaurant | 음식점 | 변경 없음 |
| spot | info (purple) | #EDE0FF / #5A00C6 | photo_camera | 관광 | 변경 없음 |
| shopping | neutral | #F8FAFC / #64748B | shopping_bag | 쇼핑 | 변경 없음 |
| stay | success | #E1F5EC / #085041 | hotel | 숙소 | NEW (rest의 의미 공유) |
| wellness | **accent (신규 tone)** | #FFDBCA / #9D4300 | spa | 마사지 | NEW (Badge에 tone 1개 추가) |
| rest | success | #E1F5EC / #085041 | bed | 기타 휴식 | 라벨 변경 |

**stay/rest tone 공유 근거**: 의미 인접("쉼") → 6 카테고리 ≠ 6 색이 아닌 5 색 + 의미 그룹 폴딩. 시각 식별은 아이콘(`hotel` vs `bed`)·라벨로 보조. shopping/wellness/food도 amber/accent로 색 인접하지만 의미 직교(쇼핑 vs 마사지 vs 식사) → 라벨로 식별.

**5 동기화 지점 일괄 수정** — 누락 시 typecheck 실패 (Record<ItemCategory, ...> exhaustive):

| 파일 | 위치 | 갱신 |
|------|------|------|
| [components/ui/Badge.tsx:3](components/ui/Badge.tsx#L3) | BadgeTone union | **accent 추가** (5→6) + styles Record에 `accent: "bg-accent-soft text-accent-deep"` |
| [components/itinerary/CategoryBadge.tsx:11-23](components/itinerary/CategoryBadge.tsx#L11-L23) | TONE/LABEL | 위 표 6 항목 |
| [lib/utils/item-display.ts:67-88](lib/utils/item-display.ts#L67-L88) | LABEL/ICON/GRADIENT | 6 항목 |
| [lib/wrap-up/highlight-suggestions.ts:24](lib/wrap-up/highlight-suggestions.ts#L24) | CATEGORY_SUBTITLE | 6 항목 |
| [components/itinerary/add-item-utils.ts:13-21](components/itinerary/add-item-utils.ts#L13-L21) | PLACE_TO_ITEM_CATEGORY | (Part 2 범위 — 본 ADR 무변경, subCategory 기반 재분류는 Part 2) |

### D. `scripts/seed-pipeline/06-export-discover.ts` 강제 매핑 해제 (2곳)

**D-1. 함수 `toDiscoverCategory` (라인 58-64)**:

```ts
// BEFORE (의도적 rest→spot 통합)
if (category === "rest" && (subCategory === "스파/마사지" || subCategory === "뷰티")) return "spot";
if (category === "rest") return "spot";

// AFTER (subCategory 기반 정확 분기)
if (subCategory === "스파/마사지" || subCategory === "뷰티" || subCategory === "마사지") return "wellness";
if (subCategory === "숙소" || subCategory === "리조트" || subCategory === "호텔") return "stay";
if (category === "rest") return "rest"; // 보존 (카페 외 공원·산책 등)
```

**D-2. `CATEGORY_MAP` (라인 50-56)** — 본 ADR 검증 단계 신규 발견:

```ts
// BEFORE
const CATEGORY_MAP: Record<string, string> = {
  "카페": "cafe",
  "food": "food",
  "spot": "spot",
  "shopping": "shopping",
  "rest": "spot", // rest는 discover에서 보여줄 필요 적음, spot으로 매핑
};

// AFTER
const CATEGORY_MAP: Record<string, string> = {
  "카페": "cafe",
  "food": "food",
  "spot": "spot",
  "shopping": "shopping",
  "stay": "stay",       // NEW — 호텔/리조트/게스트하우스
  "wellness": "wellness", // NEW — 스파/마사지/뷰티
  "rest": "rest",       // 변경: spot 강제 매핑 해제 → 본 카테고리 유지
};
```

**중요**: 본 매핑은 **시드 export 시 Discover 화면 분류 결정**. DB 영속화된 ItineraryItem은 D-스크립트(아래 H)로 별도 보정.

### E. PlaceCard subCategory 칩 — `Discover` 카드에 subCategory 작은 칩 표기

(T17 UX 신규 — Stitch mockup 호출 후 확정):
```tsx
<DiscoverCard>
  <CategoryBadge category={place.category} />        {/* 6 칩 메인 */}
  {place.subCategory && (
    <span className="text-xs text-text-muted">{place.subCategory}</span>  {/* 예: "스파/마사지", "리조트" */}
  )}
</DiscoverCard>
```

**위치는 Stitch mockup으로 확정** — 본 ADR 단계에서 Stitch 추가 호출 (mockup id `4681512633268080895`).

### F. `tests/unit/add-item-utils.test.ts:74` 단언 갱신

```ts
// BEFORE
it("4개 ItemCategory 옵션", () => {
  expect(CATEGORY_OPTIONS).toHaveLength(4);
  expect(CATEGORY_OPTIONS.map((o) => o.id)).toEqual([
    "food", "spot", "shopping", "rest",
  ]);
});

// AFTER
it("6개 ItemCategory 옵션 — stay/wellness 추가 (ADR-050)", () => {
  expect(CATEGORY_OPTIONS).toHaveLength(6);
  expect(CATEGORY_OPTIONS.map((o) => o.id)).toEqual([
    "food", "spot", "shopping", "stay", "wellness", "rest",
  ]);
});
```

### G. 신규 회귀 가드 (예정 — 본 ADR 머지 PR에 포함)

`tests/unit/category-six-chips-adr-050.test.ts` (신규, ~30 단언):
1. `ItemCategory` union 6 항목 (typecheck 강제)
2. `CATEGORY_OPTIONS` 길이 6 + 순서 고정
3. `CategoryBadge` 6 카테고리 렌더링 + tone exhaustive
4. `CATEGORY_LABEL`/`ICON`/`GRADIENT` 키 6개 정확
5. `highlightSubtitle(stay)` / `highlightSubtitle(wellness)` 비공백 반환
6. `06-export-discover.ts` 매핑: subCategory 기반 6 분기 정확
7. `discover` 시드에 stay/wellness 카테고리 noempty (마이그레이션 후 검증)
8. `AddItemModal` 칩 컨테이너에 `touch-pan-x` 클래스 (BB 패턴 답습)
9. `CATEGORY_OPTIONS` `id` 모두 `ItemCategory` 타입 호환 (TS narrowing)

### H. 잘못 분류 294건 — 마이그레이션 스크립트 별도

`scripts/migrations/050-recategorize-stay-wellness.ts` (신규, dry-run 우선):

**3단계 흐름** (T14 DB 의견):
1. **Dry-run**: subCategory 기준 main category 미스매치 검출 → CSV 출력 + AuditLog 적재 안 함
2. **Apply**: `--apply` 플래그 시 트랜잭션 내 일괄 update + AuditLog 적재 (`audit-log-system.md` 패턴, source="adr-050-migration")
3. **Verify**: apply 후 cross-check → 미스매치 0 확인

**보정 매핑**:
| subCategory | main category 강제 |
|-------------|---------------------|
| "숙소", "리조트", "호텔", "게스트하우스" | `stay` |
| "스파/마사지", "마사지", "뷰티" | `wellness` |
| 그 외 | 변경 없음 |

**입력 검증**: `subCategory` 빈 값 + main category가 4 잔여인 경우 보정 대상 아님 — skip 카운트 출력.

**AuditLog 적재** (CLAUDE.md 절대 규칙 #4):
```ts
await writeAuditLog({
  source: "adr-050-recategorize",
  entity: "Place",
  entityId: place.id,
  action: "update",
  before: { category: oldCategory, subCategory: place.subCategory },
  after: { category: newCategory, subCategory: place.subCategory },
  reason: "ADR-050 stay/wellness 신설로 인한 재분류",
});
```

**롤백 절차**: AuditLog `source="adr-050-recategorize"` 필터로 before 값 복원 가능.

---

## 다른 옵션 (기각)

### 옵션 (a) — main category 4개 유지 + UI에서만 6칩 노출 (DB ↔ UI 매핑 레이어)
**기각 사유** (R1 CTO 의견 사전 추정 + T14):
- DB 4 ↔ UI 6 분기 매핑이 매 사용처마다 반복 (CategoryBadge·Discover·AddItemModal·MorningBriefing 각각)
- 잘못 분류 294건이 schema 레벨에서 차단되지 않음 — 영구 데이터 부채
- subCategory 의존성이 비공식 → 추후 마이그레이션 시 일관성 보장 어려움

### 옵션 (b) — main category 7개 (stay·wellness·beach·nightlife 등 세분화)
**기각 사유** (T17 UX):
- 5 칩 이상 mobile 360px viewport에서 horizontal scroll 필수, 7+는 사용성 저하
- nightlife/cafe는 이미 `PLACE_TO_ITEM_CATEGORY`에서 food로 흡수되며 현 사용자 모델 적합
- 단계적 확장 — 본 ADR은 6 → 후속 사용자 신호로 7+ 결정

### 옵션 (c-prime) — 호텔을 ItineraryItem에서 빼고 전용 booking 모델 (Part 3)
**별도 ADR-051(예정)로 분리**:
- Part 3 (호텔 booking 분리)는 schema 신규 + booking 흐름 + 가격 비교 OTA 통합 → ADR-050 1 PR 범위 초과
- 본 ADR은 stay 카테고리 신설로 **booking 모델 미존재 시 fallback** 제공 (호텔이 ItineraryItem 노드로도 표현 가능)
- ADR-051은 stay 카테고리를 booking 모델 1 dependency 노드로 변환 (호환 가능)

---

## 영향

### Schema (Prisma)
- `Place.category` 컬럼 enum 가능성 — 현재 `String` (자유). 6 값 valid 강제는 zod·application layer에서 처리. **migration 무**.
- `subCategory` 무변경 (이미 존재).

### 기존 데이터
- `ItineraryItem.category`: 기존 트립 데이터에 stay/wellness 없음 — BC 100%. 새 일정 추가 시부터 적용.
- `Place.category`: 시드 4,324건 중 보정 대상 ~294건 + 강제 매핑 해제로 분류 변경되는 841건 (숙소+마사지). **마이그레이션 스크립트(H) 필수 실행**.

### BC (Backwards Compatibility)
- `ItemCategory` union 확장은 **추가 only**, narrowing 발생 함수 0 (모든 사용처 `Record<ItemCategory, ...>` exhaustive — 누락 시 typecheck error로 즉시 가시화)
- 4 칩 → 6 칩 — 기존 사용자 4 칩 선택 그대로 작동. 새 stay/wellness는 신규 진입점.

### 추천 알고리즘 (Part 2 범위 외 — 본 ADR 무변경)
- `lib/services/itinerary-generator.ts`에 마사지 자동 슬롯 + onboarding VIBES "마사지 좋아함" 추가는 **Part 2** (별도 PR + 별도 ADR 후보)
- 본 ADR은 카테고리 인프라만 — 추천 로직은 후속

### CTO 게이트 (R1)
- 본 ADR은 **schema 변경 무**(application layer만) → S-18 게이트 경량 (자료 R1 self-sign-off 가능 후보)
- 다만 마이그레이션 스크립트(H)는 시드 4,324건 데이터 변경 → R1 dry-run 결과 검토 후 apply 사인오프 필수

---

## PR-ready 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| ADR 초안 | ✅ | 본 문서 |
| Stitch mockup 6칩 | ⏳ | 추가 호출 예정 (`projectId 4681512633268080895`) |
| 변경 컴포넌트·라인 명세 | ✅ | A~F 섹션 |
| 회귀 가드 spec | ✅ | G 섹션 (~30 단언) |
| 마이그레이션 스크립트 명세 | ✅ | H 섹션 (dry-run + apply + AuditLog) |
| 회의 멤버 의견 | ✅ | R1·T1·T17·T14·T8 인라인 |
| BC 검증 | ✅ | 영향 섹션 |
| 후속 ADR 분리 | ✅ | ADR-051 (booking) + Part 2 (추천) |

---

## 후속 작업 (별도 PR/ADR)

| 후속 | 내용 | 우선순위 |
|------|------|----------|
| ADR-051 (예정) | 호텔 → booking 모델 분리 (Part 3) | M (본 ADR 후 사용자 신호 보고 결정) |
| Part 2 (예정) | itinerary-generator 마사지 자동 슬롯 + VIBES "마사지 좋아함" | M |
| 마이그레이션 prod 적용 | 본 ADR 머지 후 staging dry-run → prod apply | H (본 ADR 직후) |

---

## 결정 (R1 CTO 사인오프)

**상태**: ✅ **Accepted** (2026-05-14, R1 self-sign-off, S-18 경량 게이트)

**사인오프 근거** (S-18 자료 패턴 — schema 무변경 시 R1 self-sign-off 가능):
1. ✅ 본 ADR 본문 검토 — A~H 8섹션 PR-ready
2. ✅ Stitch mockup 2개 확보 + 시각 검토 통과 — `AddItemModal` 6 칩 + `Discover 카드` 숙소·마사지 (Stitch 105→107 변동 확인)
3. ✅ Badge tone 충돌 해결안 본 판단 — `accent` 신규 tone 추가 + stay/rest 의미 그룹 폴딩
4. ✅ CATEGORY_MAP 신규 발견 추가 보정 (D-2)
5. ⏳ 마이그레이션 스크립트 dry-run 결과 검토 — **마이그레이션 PR 단계에서 R1 별도 사인오프** (시드 4,324건 변경, apply 분리)
6. ⏳ 회귀 가드 ~30 단언 신규 — 구현 PR 단계

**PR 분리 결정** (2026-05-14 본 판단): 3 PR → **2 PR로 통합** — ADR docs (단독) + 구현·마이그레이션 dry-run 스크립트 (통합). 마이그레이션 **apply** 실행은 PR 머지 후 R1 별도 사인오프. 근거: 구현 + 마이그레이션 dry-run 스크립트는 의존 무관 + 회귀 가드는 두 영역을 함께 커버.
