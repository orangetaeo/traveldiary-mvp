# Skill: Live Replan Options (실시간 재계획 옵션)

> **스킬 유형**: 도메인 스킬
> **핵심 내용**: 실시간 일정 재계획 3가지 옵션 생성
> **사용 에이전트**: T5 Live Replan Engine

## 개요

M3 Live Replan의 핵심 로직으로, 변경 트리거 발생 시 3가지 옵션을 생성한다.
(추천/안전/강행)

## 변경 트리거

```typescript
type ReplanTrigger =
  | { type: "late"; minutes: number }      // 지각
  | { type: "weather"; condition: string } // 악천후
  | { type: "waiting"; minutes: number }  // 대기
  | { type: "user"; reason: string }       // 사용자 요청
  | { type: "closure"; placeId: string };  // 폐업/휴업
```

## 3가지 옵션 정의

### 옵션 1: 추천 (AI 최적)

```
목표: 전체 일정 손실 최소화
전략: flexibility 높은 항목 이동
우선순위: priority 1~2 유지
시각화: 🟢 초록 (긍정적 변경)
```

### 옵션 2: 안전 (여유)

```
목표: 일정 간 여유 확보
전략: 모든 항목에 버퍼 시간 추가
우선순위: priority 3~4 이동 가능
시각화: 🟡 앰버 (보통)
```

### 옵션 3: 강행 (기존 유지)

```
목표: 기존 일정 최대한 유지
전략: 최소 항목만 이동
우선순위: flexible만 조정
시각화: ⚫ 검정 (중립)
```

## 옵션 생성 알고리즘

### 1. 영향 범위 계산

```typescript
function calculateAffectedRange(
  dag: DAG,
  changedItemId: string
): ItineraryItem[] {
  // 1. 변경된 항목의 의존성 그래프 순회
  const affected: ItineraryItem[] = [];
  const visited = new Set<string>();
  
  function traverse(itemId: string) {
    if (visited.has(itemId)) return;
    visited.add(itemId);
    
    const item = dag.nodes.find(n => n.id === itemId);
    if (!item) return;
    
    affected.push(item);
    
    // 이 항목에 의존하는 항목들 찾기
    const dependents = dag.graph.getDependents(itemId);
    for (const depId of dependents) {
      traverse(depId);
    }
  }
  
  traverse(changedItemId);
  return affected;
}
```

### 2. 옵션별 재배치 로직

```typescript
interface ReplanOption {
  type: "recommend" | "safe" | "force";
  label: string;
  description: string;
  changes: ItemChange[];
  impactVisual: "green" | "amber" | "black";
}

function generateOptions(
  dag: DAG,
  affected: ItineraryItem[],
  trigger: ReplanTrigger
): ReplanOption[] {
  return [
    generateRecommendOption(dag, affected, trigger),
    generateSafeOption(dag, affected, trigger),
    generateForceOption(dag, affected, trigger)
  ];
}
```

### 추천 옵션 생성

```typescript
function generateRecommendOption(
  dag: DAG,
  affected: ItineraryItem[],
  trigger: ReplanTrigger
): ReplanOption {
  // 1. flexibility 높은 항목 우선 이동
  const sortedByFlexibility = [...affected].sort((a, b) => {
    const flexOrder = { flexible: 0, booked: 1, fixed: 2 };
    return flexOrder[a.flexibility] - flexOrder[b.flexibility];
  });
  
  // 2. priority 낮은 항목 먼저 이동
  const sortedByPriority = sortedByFlexibility.sort((a, b) => b.priority - a.priority);
  
  // 3. 변경 적용
  const changes = applyMinimumChanges(sortedByPriority, trigger);
  
  return {
    type: "recommend",
    label: "추천",
    description: "AI가 최적化した 일정입니다. 전체 일정 손실을 최소화합니다.",
    changes,
    impactVisual: "green"
  };
}
```

### 안전 옵션 생성

```typescript
function generateSafeOption(
  dag: DAG,
  affected: ItineraryItem[],
  trigger: ReplanTrigger
): ReplanOption {
  // 1. 모든 항목에 버퍼 시간 추가
  const changes = affected.map(item => ({
    itemId: item.id,
    originalTime: item.scheduledAt,
    newTime: addBuffer(item.scheduledAt, item.durationMinutes),
    reason: "여유 확보"
  }));
  
  return {
    type: "safe",
    label: "안전",
    description: "일정 간 여유를 확보합니다. 예상치 못한 변화에 안전합니다.",
    changes,
    impactVisual: "amber"
  };
}
```

### 강행 옵션 생성

```typescript
function generateForceOption(
  dag: DAG,
  affected: ItineraryItem[],
  trigger: ReplanTrigger
): ReplanOption {
  // 1. flexible 항목만 최소 이동
  const flexibleItems = affected.filter(i => i.flexibility === "flexible");
  const changes = flexibleItems.map(item => ({
    itemId: item.id,
    originalTime: item.scheduledAt,
    newTime: calculateMinimalShift(item, trigger),
    reason: "최소 변경"
  }));
  
  return {
    type: "force",
    label: "강행",
    description: "기존 일정을 최대한 유지합니다. 변경을 최소화합니다.",
    changes,
    impactVisual: "black"
  };
}
```

## 영향 시각화

```typescript
function generateImpactVisual(
  originalItem: ItineraryItem,
  newItem: ItineraryItem
): "green" | "amber" | "black" {
  // 개선: 시간 단축 or 품질 향상
  if (newItem.durationMinutes < originalItem.durationMinutes) {
    return "green";
  }
  
  // 동일: 변화 없음
  if (newItem.scheduledAt === originalItem.scheduledAt) {
    return "black";
  }
  
  // 지연: 시간 증가
  return "amber";
}

// 시각화 예시
// 변경 전: [A] → [B] → [C] → [D] → [E]
// 변경 후: [A] → [B] → [C'] → [D'] → [E']
// 시각화:  🟢    🟢     🟡      🟡      ⚫
```

## 사용자 결정 프로세스

```
1. 트리거 감지
       ↓
2. 영향 범위 계산 (DAG 순회)
       ↓
3. 3가지 옵션 생성
       ↓
4. 옵션별 시각화 (영향 색상)
       ↓
5. 사용자面前 제시
       ↓
6. 사용자 선택 → DAG 재구성
       ↓
7. 변경 사항 저장 + Audit Log
```

## 핵심 원칙

> **AI는 결정하지 않는다. 옵션을 제시하고, 사용자가 결정한다.**

- 추천 옵션도 강제하지 않음
- 모든 옵션의 장단점 명확히 표시
- "취소" 옵션 항상 제공

## 구현 예시

```typescript
// lib/live-replan.ts

export async function handleReplanTrigger(
  tripId: string,
  trigger: ReplanTrigger
): Promise<ReplanOption[]> {
  // 1. Trip + DAG 로드
  const trip = await db.trips.findUnique({ where: { id: tripId } });
  const dag = await loadDAG(tripId);
  
  // 2. 영향 범위 계산
  const affected = calculateAffectedRange(dag, trigger.itemId);
  
  // 3. 3가지 옵션 생성
  const options = generateOptions(dag, affected, trigger);
  
  // 4. Audit Log 기록
  await writeAuditLog({
    action: "replan_options_generated",
    tripId,
    trigger: trigger.type,
    optionsCount: options.length
  });
  
  return options;
}
```

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\live-replan-options.md`