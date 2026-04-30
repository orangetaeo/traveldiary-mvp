# Stitch ↔ 코드 매핑

> **목적**: Google Stitch에서 만든 TravelDiary Design System의 22개 화면과 현재 코드(`app/`)를 1:1 매핑하고, 디자인 토큰 갭과 신규 페이지 로드맵을 정리합니다.
> **작성**: 2026-04-30 · 사이클 5b 준비 단계 · 옵션 A (인벤토리 + 매핑 표만, 코드 변경 0)
> **다음 단계**: 옵션 B (디자인 토큰 정렬) → 옵션 C (시범 화면 풀 매핑)

---

## 1. 프로젝트 메타

| 항목 | 값 |
|------|-----|
| Stitch 프로젝트 URL | `https://stitch.withgoogle.com/projects/4681512633268080895` |
| Project ID | `4681512633268080895` |
| Project Title | TravelDiary Design System |
| Design System Asset ID | `22b3a1ef1bbc4710920093cefbd8196c` |
| Design System Name | TravelDiary Narrative |
| Device Type | MOBILE (390 × 932 기준) |
| Visibility | PRIVATE (소유자: bizcomhome@gmail.com) |
| Origin | STITCH (TEXT_TO_UI_PRO) |
| MCP 도구 prefix | `mcp__stitch__*` |

### 디자인 시스템 토큰 (요약)

| 카테고리 | 값 |
|----------|-----|
| Primary (Purple — 계획·AI 추천) | `#7C3AED` |
| Secondary (Coral — On-trip Live) | `#F97316` |
| Tertiary (Amber — 사회적 증거) | `#F59E0B` |
| Neutral / Ink | `#0F172A` |
| Surface 베이스 | `#F8FAFC` (slate) |
| 본문 폰트 | Pretendard Variable, Inter |
| Roundness | ROUND_FOUR (`0.25rem` 기본, `0.5rem` 카드/시트) |
| Spacing 단계 | xs:4 / sm:8 / md:12 / lg:16 / xl:24 (px) |
| Typography 토큰 | title(22) · card-title(18) · body(14) · meta(12) · caption(11) |

> 자세한 설계 철학은 Stitch `designMd` 또는 `mcp__stitch__list_design_systems` 호출 결과 참조.

---

## 2. 화면 인벤토리 (22개)

> 한국어 최종본 = `Pretendard` 접미사 — **이게 정답이고**, 영어 버전은 영문 디자인 참고용.

### 2.1 Design System

| # | screenId | title | size | 비고 |
|---|----------|-------|------|------|
| 1 | `4a53c735147e4d7ab77fe40e4ba29f83` | Design System Documentation | 390×3774 | 컬러·타이포·컴포넌트 카탈로그 |

### 2.2 Home (5종 — Pre/On-trip × variant)

| # | screenId | title | size | M# | 정답? |
|---|----------|-------|------|----|------|
| 2 | `7cf7f50eb72c479c932e237f53f0660d` | Home (Pre-trip) | 390×2438 | — | 영문 |
| 3 | `626e5350f3cc4f02a943486193eebd6b` | Home (Pre-trip) - Pretendard | 390×1922 | — | ✅ |
| 4 | `98e84673940741a7951c4aed6b63ef35` | Home (On-trip) - Magic Moment M2 | 390×2832 | M2 | 영문 |
| 5 | `559587d8308441d199a620d0af27e19c` | Home (On-trip) - Pretendard | 390×2832 | M2 | ✅ |
| 6 | `8aa85fb6e3eb4a2494661a5ee19cfbc5` | On-trip Home (City Strip) | 390×1768 | M2+M5 | M5 컴포넌트 입력 |

### 2.3 Itinerary (2종)

| # | screenId | title | size | 비고 |
|---|----------|-------|------|------|
| 7 | `efa93174768e4fe588bff68d57fab330` | Itinerary Home | 390×1922 | Pre-trip |
| 8 | `5beff0fc64fb455aa3a0a2b2d735f3d1` | Itinerary (On-trip) | 390×1768 | On-trip variant |

### 2.4 Place / Item Detail (4종 — M1 / M8 분기)

