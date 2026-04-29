# 사이클 2 다중 검증 리포트 (STEP 4)

> 4단계 검증 — HARNESS.md §5

---

## ① 자체 검증

| 항목 | 결과 |
|------|------|
| `tsc --noEmit` | ✅ 0건 |
| `next build` | ✅ 6 routes — `/itinerary/[id]` 1.53kB → 4.59kB (Replan 클라이언트 묶음) |
| 디자인 토큰 위반 | ✅ 0건 (`grep -E '#[0-9A-Fa-f]{6}' components/`) |
| 신규 의존성 | ✅ 0개 — ADR-010·012 정신 유지 |
| 명세 일치 (`docs/02-magic-moments.md` M3) | ✅ 바텀 시트, 3옵션, 영향 시각화, 사용자 결정 |

## ② 코드 리뷰 (T13)

1. **`lib/replan.ts`는 순수 함수 — 사이클 5에서 Server Action wrap만 하면 됨** ✅
2. **`validateDag` cycle 검출**: WHITE/GRAY/BLACK 3색 DFS — 표준 패턴 ✅
3. **DAG 시연 검증** (수동 합산):
   - `pq-item-6` 영향 범위 = `[pq-item-7, pq-item-8, pq-item-9]` (Day 3 시간순 후속)
   - 추천: 7(flexible, flexMin 45) → +45분, 8(booked) → 보호 0, 9(flexible, flexMin 30) → +30분
   - 안전: 모두 +120(=90+buffer 30) — 8(booked)에 ⚠️ 경고
   - 강행: 모두 +90 — 8(booked)에 ⚠️ 경고
4. **모달 ARIA**: `role="dialog"` `aria-modal` `aria-labelledby` ✅, ESC·백드롭·X 닫기 ✅
5. **상태 격리**: ItineraryView 외부에 setState 누출 없음, 새로고침 = 시드 리셋 (ADR-012 정직)
6. **inline style 0건** — 사이클 1 대비 개선

### 결정: ✅ 통과

## ③ QA (T12) — 골든패스

```
/                        → 시작하기
/onboarding              → 푸꾸옥 → 다음 → 다음 → 일정 만들기
/itinerary/creating      → 12초 → 자동 navigation
/itinerary/demo-trip-phu-quoc
  헤더 "푸꾸옥 3박 4일", 통계 12 / 3 / 2
  [지연 시뮬레이션] 카드 노출 — Day 3 사오비치 90분 지연 안내
  → "Live Replan 열기" 클릭
[ReplanModal] 바텀 시트
  헤더: "LIVE REPLAN · 데모 시뮬레이션" / "사오비치 (Bãi Sao) 90분 지연"
  옵션 3장:
    추천 — 예약 항목 보호, 유연 항목 최소 시프트
    안전 — 후속 +120분, 예약 변경 필요 경고
    강행 — 일괄 +90분, 예약 충돌 경고
  → "추천 옵션 적용" 클릭
[일정 화면 복귀]
  토스트 "추천 옵션 적용 — Day 3 일정 갱신됨" (4초)
  배지 "추천 적용됨"
  Day 3 탭 → 사오비치 10:30, 분짜 13:45, 케이블카 15:00(보호), 호국사 18:00
  [초기화] 버튼 → 시드로 리셋
```

### 환각·정합성
- DAG cycle 0 — `validateDag` 코드 검토 통과 (수동).
- 클라이언트 상태 새로고침 시 리셋 — 모달 헤더에 "데모 시뮬레이션" 라벨로 사용자 멘탈 모델 보호.
- AI는 결정하지 않는다 — 모달 푸터 명시.

### A11y
- 모달 ESC 닫기·focus 흐름 OK
- 토스트 `role="status"` (스크린 리더 알림)

### 결정: ✅ 통과

## ④ CTO 사인오프 (R1)

| 영역 | 평가 |
|------|------|
| 아키텍처 일관성 | ✅ 서버에서 시드 → 클라이언트 ItineraryView 패턴. 사이클 5에서 mutation이 자연스럽게 끼워질 형태. |
| 보안 | ✅ 사이클 2 입력·인증 0. PII 없음. |
| 성능 | ✅ /itinerary/[id] 4.59kB — 모달·Replan 알고리즘 포함 |
| 기술 부채 | ⚠️ writeAuditLog 실호출은 사이클 5(ADR-013)로 이전 — 합의문에 명문화 |
| ADR | ✅ ADR-012 |

### 사인오프: ✅ 사이클 3(M2 D-Day 모드 전환) 진입 가능

---

## 결과
```
① ✅ ② ✅ ③ ✅ ④ ✅ → STEP 5 회고
```
