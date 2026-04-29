# Skill S-14: Test Strategy (테스트 전략)

> **스킬 유형**: 운영·품질
> **핵심**: 단위·통합·E2E 우선순위와 도메인 특화 시나리오
> **사용 에이전트**: T12 QA Lead, R6 QA

## 테스트 피라미드 (도메인 적용)

```
       ╱╲
      ╱E2╲       ← 5%   M1~M4 골든 패스만 (Playwright)
     ╱────╲
    ╱ 통합 ╲     ← 25%  API + DB 시나리오
   ╱────────╲
  ╱  단위 테스트╲← 70%  순수 함수 (DAG, 검증, 번역 등)
 ╱──────────────╲
```

## 우선순위 결정 매트릭스

| 영역 | 영향도 | 변경 빈도 | 우선순위 | 대상 |
|------|--------|----------|---------|------|
| DAG 알고리즘 (S-01) | 🔴 높음 | 중 | **P0** | 단위 + 통합 |
| 5단계 검증 (S-03) | 🔴 높음 | 중 | **P0** | 단위 + 모킹 |
| Live Replan 옵션 (S-06) | 🔴 높음 | 높음 | **P0** | 단위 + E2E |
| 모드 전환 (S-04) | 🟡 중 | 낮음 | P1 | 단위 |
| 근거 수집 (S-02) | 🟡 중 | 중 | P1 | 통합 (모킹) |
| OCR 번역 (S-07) | 🟡 중 | 낮음 | P2 | 수동 + 골든 셋 |
| UI 컴포넌트 | 🟢 낮음 | 높음 | P2 | 시각 회귀 |

## P0 — 핵심 알고리즘 단위 테스트

### DAG Scheduling

```typescript
// __tests__/lib/dag-scheduling.test.ts
import { describe, it, expect } from 'vitest';
import { topologicalSort, detectCycle, calculateAffected } from '@/lib/dag';

describe('DAG Scheduling', () => {
  it('순환 의존성을 감지한다', () => {
    const items = [
      { id: 'A', dependencies: ['B'] },
      { id: 'B', dependencies: ['A'] },
    ];
    expect(() => detectCycle(items)).toThrow('Cycle detected');
  });
  
  it('위상 정렬이 의존성을 보장한다', () => {
    const items = [
      { id: 'C', dependencies: ['B'] },
      { id: 'A', dependencies: [] },
      { id: 'B', dependencies: ['A'] },
    ];
    const sorted = topologicalSort(items);
    expect(sorted.map(i => i.id)).toEqual(['A', 'B', 'C']);
  });
  
  it('flexibility=fixed는 이동 불가', () => {
    // ...
  });
  
  it('변경 시 영향 범위가 의존성을 따라 전파된다', () => {
    // ...
  });
});
```

### 5단계 검증 (모킹)

```typescript
// __tests__/lib/validation.test.ts
import { vi, describe, it, expect } from 'vitest';
import { validatePlace } from '@/lib/validation';
import * as googlePlaces from '@/lib/google-places';

vi.mock('@/lib/google-places');

describe('Place Validation', () => {
  it('placeExists=false면 즉시 종료', async () => {
    vi.mocked(googlePlaces.getPlaceDetails).mockResolvedValue(null);
    const result = await validatePlace('invalid');
    expect(result.checks.placeExists).toBe(false);
  });
  
  it('영업 종료 장소는 closed로 분류', async () => {
    vi.mocked(googlePlaces.getPlaceDetails).mockResolvedValue({
      opening_hours: { open_now: false },
      permanently_closed: false,
    });
    const result = await validatePlace('id');
    expect(result.checks.operatingStatus).toBe('closed');
  });
  
  it('5단계 모두 통과 시 신뢰 가능', async () => {
    // ... 모든 단계 PASS 시
  });
});
```

### Live Replan

```typescript
describe('Live Replan Options', () => {
  it('지각 트리거 → 3가지 옵션 생성', () => {
    const dag = makeDAG(...);
    const trigger = { type: 'late', minutes: 30 };
    const options = generateOptions(dag, calculateAffected(dag, 'item-2'), trigger);
    
    expect(options).toHaveLength(3);
    expect(options[0].type).toBe('recommend');
    expect(options[1].type).toBe('safe');
    expect(options[2].type).toBe('force');
  });
  
  it('priority=1 항목은 추천 옵션에서 보호된다', () => {
    // ...
  });
  
  it('영향 시각화 색상이 변경 정도와 일치', () => {
    // ...
  });
});
```

