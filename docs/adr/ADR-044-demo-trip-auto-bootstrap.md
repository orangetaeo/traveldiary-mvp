---
id: ADR-044
title: 데모 trip 자동 부트스트래핑 — checklist/cost 영속화 (사이클 XX)
status: Accepted
date: 2026-05-03
decider: R1 CTO
proposer: T8 PM + T14 DB + R4 BE + T16 Security
related: ADR-022 (M6 Cost·Checklist), ADR-013 (Trip 영속화), ADR-026 (인증·OAuth)
---

# ADR-044: 데모 trip 자동 부트스트래핑 (영속화 활성)

## 컨텍스트

**현 상태 (사이클 VV/WW 직후)**:
- 베트남 시드 trip 6개 (PQC/SGN/HAN/DAD/NHA/DLI)는 `lib/seed`에만 존재. DB에는 미존재.
- `actions/checklist.ts` + `actions/cost.ts` 모든 mutation 진입에 `if (!isDbConnected || input.tripId === DEMO_TRIP_ID) return demo:true` 분기.
- `app/checklist/[tripId]/page.tsx` + `app/cost/[tripId]/page.tsx`도 `params.tripId === DEMO_TRIP_ID ? [] : list...` 분기.

**문제**:
1. **푸꾸옥(DEMO_TRIP_ID)** — 사용자가 체크리스트/비용 항목 추가 시 토스트만 뜨고 영구 휘발 (demo:true)
2. **다낭/호치민/하노이/나트랑/달랏 5 trip** — 분기는 통과하지만 trip이 DB에 없어 ChecklistItem/CostEntry FK 위반 → "internal" 에러
3. 결과: 시드 trip 6개 모두에서 사용자가 추가/체크 변경한 데이터 휘발 또는 실패

**메모 정책 (2026-05-03)**: 베트남 단일 국가 + 기능 우선 (`feedback_vietnam_only_focus`).

## 결정

**시드 trip이 DB에 없을 때 첫 영속화 진입(`add` 계열)에서 자동으로 trip을 upsert.**

### A. `lib/repositories/trip.repository.ts`에 `ensureDemoTripInDb(tripId)` 추가

```ts
export async function ensureDemoTripInDb(tripId: string): Promise<void> {
  if (!prisma) return;
  const existing = await prisma.trip.findFirst({ where: { id: tripId, deletedAt: null } });
  if (existing) return;
  const seed = getDemoTrip(tripId);
  if (!seed) return;
  // SYSTEM_OWNER_ID upsert + trip.create (id는 시드 ID 그대로)
  // P2002 unique 충돌은 동시 호출이므로 흡수
}
```

특성:
- **idempotent** — 이미 존재하면 no-op
- **시드에 없는 ID는 no-op** — 사용자 trip 삭제 등은 호출처가 처리
- **itinerary 시드 복제 미수행** — 체크리스트/비용은 trip FK만 필요. itinerary는 기존 시드 path 유지

### B. mutation 진입점 수정

| 파일 | mutation | 변경 |
|---|---|---|
| `actions/checklist.ts` | `addChecklistItem` | DEMO 분기 제거 + `await ensureDemoTripInDb` 호출 |
| `actions/checklist.ts` | `addFromTemplate` | 동일 |
| `actions/checklist.ts` | `toggleChecklist` | DEMO 분기만 제거 (entry FK 보장) |
| `actions/checklist.ts` | `deleteChecklist` | DEMO 분기만 제거 |
| `actions/cost.ts` | `addCost` | DEMO 분기 제거 + ensure |
| `actions/cost.ts` | `updateCost/settleCost/deleteCost` | DEMO 분기만 제거 |

`add` 계열에만 ensure 호출 (entry 생성 전 trip FK 보장). `toggle/update/delete`는 entry 자체가 FK이므로 trip이 없으면 entry도 없음 → 자연 `not_found`.

### C. page 분기 제거

`app/checklist/[tripId]/page.tsx` + `app/cost/[tripId]/page.tsx`의 `=== DEMO_TRIP_ID ? [] : list...` 삭제. `listChecklistByTrip` / `listCostByTrip`은 prisma null 시 null → `?? []` fallback이 동일 결과.

## 대안

| 대안 | 채택 안 한 이유 |
|---|---|
| 시드 trip을 마이그레이션 시 DB에 미리 INSERT (스타트업 시드 스크립트) | 시드와 DB 사이에 두 진실 공존 — 갱신 동기화 부담. on-demand upsert가 idempotent하고 안전 |
| localStorage fallback | DB 연결 환경에서도 휘발 + 다중 디바이스 동기화 불가. 영속화 의미 약화 |
| `ChecklistItem`/`CostEntry`에 `actorId` 컬럼 추가하여 사용자별 격리 | 다중 사용자 격리는 OAuth 활성 후 별도 ADR (현재 단일 사용자 데모 단계). 본 사이클 범위 외 |
| itinerary 시드도 DB로 복제 | 체크리스트/비용은 trip FK만 필요. itinerary 복제는 별도 사이클 (`/itinerary/[id]` 영속화 진입 시) |

## 다중 사용자 격리 (보류)

현재 `SYSTEM_OWNER_ID` 공유 → 사용자 A의 데모 trip 체크리스트가 사용자 B에게도 노출. 카카오 OAuth 활성 후 별도 사이클에서 처리:
- `ChecklistItem`/`CostEntry`에 `actorId` (또는 `clientUuid`) 컬럼 추가
- 마이그레이션 0012 (`feedback_anonymous_collab_pattern` 답습)
- 시드 trip 부트스트래핑은 그대로 유지 + 사용자 격리 필터 추가

## 회귀 단언 (T12)

`tests/unit/demo-trip-bootstrap.test.ts` (신규):
1. DEMO_TRIP_IDS는 6개 (베트남 한정)
2. `ensureDemoTripInDb`는 함수로 export
3. 6 trip 모두 부트스트래핑 필수 필드 보유 (id/destination/companion/preferences/status/startDate ISO)
4. `getDemoTrip(non-existent)` → null
5. mutation export 정합성 (checklist 4 + cost 4)

## 영향

- **schema 변경 0** (마이그 0012는 별도 사이클로 보류)
- **신규 의존성 0**
- **신규 함수 1**: `ensureDemoTripInDb`
- **vitest +18**
- **사용자 액션 0** — Railway에서 mutation 첫 호출 시 자동 부트스트래핑 (`scripts/start.sh:13` 마이그 답습)
- **권한**: `canWriteTrip(DEMO_TRIP_ID)` 통과 + 단일 사용자 모드(`actorId === null`) 통과 — 현 인증 정책 유지

## 데이터 영향

운영 DB에 `Trip(SYSTEM_OWNER_ID)` 6 행이 누적. 시드 갱신 시 기존 DB 행은 그대로 유지(컨텐츠 분기 가능). 갱신 동기화는 `feedback_phased_normalization` 답습 — 마이그 0012에서 ON CONFLICT UPDATE 정책 도입 가능.
