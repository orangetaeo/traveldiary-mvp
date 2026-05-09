# Stitch ↔ 코드 매핑

> **목적**: Google Stitch에서 만든 TravelDiary Design System의 65개 화면과 현재 코드(`app/`)를 1:1 매핑하고, 디자인 토큰 갭과 신규 페이지 로드맵을 정리합니다.
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

### 2.9 Admin (6종 — Phase 7 세션 C)

| # | screenId | title | size | 비고 |
|---|----------|-------|------|------|
| 23 | `f11edd83c0534c1fb0a29cac262ea2d0` | Admin Main Dashboard | 780×2258 | ✅ 정답 |
| 24 | `09f5f91339754692bf1cc1c84493d085` | Admin Onboarding Funnel Analysis | 780×2600 | ✅ 정답 |
| 25 | `64c99f14051a4bd8b751f2a8669e9b24` | Admin M2 Skip Reasons | 780×2448 | ✅ 정답 |
| 26 | `8071e0472dbb407f951b9f37ff638378` | Admin Invite Code Management | 780×2242 | ✅ 정답 |
| 27 | `be06128b10b44e768208d1559fbdd543` | Admin A/B Testing Dashboard | 780×2244 | ✅ 정답 |
| 28 | `b6b53fe497e8491d9c7c30676aea02e5` | Admin Affiliate Tracking (M8) | 780×2986 | ✅ 정답 |

### 2.10 Permission (2종 — Phase 7 세션 C)

| # | screenId | title | size | 비고 |
|---|----------|-------|------|------|
| 29 | `be02d344ea0d41e1a62295980785b548` | Location Permission Request | 780×1768 | ✅ 정답 |
| 30 | `21c8027a5f0a4fda8bfb9794d58126ac` | Permission Request — 알림 (Notification) | 780×2172 | ✅ 정답 |

### 2.11 Settings (1종 — Phase 7 세션 C)

| # | screenId | title | size | 비고 |
|---|----------|-------|------|------|
| 31 | `d15ebd366d5e4b068a6ba3c6818357fc` | Settings Page — 설정 | 780×2842 | ✅ 정답 |

### 2.12 Trip Wrap-up (1종 — Phase 7 세션 C)

| # | screenId | title | size | 비고 |
|---|----------|-------|------|------|
| 32 | `154333c2456640819976e9279cc0e8f0` | Trip Wrap-up — 여행 마무리 (Pretendard) | 780×3034 | ✅ 정답 |

### 2.13 Booking (1종 — Phase 7 세션 C)

| # | screenId | title | size | 비고 |
|---|----------|-------|------|------|
| 33 | `e1a59aa5ba2d4033b4c9a05433361daf` | Booking Confirmation — 예약 완료 (Klook) | 780×2728 | ✅ 정답 |

### 2.14 Camera Extension (1종 — Phase 7 세션 C)

| # | screenId | title | size | M# | 비고 |
|---|----------|-------|------|----|------|
| 34 | `ad305e925eeb4056a16fb056f3f1db2e` | Camera Translation — Allergen Alert (M4) | 780×1864 | M4 | 알레르기 매칭 강조 변형 |

### 2.15 OTA Interstitial (1종 — Phase 7 세션 C)

| # | screenId | title | size | M# | 비고 |
|---|----------|-------|------|----|------|
| 35 | `904155d409d0425680539808c160df06` | OTA Affiliate Interstitial — 외부 이동 안내 | 780×1864 | M8 | 모달/Interstitial |

### 2.16 Live Replan Conflict (1종 — Phase 7 세션 C)

| # | screenId | title | size | M# | 비고 |
|---|----------|-------|------|----|------|
| 36 | `196f55b628d142989234edb8fb0ce602` | Live Replan Conflict — 충돌 해소 가이드 | 780×1768 | M3 | ReplanModal 확장 |

### 2.17 Session A 리스타일링 (10종 — Phase 7 세션 A)

