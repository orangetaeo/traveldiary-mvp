# 16. 카카오 OAuth 활성화 퀵스타트

> 소요 시간: 약 10분. 코드 변경 0건 — 환경변수만 등록하면 즉시 동작.

---

## Step 1. 카카오 개발자 앱 생성 (3분)

1. [developers.kakao.com](https://developers.kakao.com) 로그인
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 입력:
   - 앱 이름: `TravelDiary MVP`
   - 회사명: (개인)
4. 생성 후 **앱 키 → REST API 키** 복사 → 메모장에 붙여넣기

---

## Step 2. 플랫폼 등록 (1분)

사이드바 **앱 설정 → 플랫폼** → **Web 플랫폼 등록**:

```
https://traveldiary-mvp-production.up.railway.app
http://localhost:3000
```

---

## Step 3. 카카오 로그인 활성화 (2분)

1. 사이드바 **제품 설정 → 카카오 로그인** → **활성화 ON**
2. **Redirect URI** 등록:

```
https://traveldiary-mvp-production.up.railway.app/api/auth/kakao/callback
http://localhost:3000/api/auth/kakao/callback
```

3. **동의 항목** → **닉네임**: 필수 동의

> 이메일 동의는 비즈 앱 전환 후에만 가능. 현재는 닉네임만으로 충분.

---

## Step 4. JWT 비밀키 생성 (30초)

터미널에서:

```bash
openssl rand -hex 32
```

출력된 64자 hex 문자열을 메모장에 복사.

---

## Step 5. Railway 환경변수 등록 (2분)

[Railway 대시보드](https://railway.app) → 프로젝트 → **Variables** → 3개 추가:

| 변수명 | 값 |
|--------|---|
| `KAKAO_CLIENT_ID` | Step 1에서 복사한 REST API 키 |
| `JWT_SECRET` | Step 4에서 생성한 64자 hex |
| `NEXT_PUBLIC_APP_URL` | `https://traveldiary-mvp-production.up.railway.app` |

> `KAKAO_CLIENT_SECRET`는 선택사항 (카카오 콘솔 **보안** 탭에서 발급 가능).

**저장** 클릭 → Railway가 자동 재배포 (2~3분 소요).

---

## Step 6. 검증 (1분)

1. 라이브 사이트 접속: `https://traveldiary-mvp-production.up.railway.app`
2. 우상단 또는 프로필 페이지에서 **카카오 로그인** 버튼 클릭
3. 카카오 동의 화면 → **동의하고 계속하기**
4. 닉네임이 표시되면 성공

---

## 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 카카오 동의 화면이 안 뜸 | Redirect URI 불일치 | Step 3 URI 확인 |
| KOE101 에러 | REST API 키 오타 | Step 1 키 재확인 |
| KOE205 에러 | email scope 요청 | 정상 — email은 비즈앱 전용, 현재 불필요 |
| 로그인 후 빈 페이지 | JWT_SECRET 미설정 | Step 5 확인 |
| "개발 중인 앱입니다" 경고 | 정상 — 개발 앱 상태 | 비즈 전환 전까지 본인 계정만 로그인 가능 |

---

## 다음 단계 (선택)

- **비즈 앱 전환**: 다른 사용자도 로그인 가능하게 하려면 카카오 콘솔에서 비즈 앱 전환 필요
- **이메일 동의**: 비즈 앱 전환 후 동의 항목에서 이메일 추가 가능
- 상세: `docs/12-user-actions.md §B`
