# 사이클 4 다중 검증 리포트

| 검증 | 결과 |
|------|------|
| `tsc --noEmit` | ✅ 0건 |
| `next build` | ✅ 8 routes — `/translate` 4.37kB 신규 |
| 디자인 토큰 위반 | ✅ 0건 (`grep` 결과 components/ + app/translate 클린) |
| 신규 의존성 | ✅ 0개 |
| ADR-015 일치 | ✅ 외부 API 미호출, 정적 시드만 |

## ② 코드 리뷰 (T13)

1. **`lib/allergens.ts` 순수 함수** — 한·베·영 키워드 12 카테고리. seen Set으로 중복 매치 방지. ✅
2. **추측 금지 원칙 (S-08 핵심)** — 키워드 substring 일치만 사용. "해산물" 같은 추정 카테고리 매핑 없음. 알레르기는 생명 직결이라 보수적 정책. ✅
3. **MenuItemCard ingredients 칩 강조** — 매칭된 재료만 빨간색 — 시각적 환각 방지. ✅
4. **TranslateView useMemo** — excludes·sortByPopular 변경 시만 재계산. ✅
5. **Privacy** — 사용자 알레르기 칩 상태는 클라이언트 useState만, 서버 미전송 (S-08 §사용자 경험 원칙 준수). ✅
6. **button type 명시** — TravelHome FAB 버튼 type="button" 추가 (lint hint 해소). ✅

## ③ QA 골든패스

```
/travel/demo-trip-phu-quoc
  → FAB 카메라 📷 (코랄, 활성)
  → 클릭
[/translate?trip=demo-trip-phu-quoc]
  헤더: 메뉴 번역 / 즈엉동 야시장 시푸드
  알레르기 칩: 새우/갑각류/조개/땅콩/우유/돼지고기/비건
  정렬 토글: 한국인 인기순(기본) / 메뉴판 순서

  [기본] 메뉴 10개 인기순 정렬:
    까페 스아 다 (98) > 똠 훔 (96) > 퍼 보 (95) > 반쎄오 (91)
    꾸어 랑 메 (88) > 짜 죠 (87) > 묵 찌엔 (82) > 응에우 (79) > 까 럭 (74) > 분 짜 까 (71)

  → "갑각류 알레르기" 칩 클릭
  → 헤더 우상단 "5개 위험" 빨간 배지
  → 빨간 테두리 카드: 똠 훔 / 꾸어 랑 메 / 반쎄오 / 짜 죠 / (묵 찌엔=오징어 비매치)
    실제 매치: 똠훔(랍스터→갑각류), 꾸어(게→갑각류), 반쎄오(새우→갑각류), 짜죠(새우+게살→갑각류)
    묵 찌엔 = 오징어이므로 갑각류 비매치 ✅ (S-08 추측 금지)
  → 4개 위험 (헤더 카운트 4)

  → 추가 "땅콩 알레르기" 칩
  → 꾸어 랑 메 (땅콩 재료) → 추가 critical 매치 (이미 갑각류 위험 표시 위에 누적)

  → 정렬 "메뉴판 순서" 토글 → original 순서 (siterevious id 순)
```

## ④ CTO 사인오프

| 영역 | 평가 |
|------|------|
| 아키텍처 | ✅ Server page → Client TranslateView. Server Action은 사이클 5에서 OCR 결과 이체 시 도입. |
| 보안/Privacy | ✅ 알레르기 정보는 클라이언트 useState only. 서버 미전송. |
| 성능 | ✅ /translate 4.37kB, 메뉴 10개 useMemo |
| 환각 | ✅ "추측 금지" — 명시적 ingredients 키워드만 매칭 |
| 알레르기 안전성 | ✅ critical/preference 분리, severity 시각 차이 |

### 사인오프: ✅ M1~M4 4개 매직 모먼트 모두 시연 가능. **사이클 5 (Railway 배포 + 외부 API + DB) 진입 가능**.
