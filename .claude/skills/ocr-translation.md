# Skill S-07: OCR Translation (OCR + 번역)

> **스킬 유형**: 도메인 (M4)
> **핵심**: 카메라 → OCR → LLM 번역 → 한국어 특화
> **사용 에이전트**: T6 Translation Specialist

## 파이프라인

```
1. 이미지 캡처 (카메라)
       ↓
2. OCR 텍스트 추출
       ↓
3. 언어 감지
       ↓
4. LLM 번역 (문화적 맥락 포함)
       ↓
5. 한국어 특화 적용 (S-08 알레르기 필터)
       ↓
6. 사용자 노출
```

## OCR 엔진 선택 (CTO 게이트 통과)

| 엔진 | 장점 | 단점 | 채택 |
|------|------|------|------|
| Google Vision API | 정확도 높음, 다국어 | 비용 | **1차 선택** |
| Tesseract.js (브라우저) | 무료, 오프라인 | 정확도 ↓, 메모리 ↑ | fallback |
| Apple Vision (iOS) | 모바일 최적 | 플랫폼 종속 | (네이티브 시) |

> **결정**: Google Vision API + Tesseract fallback. ADR-009 작성.

## OCR 호출

```typescript
// lib/ocr.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';

const vision = new ImageAnnotatorClient({
  credentials: JSON.parse(process.env.GOOGLE_VISION_CREDENTIALS!),
});

export async function extractText(imageBuffer: Buffer): Promise<OCRResult> {
  const [result] = await vision.textDetection(imageBuffer);
  const fullText = result.fullTextAnnotation?.text ?? '';
  
  // 언어 감지
  const language = detectLanguage(fullText);
  
  // 줄별 분리 (메뉴판은 줄 구조가 중요)
  const lines = fullText.split('\n').filter(Boolean);
  
  return { fullText, lines, language };
}
```

## 언어 감지

```typescript
function detectLanguage(text: string): 'ja' | 'en' | 'zh' | 'ko' | 'unknown' {
  const samples = text.slice(0, 500);
  
  // 일본어 (히라가나/가타카나)
  if (/[぀-ゟ゠-ヿ]/.test(samples)) return 'ja';
  
  // 중국어 (한자만 — 일본어 한자와 구분 어려움 → LLM에 위임)
  if (/[一-鿿]/.test(samples) && !/[぀-ゟ]/.test(samples)) return 'zh';
  
  // 한국어
  if (/[가-힯]/.test(samples)) return 'ko';
  
  // 영어
  if (/^[\x00-\x7F]+$/.test(samples)) return 'en';
  
  return 'unknown';
}
```

## LLM 번역 (Claude API)

```typescript
// lib/translation.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function translateMenu(
  text: string,
  fromLang: string,
  userPrefs: UserPreferences
): Promise<TranslationResult> {
  const allergens = userPrefs.excludes.join(', ');
  
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001', // 비용 효율
    max_tokens: 2000,
    system: TRANSLATION_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: buildPrompt(text, fromLang, allergens),
    }],
  });
  
  return parseTranslationResponse(response.content[0]);
}
```

### 시스템 프롬프트

```typescript
const TRANSLATION_SYSTEM_PROMPT = `
당신은 한국 자유여행자를 위한 메뉴 번역 전문가입니다.

규칙:
1. 메뉴 항목별로 번역 (한 줄씩)
2. 일본어 한자 표현은 그대로 두고 한국어 음/뜻을 병기
3. 알레르기/식이 제한 정보를 정확히 추출
4. 가격 정보는 원화/일본 엔 모두 표시
5. 모르는 표현은 추측하지 말고 [원문]으로 두기 (환각 금지)

출력 형식:
{
  "items": [
    {
      "original": "天ぷら定食",
      "translated": "튀김 정식",
      "phonetic": "텐푸라 테이쇼쿠",
      "ingredients": ["새우", "야채"],
      "allergens": ["갑각류"],
      "price": { "original": "1,200円", "krw": "약 12,000원" }
    }
  ],
  "warnings": []
}
`;
```

### 환각 방지

```typescript
// LLM 출력에 포함된 [원문] 마커는 "확신 못 함" 신호
function flagUncertain(translated: string): { text: string; uncertain: boolean } {
  const uncertain = translated.includes('[원문]') || translated.includes('[?]');
  return { text: translated, uncertain };
}
```

> 확신 못 하는 번역은 **빨간 경고**로 표시. 사용자에게 "원문 그대로 보기" 옵션 제공.

## 한국어 특화 (문화 맥락)

| 원문 | 직역 | 문화 번역 |
|------|------|----------|
| `おひとり様` | 한 명 | **혼밥 가능** |
| `唐揚げ` | 튀긴 닭 | **카라아게** (일본식 닭튀김) |
| `〆` | 마지막 | **마무리 메뉴** |
| `おまかせ` | 맡김 | **셰프 추천 코스** |

이 매핑은 번역 후 후처리로 적용:

```typescript
const CULTURAL_MAPPINGS: Record<string, string> = {
  'おひとり様': '혼밥 가능',
  '唐揚げ': '카라아게 (일본식 닭튀김)',
  '〆': '마무리 메뉴',
  'おまかせ': '셰프 추천 코스',
};

function applyCulturalContext(translated: string): string {
  let result = translated;
  for (const [original, mapped] of Object.entries(CULTURAL_MAPPINGS)) {
    result = result.replace(original, mapped);
  }
  return result;
}
```

## 알레르기 필터 통합 (S-08 호출)

```typescript
import { applyAllergenFilter } from './allergen-filter';

export async function fullPipeline(
  imageBuffer: Buffer,
  userPrefs: UserPreferences
): Promise<MenuResult> {
  // 1. OCR
  const ocr = await extractText(imageBuffer);
  
  // 2. 번역
  const translated = await translateMenu(ocr.fullText, ocr.language, userPrefs);
  
  // 3. 알레르기 필터 (S-08)
  const filtered = applyAllergenFilter(translated, userPrefs.excludes);
  
  // 4. 감사 로그 (S-13)
  await writeAuditLog({
    action: 'translation.completed',
    resource: 'Translation',
    resourceId: generateId(),
    metadata: { language: ocr.language, allergens: userPrefs.excludes },
  });
  
  return filtered;
}
```

## 캐시 전략

```
같은 이미지 해시 → 24시간 캐시
같은 텍스트 → 7일 캐시 (메뉴 변동 적음)
```

## 비용 최적화

| 호출 | 비용 추정 | 최적화 |
|------|----------|--------|
| Google Vision OCR | $1.5 / 1000장 | 클라이언트에서 압축 후 전송 |
| Claude Haiku 번역 | $0.0008 / 메뉴 | 캐시 적극 활용 |

## 테스트 (S-14 P2)

골든 셋 100장 (도쿄 식당 메뉴 다양):
- 일반 메뉴
- 손글씨 메뉴
- 흑백 메뉴
- 복잡한 레이아웃

기준: 정확도 90% 이상.

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\ocr-translation.md`