## P0 — 통합 테스트

### API 라우트

```typescript
// __tests__/api/trips.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, cleanup } from '@/test/db';
import { POST } from '@/app/api/trips/route';

describe('POST /api/trips', () => {
  beforeEach(async () => await cleanup());
  
  it('Trip 생성 + AuditLog 기록', async () => {
    const req = new Request('http://localhost/api/trips', {
      method: 'POST',
      body: JSON.stringify({ destination: '도쿄', startDate: '...', nights: 4 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    
    const audit = await db.auditLog.findFirst({ where: { action: 'trip.create' } });
    expect(audit).toBeDefined();
  });
  
  it('잘못된 입력 → 400 + Zod 에러', async () => {
    // ...
  });
});
```

> 통합 테스트는 **실제 DB**(SQLite or 테스트 PostgreSQL)를 사용. 모킹은 외부 API만.

## E2E (Playwright) — 골든 패스만

```typescript
// e2e/m1-evidence-panel.spec.ts
import { test, expect } from '@playwright/test';

test('M1: 일정 항목 탭 → 근거 패널 표시', async ({ page }) => {
  await page.goto('/itinerary/test-trip-id');
  
  // 첫 번째 항목 탭
  await page.locator('[data-testid="itinerary-item"]').first().click();
  
  // 근거 패널 펼침 확인
  const panel = page.locator('[data-testid="evidence-panel"]');
  await expect(panel).toBeVisible();
  
  // 근거 텍스트 확인
  await expect(panel).toContainText('네이버 후기');
  await expect(panel).toContainText('% 긍정');
});

test('M3: 지각 트리거 → 3가지 옵션', async ({ page }) => {
  await page.goto('/travel/test-trip-id');
  
  // 지각 트리거 모킹
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('replan-trigger', {
    detail: { type: 'late', minutes: 30 }
  })));
  
  // 모달 표시
  const modal = page.locator('[data-testid="replan-modal"]');
  await expect(modal).toBeVisible();
  
  // 3가지 옵션
  const options = page.locator('[data-testid="replan-option"]');
  await expect(options).toHaveCount(3);
});
```

## 도메인 특화 시나리오

### 환각 검출 (T12 핵심)

```typescript
describe('Hallucination Detection', () => {
  it('AI가 만든 가짜 장소를 거부한다', async () => {
    // AI에 시드 → "존재하지 않는 식당" 응답
    // → T4 검증 → placeExists=false
    // → 사용자 노출 차단
  });
  
  it('폐업 장소는 즉시 제거된다', async () => {
    // ...
  });
});
```

### 한국인 특화

```typescript
describe('Korean Specialization', () => {
  it('갑각류 알레르기 사용자 → "새우" 메뉴에 경고', () => {
    // ...
  });
  
  it('네이버 후기 0건 시 패널 숨김', () => {
    // ...
  });
});
```

## 회귀 테스트

T18 회고에서 발견된 버그는 **반드시 회귀 테스트** 추가.

```typescript
// __tests__/regression/2026-04-29-evidence-empty.test.ts
describe('Regression: 후기 0건 빈 패널 노출 (2026-04-29)', () => {
  it('후기 0건 시 패널이 숨겨진다', () => {
    // 이 테스트가 통과하는 한 같은 버그 재발 안 함
  });
});
```

## 커버리지 목표

| 영역 | 목표 |
|------|------|
| 핵심 알고리즘 (DAG, Replan, 검증) | **90% 이상** |
| API 라우트 | 80% |
| UI 컴포넌트 | 60% |
| 전체 | **75% 이상** |

## 도구 권장사항 (CTO 사인오프 후 도입)

```json
{
  "vitest": "단위·통합 테스트",
  "@playwright/test": "E2E",
  "@testing-library/react": "컴포넌트",
  "msw": "외부 API 모킹"
}
```

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\test-strategy.md`
