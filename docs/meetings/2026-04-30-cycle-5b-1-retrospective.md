# 사이클 5b-1 회고 (T18) — 6번 push 끝에 healthy

## Keep
1. **Deploy Logs를 결국 봤다** — Build Logs만 보다가 진짜 원인을 5번 놓쳤다. Deploy Logs(컨테이너 stdout/stderr)는 application-level 에러를 보여줌. 다음 인프라 사이클에선 Build·Deploy 두 로그를 동시에 확인 의무화.
2. **5단계 프로세스 그대로 유지** — 빌드 실패 6회에도 회의·검증 단계 건너뛰지 않음. ADR-013을 처음부터 작성해뒀기에 진단 시 기준 명확.
3. **데모 모드 fallback 정책(ADR-009/012/014/016)이 사용자 가치 보호** — 빌드 실패 동안에도 라이브 URL은 정상 동작. 일반 사용자는 5b-1 진행 중인지 모름.
4. **사용자에게 정직하게 막힘 보고** — 6번 시도 후 "옵션 A/B/C" 제시. 사용자가 옵션 B(Deploy Logs 진단)를 선택하여 1번 push로 해결.

## Problem
1. **Prisma 7 마이그레이션 패턴 학습 부족** — ADR-011은 schema에서 url 제거만 결정, prisma.config.ts에 datasource를 적어야 한다는 부분을 누락. 6번 push 중 4번이 이 한 줄을 못 찾아서 발생.
2. **Build Logs vs Deploy Logs 구분을 사용자에게 너무 늦게 안내** — 처음부터 Deploy Logs를 요청했어야 함.
3. **Railway 보안 게이트가 NODE_ENV=production+devDeps 누락 동작을 4c08452에서 처음 노출** — a410401에선 통과했던 이유는 Railway의 첫 빌드가 dev install이었던 것 같음 (캐시 영향). 의존성 분류는 처음부터 정밀해야.
4. **사용자 시간 5분×6 = 30분+ 폴링 대기** — 사용자 경험 부담. 다음엔 첫 실패 직후에 옵션 분기 제시.

## Try
1. **새 인프라 사이클 시작 시 의무 체크리스트**:
   - [ ] Build Logs와 Deploy Logs 둘 다 확인 가능한 상태인가?
   - [ ] NODE_ENV=production + `--omit=dev` 시뮬레이션으로 로컬 빌드 통과 확인했나?
   - [ ] 외부 CLI(prisma migrate, next build 등)가 환경변수만으로 동작 가능한가, 아니면 config 파일 필요?
2. **S-09 prisma-schema-design.md 갱신** — prisma.config.ts에 datasource 적는 정확한 syntax 명시 (이번 회고에서 처리).
3. **첫 healthcheck 실패 시 Deploy Logs 우선 요청 패턴 도서관에 추가** — S-10 railway-deploy-pattern.md 보강.
4. **start 명령에 `migrate deploy`를 넣은 게 healthcheck timeout 영향**도 검토 — 큰 마이그레이션은 build 단계에서 수동 또는 release phase로 분리 검토.

## 새 패턴 (도서관 갱신 후보)

### "Build Logs ≠ Deploy Logs" 패턴
- **Build Logs**: image 빌드 단계 (npm install, next build). 의존성·webpack·CSS 처리 에러.
- **Deploy Logs**: 컨테이너 시작 후 stdout/stderr (start command 실행, 마이그레이션, next start).
- 첫 healthcheck 실패 시 **둘 다** 확인. Build만 보면 진짜 원인 놓침.

### "Prisma 7 datasource 위치 변경" 패턴 (S-09 갱신)
- Prisma 6: schema의 datasource db { url }
- Prisma 7: prisma.config.ts의 datasource: { url } (CLI용) + PrismaClient adapter (runtime용)
- 두 곳 모두 적어야 migrate + runtime 둘 다 동작.

## 메트릭

| 지표 | 값 |
|------|----|
| 5단계 ✅ | 5/5 |
| ADR | 1 (ADR-013) |
| push 횟수 | 6 (5 fail + 1 success) |
| 빌드 통과율 (1차) | 1/6 — 다음엔 개선 필요 |
| 라이브 URL healthy 도달 | ✅ 2026-04-30 09:57 (+07) |
| 사용자 액션 횟수 | 4 (PostgreSQL 추가 + reference 추가 + 스크린샷 3회) |
| audit log 실호출 도입 | ✅ S-13 절대 규칙 첫 적용 |
| Server Action 도입 | ✅ createTripFromOnboarding |
