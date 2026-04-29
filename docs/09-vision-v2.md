# 09. Vision v2 — AI 추천 + 정밀 큐레이션 결합 (사이클 6 합의 — Accepted)

> **상태**: ✅ **Accepted** (2026-04-29 사용자 7개 결정 완료)
> **이전**: docs/01-vision.md (v1 — AI 4 매직 모먼트 중심)
> **트리거**: 사용자 피드백 — "현 MVP는 단조롭다, 9가지 이상 빠짐"
> **참고**: docs/sydney-pattern-inventory.md (시드니 사이트 패턴 추출)
>
> ## 사용자 결정 7개 (확정)
> 1. **신규 매직 모먼트 M5~M8 4개 모두 채택** ✅
> 2. **사이클 5b(인프라) → 사이클 7+(v2 기능) 순서** ✅
> 3. **v2 출시 시점 도시 = 푸꾸옥 + 다낭 (베트남 2도시)** ✅
> 4. **수익 모델 M8 OTA = 사이클 12** ✅
> 5. **Tier 1 원안 그대로 유지** ✅
> 6. **카카오 OAuth = 사이클 11 협업 단계** ✅
> 7. **모바일 = PWA(v2) → 이후 React Native** ✅

---

## 0. 정체성 갱신 (한 줄)

> v1: **자유여행자를 위한 AI 여행 동반자**
>
> v2: **AI가 빠르게 그려주고, 사람이 정밀하게 다듬고, 일행과 함께 살아 움직이는 동반자**

세 가지 축이 모두 있어야 함:
1. **AI 자동 생성** (현 MVP M1~M4 강점)
2. **사람 정밀 큐레이션** (시드니 패턴 — 데이터 정밀도·응급·체크리스트)
3. **협업·공유** (일행과의 살아 움직임)

---

## 1. 사용자 갭 분석 (사용자 지적 9개 + 시드니 패턴 + 추가 발견)

### A. 기본 UX 결함 — Tier 1

| ID | 갭 | 사용자 지적 | 시드니 보유 | 우리 MVP |
|----|-----|----|----|----|
| A1 | Google Map 통합 (위치·동선·길찾기) | ✅ 1번 | ✅ 13+ 링크 | ❌ 좌표만 표시 |
| A2 | 일정 카드 드래그 정렬 | ✅ 2번 | ❌ (필요 없음 — 정적 가이드) | ❌ |
| A3 | 관광지 이미지 (썸네일/갤러리) | ✅ 6번 | ❌ (텍스트 위주) | ❌ |
| A4 | 검색 (장소·후기·메뉴) | (제 추가) | ❌ | ❌ |
| A5 | 일정 자유 추가 (사용자 직접) | (제 추가) | ✅ /cost 자유 입력 | ❌ |

→ **A1·A3가 가장 시급**. 지도와 이미지 없는 여행앱은 본질적으로 부족.

### B. 도시 컨텍스트 — Tier 1 (도시별 정적 데이터 풀)

| ID | 갭 | 사용자 지적 | 시드니 보유 | 우리 MVP |
|----|-----|----|----|----|
| B1 | 응급 핫라인 박스 | ✅ 3번 | ✅ 호주응급/영사관/외교부 | ❌ |
| B2 | 결제·환전·환율·ATM | (제 추가) | ✅ 결제 박스 | ❌ |
| B3 | 현지 교통 (그랩·우버·지하철) | ✅ 4번 | ✅ Opal·우버·페리 | ❌ |
| B4 | 전압·플러그·SIM·eSIM | (제 추가) | ✅ Type I + Telstra | ❌ |
| B5 | 비자·검역·치안 | (제 추가) | ✅ ETA·금지품 | ❌ |
| B6 | 날씨·계절성·복장 | (제 추가) | ✅ 패딩·운동화 | ❌ |
| B7 | 팁 문화·화장실·물 안전 | (제 추가) | (부분) | ❌ |
| B8 | 상황별 카드 (영어/현지어 문장) | (제 추가) | ✅ 7카테고리·40+ 문장 | ❌ |

