# 07. Railway 배포 가이드

> **시드니 사이트(`sydney-trip-production.up.railway.app`)와 절대 섞이지 않게 배포.**
> 별도 프로젝트, 별도 URL.

---

## 핵심 원칙 — 분리

| | 시드니 사이트 (기존) | TRAVELDIARY MVP (새) |
|---|---|---|
| Railway 프로젝트 | `sydney-trip` (또는 기존 이름) | `traveldiary-mvp` (새 프로젝트) |
| GitHub 저장소 | 기존 저장소 | 새 저장소 |
| 도메인 | `sydney-trip-production.up.railway.app` | `traveldiary-mvp-production.up.railway.app` (자동 생성) |
| DB | 기존 DB | 새 PostgreSQL 인스턴스 |
| 환경 변수 | 기존 키 | 새 키 (절대 공유 금지) |

**시드니 사이트는 배포 작업 중 어떤 일이 있어도 건드리지 않습니다.**

---

## 첫 배포 단계 (한 번만)

### 1. GitHub 저장소 만들기

```bash
cd ~/traveldiary-mvp
git init
git add .
git commit -m "Initial: TRAVELDIARY MVP scaffold"

# GitHub에서 새 저장소 만들기 (예: traveldiary-mvp)
git branch -M main
git remote add origin https://github.com/[your-username]/traveldiary-mvp.git
git push -u origin main
```

### 2. Railway 새 프로젝트 만들기

1. [railway.app](https://railway.app) 로그인
2. **New Project** 클릭 (시드니 프로젝트와 별개로 새로 만듦)
3. **Deploy from GitHub repo** 선택
4. `traveldiary-mvp` 저장소 선택
5. 프로젝트 이름 확인 — 시드니와 다른 이름인지 확인

### 3. 환경 변수 등록

Railway → 프로젝트 → **Variables** 탭에 추가:

```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Phase 1 추가 예정
OPENAI_API_KEY=
GOOGLE_PLACES_API_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# DB (Railway 자동 생성 후 자동 주입)
DATABASE_URL=
```

### 4. 도메인 생성

Railway → 프로젝트 → **Settings → Networking → Generate Domain**

자동 생성되는 URL 예: `traveldiary-mvp-production-xxxx.up.railway.app`

**확인 필수:**
- 시드니 사이트 URL과 다른지 ✅
- 시드니 프로젝트 설정에 영향 없는지 ✅

### 5. 첫 배포 확인

빌드 로그에서 다음 확인:
- `npm install` 성공
- `npm run build` 성공
- 배포된 URL 접속 시 첫 화면 표시

---

## 자동 배포 — Git Push만으로

설정 후엔 git push 하면 자동 배포:

```bash
git add .
git commit -m "feat: 일정 생성 중 화면 추가"
git push origin main

# Railway가 자동으로 빌드 → 배포 (3~5분)
```

---

## DB 연결 (Phase 1)

### PostgreSQL 추가
1. Railway 프로젝트 → **+ New** → **Database** → **PostgreSQL**
2. `DATABASE_URL` 환경 변수가 자동 생성됨
3. Next.js 앱에서 자동 사용 가능

### Prisma ORM 설정
```bash
npm install prisma @prisma/client
npx prisma init
# prisma/schema.prisma 작성
npx prisma migrate dev --name init
```

자세한 스키마는 `docs/04-data-model.md` 참고.

---

## 트러블슈팅

### 빌드 실패: "Module not found"
- `package.json` 의존성 누락
- 로컬에서 `npm install` 후 `package-lock.json` 같이 커밋

### 배포는 됐는데 화면이 안 보임
- Railway 로그에서 에러 확인
- `next.config.js`의 설정 확인
- 환경 변수 누락 가능성

### 빌드는 됐는데 런타임 에러
- API 키 환경 변수 누락
- `DATABASE_URL` 미설정

### 비용
- Railway Hobby Plan: 월 $5 (트래픽 적을 때 충분)
- DB 포함: 월 ~$10
- MAU 1만 이상부터 Pro Plan ($20+) 고려

---

## 시드니 사이트와 절대 섞지 않기 — 체크리스트

배포 전 매번 확인:

- [ ] 현재 Railway 프로젝트 이름이 `traveldiary-mvp`인지 확인
- [ ] `git remote -v`에서 시드니 저장소가 아닌지 확인
- [ ] 환경 변수에 시드니 사이트 키가 섞이지 않았는지 확인
- [ ] 배포 후 도메인 URL이 시드니 URL이 아닌지 확인

---

## 변경 이력

- 2026-04-29: 초안 작성. 시드니 사이트 분리 정책 명시.
