# 사이클 5a 회고 (T18)

## Keep
1. **사이클 5 분할 (5a 외부 노출 / 5b mutation·DB·외부 API)** — 사용자 액션 폭증 회피. 5a만 1.5시간(채팅 + 사용자 클릭)으로 완료.
2. **데모 모드 정책 일관성 (ADR-009/012/014/015/016)** — 외부 키 없이 시연 가능 상태 그대로 배포. 헬스체크에 `cycle: "5a"` `status: "demo"`로 명시.
3. **Railway 보안 게이트가 CVE를 잡아준 것** — 우리 코드의 직접 보안 결함은 0이지만 Next 14.2.5 의존성 CVE를 빌드 시 막아줘서 의도치 않게 보안 강화.
4. **gh CLI 자동화** — 사용자 인증 한 번 후 저장소 생성·push가 한 줄.

## Problem
1. **Next.js patch 버전 고정** (`14.2.5`) — 빠르게 진행하다 정확한 버전 박혀 있어 patch CVE 노출. `^14.2.x`로 caret을 처음부터 쓰는 게 안전.
2. **`@prisma/client`가 devDependencies에 있던 사이클 1 결정** — 로컬 dev에선 동작했지만 production install에서 누락 위험. 이번 사이클 5a에서 정정.
3. **`gh auth login` GUI 권한 화면이 일부 환경에서 OAuth 버튼 활성화 안 됨** — 사용자가 막힘. PAT fallback 가이드를 미리 마련해야 했음.
4. **Railway region이 asia-southeast1 자동 배정** — 한국 사용자엔 약간 멀지만, 사용자가 베트남 체류 중이라 우연히 적합. 사이클 5b에서 region 검토.

## Try
1. 사이클 5b의 첫 작업 — 의존성 최신 patch 정기 점검 스크립트 (`npm audit --audit-level=high`).
2. `gh auth login` PAT fallback 가이드를 도서관 S-10에 항목으로 추가.
3. 사이클 5b PostgreSQL 도입 시 Railway region을 한국 권역(asia-northeast1) 검토 — 단, 사용자 베트남 체류면 현 region이 더 빠름.
4. **Co-Authored-By 트레일러는 사용자 자동 승인** — 모든 commit에 명시 유지. 책임 추적성.

## 새 패턴 (도서관 갱신 후보)
- **"Railway 보안 게이트는 무료 의존성 audit"** — 빌드 시 자동으로 CVE 검출. CI 추가 audit 없이도 차단됨. S-10 보강 후보.

## 메트릭
| 지표 | 값 |
|------|----|
| 5단계 ✅ | 5/5 |
| ADR | 1 (ADR-016) |
| 신규 의존성 | 0 (의존성 분류 재정리만) |
| 보안 게이트 차단 | 1건 → 1번 패치로 통과 |
| 빌드 횟수 | 2 (1차 실패 / 2차 성공) |
| 산출 파일 | 4 (railway.json·api/health·package.json 갱신·env.example) + 회의/검증/회고 |
| 라이브 URL | https://traveldiary-mvp-production.up.railway.app |