→ **B는 도시별 큐레이션 데이터 풀**. 한 번 만들어 두면 모든 사용자 공유. 푸꾸옥 시드 데이터에 추가.

### C. 협업 / 소셜 — Tier 2

| ID | 갭 | 사용자 지적 | 시드니 보유 | 우리 MVP |
|----|-----|----|----|----|
| C1 | 일정 공유 링크 | ✅ 8번 | ❌ | ❌ |
| C2 | 동기화 키 (단순 협업) | (제 추가, 시드니 패턴) | ✅ /cost 동기화 키 | ❌ |
| C3 | 카카오톡 OAuth + 일행 초대 | (제 추가) | ❌ | ❌ |
| C4 | 일행 투표·동의 | ✅ 9번 | ❌ | ❌ (Vote 타입 정의만) |
| C5 | 댓글·반응 | (제 추가) | ❌ | ❌ |
| C6 | 공개 일정 갤러리 (M5 후보) | (제 추가) | ❌ | ❌ |

→ **C2 동기화 키 패턴**(시드니 단순 구현)을 첫 단계로 채택. 카카오 OAuth는 더 뒤.

### D. 외부 서비스 연동 — Tier 1+2 혼합

| ID | 갭 | 사용자 지적 | 시드니 보유 | 우리 MVP |
|----|-----|----|----|----|
| D1 | Google Maps deeplink | (시드니 = A1) | ✅ | ❌ |
| D2 | 우버·그랩 deeplink | ✅ 4번 일부 | ✅ Uber | ❌ |
| D3 | 전화 다이얼 (tel:) | (제 추가) | ✅ | ❌ |
| D4 | 이메일 (mailto·Gmail OAuth 영수증) | ✅ 5번 | ✅ 부분 | ❌ |
| D5 | 인스타그램 공유 | ✅ 7번 | ❌ | ❌ |
| D6 | OTA 가격 비교 (Klook·Agoda·KKday) | (제 추가, 수익 모델) | ✅ 직링크 | ❌ |
| D7 | 카카오맵 (한국인 친숙) | (제 추가) | ❌ | ❌ |
| D8 | 항공권 일정 자동 import (PDF/이메일) | (제 추가) | ❌ | ❌ |

→ **D1·D2·D3·D4는 단순 deeplink — Tier 1**. D5·D8은 복잡 — Tier 2~3.

### E. 여행 후 (Post) — Tier 2~3

| ID | 갭 | 사용자 지적 | 시드니 보유 | 우리 MVP |
|----|-----|----|----|----|
| E1 | 자동 정산 (일행 비용 분배) | (제 추가) | ❌ (단순 합계만) | ❌ |
| E2 | 여행 일기·후기 | (제 추가) | ❌ | ❌ |
| E3 | 사진 자동 앨범 (위치·날짜) | (제 추가) | ❌ | ❌ |
| E4 | 다음 여행 추천 | (제 추가) | ❌ | ❌ |

→ **E는 모드 전환의 "여행 후"가 아직 빈 칸**임을 노출. 사이클 9+.

### F. 트러스트 / 안전 / 도구 — Tier 1+2

| ID | 갭 | 사용자 지적 | 시드니 보유 | 우리 MVP |
|----|-----|----|----|----|
| F1 | 한국 영사관·외교부 핫라인 | (제 추가, 시드니 = B1) | ✅ | ❌ |
| F2 | 약국·병원 위치·24시간 영업 | (제 추가) | ❌ | ❌ |
| F3 | 사고·도난 가이드 (분실신고·보험) | (제 추가) | ❌ | ❌ |
| F4 | D-Day 체크리스트 (서류·짐·검역) | (제 추가) | ✅ /checklist | ❌ |
| F5 | 비용 관리 (KRW+현지통화·예산) | (제 추가) | ✅ /cost | ❌ |
| F6 | 광고/스폰서 라벨링 | (제 추가) | ❌ | ❌ |

