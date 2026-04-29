---
id: ADR-016
title: 사이클 5a — Railway 데모 모드 배포 (DB·외부 API 미도입)
status: Accepted
date: 2026-04-29
decider: R1 CTO
proposer: T15 DevOps Engineer + T16 Security
---

# ADR-016: 사이클 5a — Railway 데모 모드 배포

## 컨텍스트

사용자가 "외부에서 볼 수 있도록 Railway 셋팅"을 요청. 사이클 5는 원래 (Railway + 외부 API + mutation/DB)를 묶었으나, 외부 노출만 우선 만족하면 사용자 가치가 즉시 발생한다. ADR 분리:
- **사이클 5a** (이 ADR) — 데모 모드 그대로 Railway 배포.
- **사이클 5b** (ADR-013 예정) — Prisma adapter + PostgreSQL + Vision/Claude + Geolocation + writeAuditLog 실호출.

## 결정

1. **Railway 새 프로젝트** `traveldiary-mvp` (시드니 사이트와 분리 — docs/07-railway-deploy.md).
2. **PostgreSQL은 사이클 5b에서 추가** — 사이클 5a엔 `DATABASE_URL` 미설정 → 데모 모드(ADR-009) 그대로 동작.
3. **외부 API 키도 사이클 5b에서** — 사이클 5a는 환경변수 빈 칸으로 배포.
4. **헬스체크**: `/api/health` 엔드포인트 — DB 미연결 시 `{ status: "demo", db: "disconnected" }` 200 반환 (degraded 아님; 데모 모드는 정상 운영 상태).
5. **빌드 명령**: `npm install && npx prisma generate && npm run build` (prisma generate 필수 — schema는 url 없는 형태 ADR-011이라 통과).
6. **시작 명령**: `npm start` — `prisma migrate deploy`는 사이클 5b에서.
7. **`postinstall` 스크립트**에 `prisma generate` 추가 — Railway 빌드 안정성.
8. **`railway.json`**: 빌드/시작/헬스체크 명시.
9. **자동 배포**: GitHub `main` 브랜치 push → Railway 자동 빌드.

## 대안

### A — 사이클 5 통합 진행 (비채택)
- 단점: 사용자 액션 폭증 (Railway 가입 + GitHub 저장소 + DB 추가 + 외부 API 키 발급 4종 + 환경변수 등록). 한 사이클 검증 어려움.

### B — Vercel 배포로 변경 (비채택)
- 단점: ADR-005가 Railway. 시드니 사이트와 동일 인프라 일관성.

### C — Docker 직접 배포 (비채택)
- 단점: nixpacks 자동 감지가 더 단순. ADR-005 호환.

## 영향

### 긍정
- 외부 URL 즉시 발급 가능 (24시간 내).
- M1~M4 시연을 외부에 공유 가능.
- 사이클 5b 작업이 라이브 URL에서 바로 검증.

### 부정
- 새로고침 시 Replan 결과 사라짐 (ADR-012 클라이언트 시뮬 한계가 라이브에서 드러남) — 사용자에게 "데모" 표시 명시.
- DB·외부 API 미연결 — 헬스체크가 "demo" 상태 반환.

## 사용자 직접 액션 (이 ADR이 코드만으로는 끝나지 않는 부분)

```
1. GitHub 저장소 생성 + 초기 push (사용자가 직접)
2. Railway 가입 + 새 프로젝트 + GitHub 연결 (사용자)
3. 도메인 생성 (Railway Settings → Networking)
4. (선택) NEXT_PUBLIC_APP_URL 환경변수 등록
5. 배포 후 URL 확인 + M1~M4 시연 검증
```

코드 산출물은 사이클 5a에서 모두 준비. 사용자 액션은 단계별 가이드 제공.

## 사인오프

R1 ✅ R7 ✅ T15 ✅ T16 ✅ T13 ✅
