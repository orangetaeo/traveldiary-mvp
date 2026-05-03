---
id: ADR-040
title: ESLint + jsx-a11y CI 게이트 도입 (사이클 MM)
status: Accepted
date: 2026-05-03
decider: R1 CTO
proposer: T15 DevOps + T13 CR + T17 UX
related: ADR-029 (CI Gate 도입 — 사이클 S), ADR-037 (E2E nightly), feedback_aria_invariant
---

# ADR-040: ESLint + jsx-a11y CI 게이트 도입

## 컨텍스트

사이클 X(M3 trigger)·AA(weather)·II(CostView select aria-label)에서 **ESLint jsx-a11y 진단이 IDE에서만 노출**되고 tsc/vitest는 통과했다. 사이클 II 핸드오프(after T~II)의 회고 학습 #1: "tsc/vitest는 lint 회귀를 못 잡음. CI에 ESLint 추가 후보(다음 사이클 5)" — 본 ADR이 그 후보를 실행.

**현 상태**:
- `eslint`/`eslint-config-next` **미설치** (Next 14.2 기본은 옵션)
- `.eslintrc*` 설정 파일 없음 (`next lint`가 interactive prompt 띄움)
- IDE만 jsx-a11y 검출 → 다른 환경 작업자는 같은 회귀 재발 가능

## 결정

**ESLint를 devDependency로 명시 + `.eslintrc.json` + CI에서 `lint:ci` 단계 추가.**

### 의존성 추가 (devDependencies)

| 패키지 | 버전 | 역할 |
|--------|------|------|
| `eslint` | ^8.57.1 | core (Next 14는 v8 권장) |
| `eslint-config-next` | ^14.2.35 | next + jsx-a11y + react-hooks 룰 번들 |

`eslint-plugin-jsx-a11y`는 `eslint-config-next`의 transitive deps로 포함됨.

### 룰 정책 (`.eslintrc.json`)

```jsonc
{
  "extends": "next/core-web-vitals",
  "rules": {
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error",
    "react/no-unescaped-entities": "off",
    "@next/next/no-img-element": "off",
    "@next/next/no-page-custom-font": "off"
  }
}
```

비활성화 근거:
- `no-unescaped-entities`: 한국어 UI에 따옴표 문자 흔함, 별 의미 없는 false positive
- `no-img-element`: Next/Image 강제는 외부 OTA 썸네일 등 호환성 문제
- `no-page-custom-font`: App Router에서 `pages/_document.js` 미존재 → false positive (현재 layout.tsx에서 Pretendard CDN 로드 정상)

### CI 통합

```yaml
- name: Lint (ESLint + jsx-a11y, max-warnings=0)
  run: npm run lint:ci
```

`lint:ci` = `next lint --max-warnings 0 --dir app --dir components --dir lib --dir actions`

`tests/`, `prisma/migrations/`, `playwright-report/` 등은 `ignorePatterns` 또는 `--dir` 화이트리스트로 제외 (ADR-029 답습 — tsconfig 빌드 격리와 동일 정신).

### 사이클 MM 적용 결과

- **0 warnings, 0 errors** (사전 fix 0건 — 사이클 II에서 IDE 진단 즉시 fix가 정착했기 때문)
- `npm run lint`도 동일 디렉터리 화이트리스트 적용 (개발자 경험 일관성)

## 대안 검토

| 대안 | 채택 안 한 이유 |
|------|----------------|
| `next lint` 인터랙티브 셋업 사용 | 동의어. `.eslintrc.json` 직접 작성이 명시적이고 PR 리뷰 가능 |
| Husky pre-commit hook | 로컬 강제는 환경 의존(`feedback_prisma_generate_gate` 답습). CI 게이트가 단일 진실 |
| ESLint flat config (eslint.config.js) | Next 14는 legacy `.eslintrc.json` 지원이 안정. flat config 마이그는 Next 15+ 트리거 |
| Biome로 전환 | jsx-a11y 룰셋 부재 + Next 통합 미성숙. 추후 검토 |

## 트리거: 룰 강화 (다음 사이클 후보)

다음 룰을 단계적으로 추가 검토:
- `react-hooks/exhaustive-deps`: 현재 `eslint-disable-next-line` 다수 — 정리 후 강화
- `@typescript-eslint/no-unused-vars`: typescript-eslint 의존성 추가 필요 (별도 ADR)
- `jsx-a11y/click-events-have-key-events`: 키보드 접근성 강화

## 회귀 방지

| 항목 | 게이트 |
|------|--------|
| `aria-pressed`/`aria-checked` expression | `jsx-a11y/aria-proptypes` (error) — 토글 아닌 곳 차단 |
| 빈 `aria-label` / 잘못된 role | `jsx-a11y/role-has-required-aria-props` |
| 신규 의존성 `eslint-config-X` 변경 | CTO 사인오프 + ADR 갱신 |

## 사용자 영향

없음. devDependency만 추가 (런타임/빌드 산출물 영향 X).

## 측정

- 사이클 MM 시점 lint 실행: `0 warnings, 0 errors`
- CI 단계 추가 시간: ~15초 (전체 CI ~1m20s → ~1m35s 예상)
