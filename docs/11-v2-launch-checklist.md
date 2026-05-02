# 11. v2 출시 체크리스트

> 사이클 J 산출물. v2 출시 전 점검 항목.

---

## 🔧 기술 인프라

### 코드·빌드
- [x] `npx tsc --noEmit` 통과
- [x] `npm run build` 통과 (모든 라우트 컴파일)
- [x] `npx prisma generate` 통과
- [ ] 단위 테스트 (S-14 미도입) — K Playwright E2E로 보완
- [x] ESLint 경고 검토 (inline-style 등 unavoidable 제외)

### 배포
- [x] Railway 라이브 배포 — `https://traveldiary-mvp-production.up.railway.app`
- [x] 자동 마이그레이션 (`prisma migrate deploy && next start`)
- [x] /api/health healthcheck — `database: ok`
- [x] 마이그레이션 0001~0006 라이브 적용 검증

### 보안 (사이클 A+B+C)
- [x] 권한 검증 (`canWriteTrip`) — 14 mutation 모두
- [x] 보안 헤더 (HSTS / X-Frame-Options DENY / nosniff / Referrer-Policy / Permissions-Policy)
- [x] OAuth JWT (jose) + httpOnly·Secure·SameSite=Lax 쿠키
- [x] server-only 격리 (외부 API 키)
- [x] Geolocation 좌표 서버 미전송 (ADR-017)
- [x] AuditLog actorId 14 mutation 적용 (ADR-026)
- [ ] 시크릿 회전 정책 문서화 (S-11 §1.5 — 분기별)
- [ ] CSP (Content Security Policy) 추가 검토 — v2.1+

---

## 🎨 콘텐츠

### 도시 큐레이션 (M5)
- [x] 푸꾸옥 (24곳 + 시그니처 가이드)
- [x] 다낭
- [x] 방콕
- [x] 도쿄
- [ ] 오사카·교토·후쿠오카 — v2.1+
- [ ] 하노이·호치민 — v2.1+

### 시드 데이터
- [x] 푸꾸옥 12 일정 + 24곳 풀
- [x] 메뉴 시드 (M4 카메라 번역 데모용)
- [x] 체크리스트 22 템플릿 (D-30 ~ after)
- [x] OTA Offer 12건 (Klook/KKday/Agoda × 5 액티비티)

### 이미지
- [x] picsum.photos placeholder (시드 24곳 자동)
- [ ] 진짜 큐레이션 이미지 — v2.1+ 콘텐츠 사이클

---

## 🔑 사용자 액션 (옵션, 미설정 OK)

### 활성 시 효과 큰 순
- [ ] **카카오 OAuth** (KAKAO_CLIENT_ID/SECRET + JWT_SECRET) → 로그인 + actorId
- [ ] **Google Places** (GOOGLE_PLACES_API_KEY) → M1 검증 배지
- [ ] **Vision + Claude** (GOOGLE_VISION_API_KEY + ANTHROPIC_API_KEY) → M4 실 동작
- [ ] **Naver** (NAVER_CLIENT_ID/SECRET) → M1 한국어 후기
- [ ] **Maps Embed** (NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY) → 인라인 지도
- [ ] **OTA 어필리에이트** (KLOOK/KKDAY/AGODA × _AFFILIATE_ID + _API_KEY) → M8 수익

### 가이드
각 ADR의 "사용자 직접 액션" 절 참조:
- ADR-018 Google Places
- ADR-019 Vision + Claude
- ADR-020 Naver
- ADR-026 카카오 OAuth
- ADR-028 Maps Embed
- ADR-025 + ADR-027 OTA

---

## 🧪 QA 시나리오 (수동 또는 K E2E)

