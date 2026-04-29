# Skill: Evidence Gathering (근거 수집)

> **스킬 유형**: 도메인 스킬
> **핵심 내용**: 추천 근거 수집, 소스 검증, 긍정율 계산
> **사용 에이전트**: T3 Evidence Collector

## 개요

M1 추천 근거 패널의 핵심 데이터인 Evidence를 수집하는 패턴이다.
"네이버 후기 387건 중 92% 긍정" 같은 근거를 생성한다.

## Evidence 구조

```typescript
interface Evidence {
  reasons: string[];           // ["네이버 후기 387건 중 92% 긍정", ...]
  sources: EvidenceSource[];   // 출처 — 검증 가능성
  verifiedAt: string;
  warnings?: string[];
}

interface EvidenceSource {
  platform: "naver" | "google" | "kakao" | "ota";
  url: string;
  reviewCount: number;
  positiveRate: number;
  lastVerified: string;
}
```

## 근거 수집 파이프라인

```
1. 장소 ID 수신
       ↓
2. 플랫폼별 후기 수집 (네이버, 구글, OTA)
       ↓
3. 긍정율 계산
       ↓
4. 소스 검증
       ↓
5. Evidence 생성
       ↓
6. 검증 결과 저장
```

## 플랫폼별 수집 전략

### 네이버

```
수집: 블로그 후기, 카페 후기
한계: API 호출 제한 (1일 1만 회)
정리: "네이버 블로그 후기 N건 중 X% 긍정"
```

### 구글

```
수집: Places 리뷰
한계: 5개 이상부터 신뢰
정리: "구글 리뷰 N건 중 X% 긍정"
```

### OTA (Klook, Agoda)

```
수집: Affiliate 후기
한계: 파트너십 필요
정리: "OTA 후기 N건"
```

## 긍정율 계산 공식

```
positiveRate = (긍정 후기 수 / 총 후기 수) × 100

긍정 정의:
- 별점 4~5점 (5점 만점)
- 또는 "좋아요", "추천" 등 긍정 키워드
```

### 신뢰도 기준

| 후기 수 | 신뢰도 | 표시 |
|---------|--------|------|
| ≥ 100 | 높음 | "387건 중 92% 긍정" |
| 30~99 | 중간 | "87건 중 88% 긍정" |
| 10~29 | 낮음 | "후기 23건" |
| < 10 | 매우 낮음 | "후기 부족" |

## 근거 생성 규칙

### 필수 근거 (항상 포함)

1. **후기 기반**
   ```
   "[플랫폼] 후기 N건 중 X% 긍정"
   ```

2. **위치 기반**
   ```
   "[다음 일정]과 도보/지하철 N분"
   ```

3. **취향 기반**
   ```
   "당신의 취향 '[취향]'과 일치"
   ```

### 선택 근거

- 계절적 적합성: "봄철 인기 메뉴"
- 현지인 비율: "현지인 60% 방문" (검증 시)
- 가격 경쟁력: "동일 메뉴 대비 10% 저렴"

### 금지 근거

- ❌ 검증 불가능한 추정 ("현지인 비율 60%")
- ❌ 출처 없는 주장
- ❌ 과장된 표현 ("최고의 맛")

## 근거 부족 시 처리

| 상황 | 처리 |
|------|------|
| 후기 10개 미만 | 이유만 표시, 숫자 생략 |
| 출처 0개 | 패널 숨김 |
| 긍정율 50% 미만 | "후기 평가 낮음" 경고 |

## 소스 검증

### 검증 가능성 점수

```typescript
function calculateSourceCredibility(source: EvidenceSource): number {
  let score = 0;
  
  // 플랫폼 신뢰도
  if (source.platform === "naver") score += 30;
  if (source.platform === "google") score += 30;
  if (source.platform === "ota") score += 20;
  
  // 후기 수
  if (source.reviewCount >= 100) score += 20;
  else if (source.reviewCount >= 30) score += 10;
  
  // 최근 검증
  const daysSinceVerify = daysBetween(source.lastVerified, now());
  if (daysSinceVerify < 7) score += 20;
  else if (daysSinceVerify < 30) score += 10;
  
  return score; // 0~100
}
```

## 구현 예시

```typescript
// lib/evidence.ts

export async function gatherEvidence(placeId: string): Promise<Evidence> {
  // 1. 플랫폼별 후기 수집
  const [naverReviews, googleReviews, otaReviews] = await Promise.all([
    fetchNaverReviews(placeId),
    fetchGoogleReviews(placeId),
    fetchOTAReviews(placeId)
  ]);
  
  // 2. 긍정율 계산
  const positiveRate = calculatePositiveRate(naverReviews);
  
  // 3. 근거 생성
  const reasons = [
    `네이버 후기 ${naverReviews.length}건 중 ${positiveRate}% 긍정`,
    `구글 리뷰 ${googleReviews.length}건`,
  ];
  
  // 4. 소스 검증
  const sources = [
    { platform: "naver", reviewCount: naverReviews.length, positiveRate, ... },
    { platform: "google", reviewCount: googleReviews.length, ... },
  ];
  
  return { reasons, sources, verifiedAt: new Date().toISOString() };
}
```

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\evidence-gathering.md`