| # | screenId | title | size | 비고 |
|---|----------|-------|------|------|
| 37 | `e6ec700d62464e6d8cc64abd44c48545` | Onboarding (Pretendard) — 4-step wizard | 780×7072 | ✅ |
| 38 | `9b8f828c46854596937f351f30dc6ba0` | Profile / My Page (BLOCKER 2) | 780×2008 | ✅ |
| 39 | `a184a5fba935488d9d2bb21ea47fbdea` | Trips — Listing Hub (Pretendard) | 780×4232 | ✅ |
| 40 | `cf0e42c1fe264da3941b69f645f078a8` | Shared Trips — 받은 여행 목록 (Pretendard) | 780×3504 | ✅ |
| 41 | `0d4d9885abb24a45ad6c86524473c8f1` | 여행 준비물 체크리스트 (D-Day Checklist) | 780×2200 | ✅ |
| 42 | `7cfe30457ce643c59fd522ccc3dfd83c` | Travel Cost & Settlement | 780×2190 | ✅ |
| 43 | `67bcb02240a642e685b5ec677da3b828` | Vote — 일행 투표 (Pretendard) | 780×2092 | ✅ |
| 44 | `37b82488387f47fcad912c939af88056` | Vietnam Travel Guide Index (Pretendard) | 780×3132 | ✅ |
| 45 | `c628b086ed0744e6bd7f6e2304345c67` | City Emergency (Pretendard) | 780×2762 | ✅ |
| 46 | `80b23ee177b548f28eb2cd38ab5377a2` | Itinerary Creating (Pretendard) | 780×1768 | ✅ |

### 2.18 Session B 컴포넌트 (6종 — Phase 7 세션 B)

| # | screenId | title | size | 비고 |
|---|----------|-------|------|------|
| 47 | `a66c84466c91426d8833d271e5fa6459` | Toast / Snackbar Notification Variants | 780×2310 | 컴포넌트 spec |
| 48 | `9ea27f2d0ef84ec8852527b8933f57ed` | TravelDiary Empty States (4-up) | 780×5840 | 컴포넌트 spec |
| 49 | `722acf9e5dbb44ce98900330f5309738` | Error & Exception States (3-up) | 780×4928 | 컴포넌트 spec |
| 50 | `9c891984bcfd4c51a6f0bb2913784d37` | EvidencePanel (M1) — 왜 이걸 골랐나 | 780×2298 | 컴포넌트 spec |
| 51 | `3d3e1a364719434f8a0e8d0459a689ae` | Allergen Filter Chips Component Spec | 814×1928 | 컴포넌트 spec |
| 52 | `3ab6bad319854d6483bc148cd01bb0fc` | ImpactDisplay Component Spec | 780×3184 | 컴포넌트 spec |

### 2.19 기타 (세션 공통 참조)

| # | screenId | title | size | 비고 |
|---|----------|-------|------|------|
| 53 | `e8139bbb1c384e51a509583aaeb7313d` | 카카오 로그인 환영 | 908×1938 | 세션 A (Kakao OAuth) |
| 54 | `2aa52adec90742b5a19a3f39328d450e` | AI Generation Loading State | 780×1768 | 세션 A (M1 로딩) |
| 55 | `d3791575a14e46c3a8d42cddb1f69604` | Profile — My Page (Comparison) | 780×3504 | 비교용 |

### 2.20 Mode Transition User UX (2종 — 사이클 1, 2026-05-06, G5/G6)

| # | screenId | title | size | M# | 비고 |
|---|----------|-------|------|----|------|
| 56 | `b199aee93287416badee4d9086dd29b2` | Mode Transition Welcome (Pretendard) — D-Day 전환 환영 | 390×1768 | M2 | G5 — 자동 전환 후 1회 표시 (LocalStorage) |
| 57 | `66261b1482b94e7ca850f697c9c57b3c` | Mode Transition Skip Reason (Pretendard) — 모드 전환 거부 사유 | 390×1768 | M2 | G6 — 사용자 명시 거부 sheet (5 옵션 + textarea 200자) |

### 2.21 디자인 갭 해소 8종 (Phase 7 세션 D — 2026-05-09)

