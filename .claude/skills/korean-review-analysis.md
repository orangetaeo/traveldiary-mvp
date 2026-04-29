# Skill: Korean Review Analysis (한국어 후기 분석)

> **스킬 유형**: 도메인 스킬
> **핵심 내용**: 한국어 후기 LLM 요약, 인덱싱, 긍정/부정 분석
> **사용 에이전트**: T3 Evidence Collector

## 개요

한국어 후기(네이버 블로그, 카페)를 분석하여 추천 근거로 변환하는 스킬이다.
"네이버 후기 387건 중 92% 긍정" 같은 근거를 생성한다.

## 분석 대상

| 플랫폼 | 유형 | 수집 방법 |
|--------|------|----------|
| 네이버 | 블로그 후기, 카페 후기 | API (제한あり) |
| 구글 | 한국어 리뷰 | Places API |
| 카카오 | 플레이스 후기 | API 필요 |

## 분석 파이프라인

```
1. 후기 수집 (플랫폼별)
       ↓
2. 텍스트 정제 (HTML 태그, 이모지 제거)
       ↓
3. LLM 요약 (핵심 키워드, 평가 추출)
       ↓
4. 긍정/부정 분류
       ↓
5. 긍정율 계산
       ↓
6. 근거 생성
```

## 텍스트 정제

```typescript
function cleanReviewText(text: string): string {
  return text
    // HTML 태그 제거
    .replace(/<[^>]*>/g, "")
    // 이모지 제거 (선택적)
    .replace(/[\u{1F300}-\u{1F6FF}]/gu, "")
    // URL 제거
    .replace(/https?:\/\/[^\s]+/g, "")
    //多余 공백 제거
    .replace(/\s+/g, " ")
    .trim();
}
```

## LLM 요약 프롬프트

```typescript
const SUMMARY_PROMPT = `
다음은 여행 장소에 대한 한국어 후기입니다.
이 후기들을 분석하여 다음 정보를 추출해주세요:

1. **핵심 키워드** (3~5개): 이 장소의 특징을 나타내는 단어
2. **긍정 평가**: 방문자가 좋게 평가한 부분
3. **부정 평가**: 방문자가 아쉬게 평가한 부분
4. **종합 평가**: 한 줄 요약

후기:
{reviews}

JSON 형식으로 출력:
{
  "keywords": ["키워드1", "키워드2", ...],
  "positive": ["긍정1", "긍정2", ...],
  "negative": ["부정1", "부정2", ...],
  "summary": "종합 평가"
}
`;
```

## 긍정/부정 분류

### 규칙 기반 분류

```typescript
function classifySentiment(text: string): "positive" | "negative" | "neutral" {
  const positiveKeywords = [
    "좋아요", "추천", "만족", "최고", "훌륭", "감동", 
    "맛있", "친절", "깨끗", "재밌", "행복", "만족스러움"
  ];
  
  const negativeKeywords = [
    "실망", "아쉬", "불만", "별로", "최악", "비추", 
    "맛없", "불친절", "더럽", "지루", "후회"
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const keyword of positiveKeywords) {
    if (text.includes(keyword)) positiveCount++;
  }
  
  for (const keyword of negativeKeywords) {
    if (text.includes(keyword)) negativeCount++;
  }
  
  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}
```

### LLM 기반 분류 (정확도 높음)

```typescript
async function classifyWithLLM(reviews: string[]): Promise<SentimentResult[]> {
  const prompt = `
다음 후기들의 감정을 분석해주세요:

${reviews.map((r, i) => `${i + 1}. ${r}`).join("\n")}

각 후기에 대해:
- positive: 긍정
- negative: 부정  
- neutral: 중립

JSON 배열로 출력:
[{"index": 0, "sentiment": "positive"}, ...]
`;

  const response = await llm.chat(prompt);
  return JSON.parse(response);
}
```

## 긍정율 계산

```typescript
function calculatePositiveRate(reviews: Review[]): number {
  const sentiments = reviews.map(r => classifySentiment(r.text));
  const positiveCount = sentiments.filter(s => s === "positive").length;
  return Math.round((positiveCount / reviews.length) * 100);
}

// 사용 예
// 후기 100개, 긍정 92개 → 92%
// 후기 50개, 긍정 25개 → 50%
```

## 근거 생성

### 기본 근거

```typescript
function generateEvidence(reviews: Review[]): Evidence {
  const positiveRate = calculatePositiveRate(reviews);
  const totalCount = reviews.length;
  
  // 근거 텍스트 생성
  const reasons = [
    `네이버 후기 ${totalCount}건 중 ${positiveRate}% 긍정`,
  ];
  
  // 선택적 근거
  if (totalCount >= 50) {
    const keywords = extractKeywords(reviews);
    reasons.push(`주요 키워드: ${keywords.slice(0, 3).join(", ")}`);
  }
  
  return {
    reasons,
    sources: [{
      platform: "naver",
      reviewCount: totalCount,
      positiveRate,
      verifiedAt: new Date().toISOString()
    }],
    verifiedAt: new Date().toISOString()
  };
}
```

## 신뢰도 기준

| 후기 수 | 신뢰도 | 표시 형식 |
|---------|--------|----------|
| ≥ 100 | 높음 | "387건 중 92% 긍정" |
| 30~99 | 중간 | "87건 중 88% 긍정" |
| 10~29 | 낮음 | "후기 23건" |
| < 10 | 매우 낮음 | "후기 부족" |

## 인덱싱 (검색 최적화)

```typescript
interface IndexedReview {
  placeId: string;
  platform: string;
  originalText: string;
  cleanedText: string;
  sentiment: "positive" | "negative" | "neutral";
  keywords: string[];
  extractedAt: string;
}

// 벡터 인덱싱 (필요 시)
async function indexReviews(reviews: Review[]): Promise<void> {
  for (const review of reviews) {
    const embedding = await getEmbedding(review.cleanedText);
    await vectorStore.upsert({
      id: review.id,
      values: embedding,
      metadata: {
        placeId: review.placeId,
        sentiment: review.sentiment,
        keywords: review.keywords
      }
    });
  }
}
```

## 구현 예시

```typescript
// lib/korean-review.ts

export async function analyzeKoreanReviews(placeId: string): Promise<Evidence> {
  // 1. 후기 수집
  const reviews = await fetchNaverReviews(placeId);
  
  // 2. 텍스트 정제
  const cleanedReviews = reviews.map(r => ({
    ...r,
    cleanedText: cleanReviewText(r.text)
  }));
  
  // 3. 감정 분류
  const sentiments = await Promise.all(
    cleanedReviews.map(r => classifySentiment(r.cleanedText))
  );
  
  // 4. 긍정율 계산
  const positiveRate = calculatePositiveRate(
    cleanedReviews.map((r, i) => ({ ...r, sentiment: sentiments[i] }))
  );
  
  // 5. 근거 생성
  return generateEvidence(cleanedReviews, positiveRate);
}
```

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\korean-review-analysis.md`