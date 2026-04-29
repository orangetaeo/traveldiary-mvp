---
id: ADR-015
title: 사이클 4 카메라 번역 — 정적 베트남어 메뉴 시드 (외부 API 미호출)
status: Accepted
date: 2026-04-29
decider: R1 CTO
proposer: T6 Translation Specialist + T16 Security
---

# ADR-015: 사이클 4 카메라 번역 — 정적 메뉴 시드

## 컨텍스트

S-07 OCR Translation은 Google Vision + Claude API를 전제로 작성되어 있다. 사이클 4에 이를 도입하려면:
- 신규 의존성: `@google-cloud/vision`, `@anthropic-ai/sdk`
- 환경 변수 + Privacy 정책(이미지 업로드 동의) 추가
- 사이클 5 Railway 배포·Geolocation·DB와 결합되어야 자연스러움

ADR-009/010/012/014 정신("사이클별 작은 단위, 시연 가능")을 유지하려면 외부 API는 사이클 5로 묶는 게 합리적.

## 결정

1. **사이클 4는 정적 베트남어 메뉴 시드로 시연**한다 — 즈엉동 야시장 시푸드 식당 메뉴 10개 항목.
2. 각 항목은 `original`(베트남어) · `phonetic`(한국어 발음) · `translated`(한국어 번역) · `culturalNote`(문맥) · `ingredients`(재료) · `allergens`(표준 카테고리)를 정적으로 보유.
3. **알레르기 매칭은 순수 함수**(`lib/allergens.ts`) — 다국어 키워드(한·베·영) 사전 기반.
4. UI는 `/translate` 라우트 신설. /travel/[id]의 FAB 카메라 버튼 활성화 → `/translate?trip=<id>`.
5. "사진 업로드" 입력은 사이클 5에서. 사이클 4엔 "예시 메뉴 보기" 단일 액션.
6. 알레르기 토글은 화면 상단 칩 (새우·갑각류·땅콩·우유·계란·돼지고기·비건). 온보딩 데이터 연결은 사이클 5(상태 영속화)에서.

## 대안

### A — Google Vision + Claude 즉시 도입 (비채택)
- 단점: 의존성 2개·환경변수·Privacy ADR + 사이클 4 독립 검증 어려움.

### B — Tesseract.js 클라이언트 OCR만 도입 (비채택)
- 단점: 라이브러리 크기(~10MB) + 정확도 ↓ + 사이클 5에서 어차피 Vision으로 swap.

### C — 사이클 4를 사이클 5와 묶음 (비채택)
- 단점: 매직 모먼트 4개를 하나의 사이클에 — 검증 부실.

## 영향

### 긍정
- 의존성 0 추가 유지.
- 한국어 특화 알레르기 매칭(S-08)을 외부 API 노이즈 없이 검증.
- 베트남어 메뉴 시드는 **푸꾸옥 시드 데이터셋의 일부로 영구 보존** — 사이클 5에서 OCR 결과 검증용 골든셋으로 재사용 가능.

### 부정
- "카메라 → 사진" 흐름이 시뮬되지 않음 (UI에 "데모 메뉴" 라벨 명시).

## 후속

- ADR-013 (사이클 5): Google Vision + Claude API + 이미지 업로드 + Privacy 동의 + Server Action + writeAuditLog.

## 사인오프

R1 ✅ T6 ✅ T16 ✅ (이미지 업로드 Privacy는 사이클 5 별도 ADR) T17 ✅