| # | screenId | title | size | M# | 정답? |
|---|----------|-------|------|----|------|
| 9 | `14215a0f6a68497cb2bd4db33ed40eef` | Place Detail & Evidence | 390×1864 | M1 | ✅ (M1 기준) |
| 10 | `e6fed503f23f440e9ee4bb70e439e6f1` | Item Detail (Magic Moment) | 390×1796 | M1 | 영문 |
| 11 | `128c4b1eea194bd4bd13b75c1ba500e4` | Item Detail - Pretendard | 390×1796 | M1 | ✅ |
| 12 | `3e72ee44ffaf4a7fa46576357648790e` | Item Detail (OTA Comparison) | 390×1848 | M8 | ✅ (M8 기준) |

### 2.5 Live Replan Modal (2종 — M3)

| # | screenId | title | size | M# | 정답? |
|---|----------|-------|------|----|------|
| 13 | `7ea42001e4a1436084b96a5dbcb8c991` | Live Replan Modal (Magic Moment M3) | 390×1768 | M3 | 영문 |
| 14 | `66a10354826a42cbb537d440e4c2e39f` | Live Replan Modal - Pretendard | 390×1768 | M3 | ✅ |

> ⚠️ **이건 페이지가 아니라 모달 컴포넌트**. `/itinerary/[id]` 또는 `/travel/[id]` 안에서 띄움.

### 2.6 Camera Translator (4종 — M4 · 2-step)

| # | screenId | title | size | step | 정답? |
|---|----------|-------|------|------|------|
| 15 | `35e571d36b1e479da07962d797c425bc` | Camera Translator - Capturing | 390×1880 | 1 | 영문 |
| 16 | `04b273c76fc942019664a2f42160bb5e` | Camera Translator - Capturing (Pretendard) | 390×1880 | 1 | ✅ |
| 17 | `e09af6f8beee4b4ebc1f9d6d2f5e96dd` | Camera Translator - Results | 390×1926 | 2 | 영문 |
| 18 | `ff1d45a999a84cd590a4dfbc1380e720` | Camera Translator - Results (Pretendard) | 390×1926 | 2 | ✅ |

### 2.7 City (3종 — M5 신규)

| # | screenId | title | size | M# | 비고 |
|---|----------|-------|------|----|------|
| 19 | `0d9bc0376b144acd9af96bfe609c0d63` | City Context Strip (On-trip) | 390×1896 | M5 | `/travel/[id]` 푸터 컴포넌트 |
| 20 | `287ff902a0f34684969746e04bf5df45` | City Guide (Phu Quoc) | 390×4080 | M5 | 신규 페이지 (사이클 8) |
| 21 | `00252c59031c4b5392bf10d3e95bffd8` | City Guide (Phu Quoc) — full | 390×4854 | M5 | 풀 콘텐츠 버전 |

### 2.8 Share & Collaborate (1종 — M7 신규)

| # | screenId | title | size | M# | 비고 |
|---|----------|-------|------|----|------|
| 22 | `bddfc20ffc854770b10c382ab6ac14ac` | Share & Collaborate (Magic Moment M7) | 390×2810 | M7 | 신규 페이지 (사이클 11) |

---

## 3. 코드 ↔ Stitch 매핑

### 3.1 페이지 매핑 (1:1 또는 1:N)

| 코드 페이지 | Stitch 화면 (정답 한국어) | M# | 사이클 | variant 분기 |
|------------|--------------------------|----|-------|------------|
| [app/page.tsx](../app/page.tsx) | #3 Home (Pre-trip) - Pretendard ✅ | — | 5b | 적용 완료 (2026-04-30) |
| [app/onboarding/page.tsx](../app/onboarding/page.tsx) | (Stitch에 없음) | — | — | Stitch 신규 설계 필요 |
| [app/itinerary/creating/page.tsx](../app/itinerary/creating/page.tsx) | (Stitch에 없음) | — | — | 로딩 화면 — Stitch 신규 설계 필요 |
| [app/itinerary/[id]/page.tsx](../app/itinerary/[id]/page.tsx) | #7 Itinerary Home / #8 Itinerary (On-trip) ✅ | — | 5b | data-travel-mode로 자동 색 swap (2026-04-30) |
| [app/itinerary/[id]/item/[itemId]/page.tsx](../app/itinerary/[id]/item/[itemId]/page.tsx) | #9 Place Detail & Evidence + #11 Item Detail Pretendard ✅ | M1 | 5b | 통합 적용 (2026-04-30). M8 OTA는 사이클 12 |
| [app/travel/[id]/page.tsx](../app/travel/[id]/page.tsx) | #5 Home (On-trip) - Pretendard ✅ | M2 | 5b | 적용 완료 (2026-04-30). City Strip은 사이클 8 |
| [app/translate/page.tsx](../app/translate/page.tsx) | #16 Capturing-Pretendard → #18 Results-Pretendard ✅ | M4 | 5b | 2-step useState 분기 (2026-04-30) |

