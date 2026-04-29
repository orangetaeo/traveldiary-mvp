# Skill S-12: UX Design System (UX 디자인 시스템)

> **스킬 유형**: 도메인·UX
> **핵심**: 디자인 토큰 + 화면 LEVEL + 모드별 색상 + A11y
> **사용 에이전트**: T17 UX/UI Designer, R9 UX/UI, R10 PUB

## 디자인 토큰 (단일 진실 — `lib/design-tokens.ts`)

> **모든 색상·간격·반경은 토큰에서.**
> 하드코딩 hex 또는 px 발견 시 T13 코드 리뷰에서 즉시 반려.

### 색상 토큰

```typescript
// lib/design-tokens.ts (개념)

export const colors = {
  // 모드별 강조
  modePrimary: {
    pre: '#8B5CF6',   // 보라
    in: '#F97316',    // 코랄
    post: '#22C55E',  // 그린
  },
  
  // 의미적
  positive: '#22C55E',
  negative: '#EF4444',
  neutral: '#6B7280',
  warning: '#F59E0B',
  
  // 텍스트
  text: {
    primary: '#111827',
    secondary: '#4B5563',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // 배경
  bg: {
    base: '#FFFFFF',
    subtle: '#F9FAFB',
    raised: '#F3F4F6',
  },
  
  // 보더
  border: {
    subtle: '#E5E7EB',
    strong: '#D1D5DB',
  },
} as const;
```

### 간격 토큰

```typescript
export const space = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;
```

### 반경 토큰

```typescript
export const radius = {
  sm: '4px',
  md: '8px',
  card: '12px',
  pill: '9999px',
} as const;
```

### 타이포그래피

```typescript
export const typography = {
  display: { size: '32px', weight: 700, lineHeight: 1.2 },
  heading: { size: '20px', weight: 600, lineHeight: 1.3 },
  body: { size: '16px', weight: 400, lineHeight: 1.5 },
  small: { size: '14px', weight: 400, lineHeight: 1.4 },
  caption: { size: '12px', weight: 500, lineHeight: 1.3 },
} as const;
```

## 화면 LEVEL (정성도 가이드)

| LEVEL | 화면 | 정성도 | 작업 시간 |
|-------|------|--------|----------|
| 🔴 1 | 온보딩, 일정 생성 중, 일정 상세, 여행 중 홈, Live Replan, 카메라 번역 | 픽셀 단위 | 1~2시간 |
| 🟡 2 | 홈, 일정 전체, 일정 편집, 항목 검색, 미리보기 | 토큰 적용 + 컴포넌트 재사용 | 30분 |
| 🟢 3 | 로그인, 알림센터, 마이페이지, 설정 | 표준 컴포넌트 | 명세만 |

### LEVEL별 작업 원칙

```
🔴 LEVEL 1: 인터랙션·애니메이션·마이크로 카피까지 모두 명세
🟡 LEVEL 2: 컴포넌트 재사용 우선, 새 패턴은 만들지 않음
🟢 LEVEL 3: 기본 컴포넌트로 빠르게 만듦, 검증만
```

## 모드 전환 색상 (M2 통합)

```css
:root {
  --color-primary: var(--color-mode-pre); /* 기본 — pre */
}

[data-travel-mode="pre-travel"] {
  --color-primary: #8B5CF6;
}

[data-travel-mode="in-travel"] {
  --color-primary: #F97316;
}

[data-travel-mode="post-travel"] {
  --color-primary: #22C55E;
}
```

```tsx
// 사용
<div data-travel-mode={mode}>
  <button className="bg-[var(--color-primary)]">시작</button>
</div>
```

## 컴포넌트 패턴 (`components/ui/`)

### Button

```tsx
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  // ...
}
```

새 화면에서 `<button>` 직접 사용 ❌. `<Button>` 재사용 ✅.

### EvidencePanel (M1)

```tsx
interface EvidencePanelProps {
  reasons: string[];
  sources: EvidenceSource[];
  defaultExpanded?: boolean;
  onSourceClick?: (source: EvidenceSource) => void;
}
```

