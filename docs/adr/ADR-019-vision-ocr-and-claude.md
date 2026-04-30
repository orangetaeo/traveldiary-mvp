---
id: ADR-019
title: Google Vision OCR + Anthropic Claude API (M4 카메라 번역 실 동작)
status: Accepted
date: 2026-04-30
decider: R1 CTO
proposer: T6 Translation Specialist + T10 API + T16 Security
related: ADR-015 (translate static seed), ADR-018 (Google Places + cache), 외부 API 표준 패턴 (feedback_external_api_pattern)
---

# ADR-019: Vision OCR + Claude API (M4 실 동작)

## 컨텍스트

- 사이클 4 ADR-015: M4 카메라 번역은 정적 베트남어 메뉴 시드로 시연.
- 5b-3 외부 API 표준 패턴 안착 (server-only, 데모 fallback, 캐시, audit fresh-only).
- M4 실 동작은 Vision OCR(이미지 → 텍스트) + Claude API(번역 + 알레르기 분석) 두 단계.
- Naver Local API는 별도 사이클 5b-6으로 분리 (가치 차이 + 사용자 액션 누적 회피).

## 결정

### A. 신규 의존성 0개

내장 fetch + Base64 이미지. SDK 미사용 (5b-3 패턴 답습).

### B. Vision OCR — Google Cloud Vision Image Annotation

```
POST https://vision.googleapis.com/v1/images:annotate?key=API_KEY
Body: {
  requests: [{
    image: { content: "<base64>" },
    features: [{ type: "TEXT_DETECTION", maxResults: 50 }]
  }]
}
Response: textAnnotations[0].description (전체 텍스트)
```

캐시 키: 이미지 SHA256 해시. TTL 7일 (이미지 변경 거의 없음).

### C. Claude API — Anthropic Messages

```
POST https://api.anthropic.com/v1/messages
Headers: x-api-key, anthropic-version: 2023-06-01
Body: {
  model: "claude-haiku-4-5-20251001",  // 가장 저렴/빠름
  max_tokens: 1024,
  messages: [{ role: "user", content: "<프롬프트>" }]
}
```

**프롬프트** (한국인 자유여행자용):
```
다음은 베트남어 메뉴 OCR 결과입니다. 한국어로 번역하고, 한국인이 흔히 알레르기 있는 재료(새우, 땅콩, 우유, 글루텐, 갑각류)를 표시해주세요.

OCR: <텍스트>

JSON 형식으로만 응답:
{
  "items": [
    { "vn": "원문", "ko": "번역", "allergens": ["shrimp"|"peanut"|...] }
  ]
}
```

캐시 키: prompt SHA256 해시. TTL 30일 (메뉴 응답은 변경 없음).

### D. 서비스 통합 — `lib/services/menu-translation.ts`

```typescript
translateMenuPhoto(imageBase64): Promise<MenuTranslationResult>
  1. Vision OCR (캐시 우선)
  2. Claude 번역+알레르기 분석 (캐시 우선)
  3. 결과 통합 → MenuItem[] (lib/seed/menu-phu-quoc.ts MenuItem 호환)
```

데모 fallback (5b-3 답습): 두 키 모두 미설정 → `{ mode: "demo" }` 반환, TranslateView가 정적 시드 사용.

### E. UI — TranslateView.tsx Capturing 단계 확장

현재 Capturing → Results 단순 전환. 5b-5에서:
- **Capturing**: 카메라 fallback이 없으니 파일 업로드 input 추가 (사이클 5b-5 단계엔 file input만, 카메라 native 통합은 별도)
- **Results**: 업로드된 사진의 OCR/번역 결과를 정적 시드 자리에 노출
- API 키 미설정 → 정적 시드 노출 + "데모 모드" 배지

### F. 보안 (T16)

- GOOGLE_VISION_API_KEY, ANTHROPIC_API_KEY는 server-only
- 사용자가 업로드한 이미지는 EvidenceCache에만 저장 (사용자 별도 보존 X)
- 이미지 해시만 DB 저장, 원본은 메모리 휘발

### G. AuditLog

- `evidence.gathered` 재사용
- metadata: { source: "vision" | "claude", cached, fetchDurationMs, error? }

### H. 비용 통제

- Vision OCR: $1.50 / 1000 이미지 (TEXT_DETECTION)
- Claude Haiku: 입력 $1 / 출력 $5 per 1M tokens — 메뉴 1장은 ~$0.001
- 캐시 7일/30일 — 같은 이미지 재호출 0건
- Rate Limit (S-11)은 5b-6에서 일괄 도입

## 대안

### 대안 1 — Naver Local API 동시 도입 (비채택)
- 사용자 액션 1건 더 발생
- M1 Evidence 보강은 5b-3 Google로 부분 달성
- 5b-6으로 분리

### 대안 2 — Vision/Claude SDK 채택 (비채택)
- 두 서비스만 호출, fetch로 충분 (5b-3 답습)

### 대안 3 — 클라이언트에서 Vision 직접 호출 (비채택)
- 키 노출 — Security 절대 금지

### 대안 4 — Anthropic이 Vision도 처리 (claude-haiku 멀티모달) (검토)
- Claude Haiku 4.5는 이미지 입력 가능. 두 단계를 한 단계로 단축 가능.
- 단점: 한 번 호출에 두 비용 — 입력 토큰 ↑ (이미지가 비용 큼)
- **결정**: 5b-5는 두 단계 분리 (캐시 효율 ↑, 디버깅 ↑). 통합 호출은 사이클 5b-5.5에서 검토.

## 영향

### 긍정
- M4 매직 모먼트 첫 실 동작 — 차별화 4축 마지막 활성
- 5b-3 외부 API 표준 패턴 검증 (Vision + Claude 추가)
- EvidenceCache 활용 확대

### 부정
- 사용자 직접 액션 2건 (Vision + Anthropic 키)
- 비용 발생 (월 ~$5 예상, 캐시로 통제)
- 이미지 처리 지연 (~3~5초)

### 트레이드오프
- 키 미설정 라이브에서 정적 시드 그대로 → 회귀 0. 사용자 의도적 활성 후 진짜 동작.

## 사용자 직접 액션

```
1. Google Cloud Console → Cloud Vision API 활성 → API key (HTTP referrer 제한)
2. Anthropic Console (https://console.anthropic.com) → API Key 발급
3. Railway Variables:
   - GOOGLE_VISION_API_KEY=<key>
   - ANTHROPIC_API_KEY=<key>
4. (자동) 재배포 → /translate 사진 업로드 → 실 OCR + Claude 번역
```

## 검증 통과 기준 (STEP 4)

- [ ] tsc + build 통과
- [ ] 키 미설정 → 정적 시드 그대로 노출 (회귀 0)
- [ ] 키 있음 + 이미지 업로드 → OCR 텍스트 추출 + Claude 번역 결과
- [ ] EvidenceCache 행 (vision.ocr / claude.menu) 적재
- [ ] AuditLog "evidence.gathered" + metadata.source 분기

## 사인오프

R1 ✅ · T6 ✅ · T10 ✅ · T16 ✅ · T13 ✅