### 3.2 신규 페이지 (Stitch 청사진 → 코드 백지)

| 신규 라우트 | Stitch 화면 | M# | 사이클 |
|------------|-------------|----|-------|
| `app/city/[slug]/page.tsx` | #20 또는 #21 City Guide (Phu Quoc) | M5 | **8** |
| `app/share/[id]/page.tsx` | #22 Share & Collaborate | M7 | **11** |

### 3.3 신규 컴포넌트 (페이지 아님)

| 컴포넌트 (제안 경로) | Stitch 화면 | 사용처 | 사이클 |
|--------------------|-------------|--------|-------|
| `components/itinerary/ReplanModal.tsx` ✅ | #14 Live Replan Modal - Pretendard | `/itinerary/[id]`, `/travel/[id]` | Stitch 디자인 적용 (2026-04-30). M3 mutation은 사이클 5b |
| `components/city/CityContextStrip.tsx` | #19 City Context Strip (On-trip) | `/travel/[id]` 푸터 | **8** |

---

## 4. 디자인 토큰 갭 (옵션 B 입력)

> 현재 코드: [tailwind.config.ts](../tailwind.config.ts) + [app/globals.css](../app/globals.css)

### 4.1 컬러 충돌

| 토큰 | 현재 코드 | Stitch | 차이 |
|------|----------|--------|------|
| Primary (Purple) | `#5B4BC4` (어두운 보라) | `#7C3AED` (밝은 보라) | 색조 다름 — Stitch 쪽이 더 활기 |
| Accent (Coral) | `#FF6B47` | `#F97316` | 약간 다름 — Stitch가 약간 어두움 |
| Amber | `#C97A1F` (캐러멜) | `#F59E0B` (밝은 호박) | 명도 차이 큼 |
| Ink (Neutral) | `#1A1F26` | `#0F172A` (slate-900) | 살짝 다름 |
| Ink-soft | `#5A6270` | `#64748B` (slate-500) | 미세 차이 |
| Surface | `#F4F1EB` (베이지) | `#F8FAFC` (slate-50) | **베이지 ↔ 슬레이트, 정체성 결정 필요** |
| Danger | `#C73F3F` | `#BA1A1A` (Material) | 미세 차이 |

### 4.2 누락 토큰 (코드에 없음)

| 토큰 | Stitch 값 | 비고 |
|------|----------|------|
| Typography `title` | Pretendard 22/500/28 | h1·페이지 제목 |
| Typography `card-title` | Pretendard 18/500/24 | 카드 헤더 |
| Typography `body` | Pretendard 14/400/20 | 본문 |
| Typography `meta` | Pretendard 12/400/16 | 메타·증거 |
| Typography `caption` | Pretendard 11/400/14 (letter-spacing 0.02em) | 캡션 |
| Spacing `xs/sm/md/lg/xl` | 4/8/12/16/24 | Tailwind 기본값과 다름 — 별도 명명 필요 |
| Surface containers (`-low/-high/-highest`) | 5단계 | 카드 깊이 표현 |
| Outline / Outline-variant | `#7B7487` / `#CCC3D8` | 카드 테두리 |

### 4.3 일치하는 토큰 (변경 불필요)