특징:
- 기본 접힘
- 부드러운 펼침 (300ms ease-out)
- 근거 부족 시 자체 숨김 (T3 규칙)

### ImpactPanel (M3)

```tsx
interface ImpactPanelProps {
  changes: Array<{
    key: string;
    value: string;
    tone: 'positive' | 'negative' | 'neutral';
  }>;
}
```

색상:
- 🟢 positive
- 🔴 negative
- ⚫ neutral

## 인터랙션 패턴

### 모달 / 바텀 시트

```
- 진입: slide up (300ms cubic-bezier(0.4, 0, 0.2, 1))
- 종료: slide down
- 배경: rgba(0, 0, 0, 0.5)
- ESC / 배경 탭 → 닫힘
- focus trap 적용
```

### 토스트

```
- 위치: bottom-center (모바일), top-right (PC)
- 자동 닫힘: 3초 (성공) / 5초 (경고)
- 사용자 액션 가능 시 닫힘 버튼 명시
```

### 로딩

```
- < 300ms: 인디케이터 표시 안 함 (깜빡임 방지)
- 300ms ~ 1s: 스피너
- > 1s: 스피너 + "잠시만 기다려주세요"
- > 3s: 스켈레톤 또는 진행률
```

## 접근성 (A11y) 표준

### 색대비 (WCAG AA)

```
✅ 본문 텍스트 / 배경 = 4.5:1 이상
✅ 큰 텍스트 (18pt+) / 배경 = 3:1 이상
✅ UI 요소 / 배경 = 3:1 이상
```

### 터치 영역

```
✅ 최소 44×44pt (iOS) / 48×48dp (Android)
✅ 인접 인터랙티브 요소 간 8pt 이상 간격
```

### 스크린 리더

```tsx
<button aria-label="일정 추가">
  <PlusIcon aria-hidden="true" />
</button>

<img src="..." alt="도쿄 시부야 야경" />

<dialog aria-labelledby="modal-title" aria-modal="true">
  <h2 id="modal-title">일정 변경 옵션</h2>
  ...
</dialog>
```

### 키보드

```
✅ 모든 인터랙티브 요소 Tab으로 접근 가능
✅ Tab 순서가 시각 순서와 일치
✅ ESC로 모달 닫기
✅ Enter로 기본 액션
✅ focus visible (keyboard-only) 스타일
```

## 모바일/PC 반응형

```
- 모바일 우선 (mobile-first)
- 브레이크포인트:
  - sm: 640px (큰 모바일)
  - md: 768px (태블릿)
  - lg: 1024px (PC)
  - xl: 1280px (와이드)

- 화면 LEVEL 1 — 모바일 픽셀 단위 + PC도 케어
- 화면 LEVEL 2 — 모바일 우선, PC는 자동
- 화면 LEVEL 3 — 표준 반응형
```

## 디자인 결정 로그 (DDR)

새 컴포넌트나 인터랙션 패턴 결정 시 기록:

```markdown
## DDR-001: 추천 근거 패널 기본 접힘 상태
- 결정일: 2026-04-29
- 결정자: T17
- 이유: 정보 과부하 방지, 사용자 호기심 유발
- 대안 1: 항상 펼침 — 비채택 (시각적 무게)
- 대안 2: 첫 방문만 펼침 — 보류 (구현 비용)
- 적용: M1 모든 일정 항목
```

## 안티 패턴 (T13 리뷰에서 잡음)

```
❌ #FF6B47, #8B5CF6 등 hex 하드코딩
✅ var(--color-primary), tailwind 토큰 클래스

❌ 16px, 24px 등 px 하드코딩 (간격)
✅ space.md, space.lg 또는 tailwind 클래스

❌ <button onClick={...}>...</button>
✅ <Button onClick={...}>...</Button>

❌ aria-label 누락
✅ 모든 아이콘 버튼에 aria-label

❌ 색상으로만 정보 전달 (e.g. 빨간 = 에러)
✅ 색상 + 텍스트 + 아이콘 함께
```

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\ux-design-system.md`