### 골든 패스
- [ ] 홈 → 로그인 (또는 단일 사용자) → 온보딩 4단계 → 일정 자동 생성
- [ ] 일정 상세 → 추천 근거 패널 펼침 → Naver/Google evidence 노출
- [ ] M3 Replan 옵션 적용 → DB 영속화
- [ ] M2 데모 토글 → /travel/[id] → "내 위치로 자동 전환" → in-travel mode
- [ ] M4 카메라 번역 → 사진 업로드 → 결과 (Vision/Claude 키 있을 때)
- [ ] M5 도시 가이드 (/city/phu-quoc) → 응급/결제/교통/한마디
- [ ] M6 체크리스트 → "기본 템플릿 추가" → 토글
- [ ] M6 비용 → 이중통화 입력 → splitWith 정산 (사용자 액션)
- [ ] M7 공유 링크 → URL 복사 → 다른 브라우저 진입 view-only
- [ ] M7 공유 OG 이미지 → 인스타·카톡에서 미리보기 (slack-curl 또는 og-debug)
- [ ] M8 OTA 비교 → 카드 클릭 → AuditLog `affiliate.click` 적재
- [ ] /admin/affiliate → 대시보드 노출
- [ ] /vote/[tripId] → 새 투표 + 옵션 토글

### 권한 검증
- [ ] User A 로그인 → Trip 생성
- [ ] User B 로그인 → A의 Trip mutation 호출 → `forbidden`
- [ ] User A → 자기 Trip mutation → 통과

### 회귀 (데모 모드)
- [ ] 모든 환경변수 미설정 → 데모 trip 정상 동작
- [ ] DB 미연결 → /api/health `demo`
- [ ] OAuth 미설정 → LoginButton disabled, 단일 사용자 모드

---

## 📊 성능

- [ ] First Load JS < 110KB (현재 모든 라우트 통과)
- [ ] 인라인 지도 lazy 로딩 (이미 적용)
- [ ] 이미지 lazy 로딩 (이미 적용)
- [ ] EvidenceCache 24h/12h TTL — 외부 API 비용 통제
- [ ] CDN 캐시 헤더 (OG 이미지 1h, share 페이지 검토)

---

## 📣 마케팅·콘텐츠 (출시 후)

- [ ] 사용자 안내 (`?auth_error` 처리·로그인 후 첫 진입 가이드)
- [ ] 인스타·블로그 미리보기 검증 (OG 이미지 1200x630)
- [ ] 카카오톡 공유 미리보기 (open graph 호환 확인)
- [ ] 베타 사용자 모집 — 50명 푸꾸옥 출발자
- [ ] 사용자 피드백 채널 (이메일·카카오 채널)

---

## 📈 출시 후 측정 지표

- [ ] /api/health uptime ≥ 99.5% (Railway 모니터링)
- [ ] 평균 trip당 mutation 수 (audit log 집계)
- [ ] M1 추천 근거 패널 펼침율
- [ ] M3 Live Replan 시뮬·적용 비율
- [ ] M4 카메라 번역 사용 빈도 (Claude API 비용 추적)
- [ ] M8 어필리에이트 클릭 → commission 정산 비교 (월별)

---

## ✅ 출시 결정 기준

다음을 모두 만족하면 v2 정식 출시:

1. **기술**: 위 §🔧 모두 ✅, 보안 검토 통과
2. **콘텐츠**: 푸꾸옥/다낭/방콕/도쿄 4 도시 큐레이션 완료 (✅)
3. **사용자 액션**: 카카오 OAuth + Google Places + Naver 최소 3개 키 활성
4. **검증**: §🧪 골든 패스 시나리오 모두 통과
5. **모니터링**: /api/health 7일 연속 healthy

---

## 🚧 v2.1+ 후속 (출시 후)

- 11d ShareLink edit 권한 검증 (현재 owner만)
- 12d 실 commission CSV import + 어필리에이트 검증
- 5b-7 Claude로 블로그 본문 정밀 긍정율 분석
- A4 검색 (Tier 2)
- D5 Threads/X 공유 추가
- E1 자동 정산 결제 연동 (토스페이먼츠 등)
- 7.5+ Maps Embed directions Geolocation 검증 흐름
- 인스타·블로그 자동 임베드 (UGC)
- 콘텐츠 마켓 (공개 일정 갤러리, Tier 3 트랩이지만 사용자 가치 ↑면 검토)