| # | screenId | title | size | 코드 매핑 | 비고 |
|---|----------|-------|------|----------|------|
| 58 | `69072b18fdee436296f72acdd19d831f` | Morning Briefing — 모닝 브리핑 (Pretendard) | 390×1768 | `/morning/[tripId]` | On-trip 아침 요약 |
| 59 | `c389873963894d0c819c40692eea88bc` | 영수증 OCR 스캔 — Receipt Scan Viewfinder | 390×884 | `/cost/[tripId]/scan` | Claude Vision OCR 2-step |
| 60 | `0d86bb66696a4d499a7bccc8baa7d48a` | 여행 사진 앨범 (Photo Album) | 390×1360 | `/wrap-up/[tripId]/album` | 날짜별 masonry grid |
| 61 | `d87c21e056f8409685c3b47ccebbd52f` | 여행 추억 리캡 (Trip Recap) | 390×1536 | `/wrap-up/[tripId]/recap` | AI 여행 요약 + 통계 |
| 62 | `dbfac85529d74ac997b65f4db5c2dae4` | 장소 탐색 — Place Discovery | 390×1234 | `/itinerary/[id]/discover` | 카테고리별 AI 추천 장소 |
| 63 | `17359fce0da14b51a0cf0d5120a50e87` | Day 2 동선 지도 스크린 | 390×884 | `/itinerary/[id]/map` | 일일 동선 + 타임라인 |
| 64 | `8f5cc70b921542f79d7db084e224a8f2` | 베트남어 핵심 문장 — Essential Phrases | 390×1616 | `/phrases` | 14문장 카테고리별 + TTS |
| 65 | `070783079d6f4e75b183f21a3f141b26` | 로그인 및 환영 — Login Welcome | 390×884 | `/login` | 카카오 OAuth + 게스트 진입 |

---

## 3. 코드 ↔ Stitch 매핑

### 3.1 페이지 매핑 (1:1 또는 1:N)

| 코드 페이지 | Stitch 화면 (정답 한국어) | M# | 사이클 | variant 분기 |
|------------|--------------------------|----|-------|------------|
| [app/page.tsx](../app/page.tsx) | #3 Home (Pre-trip) - Pretendard ✅ | — | 5b | 적용 완료 (2026-04-30) |
| [app/morning/[tripId]/page.tsx](../app/morning/[tripId]/page.tsx) | #58 Morning Briefing — 모닝 브리핑 ✅ | M2 | 세션 D | On-trip 아침 요약 (2026-05-09) |
| [app/cost/[tripId]/scan/page.tsx](../app/cost/[tripId]/scan/page.tsx) | #59 영수증 OCR 스캔 ✅ | M6 | 세션 D | Claude Vision 2-step (2026-05-09) |
| [app/wrap-up/[tripId]/album/page.tsx](../app/wrap-up/[tripId]/album/page.tsx) | #60 여행 사진 앨범 ✅ | — | 세션 D | 날짜별 masonry grid (2026-05-09) |
| [app/wrap-up/[tripId]/recap/page.tsx](../app/wrap-up/[tripId]/recap/page.tsx) | #61 여행 추억 리캡 ✅ | — | 세션 D | AI 여행 요약 (2026-05-09) |
| [app/itinerary/[id]/discover/page.tsx](../app/itinerary/[id]/discover/page.tsx) | #62 장소 탐색 ✅ | — | 세션 D | 카테고리별 AI 추천 (2026-05-09) |
| [app/itinerary/[id]/map/page.tsx](../app/itinerary/[id]/map/page.tsx) | #63 동선 지도 ✅ | — | 세션 D | 일일 동선 타임라인 (2026-05-09) |
| [app/phrases/page.tsx](../app/phrases/page.tsx) | #64 베트남어 핵심 문장 ✅ | M4 | 세션 D | 14문장 + TTS (2026-05-09) |
| [app/login/page.tsx](../app/login/page.tsx) | #65 로그인 환영 ✅ | — | 세션 D | 카카오 OAuth (2026-05-09) |
| [app/onboarding/page.tsx](../app/onboarding/page.tsx) | #37 Onboarding (Pretendard) ✅ | — | 세션 A | 4-step wizard |
| [app/itinerary/creating/page.tsx](../app/itinerary/creating/page.tsx) | #46 Itinerary Creating (Pretendard) ✅ | — | 세션 A | 로딩 화면 |
| [app/itinerary/[id]/page.tsx](../app/itinerary/[id]/page.tsx) | #7 Itinerary Home / #8 Itinerary (On-trip) ✅ | — | 5b | data-travel-mode로 자동 색 swap (2026-04-30) |
| [app/itinerary/[id]/item/[itemId]/page.tsx](../app/itinerary/[id]/item/[itemId]/page.tsx) | #9 Place Detail & Evidence + #11 Item Detail Pretendard ✅ | M1 | 5b | 통합 적용 (2026-04-30). M8 OTA는 사이클 12 |
| [app/travel/[id]/page.tsx](../app/travel/[id]/page.tsx) | #5 Home (On-trip) - Pretendard ✅ | M2 | 5b | 적용 완료 (2026-04-30). City Strip은 사이클 8 |
| [app/translate/page.tsx](../app/translate/page.tsx) | #16 Capturing-Pretendard → #18 Results-Pretendard ✅ | M4 | 5b | 2-step useState 분기 (2026-04-30) |

