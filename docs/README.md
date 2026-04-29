# TRAVELDIARY 기획 문서

이 폴더는 **단일 진실 공급원**입니다. 화면 만들 때, 결정 내릴 때 항상 여기를 참고하세요.

## 읽는 순서

1. **[01-vision.md](./01-vision.md)** — 우리가 무엇을 만드는가, 왜 만드는가
2. **[02-magic-moments.md](./02-magic-moments.md)** — 사용자가 "이 앱은 다르네"라고 느끼는 4개 순간
3. **[03-style-system.md](./03-style-system.md)** — 컬러·타이포·컴포넌트·인터랙션 룰
4. **[04-data-model.md](./04-data-model.md)** — 데이터 구조·DB 스키마 방향
5. **[05-roadmap.md](./05-roadmap.md)** — MVP 우선순위, 12개월 로드맵
6. **[06-ai-collaboration.md](./06-ai-collaboration.md)** — VSCode + AI 도구 협업 가이드
7. **[07-railway-deploy.md](./07-railway-deploy.md)** — Railway 배포 (시드니 사이트와 분리)

## 화면별 명세

`screens/` 폴더에 화면별 명세가 있습니다. 화면을 만들기 전에 해당 명세를 먼저 읽으세요.

- ✅ [01-onboarding.md](./screens/01-onboarding.md) — 구현 완료 (`/onboarding`, 푸꾸옥 우선)
- ✅ [02-itinerary-creating.md](./screens/02-itinerary-creating.md) — 구현 완료 (`/itinerary/creating`, 4단계 진행률)
- ✅ 03-itinerary-list — 일정 전체 (`/itinerary/[id]`, Day 탭, 사이클 1)
- ✅ 04-itinerary-detail — 일정 상세 (`/itinerary/[id]/item/[itemId]`, **M1 추천 근거**, 사이클 1)
- ✅ 05-travel-home — 여행 중 홈 (M2, 사이클 3 완료) · `/travel/[id]`
- ✅ 06-live-replan — Live Replan (M3, 사이클 2 완료) · `/itinerary/[id]` 바텀 시트
- ✅ 07-camera-translate — 카메라 번역 (M4, 사이클 4 완료) · `/translate`

## ADR (아키텍처 결정 기록)

`adr/` 폴더에 R1 CTO 사인오프된 결정이 있습니다.

- ADR-001~008 — 기존 결정 (`.claude/skills/cto-review-gate.md` §기존 결정 표 참조)
- [ADR-009](./adr/ADR-009-phuquoc-seed-and-demo-mode.md) — 푸꾸옥 시드 + Phase 0 데모 모드
- [ADR-010](./adr/ADR-010-phase0-demo-mode-no-new-deps.md) — 사이클 1 신규 의존성 무추가
- [ADR-011](./adr/ADR-011-prisma7-config-datasource-url.md) — Prisma 7 datasource URL 이전
- [ADR-012](./adr/ADR-012-replan-client-state-simulation.md) — 사이클 2 Live Replan 클라이언트 시뮬레이션
- [ADR-014](./adr/ADR-014-mode-transition-demo-toggle.md) — 사이클 3 모드 전환 데모 토글
- [ADR-015](./adr/ADR-015-translate-static-menu-seed.md) — 사이클 4 카메라 번역 정적 메뉴 시드

## 회의록

- [2026-04-29 사이클 1 합의문](./meetings/2026-04-29-cycle-1.md)
- [2026-04-29 사이클 1 다중 검증 리포트](./meetings/2026-04-29-cycle-1-verification.md)
- [2026-04-29 사이클 1 회고](./meetings/2026-04-29-cycle-1-retrospective.md)
- [2026-04-29 사이클 2 합의문](./meetings/2026-04-29-cycle-2.md)
- [2026-04-29 사이클 2 다중 검증 리포트](./meetings/2026-04-29-cycle-2-verification.md)
- [2026-04-29 사이클 2 회고](./meetings/2026-04-29-cycle-2-retrospective.md)
- [2026-04-29 사이클 3 합의문](./meetings/2026-04-29-cycle-3.md)
- [2026-04-29 사이클 3 검증](./meetings/2026-04-29-cycle-3-verification.md)
- [2026-04-29 사이클 3 회고](./meetings/2026-04-29-cycle-3-retrospective.md)
- [2026-04-29 사이클 4 합의문](./meetings/2026-04-29-cycle-4.md)
- [2026-04-29 사이클 4 검증](./meetings/2026-04-29-cycle-4-verification.md)
- [2026-04-29 사이클 4 회고](./meetings/2026-04-29-cycle-4-retrospective.md)

## AI 도구와 협업 시

Cursor/Claude Code/ChatGPT 등에 작업 시킬 때:

```
1. 이 docs/ 폴더 전체를 컨텍스트로 제공
2. 만들 화면의 명세 파일을 가리킴
3. "이 명세대로 [경로]에 화면 만들어줘" 요청
```

기획 결정으로 막히면 Claude 채팅으로 돌아오세요.
이 프로젝트는 **코드를 만들면서 기획하는** 방식입니다.