→ **F1·F4·F5는 Tier 1**.

---

## 2. Tier 분류 (사이클 6 합의 — 우선순위)

### 🟢 Tier 1 — MVP v2 출시 필수 (사이클 7~10에 분배)

```
A1 Google Map 통합 — 일정 카드/상세에 인라인 지도 + 길찾기 deeplink
A3 관광지 이미지 — Place 모델 + 큐레이션 풀에서 제공
A5 일정 자유 추가 — 사용자가 시드 외 항목 직접 입력
B1 응급 핫라인 박스 — /travel 화면 하단 고정
B2 결제·환전·환율 정보 — 도시 데이터 풀
B3 현지 교통 (그랩·우버·지하철) — 도시 데이터 풀
B4 전압·플러그·SIM — 도시 데이터 풀
B5 비자·검역·치안 — 도시 데이터 풀
B8 상황별 영어/현지어 카드 — 시드니 패턴 그대로
F1 한국 영사관·외교부 — B1과 묶음
F4 D-Day 체크리스트 — /checklist 신규 화면
F5 비용 관리 (이중통화·동기화 키) — /cost 신규 화면
D1 Google Maps deeplink — 모든 위치에
D2 우버·그랩 deeplink — 도시 데이터 풀의 좌표로
D3 전화 다이얼 — 응급/예약 모두
D4 이메일 mailto — 예약 항목
A2 일정 카드 드래그 정렬 — 사이클 8 (M3 Replan과 결합)
```

### 🟡 Tier 2 — 베타 출시 후 1~2개월

```
C1 일정 공유 링크 (URL 토큰)
C2 동기화 키 (시드니 패턴 채택)
C3 카카오 OAuth (일행 초대)
C4 일행 투표
D6 OTA 가격 비교 (Klook·KKday·Agoda) — 수익 모델 핵심
D5 인스타그램 공유 (사진 + 일정 카드)
D7 카카오맵 통합
F2 약국·병원 위치
B6 날씨·복장
A4 검색
```

### 🔴 Tier 3 — 의도적 미루기 (트랩)

```
C5 댓글·반응 (콜드스타트 지옥)
C6 공개 일정 갤러리 (콘텐츠 모더레이션 부담)
D8 항공권 자동 import (eml 파싱 복잡)
E1~E4 여행 후 정산·일기·앨범 (출시 후 6개월+)
B7 팁 문화·화장실 (쪼가리 정보 — 큰 카테고리에 흡수)
F3 사고·도난 가이드 (전문 콘텐츠 — 추후 외주)
F6 광고 라벨링 (수익 모델 본격 도입 시)
```

---

## 3. 매직 모먼트 v2 (M1~M8)

기존 M1~M4 유지 + 신규 M5~M8 추가:

| # | 모먼트 | v1/v2 | 화면 |
|---|--------|------|------|
| M1 | 추천 근거 패널 | v1 ✅ | 일정 상세 |
| M2 | D-Day 모드 전환 | v1 ✅ (데모) | 여행 중 홈 |
| M3 | Live Replan | v1 ✅ (시뮬) | 모달 |
| M4 | 카메라 번역 | v1 ✅ (정적) | /translate |
| **M5** | **응급/실용 박스 (도시 컨텍스트)** | **v2 신규** | **/travel 푸터 + /city 신규** |
| **M6** | **D-Day 체크리스트 + 비용 관리** | **v2 신규** | **/checklist /cost** |
| **M7** | **공유 링크 + 동기화 키 협업** | **v2 신규** | **/share** |
| **M8** | **OTA 가격 비교 (수익 모델)** | **v2 신규** | **일정 상세 인라인** |

→ M5~M7은 시드니 패턴을 모방. M8은 우리만의 차별화 (수익 모델).

