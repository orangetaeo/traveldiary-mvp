# Skill: Mode Transition (모드 전환)

> **스킬 유형**: 도메인 스킬
> **핵심 내용**: 여행 전→중→후 모드 자동 전환, D-Day 관리
> **사용 에이전트**: T7 Mode Transition Manager

## 개요

M2 D-Day 자동 모드 전환을 실행하는 로직이다.
사용자가 버튼을 누르지 않아도 자동으로 UI가 전환된다.

## 모드 정의

```typescript
type TravelMode = 
  | "pre-travel"    // 여행 전 (계획 중)
  | "in-travel"     // 여행 중 (진행 중)
  | "post-travel";  // 여행 후 (기록)
```

## 전환 조건

### 여행 전 → 여행 중

```
필수 조건 (AND):
□ 출발일 D-Day = 0
□ 사용자 위치 ∈ 목적지 도시 경계

선택 조건:
□ 첫 번째 일정 시간 - 현재 시간 ≤ 2시간
```

### 여행 중 → 여행 후

```
필수 조건 (AND):
□ 귀국일 (마지막 일정 종료 후 24시간 경과)
□ 사용자 위치 = 국내
```

## UI 전환 요소

| 요소 | 여행 전 | 여행 중 | 여행 후 |
|------|---------|---------|---------|
| **헤더** | "도쿄 4박 5일" | "DAY 2 · 13:42" | "도 Tokyo 완료" |
| **통계** | 동선·경비 예상 | 진행률 2/5 | 총 비용, 방문 장소 |
| **강조 색** | 보라 (계획) | 코랄 (진행) | 그린 (완료) |
| **FAB** | 없음 | 카메라 번역 / 주변 검색 | 사진 정리 |
| **하단 nav** | 일정·검색·설정 | 일정·현황·번역 | 일정·기록·공유 |

## 전환 시퀀스

```
1. D-Day 감지 (매일 자정 + 실시간)
       ↓
2. 위치 확인 (GPS 또는 수동 설정)
       ↓
3. 전환 조건 충족 확인
       ↓
4. 애니메이션과 함께 UI 전환
       ↓
5. 여행 중 기능 활성화
       ↓
6. 사용자에게 알림 (첫 전환 시)
```

## D-Day 계산

```typescript
function calculateDDay(tripStartDate: string): number {
  const today = new Date();
  const start = new Date(tripStartDate);
  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// 사용 예
// D-Day > 0: 여행 전
// D-Day = 0: 여행 당일 → 여행 중 전환
// D-Day < 0: 여행 중
```

## 위치 기반 전환

### 목적지 경계 정의

```typescript
const DESTINATION_BOUNDARIES: Record<string, GeoBoundary> = {
  tokyo: {
    center: { lat: 35.6762, lng: 139.6503 },
    radiusKm: 50  // 반경 50km
  },
  osaka: {
    center: { lat: 34.6937, lng: 135.5023 },
    radiusKm: 30
  },
  kyoto: {
    center: { lat: 35.0116, lng: 135.7681 },
    radiusKm: 20
  }
};

function isWithinBoundary(
  userLocation: GeoLocation,
  destination: string
): boolean {
  const boundary = DESTINATION_BOUNDARIES[destination];
  const distance = calculateDistance(userLocation, boundary.center);
  return distance <= boundary.radiusKm;
}
```

### Privacy 대안

```
원칙: 사용자의 동의를 받은 위치만 사용
       ↓
대안: 목적지 도시 경계는 수동 설정 가능
       ↓
Privacy: 위치 데이터는 기기 내 처리 (서버 미전송)
```

## 모드 전환 감지 로직

```typescript
function detectModeTransition(
  trip: Trip,
  userLocation: GeoLocation
): TravelMode {
  const dDay = calculateDDay(trip.startDate);
  const isInDestination = isWithinBoundary(userLocation, trip.destination);
  
  // 여행 전 → 여행 중
  if (dDay <= 0 && isInDestination) {
    return "in-travel";
  }
  
  // 여행 중 → 여행 후
  if (dDay < -trip.nights && !isInDestination) {
    return "post-travel";
  }
  
  // 기본: 여행 전
  return "pre-travel";
}
```

## UI 전환 구현

### CSS 변수 기반

```css
:root {
  /* 여행 전 */
  --color-primary: #8B5CF6;  /* 보라 */
  --header-title: "도 Tokyo 4박 5일";
  --fab-visible: false;
}

[data-travel-mode="in-travel"] {
  /* 여행 중 */
  --color-primary: #F97316;  /* 코랄 */
  --header-title: "DAY {day} · {time}";
  --fab-visible: true;
}

[data-travel-mode="post-travel"] {
  /* 여행 후 */
  --color-primary: #22C55E;  /* 그린 */
  --header-title: "도 Tokyo 완료";
  --fab-visible: false;
}
```

### React 컨텍스트

```typescript
// context/TravelModeContext.tsx

const TravelModeContext = createContext<TravelMode | null>(null);

export function TravelModeProvider({ children, trip, userLocation }) {
  const [mode, setMode] = useState<TravelMode>("pre-travel");
  
  useEffect(() => {
    const newMode = detectModeTransition(trip, userLocation);
    if (newMode !== mode) {
      setMode(newMode);
      // 애니메이션 + 알림
    }
  }, [trip, userLocation]);
  
  return (
    <TravelModeContext.Provider value={mode}>
      <div data-travel-mode={mode}>
        {children}
      </div>
    </TravelModeContext.Provider>
  );
}
```

## 핵심 원칙

> **사용자는 모드 전환 버튼을 누른 적이 없어야 한다**
> - 자동 전환: 사용자가 의도하지 않아도 발동
> - 출발일 + 위치 둘 다 충족 시 전환
> - 전환 시점 명확히 기록 (Audit Log)

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\mode-transition.md`