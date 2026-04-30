---
id: ADR-027
title: 실 OTA API 통합 (3 OTA 병렬 + 시드 fallback)
status: Accepted
date: 2026-04-30
decider: R1 CTO
proposer: T9 Business + T10 API
related: ADR-025 (12a 시드 + 어필리에이트), 외부 API 표준 패턴 (5b-3)
---

# ADR-027: 실 OTA API 통합 (사이클 12b)

## 컨텍스트

- 사이클 12a: Klook/KKday/Agoda 시드 + 어필리에이트 URL 패턴.
- 어필리에이트 계약 + API 키 발급은 사용자 직접 액션 — 12a 단계에서는 시드만.
- 12b는 실 API 통합 *코드 인프라* 마련. 키 미설정 시 시드 그대로 fallback.

## 결정

### A. 신규 의존성 0개

5b-3 외부 API 표준 패턴 답습 — fetch + 캐시 우선 lookup.

### B. 3 OTA 모듈 구조

```
lib/services/ota/
  klook.ts   — fetchKlookOffers(query, location?) → OtaOffer[]
  kkday.ts   — fetchKKdayOffers(query, location?) → OtaOffer[]
  agoda.ts   — fetchAgodaOffers(query, location?) → OtaOffer[]
```

각 모듈은 5b-3 표준 패턴:
- `import "server-only"`
- API 키 미설정 → `mode: "demo"` 즉시 반환
- EvidenceCache 활용 (platform: `"ota.klook"` / `"ota.kkday"` / `"ota.agoda"`)
- TTL 6시간 (가격 변동 가능)
- 실패 시 `mode: "error"` (호출자가 시드 fallback)

### C. Aggregator (`lib/services/ota-aggregator.ts`)

```typescript
async function aggregateOffersForItem(item: ItineraryItem): Promise<OtaOffer[]>
```

흐름:
1. 3 OTA 병렬 호출 (`Promise.allSettled`)
2. 각 OTA 결과를 OtaOffer로 정규화
3. *실 API 결과 + 시드*를 합치되 같은 `matchTag` 중복 시 실 API 우선
4. 가격순 정렬

API 키 0개 → 모든 OTA가 demo → 시드만 반환 (12a 동작 유지).

### D. EvidenceCache 활용

각 OTA 응답:
```typescript
key: hash(query + location), platform: "ota.{provider}", TTL: 6h
data: OtaOffer[]
```

### E. UI 영향 0

`OtaCompareSection`은 OtaOffer[] 받음 — aggregate 결과든 시드든 동일.
`item detail page`에서 `findOffersForItem` 호출을 `aggregateOffersForItem`으로 swap.

### F. AuditLog

12a `affiliate.click` 그대로. 12b는 별도 audit 추가 X (실 API 호출은 캐시 위주, audit 부하 큼).

### G. Privacy

- 사용자 검색어 → 3 OTA에 전송. 12a `affiliate.click` audit metadata와 연계 불가 (별 사용자 ID).
- 12b는 검색 단계 audit 미추가. 어필리에이트 클릭만 audit.

### H. 환경변수

```bash
KLOOK_API_KEY=
KLOOK_AFFILIATE_ID=         # 12a 그대로
KKDAY_API_KEY=
KKDAY_AFFILIATE_ID=
AGODA_API_KEY=
AGODA_AFFILIATE_ID=
```

각 OTA의 실 API endpoint는 어필리에이트 콘솔에서 발급. 본 ADR에는 stub URL만.

### I. 데모 fallback

```
KLOOK_API_KEY 등 미설정 → 해당 OTA는 demo 반환
모든 키 미설정 → aggregator가 시드만 반환 (12a 회귀 0)
```

## 대안

### 대안 1 — 실 API 통합 미루기 (사이클 13+) (비채택)
- 어필리에이트 계약 후 코드 작업 부담 ↑
- 미리 인프라 구축이 안전

### 대안 2 — 단일 OTA만 (Klook 등) (비채택)
- 가격 비교가 정체성 — 3 OTA 동시

## 영향

### 긍정
- 어필리에이트 계약 후 즉시 활성 (코드 0)
- 5b-3 외부 API 표준 패턴 7번째 적용

### 부정
- API endpoint stub만 — 어필리에이트 계약 후 실제 endpoint 검증 필요
- 코드 미사용 상태로 누적 (계약 전까지)

## 사용자 직접 액션 (계약 후)

```
1. Klook Affiliate, KKday Partners, Agoda Partner Hub 가입
2. API 문서 확인 후 endpoint 정확화
3. Railway Variables에 키 추가
```

## 검증 통과 기준

- [ ] tsc + build 통과
- [ ] 모든 OTA_API_KEY 미설정 → 12a 시드 동작 (회귀 0)
- [ ] 1 OTA 키 설정 (e.g. Klook만) → Klook은 실 API, KKday/Agoda는 시드
- [ ] 모든 OTA 키 설정 → 3 OTA 병렬 호출 + 결과 결합

## 사인오프

R1 ✅ · T9 ✅ · T10 ✅ · T13 ✅
