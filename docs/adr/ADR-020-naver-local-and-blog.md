---
id: ADR-020
title: Naver Local + Blog 검색 API (한국어 후기 인덱싱)
status: Accepted
date: 2026-04-30
decider: R1 CTO
proposer: T3 Evidence + T10 API
related: ADR-018 (Google Places), ADR-019 (Vision/Claude), 외부 API 표준 패턴
---

# ADR-020: Naver Search API (Local + Blog)

## 컨텍스트

- 5b-3 Google Places로 장소 검증 (placeExists/operatingStatus).
- 5b-5 Vision/Claude로 카메라 번역.
- 한국인 자유여행자 차별화 핵심 = "한국어 후기" — Naver 블로그가 가장 풍부 (시드 데이터에 이미 sources.platform=naver 있음).
- Naver Search API는 무료 (월 25,000 requests/day). 카카오 OAuth 별도, 사용자 액션 단순.

## 결정

### A. 신규 의존성 0개

내장 fetch. 5b-3/5b-5 패턴 답습.

### B. 두 endpoint

```
Local Search v1: https://openapi.naver.com/v1/search/local.json
Blog Search v1:  https://openapi.naver.com/v1/search/blog.json
```

헤더:
```
X-Naver-Client-Id: <NAVER_CLIENT_ID>
X-Naver-Client-Secret: <NAVER_CLIENT_SECRET>
```

### C. 캐싱

| Platform | TTL | 키 |
|----------|-----|-----|
| `naver.local` | 24h | hash(query + location) |
| `naver.blog` | 12h | hash(query) |

5b-3 EvidenceCache 활용.

### D. 통합 — `lib/services/korean-evidence.ts`

```typescript
gatherKoreanEvidence(item: ItineraryItem): Promise<Evidence | null>
  1. naver.search.local(item.name) → 첫 결과의 한국어 표기 + 전화번호
  2. naver.search.blog(item.name) → 후기 5건 + 긍정율 추정 (heuristic: title/description에 긍정 키워드)
  3. Evidence 생성:
     reasons: [
       "네이버 블로그 후기 N건",
       "한국 방문자 X% 긍정 추정 (heuristic)"
     ]
     sources: [{platform:"naver", url, reviewCount, lastVerified}]
```

긍정율 정밀 추정은 5b-7+ Claude API와 결합 (블로그 본문 LLM 분석).

### E. 데모 fallback

NAVER_CLIENT_ID + NAVER_CLIENT_SECRET 미설정 → `mode:"demo"` 즉시 반환.
시드 evidence(이미 sources.platform=naver 있음) 그대로 노출.

### F. UI 영향

5b-6은 *backend 인프라만*. EvidencePanel은 시드 evidence 그대로 표시.
사이클 5b-6.5+에서 verifyPlaceAction 응답에 Naver evidence 추가 → EvidencePanel에 동적 노출.

### G. AuditLog

`evidence.gathered` 재사용. metadata.source = `"naver.local" | "naver.blog"`.

### H. Privacy

- 사용자 검색어를 Naver에 전송 (Google과 동일).
- audit metadata에 query 기록 (5b-3 정책 동일).

### I. Rate Limit

- Naver: 25,000 req/day (무료) — 캐시 24h/12h로 충분.
- 분산 Rate Limit (S-11)은 사이클 운영 단계 (5b-6은 함수 내부 dedup만).

## 대안

### 대안 1 — 카카오 Daum 검색 채택 (비채택)
- Naver 블로그가 한국어 후기 양적·질적 우위
- 사이클 11c+에서 카카오 검색 추가 검토

### 대안 2 — Claude API로 블로그 본문 분석 (비채택)
- 비용 ↑, 정확도 ↑
- 5b-7+에서 분리

## 영향

### 긍정
- 한국인 특화 차별화 첫 활성 (Evidence reasons에 한국어 후기)
- M1 추천 근거 패널 신뢰도 ↑
- 5b-3 외부 API 표준 패턴 7번째

### 부정
- 사용자 액션 1건 (Naver Developer 콘솔 + Client ID/Secret)
- 긍정율 heuristic — 정밀도 한계

## 사용자 직접 액션

```
1. https://developers.naver.com 가입
2. 애플리케이션 등록:
   - 이름: TravelDiary MVP
   - 사용 API: 검색 (블로그 + 지역)
3. Client ID + Client Secret 발급
4. Railway Variables:
   - NAVER_CLIENT_ID=
   - NAVER_CLIENT_SECRET=
5. (자동) 재배포 → Naver evidence 활성
```

## 검증 통과 기준

- [ ] tsc + build 통과
- [ ] 키 미설정 → demo (회귀 0)
- [ ] 키 설정 + Local 호출 → 결과 캐시 + 한국어 표기 반환
- [ ] 키 설정 + Blog 호출 → 후기 5건 + heuristic 긍정율
- [ ] AuditLog `evidence.gathered` + metadata.source

## 사인오프

R1 ✅ · T3 ✅ · T10 ✅ · T13 ✅
