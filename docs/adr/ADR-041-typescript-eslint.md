---
id: ADR-041
title: typescript-eslint 추가 (사이클 TT)
status: Accepted
date: 2026-05-03
decider: R1 CTO
proposer: T13 CR + T15 DevOps
related: ADR-040 (ESLint + jsx-a11y CI 게이트, 사이클 MM)
---

# ADR-041: typescript-eslint 추가

## 컨텍스트

ADR-040 "트리거: 룰 강화 (다음 사이클 후보)"에 명시된 후속 — `@typescript-eslint/no-unused-vars`는 typescript-eslint 의존성 추가 필요.

**현 상태 (사이클 TT 직전)**:
- ESLint 8.57.1 + `eslint-config-next` ^14.2.35 (ADR-040)
- `react-hooks/exhaustive-deps` error 승격 (사이클 PP)
- TypeScript 룰 미적용 — `tsc --noEmit`만 의존
- `tsc`는 `noUnusedLocals`/`noUnusedParameters` off (사용자 미설정 + Next 14 기본 off)

**문제**: 미사용 변수/import가 코드 리뷰까지 통과 가능. 사이클 JJ에서 dead code 2개(DayTabs/ItineraryCard) 발견 사례 → import는 살아있으나 모듈 자체가 unused. `@typescript-eslint/no-unused-vars`는 변수 단위 게이트.

## 결정

**typescript-eslint v7.x 추가 + recommended 룰셋 + `no-unused-vars` error 승격.**

### 의존성 추가 (devDependencies)

| 패키지 | 버전 | 역할 |
|--------|------|------|
| `@typescript-eslint/parser` | ^7 | TypeScript AST 파서 |
| `@typescript-eslint/eslint-plugin` | ^7 | TS 룰셋 + recommended config |

**v7 선택 근거**: ESLint 8.57과 호환 (v8+는 ESLint 9+ 필요 — Next 14 미호환).

### 룰 정책

```jsonc
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/ban-ts-comment": "off"
  }
}
```

비활성화 근거:
- `no-explicit-any`: 외부 API 응답 (Naver/Vision/Claude) shape이 동적 — 점진 도입 필요
- `no-empty-object-type`: Next 14 generated types에 `{}` 다수 (false positive)
- `ban-ts-comment`: `@ts-expect-error`로 인텐셔널 타입 우회 허용 (테스트/시드 패턴)

### 사이클 TT 적용 결과

- 룰 추가 + `npm run lint:ci` → **0 warnings, 0 errors** (사전 fix 0건)
- 미사용 변수가 우연히 0건이었던 게 아니라, ADR-040 도입 후 IDE 진단 즉시 fix 정착(사이클 X→AA→II 답습)이 효과 발휘한 결과

## 대안 검토

| 대안 | 채택 안 한 이유 |
|------|----------------|
| typescript-eslint v8 | ESLint 9+ 필요 — Next 14 미지원 |
| `tsc --noUnusedLocals` 활성 | 빌드 타임 추가, IDE 통합 약함, fine-grained ignore 불가 |
| Biome 도입 | jsx-a11y 부재 (ADR-040 답습 결정) |
| recommended 대신 strict | 첫 도입은 보수적으로 — strict는 점진 트리거 |

## 트리거: 룰 강화 (다음 사이클 후보)

- `@typescript-eslint/no-explicit-any`: any 사용처 정리 후 warn → error 단계
- `@typescript-eslint/consistent-type-imports`: `import type` 강제 (번들 사이즈 미세 효익)
- `@typescript-eslint/strict-boolean-expressions`: null/undefined 안전 (큰 사이클 — 사전 정리 다수)

## 회귀 방지

| 항목 | 게이트 |
|------|--------|
| 미사용 import / 변수 | `@typescript-eslint/no-unused-vars` (error) |
| `_` prefix는 의도 명시 (allow) | `argsIgnorePattern: "^_"` 등 |
| 신규 의존성 변경 | CTO 사인오프 + ADR 갱신 (ADR-040 답습) |

## 사용자 영향

없음. devDependency만 추가 (런타임/빌드 산출물 영향 X).

## 측정

- 사이클 TT 시점 lint 실행: `0 warnings, 0 errors`
- CI 단계 추가 시간: ~0초 (lint:ci 한 단계 안에서 처리)
- npm install: +5 packages