| 토큰 | 값 | 비고 |
|------|----|------|
| 본문 폰트 | Pretendard | ✅ globals.css 일치 |
| Roundness 기본 | 0.25rem (md/lg는 8/12 vs Stitch 6/8 — 미세 차이) | ⚠️ 살짝 다름 |
| 모드 전환 패턴 | `data-travel-mode` 속성 (S-04 / ADR-014) | ✅ Stitch가 가지지 않은 코드 자산 |

### 4.4 옵션 B에서 결정해야 할 것

1. **Surface 베이지 ↔ 슬레이트** — 가장 큰 정체성 차이. `#F4F1EB`(따뜻한 종이) vs `#F8FAFC`(차가운 디지털) 중 하나.
2. **Purple 헥스** — `#5B4BC4` vs `#7C3AED`. Stitch 쪽이 표준 Tailwind `violet-600`.
3. **Typography 5단** — Tailwind `theme.extend.fontSize`에 등록할지, CSS `@layer base` 클래스로 둘지.
4. **Spacing 명명 충돌** — Tailwind 기본 `spacing.4 = 1rem(16px)`이라 `lg = 16px`와 맞음. xs/sm/md 명명을 별도 토큰으로 둬야 충돌 없음.

---

## 5. 신규 페이지 로드맵

| 사이클 | 매직 모먼트 | 신규 라우트/컴포넌트 | Stitch 입력 |
|-------|-----------|---------------------|------------|
| 사이클 5b | M2/M3/M4 정식 (DB·외부 API) | (기존 페이지 mutation 추가) | #5, #11, #14, #16, #18 |
| **사이클 8** | **M5 응급/실용/도시 컨텍스트** | `app/city/[slug]/page.tsx` + `components/city/CityContextStrip.tsx` | **#19, #20, #21** |
| 사이클 9 | M6 D-Day 체크리스트 + 비용 관리 | `app/checklist/page.tsx`, `app/cost/page.tsx` | (Stitch 미설계 — 사이클 9 시작 전 추가 필요) |
| **사이클 11** | **M7 공유 + 동기화 키 협업** | `app/share/[id]/page.tsx` | **#22** |
| **사이클 12** | **M8 OTA 가격 비교 (수익 모델)** | `app/itinerary/[id]/item/[itemId]/page.tsx` 확장 | **#12** |

---

## 6. MCP 도구 사용 cheat sheet

| 작업 | MCP 호출 | 인자 |
|------|---------|------|
| 화면 목록 조회 | `mcp__stitch__list_screens` | `projectId: "4681512633268080895"` |
| 화면 상세 (HTML 다운로드) | `mcp__stitch__get_screen` | `name: "projects/4681512633268080895/screens/{screenId}"` |
| 디자인 시스템 조회 | `mcp__stitch__list_design_systems` | `projectId: "4681512633268080895"` |
| 화면에 디자인 시스템 적용 | `mcp__stitch__apply_design_system` | `assetId: "22b3a1ef1bbc4710920093cefbd8196c"` |
| 텍스트로 신규 화면 생성 | `mcp__stitch__generate_screen_from_text` | (사이클 9 체크리스트/비용 화면용) |
| 화면 변형 생성 | `mcp__stitch__generate_variants` | A/B 디자인 비교 시 |

> 옵션 C 진입 시 `get_screen`의 `htmlCode.downloadUrl`을 받아 `WebFetch`로 다운로드 → React/Tailwind로 변환.

---

## 변경 이력

| 일자 | 사이클 | 변경 |
|------|-------|------|
| 2026-04-30 | 5b 준비 | 최초 작성 (옵션 A) — Stitch 22개 화면 인벤토리 + 코드 매핑 + 토큰 갭 |
| 2026-04-30 | 5b | 옵션 B 완료 — 디자인 토큰 정렬 (lib/design-tokens.ts, tailwind.config.ts, globals.css 등) |
| 2026-04-30 | 5b | 옵션 C #1 Home (Pre-trip) 적용 — app/page.tsx Stitch 디자인 변환, Material Symbols CDN 추가 |
| 2026-04-30 | 5b | 옵션 C #2~#10 일괄 적용 — Item Detail / Itinerary / Travel On-trip / Translate 2-step / Replan Modal. Stitch 22개 중 11개 한국어 정답 화면이 모두 코드에 매핑 (#7 OTA, #11 Share는 사이클 12/11 보류) |
