# 06. AI 협업 가이드

> 이 프로젝트는 **AI 도구와 협업할 것을 전제**로 만들어졌어요.
> Claude Code, Cursor, GitHub Copilot 등 어느 도구를 써도 같은 원칙.

---

## 핵심 원칙 — `docs/`를 컨텍스트로

**좋은 결과의 80%는 컨텍스트가 결정합니다.**

AI에게 "여행앱 일정 화면 만들어줘"는 일반적인 결과를 줘요. 우리 정체성과 안 맞아요.
AI에게 "@docs/02-magic-moments.md 따라서, @docs/03-style-system.md 컴포넌트 사용해서 일정 상세 화면 만들어줘"는 우리만의 결과를 줘요.

---

## 도구별 시작 방법

### Claude Code (강력 추천)

```bash
# 프로젝트 폴더에서
cd ~/traveldiary-mvp
claude
```

자동으로 폴더 전체 컨텍스트 읽음. 그 다음 자연어로 작업 요청.

**좋은 첫 메시지:**
> "이 프로젝트는 자유여행자 AI 동반자 MVP야.
> docs/ 폴더 한 번 훑어보고, 다음에 만들 화면 추천해줘."

### Cursor

1. Cursor 다운로드 ([cursor.com](https://cursor.com))
2. 폴더 열기
3. `Cmd/Ctrl + L` 채팅 열기
4. 첫 메시지에 `@docs/README.md` 또는 `@docs` 폴더 통째로 첨부
5. "이 기획 따라서 [화면명] 만들어줘" 요청

### GitHub Copilot

채팅 기능 약함. Copilot은 자동완성 위주로 사용.
설계는 Claude/Cursor에서, 키보드 타이핑은 Copilot이 가속.

### ChatGPT (브라우저)

코드 컨텍스트 없어서 비효율. 단순 질문 답변용으로만.
"이 함수 어떻게 작성?" 같은 좁은 질문에만.

---

## 좋은 프롬프트 패턴

### 화면 만들기

> "@docs/screens/02-itinerary-creating.md 명세대로
> `app/itinerary/creating/page.tsx`를 만들어줘.
>
> 제약:
> - `lib/design-tokens.ts`의 색상만 사용
> - `components/ui/` 안의 기존 컴포넌트 재활용 (Card, Badge 등)
> - 새 컴포넌트 만들면 `components/ui/`에 추가
> - 'use client' 필요 시 명시"

### 컴포넌트 만들기

> "추천 근거 패널과 같은 톤으로
> '변경 영향' 패널 컴포넌트를 만들어줘.
>
> Props:
> - changes: { key: string, value: string, type: 'pos' | 'neg' | 'neu' }[]
>
> 위치: components/ui/ImpactPanel.tsx
> 참고: components/ui/EvidencePanel.tsx 의 구조"

### 기능 구현

> "@docs/04-data-model.md 의 DAG 모델 따라서
> Live Replan 알고리즘을 lib/replan.ts 에 만들어줘.
>
> 5단계:
> 1. 영향받는 노드 식별
> 2. 고정 노드 보호
> 3. 유연 노드 시간 재배치 (백트래킹)
> 4. 풀이 실패 시 LLM 호출
> 5. 새 일정 + 변경 사유 반환"

---

## 나쁜 프롬프트 (하지 마세요)

❌ "여행앱 만들어줘" — 너무 모호
❌ "이쁘게 만들어줘" — 우리 정체성과 무관한 결과
❌ "ChatGPT처럼 만들어줘" — 우리는 ChatGPT가 아님
❌ "내가 어제 말한 거 기억해?" — 이전 컨텍스트 없음, 매번 새로 시작
❌ "한 번에 모든 화면 만들어줘" — 검토 불가, 버그 폭증

---

## 작업 사이클 — 한 화면 작업 시

```
1. docs/screens/XX.md 명세 읽기 (or 작성)
   ↓
2. AI에게 "이 명세대로 만들어줘" 요청
   ↓
3. 코드 받기 → 한 번 훑어봄
   ↓
4. npm run dev 로 로컬에서 확인
   ↓
5. 작동하면 다음, 이상하면 AI에게 "이 부분 X로 바꿔줘"
   ↓
6. 만족하면 docs/README.md의 진행 상황 업데이트
   ↓
7. git commit (작은 단위로)
```

**한 사이클 = 30분 ~ 2시간**. 화면 하나씩.
하루에 1~3개 화면 진도 가능.

---

## 막힐 때 — Claude 채팅으로 돌아오기

VSCode + AI 도구는 **구현**에 강해요.
하지만 **기획 결정**은 깊은 대화가 필요해요. 그때는 Claude 채팅으로:

- "이 화면에 어떤 정보가 들어가야 할까?"
- "사용자가 이 단계에서 이탈할 것 같은데 어떻게 막지?"
- "A안 vs B안, 뭐가 더 나을까?"
- "이 결정이 다른 화면에 영향 주나?"

이런 질문은 도구가 아니라 **파트너**가 답해야 해요.
구현은 도구, 기획은 파트너 — 분리해서 활용하세요.

---

## 코드 품질 체크리스트

AI가 작성한 코드 받았을 때 5가지만 확인:

- [ ] **타입 에러 없음** — `npm run type-check`
- [ ] **디자인 토큰만 사용** — 하드코딩된 hex 색 없음 (`#FF6B47` 같은 거 X)
- [ ] **기존 컴포넌트 재사용** — Button 새로 안 만들고 `components/ui/Button.tsx` 사용
- [ ] **'use client' 필요 시** — useState, useEffect 등 사용 시
- [ ] **명세 일치** — `docs/screens/XX.md`에 적힌 모든 동작이 작동

이 5가지만 보고 다른 건 일단 굴러가게 두세요. 완벽주의 금지.

---

## 변경 이력

- 2026-04-29: 초안 작성
