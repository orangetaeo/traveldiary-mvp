# 04. Data Model

## 핵심 통찰

**일정은 "리스트"가 아니라 "그래프"여야 한다.**

기존 일정 앱들이 Live Replan을 못 하는 이유: 데이터 모델이 선형 리스트라서. 한 항목 바꾸면 뒤가 도미노로 깨짐.

우리는 **DAG (Directed Acyclic Graph)**로 설계.

코드: `lib/types.ts`

---

## 핵심 엔티티

### Trip (여행)

```typescript
interface Trip {
  id: string;
  destination: string;
  startDate: string;
  nights: number;
  companion: "solo" | "friends" | "family" | "group";
  preferences: UserPreferences;
  status: "draft" | "confirmed" | "in-progress" | "completed";
}
```

### ItineraryItem (일정 항목 = DAG 노드)

```typescript
interface ItineraryItem {
  id: string;
  scheduledAt: string;
  durationMinutes: number;

  // Live Replan의 핵심
  flexibility: "fixed" | "flexible" | "booked";
  priority: 1 | 2 | 3 | 4 | 5;
  flexMinutes: number;

  // 그래프 구조
  dependencies: string[];

  // 콘텐츠
  name: string;
  category: "food" | "spot" | "shopping" | "rest";
  location: { lat: number; lng: number; address: string };

  // 우리 정체성
  evidence: Evidence;
}
```

### Evidence (추천 근거)

```typescript
interface Evidence {
  reasons: string[];           // ["네이버 후기 387건 중 92% 긍정", ...]
  sources: EvidenceSource[];   // 출처 — 검증 가능성
  verifiedAt: string;
  warnings?: string[];
}
```

### Validation (환각 차단)

```typescript
interface ValidationResult {
  itemId: string;
  checks: {
    placeExists: boolean;
    operatingStatus: "open" | "closed" | "temporary";
    bookingRequired: boolean;
    distanceVerified: boolean;
    priceVerified: boolean;
  };
  validatedAt: string;
}
```

---

## DB 스키마 방향 (Phase 1)

PostgreSQL 기준. Railway에 PostgreSQL 한 클릭으로 추가 가능.

```sql
-- 사용자 (지금은 익명, Phase 1에서 익명 ID 발급)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ
);

-- 여행 (메인 컨테이너)
CREATE TABLE trips (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  destination VARCHAR(100),
  start_date DATE,
  nights INT,
  companion VARCHAR(20),
  preferences JSONB,           -- vibes, pace, excludes
  status VARCHAR(20),
  created_at TIMESTAMPTZ
);

-- 동행 (다대다)
CREATE TABLE trip_members (
  trip_id UUID REFERENCES trips(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20),            -- owner, editor, viewer
  joined_at TIMESTAMPTZ,
  PRIMARY KEY (trip_id, user_id)
);

-- 일정 항목 (DAG 노드)
CREATE TABLE itinerary_items (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id),
  day_index INT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INT,
  flexibility VARCHAR(20),
  priority INT CHECK (priority BETWEEN 1 AND 5),
  flex_minutes INT,
  name VARCHAR(200),
  category VARCHAR(20),
  location JSONB,              -- { lat, lng, address }
  estimated_price JSONB,
  booking_status JSONB,
  evidence JSONB,              -- reasons, sources, warnings
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

-- DAG 엣지 (의존성)
CREATE TABLE item_dependencies (
  item_id UUID REFERENCES itinerary_items(id),
  depends_on UUID REFERENCES itinerary_items(id),
  PRIMARY KEY (item_id, depends_on)
);

-- Live Replan 이력 (되돌리기용 — 30분 보관)
CREATE TABLE replan_history (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id),
  triggered_at TIMESTAMPTZ,
  context JSONB,
  applied_option_id VARCHAR(20),
  snapshot JSONB,              -- 변경 전 상태 (되돌리기용)
  expires_at TIMESTAMPTZ
);

-- 장소 캐시 (푸꾸옥 800곳 시드 + 동적 추가)
CREATE TABLE places (
  id UUID PRIMARY KEY,
  google_place_id VARCHAR(100) UNIQUE,
  name VARCHAR(200),
  city VARCHAR(50),
  category VARCHAR(20),
  location JSONB,
  korean_reviews JSONB,        -- 네이버 블로그 인덱스
  popularity_score FLOAT,      -- 한국인 인기도
  last_validated_at TIMESTAMPTZ
);
```

---

## 데이터 소스 매핑

각 정보가 어디서 오는가:

| 화면 정보 | 소스 | 비용 | 신뢰도 |
|-----------|------|------|--------|
| 장소 기본 정보 | Google Places API | $0.017/호출 | ⭐⭐⭐⭐⭐ |
| 한국어 후기 요약 | 네이버 블로그 + LLM | $0.002 | ⭐⭐⭐ |
| "한국인 BEST" | 네이버 + 인스타 + LLM | $0.005 | ⭐⭐ |
| 다음 일정과 거리 | Google Directions | $0.005 | ⭐⭐⭐⭐⭐ |
| 메뉴판 OCR | Google Vision + GPT | $0.03 | ⭐⭐⭐⭐ |
| 알레르기 함유 | LLM 추론 | $0.005 | ⭐⭐⭐ |
| OTA 가격 | 어필리에이트 API | 매출 분배 | ⭐⭐⭐⭐⭐ |
| 환불 정책 | 자체 정적 DB | 0 | ⭐⭐⭐⭐⭐ |

**중요**: ⭐ 1~2개 짜리는 MVP에서 빼야 함. "현지인 비율 60%" 같이 만들 수 없는 숫자는 화면에 노출 금지.

---

## 1인당 데이터 비용 (푸꾸옥 3박 4일)

| 항목 | 비용 |
|------|------|
| LLM 일정 생성 | $0.30 |
| Google Places (30개 장소) | $0.51 |
| 사진 로드 (90장) | $0.63 |
| Directions (50회) | $0.25 |
| 한국어 후기 요약 | $0.15 |
| Live Replan (3회) | $0.15 |
| 카메라 번역 (5회) | $0.15 |
| 알레르기 분석 | $0.05 |
| **합계** | **$2.20 (≈ ₩3,000)** |

수익 모델 (어필리에이트 25% 전환 가정):
- 매출 ₩4,500~6,000
- 영업이익 ₩1,500~3,000

손익분기 근처. 캐싱 + 사용자 누적으로 점차 흑자 전환.

---

## 환각 차단 검증 — 5단계

LLM 출력 → 사용자 노출 사이에 **5단계 검증**:

1. **장소명 검증**: Google Places로 실제 존재 확인. 미존재 → 폐기 → LLM 재추천.
2. **영업 상태 검증**: 폐업·임시휴업·영업시간. *Mindtrip이 폐업 호텔 추천한 사고 방지.*
3. **예약 필수 검증**: 공식·OTA에서 사전 예약 필수 여부 확인 → 화면에 명시.
4. **거리·시간 검증**: LLM이 "도보 5분" → Directions API로 실측 → 후자로 교체.
5. **가격 검증**: OTA 실시간 가격으로 표시. LLM 추정가는 사용자에게 절대 노출 금지.

**구현 핵심**: LLM은 **창의적 생성**에만, 사실 검증은 **결정론적 API**에. 이게 "AI가 거짓말 안 하는 시스템"의 본질.
