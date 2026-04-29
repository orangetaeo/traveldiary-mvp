# Skill: DAG Scheduling (DAG 스케줄링)

> **스킬 유형**: 도메인 스킬
> **핵심 내용**: Directed Acyclic Graph 기반 일정 스케줄링,灵活性 계산
> **사용 에이전트**: T2 Itinerary Graph Engineer, T5 Live Replan Engine

## 개요

TravelDiary의 일정 데이터 모델은 **선형 리스트가 아닌 DAG(Directed Acyclic Graph)**로 설계된다.
이것이 Live Replan(일정 재계획)의 핵심 기반이다.

## 핵심 개념

### DAG 노드 (ItineraryItem)

```typescript
interface ItineraryItem {
  id: string;
  scheduledAt: string;           // 계획 시작 시간
  durationMinutes: number;       // 소요 시간
  
  // Live Replan 핵심 속성
  flexibility: "fixed" | "flexible" | "booked";
  priority: 1 | 2 | 3 | 4 | 5;   // 5 = 절대 빼지 마
  flexMinutes: number;            // ±이동 가능 시간 (분)
  
  // 그래프 구조
  dependencies: string[];         // 선행 노드 ID 배열
  
  // 콘텐츠
  name: string;
  category: "food" | "spot" | "shopping" | "rest";
  location: { lat: number; lng: number; address: string };
  
  // 추천 근거
  evidence: Evidence;
}
```

### flexibility 속성

| 값 | 의미 | 재배치 가능 |
|---|------|------------|
| `fixed` | 고정 (예: 항공편) | 불가능 |
| `flexible` | 유연 | ±flexMinutes 범위 |
| `booked` | 예약 완료 | 예약 취소 필요 |

### priority 속성

| 우선순위 | 의미 | 재배치 시 |
|----------|------|----------|
| 1 | 절대 빼지 마 | 다른 항목 이동 |
| 2 |非常重要 | 가능한 이동 |
| 3 | 보통 | 유연하게 이동 |
| 4 | 낮음 | 먼저 이동 가능 |
| 5 | 가장 낮음 | 삭제 가능 |

## 스케줄링 알고리즘

### 1. Topological Sort (위상 정렬)

DAG의 노드를 의존성 순서에 따라 정렬한다.

```
function topologicalSort(nodes: ItineraryItem[]): ItineraryItem[] {
  // 1. 의존성 그래프 구축
  // 2. 진입 차수(In-degree) 계산
  // 3. 차수가 0인 노드부터 순차 추출
  // 4. 추출된 노드의 간선 제거
  // 5. 반복
}
```

### 2. 시간 충돌 해결

```
function resolveConflicts(items: ItineraryItem[]): ItineraryItem[] {
  // 1. 시간순 정렬
  // 2. 중복 구간 찾기
  // 3. flexibility + priority 기반 해결
  // 4. 유효하지 않은 의존성 제거
}
```

### 3. 재배치 가능성 계산

```
function calculateReplanOptions(
  changedItem: ItineraryItem,
  allItems: ItineraryItem[]
): ReplanOption[] {
  // 1. 영향 범위 계산 (DFS/BFS)
  // 2. 각 노드의 이동 가능 여부 확인
  // 3. 옵션 생성 (추천/안전/강행)
}
```

## Live Replan 통합

### 변경 트리거 시

```
1. 변경 요청 수신
       ↓
2. 영향 범위 계산 (changedItem에서 역방향 DFS)
       ↓
3. 각 노드의 재배치 가능성 계산
       ↓
4. 3가지 옵션 생성
       ↓
5. 사용자에게 제시
```

### 영향 범위 예시

```
변경: [B] 시간을 10:00 → 14:00로 이동
     ↓
영향: [C] depends on [B] → 재배치 필요
     ↓
     [D] depends on [C] → 연쇄 효과
     ↓
     [E] depends on [B] → 재배치 필요
```

## 검증 규칙

### DAG 유효성 검사

- [ ] 순환 의존성 없음 (cycle detection)
- [ ] 모든 의존성 참조가 존재하는 노드
- [ ] 시간 역행 없음 (과거 시간으로의 의존성)
- [ ] 예약 완료(fixed) 항목은 의존성 변경 불가

### 시간 유효성 검사

- [ ] 각 항목의 종료 시간 > 시작 시간
- [ ] 의존성 항목의 시작 시간 ≥ 선행 항목 종료 시간 + 이동 시간
- [ ] 일일 총 소요 시간 ≤ 18시간 (식사, 휴식 포함)

## 구현 예시

```typescript
// lib/scheduler.ts

export function createDAG(items: ItineraryItem[]): DAG {
  // 1. 노드 검증
  validateNodes(items);
  
  // 2. 의존성 그래프 구축
  const graph = buildGraph(items);
  
  // 3. 위상 정렬
  const sorted = topologicalSort(graph);
  
  // 4. 시간 계산
  calculateTimes(sorted);
  
  return { nodes: sorted, graph };
}

export function replan(
  dag: DAG,
  changedItemId: string,
  newTime: string
): ReplanResult {
  // 1. 영향 범위 계산
  const affected = calculateAffectedRange(dag, changedItemId);
  
  // 2. 옵션 생성
  const options = generateOptions(dag, affected, newTime);
  
  return { options, affectedRange };
}
```

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\dag-scheduling.md`