---

## 4. 데이터 모델 갱신 계획 (lib/types.ts + prisma/schema.prisma)

### 신규 모델

```typescript
// City — 도시별 큐레이션 데이터 풀
interface City {
  code: string;              // "PQC"
  name: string;              // "푸꾸옥"
  country: string;           // "베트남"
  emergencyContacts: EmergencyContact[];
  payment: PaymentInfo;      // 통화·환율·ATM·카드 사용성
  transport: TransportInfo;  // 그랩·택시·지하철·우버
  utilities: UtilityInfo;    // 전압·플러그·심카드
  visa: VisaInfo;            // ETA·체류일·검역
  weather: WeatherInfo;      // 계절·기온·복장
  phrases: SituationalPhrase[]; // B8 상황별 카드
  curatedGuides: CuratedGuide[]; // /vivid 같은 시그니처 가이드
}

// Place — A3 이미지 + Google Place 풀
interface Place {
  id: string;
  cityCode: string;
  googlePlaceId?: string;
  name: string;
  category: ItemCategory;
  location: { lat: number; lng: number; address: string };
  photos: string[];        // 큐레이션 + Google Places photos
  averagePrice?: { amount: number; currency: string };
  // ... (기존 evidence 등)
}

// ItineraryItem 확장 (시드니 패턴 흡수)
interface ItineraryItem {
  // ... 기존 ...
  // bookingStatus 확장
  booking?: {
    status: "confirmed" | "pending" | "cancelled" | "tentative";
    bookingNumber?: string;
    provider?: string;
    voucherUrl?: string;
    receiptUrl?: string;
    payment: { status: "prepaid"|"holding"|"on-site"; method?: string };
    cancellation?: { policy: string; deadline?: string; fee?: string };
    dressCode?: string;
    meetingPoint?: { address: string; lat: number; lng: number };
    bringList?: string[];
    specialRequests?: string[];
  };
  // 외부 링크
  externalLinks?: {
    googleMaps?: string;
    uber?: string;
    grab?: string;
    phone?: string;
    email?: string;
    website?: string;
    bookingPlatform?: { name: string; url: string };
  };
}

// PreTripChecklist — F4
interface ChecklistItem {
  id: string;
  tripId: string;
  category: "documents"|"clothing"|"electronics"|"forbidden"|"declarable"|"custom";
  text: string;
  dDayBucket: "D-30"|"D-14"|"D-7"|"D-1"|"during"|"after";
  done: boolean;
  cityNote?: string;  // 도시별 특이사항
}

// CostEntry — F5 비용 관리
interface CostEntry {
  id: string;
  tripId: string;
  date: string;
  label: string;
  amountKrw: number;
  amountLocal: { value: number; currency: string };
  status: "paid"|"booked"|"planned";
  splitWith?: string[];  // E1 정산 — Tier 2
}

// ShareLink — C1·C2
interface ShareLink {
  id: string;
  tripId: string;
  syncKey: string;       // 시드니 패턴: 문자열 키만으로 협업
  permission: "view"|"edit";
  expiresAt?: string;
}
```

### 데이터 소스 매핑 갱신 (docs/04-data-model.md 보강)

| 정보 | 소스 | 형태 |
|------|------|------|
| 응급/영사관 (B1·F1) | 외교부 영사콜센터·각국 가이드 | 정적 도시 풀 |
| 환율 (B2) | 한국은행 API or 정적 + 실시간 표시 | API + 캐시 |
| 그랩/우버 deeplink (B3·D2) | 좌표 → 표준 URL 스킴 | 클라이언트 생성 |
| 전압·SIM (B4) | 정적 도시 풀 | 시드 |
| 비자 (B5) | 외교부 트래블맵 | 정적 (분기 갱신) |
| 상황별 카드 (B8) | LLM 사전 생성 + 사람 검수 | 시드 |
| 사진 (A3) | Google Places photos + 큐레이션 | 캐시 + 정적 |

