# TravelDiary

> **자유여행자를 위한 AI 여행 동반자**
> 일정을 짜고, 살아 움직이게 하고, 함께 만들어 가는 한 개의 앱.

[![Live](https://img.shields.io/badge/live-traveldiary--mvp.up.railway.app-7C3AED)](https://traveldiary-mvp-production.up.railway.app)
[![Healthcheck](https://img.shields.io/badge/healthcheck-%2Fapi%2Fhealth-success)](https://traveldiary-mvp-production.up.railway.app/api/health)

---

## ✨ 매직 모먼트 8개 (M1~M8)

| # | 모먼트 | 화면 | 상태 |
|---|--------|------|------|
| **M1** | 추천 근거 패널 — AI가 왜 이걸 골랐는지 출처와 함께 (네이버 후기 + Google Places 검증) | `/itinerary/[id]/item/[itemId]` | ✅ |
| **M2** | D-Day 자동 모드 전환 — 출발 당일 도시 진입 시 UI 자동 swap | `/travel/[id]` | ✅ |
| **M3** | Live Replan — 지연·악천후 시 AI 옵션 3개 (추천·안전·강행) | 모달 | ✅ |
| **M4** | 카메라 번역 — 메뉴 사진 → Vision OCR + Claude 번역 + 알레르기 분석 | `/translate` | ✅ |
| **M5** | 도시 컨텍스트 — 응급·결제·교통·한마디 큐레이션 (푸꾸옥/다낭/방콕/도쿄) | `/city/[slug]` | ✅ |
| **M6** | D-Day 체크리스트 + 비용 관리 — 이중통화 자동 변환 | `/checklist/[id]` `/cost/[id]` | ✅ |
| **M7** | 공유 링크 + 일행 투표 — 시드니 패턴 (OAuth 없이 URL 토큰) | `/share/[key]` `/vote/[id]` | ✅ |
| **M8** | OTA 가격 비교 — Klook · KKday · Agoda 어필리에이트 (수익 모델) | 일정 상세 인라인 | ✅ |

---

## 🛠️ 기술 스택

- **Next.js 14** (App Router, Server Components, Server Actions)
- **Prisma 7** + **PostgreSQL 16** (driver adapter `@prisma/adapter-pg`)
- **Tailwind CSS 3** + 커스텀 디자인 토큰 (Stitch 정렬)
- **TypeScript 5**
- **jose** — JWT (카카오 OAuth)
- **Railway** — 배포 + PostgreSQL + 자동 마이그레이션

신규 의존성 4개 (`@prisma/adapter-pg`, `pg`, `@types/pg`, `jose`).

---

## 🚀 빠른 시작

```bash
git clone https://github.com/orangetaeo/traveldiary-mvp
cd traveldiary-mvp
npm install
cp .env.example .env.local   # DATABASE_URL 등 채우기 (전부 옵션 — 비워도 데모 모드 동작)
npm run dev
# → http://localhost:3000
```

### 라이브

- **데모 사이트**: https://traveldiary-mvp-production.up.railway.app
- **헬스체크**: https://traveldiary-mvp-production.up.railway.app/api/health

---

## 🔐 환경변수 (모두 옵션 — 미설정 시 데모 fallback)

| 변수 | 사이클 | 활성 효과 |
|------|------|----------|
| `DATABASE_URL` | 5b-1 | DB persist (Railway PostgreSQL 자동 주입) |
| `NEXT_PUBLIC_APP_URL` | 11b | OAuth redirect base URL |
| **`KAKAO_CLIENT_ID/SECRET`** + `JWT_SECRET` | 11b | 카카오 로그인 + actorId |
| `GOOGLE_PLACES_API_KEY` | 5b-3 | M1 검증 배지 (placeExists/operatingStatus) |
| `GOOGLE_VISION_API_KEY` + `ANTHROPIC_API_KEY` | 5b-5 | M4 카메라 번역 실 동작 |
| `NAVER_CLIENT_ID/SECRET` | 5b-6 | M1 한국어 후기 evidence |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | 7.5 | 인라인 지도 (referrer 화이트리스트 필수) |
| `KLOOK/KKDAY/AGODA_AFFILIATE_ID` + `*_API_KEY` | 12 | M8 OTA 어필리에이트 + 실시간 가격 |

**키 발급 가이드**: 각 ADR(`docs/adr/ADR-018~028`) "사용자 직접 액션" 절 참조.

---

## 📁 구조

```
app/
  page.tsx                      # 홈 (Pre-trip)
  onboarding/                   # 4단계 트립 생성
  itinerary/[id]/               # 일정 전체 + 상세
  travel/[id]/                  # 여행 중 홈 (M2)
  translate/                    # 카메라 번역 (M4)
  city/[slug]/                  # 도시 가이드 (M5)
  checklist/[tripId]/           # D-Day 체크리스트 (M6)
  cost/[tripId]/                # 비용 관리 (M6)
  share/[key]/                  # 공유 링크 view (M7)
  vote/[tripId]/                # 일행 투표 (C4)
  admin/affiliate/              # 어필리에이트 통계 (M8)
  api/auth/kakao/{start,callback}/   # OAuth
  api/auth/logout/
  api/og/share/[key]/           # OG 이미지 (인스타 공유)
  api/health/

actions/                        # Server Actions (15+ mutations + audit log)
lib/
  auth/                         # JWT + session + kakao + authorize
  repositories/                 # Prisma 접근 계층
  services/                     # 외부 API (google-places, vision, claude, naver, ota/*)
  seed/cities/                  # 도시 큐레이션 (4 도시)
  utils/                        # deeplinks (Maps/Uber/Grab/카카오맵), affiliate URL

prisma/
  schema.prisma                 # 12 모델 (User, Trip, ItineraryItem, ChecklistItem, ...)
  migrations/0001~0006/         # 모두 라이브 자동 적용

components/                     # React 컴포넌트
docs/                           # ADR 18+개 + 비전·로드맵·매직모먼트 문서
.claude/                        # 하네스 도서관 (62권 — 에이전트·스킬·프로세스)
memory/                         # 세션 간 자동 메모리
```

---

## 🧪 검증

```bash
npx tsc --noEmit          # 타입 체크
npm run build             # 빌드
npx prisma generate       # Prisma 클라이언트 재생성
```

라이브 헬스체크:
```bash
curl https://traveldiary-mvp-production.up.railway.app/api/health
# → {"status":"healthy","cycle":"...","database":"ok"}
```

---

## 📚 문서

- **비전·로드맵**: [docs/01-vision.md](docs/01-vision.md), [docs/09-vision-v2.md](docs/09-vision-v2.md)
- **매직 모먼트**: [docs/02-magic-moments.md](docs/02-magic-moments.md)
- **데이터 모델**: [docs/04-data-model.md](docs/04-data-model.md)
- **로드맵**: [docs/05-roadmap.md](docs/05-roadmap.md)
- **Stitch 디자인 매핑**: [docs/10-stitch-mapping.md](docs/10-stitch-mapping.md)
- **출시 체크리스트**: [docs/11-v2-launch-checklist.md](docs/11-v2-launch-checklist.md)
- **ADR**: [docs/adr/](docs/adr/)
- **하네스 도서관**: [.claude/INDEX.md](.claude/INDEX.md)

---

## 🤝 보안·Privacy

- **OAuth (카카오)**: JWT (jose) + httpOnly·Secure·SameSite=Lax 쿠키
- **API 키**: server-only 격리. `NEXT_PUBLIC_*`은 HTTP referrer 화이트리스트로 보호
- **위치 데이터**: Geolocation 좌표는 클라이언트 메모리에만 — 서버 전송 X (ADR-017)
- **권한 검증**: Trip 자원 변경은 ownerId 일치 또는 단일 사용자 모드만 (`canWriteTrip`)
- **보안 헤더**: HSTS / X-Frame-Options DENY / nosniff / Referrer-Policy / Permissions-Policy

---

## 📄 라이선스

비공개 — TravelDiary MVP 프로젝트.
