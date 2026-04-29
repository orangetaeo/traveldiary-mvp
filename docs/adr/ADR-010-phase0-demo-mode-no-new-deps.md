---
id: ADR-010
title: 사이클 1 신규 의존성 무추가 (의존성 폭주 방지)
status: Accepted
date: 2026-04-29
decider: R1 CTO
proposer: T19 Harness Librarian
---

# ADR-010: 사이클 1 신규 의존성 무추가

## 컨텍스트

CTO 게이트(S-18) 안티 패턴 중 "의존성 폭주"가 있다. 사이클 1에서 다음 라이브러리 추가가 검토됨:

- `tsx` — Prisma seed 스크립트 실행용
- `zod` — 입력 검증
- `framer-motion` — EvidencePanel 펼침 애니메이션
- `lucide-react` — 아이콘

## 결정

**사이클 1은 신규 의존성 0개로 진행한다.**

- Seed 데이터는 정적 TypeScript 모듈(`lib/seed/phu-quoc.ts`)로 import해 사용 → `tsx` 불필요 (이번 사이클은 `prisma db seed` 미실행).
- 입력 검증은 Server Action 도입(사이클 2)부터 `zod` 검토.
- 펼침 애니메이션은 Tailwind transition + CSS만으로 구현.
- 아이콘은 inline SVG 또는 텍스트(▾, ▸)로 대체.

## 대안

### 대안 A — `tsx`만 추가 (비채택)
- 단점: 이번 사이클에 seed CLI 실행 시나리오가 없음. 추가 명분 부족.

### 대안 B — 4개 모두 추가 (비채택)
- 단점: 안티 패턴 "한 PR에 3개 이상" 정확히 위반. 사이클별 게이트 가치 훼손.

## 영향

- 긍정: 번들 크기 유지, CTO 게이트 부담 최소.
- 부정: EvidencePanel 펼침 애니메이션이 단순(CSS only) — UX 톤은 충분.
- 후속: 사이클 2에서 mutation 도입 시 `zod` ADR 단독 상정. 사이클 4 OCR에서 `lucide-react`/이미지 업로드 라이브러리 검토.

## 사인오프

- R1 CTO ✅