### 3.2 신규 페이지 (Stitch 청사진 → 코드 백지)

| 신규 라우트 | Stitch 화면 | M# | 사이클 |
|------------|-------------|----|-------|
| `app/city/[slug]/page.tsx` | #20 또는 #21 City Guide (Phu Quoc) | M5 | **8** |
| `app/share/[id]/page.tsx` | #22 Share & Collaborate | M7 | **11** |
| `app/wrap-up/[tripId]/page.tsx` | #32 Trip Wrap-up (Pretendard) | M2 | **Phase 7** |
| `app/permission/location/page.tsx` | #29 Location Permission Request | — | **Phase 7** |
| `app/permission/notification/page.tsx` | #30 Permission Notification | — | **Phase 7** |
| `app/settings/page.tsx` | #31 Settings Page — 설정 | — | **Phase 7** |
| `app/booking/[bookingId]/page.tsx` | #33 Booking Confirmation (Klook) | M8 | **Phase 7** |

### 3.2b Admin 페이지 (기존 코드 → 디자인 적용)

| 코드 페이지 | Stitch 화면 | 사이클 | 상태 |
|------------|------------|-------|------|
| `app/admin/page.tsx` | #23 Admin Main Dashboard | Phase 7 | ⬜ |
| `app/admin/funnel/page.tsx` | #24 Admin Onboarding Funnel | Phase 7 | ⬜ |
| `app/admin/affiliate/page.tsx` | #28 Admin Affiliate Tracking | Phase 7 | ⬜ |
| `app/admin/m2-skip-reasons/page.tsx` | #25 Admin M2 Skip Reasons | Phase 7 | ⬜ |
| `app/admin/invite/page.tsx` | #26 Admin Invite Code Management | Phase 7 | ⬜ |
| `app/admin/ab/page.tsx` | #27 Admin A/B Testing Dashboard | Phase 7 | ⬜ |

### 3.3 신규 컴포넌트 (페이지 아님)

| 컴포넌트 (제안 경로) | Stitch 화면 | 사용처 | 사이클 |
|--------------------|-------------|--------|-------|
| `components/itinerary/ReplanModal.tsx` ✅ | #14 Live Replan Modal - Pretendard | `/itinerary/[id]`, `/travel/[id]` | Stitch 디자인 적용 (2026-04-30). M3 mutation은 사이클 5b |
| `components/city/CityContextStrip.tsx` | #19 City Context Strip (On-trip) | `/travel/[id]` 푸터 | **8** |
| `components/travel/ModeTransitionWelcome.tsx` ✅ | #56 Mode Transition Welcome | `/travel/[id]` (TravelHome 통합) | **1 (2026-05-06)** |
| `components/travel/ModeTransitionSkipSheet.tsx` ✅ | #57 Mode Transition Skip Reason | `/travel/[id]` (Welcome 거부 시) | **1 (2026-05-06)** |

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
| 2026-05-05 | Phase 7 | 화면 인벤토리 22→55개 확장. Admin 6 + Permission 2 + Settings 1 + Wrap-up 1 + Booking 1 + Extension 3 + Session A 10 + Session B 6 + 기타 3. 3 세션 병렬 매핑. |
| 2026-05-06 | 사이클 1 (G5/G6) | Mode Transition User UX 2종 추가 (#56 Welcome + #57 Skip Reason). 사용자 흐름 갭 10 중 1번 해소. ModeTransitionWelcome + ModeTransitionSkipSheet 컴포넌트 + ModeTransitionSkipReason enum +3 (user_postponed_for_now / user_confused_ui / user_other) + userNote 화이트리스트 (200자, ADR-017 §C 답습). |
| 2026-05-09 | Phase 7 세션 B | Session B 컴포넌트 6종 Stitch 정합 검증 완료. Toast(#47)·EmptyState(#48)·ErrorState(#49)·EvidencePanel(#50) 이미 정합. FilterChip(#51) icon prop + Stitch 색상 정렬. ImpactDisplay(#52) danger 4톤 + 헤더·compact·CTA 변형 추가. |
| 2026-05-09 | Phase 7 세션 D | 디자인 갭 해소 8종 신규 생성 (#58~#65). Morning Briefing / Receipt Scan / Photo Album / Trip Recap / Place Discovery / Day Route Map / Phrases / Login. TravelDiary Narrative 디자인 시스템 적용 완료. 총 화면 수 57→65개. |