---

## 5. 로드맵 v2 (사이클 5b → 12, 사용자 결정 반영)

```
사이클 5a ✅ Railway 외부 노출 (완료 — 데모 모드)
       │
       ▼
사이클 5b ⏳ 인프라 (사용자 결정: "먼저 튼튼히")
   5b-1: Prisma 7 adapter + PostgreSQL + prisma.config.ts + 첫 Server Action + writeAuditLog 실호출
   5b-2: Geolocation 권한 + M2 자동 트리거 + Privacy ADR
   5b-3: 외부 API (Google Vision OCR + Claude API + Naver 후기 인덱싱)
       │
       ▼
사이클 7    A1·A3·D1 — Place 모델 + 이미지 + Google Maps deeplink
사이클 8    M5 — 푸꾸옥 City 데이터 풀 (B1~B5·B8·F1) + 응급 박스 + 다낭 시드 데이터 추가
사이클 9    M6 — /checklist + /cost (이중통화·동기화 키)
사이클 10   UX 보강 — 카드 드래그(A2) · 자유 추가(A5) · 검색(A4)
사이클 11   M7 — 공유 링크 + 동기화 키 + 카카오 OAuth
사이클 12   M8 — OTA 가격 비교 + 어필리에이트 추적 (수익 모델)
       │
       ▼
v2 출시 (PWA · 푸꾸옥 + 다낭 2도시)
       │
       ▼
v3 (별도 프로젝트): React Native 디렉 앱 + 인스타 공유·푸시·심층 카메라
```

각 사이클은 5단계 프로세스 + 4단계 검증 통과 의무.

---

## 6. 합의 결과 (사용자 7개 결정 — 2026-04-29)

| # | 결정 | 근거 |
|---|------|------|
| 1 | M5·M6·M7·M8 모두 채택 | 매직 모먼트 8개 — v1의 M1~M4 + v2 신규 4개 |
| 2 | 5b 인프라 먼저 → 7+ v2 기능 | "인프라 먼저 튼튼히" — 5b 위에 v2 |
| 3 | v2 도시 = 푸꾸옥 + 다낭 | 한국인 자주 가는 베트남 2도시 |
| 4 | M8 OTA 수익 = 사이클 12 | 신뢰 도시 우선, PMF 검증 후 수익 |
| 5 | Tier 1 원안 유지 | 절단 없이 모두 출시 필수 |
| 6 | 카카오 OAuth = 사이클 11 | 동기화 키(C2) 단순 협업 → OAuth |
| 7 | 앱 = v2 PWA → React Native | 속도 우선, 검증 후 네이티브 |

## 7. 다음 사이클 (5b 분할 제안 — 사이클 6 종료 시 STEP 1 Triage 입력)

```
사이클 5b-1 (다음): Prisma adapter + PostgreSQL + 첫 mutation Server Action + writeAuditLog 실호출
   - ADR-013 (Prisma 7 driver adapter — @prisma/adapter-pg + pg)
   - prisma.config.ts 도입
   - Railway PostgreSQL 추가 (사용자 클릭)
   - 첫 mutation Server Action: trip.create 또는 itinerary.update
   - writeAuditLog 실호출 검증

사이클 5b-2: Geolocation + M2 자동 트리거 + Privacy ADR
   - ADR-017 (Geolocation 권한 + 위치 데이터 처리 정책)
   - lib/mode-transition.ts에 navigator.geolocation 통합
   - 자동 트리거 활성화 (D-Day=0 + 도시 경계 안)

사이클 5b-3: 외부 API
   - ADR-018 (Google Vision OCR + Claude API)
   - ADR-019 (Naver Search API + 후기 인덱싱)
   - .env.example 변수 사용자가 직접 등록 (Railway Variables)
```

## 8. 변경 이력

- 2026-04-29: 초안 작성 + 사용자 7개 결정 → Accepted 격상.
