# TRAVELDIARY MVP

> **자유여행자를 위한 AI 여행 동반자**
> 일정을 짜고, 살아 움직이게 하고, 함께 만들어 가다.

---

## 0. 이 프로젝트가 뭐야?

이건 **시드니 여행 사이트와 별개의 새 프로젝트**예요. 시드니 사이트(`sydney-trip-production.up.railway.app`)는 절대 건드리지 않습니다.

**기획 단계 핵심 문서**는 `docs/` 폴더에 다 정리되어 있어요. 코드 짜기 전에 한 번 훑어보세요.

---

## 1. VSCode에서 시작하기

### 필요한 것
- **Node.js 18.17 이상** ([nodejs.org](https://nodejs.org/) 에서 설치)
- **VSCode** ([code.visualstudio.com](https://code.visualstudio.com/) 에서 설치)
- **Git** (이미 설치되어 있을 가능성 높음, `git --version`으로 확인)

### 추천 VSCode 확장 프로그램
- **ES7+ React/Redux/React-Native snippets** — React 자동완성
- **Tailwind CSS IntelliSense** — Tailwind 클래스 자동완성
- **Prettier** — 코드 포맷팅
- **TypeScript Vue Plugin** 끄기 (Next.js 충돌 방지)

### 처음 한 번만 실행
```bash
# 1. 의존성 설치 (몇 분 걸림)
npm install

# 2. 환경변수 파일 만들기 (현재는 비어있어도 됨)
cp .env.example .env.local

# 3. 개발 서버 켜기
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열면 첫 화면이 보입니다.

---

## 2. 폴더 구조 한눈에

```
traveldiary-mvp/
├── README.md               ← 지금 보고 있는 파일
├── docs/                   ← 📚 기획 문서 (이게 핵심)
│   ├── README.md           ← 기획 문서 인덱스
│   ├── 01-vision.md        ← 비전·차별화 가설
│   ├── 02-magic-moments.md ← M1~M4 정의
│   ├── 03-style-system.md  ← 디자인 시스템
│   ├── 04-data-model.md    ← 데이터 구조
│   ├── 05-api-strategy.md  ← API 통합·검증 레이어
│   └── screens/            ← 화면별 명세
│       ├── 01-onboarding.md       ← 온보딩 (✅ 구현됨)
│       ├── 02-itinerary-creating.md  ← 일정 생성 중 (⏳ 다음)
│       └── ...
│
├── app/                    ← Next.js 페이지 (URL = 폴더 경로)
│   ├── page.tsx            ← 홈 / "/"
│   ├── onboarding/         ← /onboarding
│   ├── itinerary/          ← /itinerary/[id]
│   └── travel/             ← /travel/[id] (여행 중 모드)
│
├── components/             ← 재사용 컴포넌트
│   ├── ui/                 ← 디자인 시스템 (Card, Badge, FilterChip…)
│   └── itinerary/          ← 일정 도메인 컴포넌트
│
├── lib/                    ← 유틸·타입·디자인 토큰
│   ├── design-tokens.ts    ← 색상·타이포·여백 (단일 진실 공급원)
│   └── types.ts            ← Itinerary, Item 등 타입 정의
│
└── public/                 ← 이미지·폰트
```

---

## 3. 개발 흐름 — 화면 단위로

이 프로젝트는 **"화면 하나씩 깊게"** 패턴으로 진행합니다.

### 한 화면을 작업할 때
1. `docs/screens/XX-화면이름.md` 읽기 (기획 명세)
2. `app/`에 페이지 만들기
3. `components/`에 필요한 컴포넌트 만들기
4. 브라우저에서 `npm run dev`로 즉시 확인
5. 명세대로 작동하면 다음 화면

### 현재 진행 상황 (사이클 1 완료 — 2026-04-29)
- [x] 홈 페이지 (`/`)
- [x] 온보딩 (`/onboarding`) — 4단계, 푸꾸옥 우선
- [x] 일정 생성 중 (`/itinerary/creating`) — 4단계 진행률 + 환각 차단 5단계 노출
- [x] 일정 전체 (`/itinerary/[id]`) — Day 탭 + 푸꾸옥 3박 4일 시연
- [x] 일정 상세 (`/itinerary/[id]/item/[itemId]`) — **M1 추천 근거 패널**
- [x] Prisma 스키마 + 감사 로그 유틸 (DATABASE_URL 미설정 시 데모 모드)
- [ ] 여행 중 홈 (`/travel/[id]`) — 사이클 3
- [ ] Live Replan — 사이클 2
- [ ] 카메라 번역 — 사이클 4
- [ ] Railway 배포 + E2E QA — 사이클 5

---

## 4. AI 도구 활용 팁

이 프로젝트는 **Claude Code, Cursor, GitHub Copilot 같은 AI 도구와 협업할 것을 전제**로 만들어졌어요.

### Claude Code (추천)
```bash
# 프로젝트 폴더에서
claude
```
그러면 Claude가 폴더 전체를 이해하고 작업해줍니다.

### Cursor 또는 Continue.dev
1. VSCode 대신 Cursor 설치 또는 Continue 확장 설치
2. `Cmd/Ctrl + L`로 채팅 열기
3. **`docs/` 폴더를 컨텍스트로 추가** — 이게 핵심. 기획서 보고 코드 짜게 만들기

### 좋은 프롬프트 예시
> "@docs/screens/02-itinerary-creating.md 명세를 따라서
> 푸꾸옥 시드 데이터(@lib/seed/phu-quoc.ts)로 일정 상세 화면을 만들어줘.
> `lib/design-tokens.ts`의 색상을 사용하고,
> `components/ui/Card.tsx` 같은 기존 컴포넌트를 재활용해."

### 나쁜 프롬프트 예시
> "여행앱 일정 생성 화면 만들어줘"

(컨텍스트 없으면 AI는 일반적인 결과를 줍니다. 우리 정체성과 안 맞아요.)

---

## 5. 배포 — Railway

시드니 사이트와 별개의 새 Railway 프로젝트로 배포합니다.

### 처음 한 번만
1. [railway.app](https://railway.app) 로그인 (GitHub 연동)
2. **New Project** → **Deploy from GitHub repo** → 이 저장소 선택
3. 프로젝트 이름: `traveldiary-mvp` (시드니 사이트와 다른 이름)
4. **Settings → Networking → Generate Domain**
   - 자동 생성되는 URL 예: `traveldiary-mvp-production.up.railway.app`
   - 시드니 사이트 URL과 다른지 반드시 확인

### 환경 변수 등록 (Railway → Variables)
나중에 API 키 받으면 등록할 것들:
- `OPENAI_API_KEY` — LLM 일정 생성
- `GOOGLE_PLACES_API_KEY` — 장소 검증
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` — 블로그 검색
- `KLOOK_AFFILIATE_ID` — 어필리에이트
- `DATABASE_URL` — Railway PostgreSQL (자동 생성)

`.env.example` 파일에 빈 템플릿 있음.

---

## 6. 디자인 시스템 — 흔들리지 않는 약속

### 5색 + 회색
- **보라 (purple)** — 계획·정보·AI 추천
- **코랄 (accent)** — 진행·시간·여행 중
- **앰버 (amber)** — 주의·지연·사회적 증거
- **빨강 (danger)** — 안전 위험만 (알레르기, 환불 불가) — 절대 남용 금지
- **초록 (success)** — 안전·완료·여행 후
- **회색 (ink/surface)** — 모든 중립

자세한 룰: `docs/03-style-system.md`

### 핵심 원칙
1. **색은 의미를 동반해야 함** — 예쁘다고 색 추가 금지
2. **한 화면에 색 3개 이내** — 메인 1 + 보조 1 + 회색
3. **검정 결정 버튼 한 화면 1개만** — 위계 명확

---

## 7. 다음에 할 일 (사이클 2~5)

1. **사이클 2 — M3 Live Replan**
   — DAG 재계산, 추천/안전/강행 옵션 모달, ImpactDisplay 컴포넌트
2. **사이클 3 — M2 D-Day 자동 모드 전환**
   — 여행 중 홈, 보라→코랄 색 전환, 위치+날짜 트리거
3. **사이클 4 — M4 카메라 번역**
   — 베트남어 메뉴판 OCR + 알레르기 경고
4. **사이클 5 — Railway 배포 + 실 운영 외부 API 연결**
   — Google Places · 네이버 검색 · OTA 어필리에이트

각 사이클은 `.claude/HARNESS.md`의 5단계 프로세스(Triage→회의→구현→4단검증→회고)를 통과합니다.
막힐 때 Claude(이 채팅)으로 돌아오면 사이클 단위로 도와드립니다.

---

## 8. 트러블슈팅

### `npm install`이 실패해요
- Node.js 버전이 18.17 이상인지 확인: `node --version`
- 한국에서 npm 느릴 때: `npm config set registry https://registry.npmjs.org/`

### `npm run dev` 띄웠는데 화면이 안 보여요
- 포트 3000이 다른 프로세스에 쓰이고 있을 수 있음
- 다른 포트로: `PORT=3001 npm run dev`

### TypeScript 에러가 너무 많이 떠요
- `npm run type-check`로 모든 에러 확인
- 한 번에 다 고치려고 하지 말고 **현재 작업 중인 파일 위주로**

### Tailwind 클래스가 적용 안 돼요
- `tailwind.config.ts`의 `content` 경로에 해당 폴더가 들어있는지 확인
- 개발 서버 재시작: `Ctrl+C` 후 다시 `npm run dev`

---

## 9. 협업

**기획자**: 김학태 (Founder)
**기획 파트너**: Claude (이 채팅 세션)
**개발 도구**: VSCode + Claude Code / Cursor

기획 결정이 필요할 때 Claude와 다시 채팅. 코드 작성은 VSCode + AI 도구로.

---

## 10. 라이선스

Private. © 2026 김학태
