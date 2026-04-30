---
id: ADR-025
title: M8 OTA 가격 비교 + 어필리에이트 추적 (수익 모델)
status: Accepted
date: 2026-04-30
decider: R1 CTO
proposer: T9 Business + T10 API + T16 Security
related: ADR-024 (ShareLink), v2 §4 OTA, 외부 API 표준 패턴
---

# ADR-025: OTA 가격 비교 + 어필리에이트 추적 (사이클 12a)

## 컨텍스트

- M8 = TravelDiary 수익 모델 핵심. v1 Tier 2 + v2 Tier 1 채택.
- 3 OTA: Klook · KKday · Agoda (한국인 자유여행자 동남아 주력).
- 어필리에이트 계약 미체결 — 사용자 액션 부담 (각 OTA와 계약, 어필리에이트 ID 발급).
- 사이클 12a는 *시드 + UI + 어필리에이트 URL 패턴*만. 실 API 통합 + 계약 체결은 12b+.

## 결정

### A. 신규 의존성 0개

OTA 어필리에이트 URL은 정적 패턴 (각 OTA 가이드 따름). API 호출은 12b+.

### B. OtaOffer 타입 (시드만, Prisma 모델 미도입)

```typescript
export interface OtaOffer {
  /** 시드 ID — `klook-pq-cable-car` 형식 */
  id: string;
  /** ItineraryItem과 매칭하는 키. 시드에 명시 */
  matchTag: string;  // "phu-quoc-cable-car" 등
  ota: "klook" | "kkday" | "agoda";
  title: string;
  /** 가격 (KRW 환산) */
  priceKrw: number;
  /** 원가 노출 (할인 표시용) */
  originalPriceKrw?: number;
  rating?: number;
  reviewCount?: number;
  /** OTA의 product/page URL (어필리에이트 wrapper 이전) */
  url: string;
}
```

### C. 시드 (lib/seed/ota-offers.ts)

푸꾸옥 트립 12개 일정 중 OTA 매칭 가능한 항목 (관광·액티비티) ~5건만:
- 케이블카 (Sun World 케이블카)
- 사오비치 데이투어
- 야시장 워킹투어
- 빈펄랜드 데이투어
- 서핑/스노클링

각 매칭 항목에 3 OTA 가격 (Klook/KKday/Agoda) 시드.

### D. 어필리에이트 URL 패턴 (lib/utils/affiliate.ts)

각 OTA의 어필리에이트 URL 패턴:
```
Klook:  https://www.klook.com/{path}?aid={KLOOK_AFFILIATE_ID}
KKday:  https://www.kkday.com/{path}?cid={KKDAY_AFFILIATE_ID}
Agoda:  https://www.agoda.com/{path}?cid={AGODA_AFFILIATE_ID}
```

`process.env.{OTA}_AFFILIATE_ID` 미설정 시 → 어필리에이트 wrap 안 함, OTA 직접 URL로 fallback (어필리에이트 수익 0이지만 사용자 경험은 동일).

### E. 클릭 추적 — Server Action

```typescript
trackAffiliateClick({ offerId, itemId, ota, priceKrw }):
  → audit log "affiliate.click" + metadata { ota, offerId, itemId, priceKrw }
  → 외부 redirect URL 반환 → 클라이언트가 window.open
```

이유: 클릭 즉시 audit log → 후속 어필리에이트 commission 추적·분석.

### F. UI — OtaCompareSection

`/itinerary/[id]/item/[itemId]` 페이지에 추가:
- OtaOffer 매칭이 있을 때만 노출
- 3 OTA 가격 카드 (가장 저렴 강조)
- 클릭 → trackAffiliateClick → 새 탭 open

매칭 없으면 섹션 미노출 (사용자 경험 자연스럽게).

### G. Privacy

- 어필리에이트 click 시 사용자 IP/userAgent → audit metadata에 미기록 (사이클 11b OAuth + actorId 후 검토)
- ota click 행동만 기록 (offerId, itemId, priceKrw, ota)

### H. 사용자 직접 액션 (사이클 12b 활성)

```
1. 각 OTA와 어필리에이트 계약:
   - Klook Affiliate: https://affiliate.klook.com
   - KKday Partners: https://partners.kkday.com
   - Agoda Partner Hub: https://partners.agoda.com
2. 어필리에이트 ID 발급 후 Railway Variables:
   - KLOOK_AFFILIATE_ID=
   - KKDAY_AFFILIATE_ID=
   - AGODA_AFFILIATE_ID=
3. (자동) Railway 재배포 → click 시 어필리에이트 wrapper 적용
```

## 대안

### 대안 1 — 실 OTA API 통합 (사이클 12에서) (비채택)
- 어필리에이트 계약 + API 키 발급이 선행 필요
- 12b로 분리

### 대안 2 — Prisma OtaOffer 모델 (비채택)
- 시드만으로 충분, DB 영속화는 12b+ (계약 체결 후 운영 단계)

### 대안 3 — 단일 OTA만 (Klook만) (비채택)
- 가격 비교가 정체성 — 3 OTA 동시 노출이 가치

## 영향

### 긍정
- M8 매직 모먼트 첫 활성 — 수익 모델 시드 오픈
- AuditLog `affiliate.click` — 행동 추적 시작점
- 사이클 12b 어필리에이트 wrapper 즉시 활성 가능

### 부정
- 시드 가격은 정적 — 실제 OTA 가격 변동 미반영 (12b+ 실 API 통합 시)
- 어필리에이트 ID 미설정 — 수익 0 (사용자 경험은 동일)

## 사용자 직접 액션 (옵션)

위 §H 참조. 미설정 시 데모 모드로 OTA 직접 URL 노출.

## 검증 통과 기준 (STEP 4)

- [ ] tsc + build 통과
- [ ] 시드 매칭이 있는 ItineraryItem 상세 → OtaCompareSection 노출
- [ ] 매칭 없는 항목 → 섹션 미노출
- [ ] 클릭 → AuditLog "affiliate.click" 행 적재
- [ ] 어필리에이트 ID 미설정 → OTA 직접 URL fallback (회귀 0)

## 사인오프

R1 ✅ · T9 ✅ · T10 ✅ · T16 ✅ · T13 ✅
