# 12. 사용자 직접 액션 가이드

> 사이클 L 산출물 (2026-05-02). 코드 외 사용자가 직접 수행해야 하는 액션을 한 곳에 모음.

데모 모드(키 미설정)에서도 모든 화면이 동작합니다. 아래 액션은 **활성화 시 가치가 큰 순서**로 정렬되어 있으며, 한 번에 다 하지 않아도 됩니다.

---

## 🚨 우선 액션 (대기 중)

### A. `prisma migrate deploy` — 사이클 E의 0007 마이그레이션 (prod)

**상태**: 미적용. 마이그 파일은 이미 코드에 있고, 자동 배포(`prisma migrate deploy && next start`)가 다음 배포 시 자동 적용함.

**즉시 적용하고 싶을 때**:

```bash
# 1. Railway CLI 로그인 (이미 했으면 생략)
railway login

# 2. 프로젝트 link (이미 했으면 생략)
cd c:/Projects/traveldiary-mvp
railway link

# 3. 마이그 적용 (DATABASE_URL은 Railway Variables에서 자동 주입)
railway run npx prisma migrate deploy
```

**또는 단순히 다음 배포 트리거** (commit + push) 시 자동 적용됨.

**적용되는 변경**:
- `ValidationResult` 테이블에 `priceStatus` / `distanceStatus` TEXT 컬럼 (NULLABLE)
- 기존 row 호환 (보수적 fallback 유지)
- 사이클 E의 캐시 hit 정확도 ↑ (외부 API 호출 50% 감소)

**검증**:
```bash
railway run npx prisma db execute --stdin <<EOF
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'ValidationResult' AND column_name IN ('priceStatus', 'distanceStatus');
EOF
```
2 rows 반환되면 적용 완료.

**참고 ADR**: [ADR-031](adr/ADR-031-validation-status-columns.md)

---

### B. 카카오 OAuth 활성화 (인증 전환점)

**상태**: 코드 100% 준비 완료 (사이클 11b 종료). 카카오 키 발급만 남음.

#### 1. 카카오 개발자 콘솔
[https://developers.kakao.com](https://developers.kakao.com) → 로그인 → 내 애플리케이션 → 애플리케이션 추가하기.

| 입력 | 값 |
|------|---|
| 앱 이름 | TravelDiary MVP |
| 회사명 | (개인) |

생성 후 **앱 키 → REST API 키** 복사 (= `KAKAO_CLIENT_ID`).

#### 2. 플랫폼 설정
사이드바 **앱 설정 → 플랫폼** → **Web 플랫폼 등록** → 사이트 도메인:

```
https://traveldiary-mvp-production.up.railway.app
http://localhost:3000
```

#### 3. 카카오 로그인 활성화
사이드바 **제품 설정 → 카카오 로그인** → 활성화 ON → **Redirect URI** 등록:

```
https://traveldiary-mvp-production.up.railway.app/api/auth/kakao/callback
http://localhost:3000/api/auth/kakao/callback
```

#### 4. 동의 항목
**제품 설정 → 카카오 로그인 → 동의 항목**:
- **닉네임** — 필수 동의
- **이메일** — 선택 동의 (선택사항, 사이클 11c+에서 활용)

#### 5. JWT 비밀키 생성

```bash
openssl rand -hex 32
```

출력값(64자 hex)을 `JWT_SECRET`으로 사용. **외부 노출 절대 금지**.

#### 6. Railway Variables 추가

Railway 대시보드 → 프로젝트 → Variables → 4개 추가:

```
KAKAO_CLIENT_ID=<5-1에서 복사한 REST API 키>
KAKAO_CLIENT_SECRET=<선택. 카카오 콘솔의 보안 → Client Secret에서 발급 가능>
JWT_SECRET=<5-5에서 생성한 64자 hex>
NEXT_PUBLIC_APP_URL=https://traveldiary-mvp-production.up.railway.app
```

저장 시 자동 재배포됨.

#### 7. 검증

라이브 사이트 → 우상단 **카카오 로그인** 버튼 (이전엔 disabled) → 카카오 동의 화면 → 닉네임 표시 확인.

**참고 ADR**: [ADR-026](adr/ADR-026-kakao-oauth-and-jwt.md)

---

## 🟡 활성 시 효과 있는 액션 (선택)

| 키 | 효과 | 가이드 |
|----|------|--------|
| `GOOGLE_PLACES_API_KEY` | M1 추천 근거 패널의 1·2단계 검증 (placeId·rating) | [ADR-018](adr/ADR-018-google-places-and-evidence-cache.md) |
| `GOOGLE_VISION_API_KEY` + `ANTHROPIC_API_KEY` | M4 카메라 번역 실 동작 (정적 시드 → 실 OCR) | [ADR-019](adr/ADR-019-vision-ocr-and-claude.md) |
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | M1 한국어 후기 검증 (네이버 블로그·로컬) | [ADR-020](adr/ADR-020-naver-local-and-blog.md) |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | A1 인라인 지도 (item 상세 페이지) | [ADR-028](adr/ADR-028-google-maps-embed.md) |
| `KLOOK_*` / `KKDAY_*` / `AGODA_*` 어필리에이트 | M8 OTA 가격 비교 + 수익 모델 | [ADR-025](adr/ADR-025-ota-price-and-affiliate.md) + [ADR-027](adr/ADR-027-real-ota-api.md) |

미설정 시 모든 화면이 시드 fallback으로 정상 동작합니다.

---

## ✅ 액션 후 체크 (선택)

```bash
# 라이브 헬스체크
curl https://traveldiary-mvp-production.up.railway.app/api/health

# 응답 예시
# { "status": "ok", "database": "ok", "uptime": 1234 }
```

화면 동작:
- 홈 → "다른 도시 둘러보기" → "전체 보기 →" → /trips → 8 도시 노출
- /trips → 카드 클릭 → /itinerary 또는 /city
- /city/da-lat → Hero 아래 큰 CTA 카드 → 일정 진입
- /city/can-tho → Hero 아래 amber "준비 중" 안내 → /trips
- (OAuth 활성 후) 우상단 카카오 로그인 → 동의 → 닉네임 표시

---

## 🔬 C. 외부 API 키 활성 검증 (사이클 Y 신규)

키를 Railway Variables에 등록하고 재배포한 뒤 **정말 인식됐는지** 한 번 확인하는 절차.

### C-1. M4 카메라 번역 (Vision OCR + Claude 번역)

```bash
curl https://traveldiary-mvp-production.up.railway.app/api/diag/translate
```

기대 응답 예시 (둘 다 활성):

```json
{
  "feature": "M4 Camera Translate",
  "services": {
    "vision": { "available": true,  "keyMask": "****abcd" },
    "claude": { "available": true,  "keyMask": "****wxyz" }
  },
  "fallback": { "mode": "demo", "description": "..." }
}
```

- `available: false` → Railway Variables에서 키명 오타 또는 빈 값. 재등록 후 자동 재배포 대기.
- `available: true` → /translate 페이지에서 실제 메뉴 사진 업로드 → 결과 확인. 처음 호출은 1~2초 (Vision + Claude 직렬). 두 번째부터는 EvidenceCache hit.

### C-2. 회귀 모니터링

E2E nightly(ADR-037)는 `/translate` 페이지 진입까지만 검증 (실 OCR 호출은 비용 + flake 위험). 키 만료/취소 회귀는 사용자가 위 진단으로 주기적(분기 1회) 확인.

| 키 | 발급처 | 진단 |
|---|---|---|
| `GOOGLE_VISION_API_KEY` | https://console.cloud.google.com/apis/credentials | `vision.available` |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/ | `claude.available` |

### C-3. 비용 가드 (ADR-019)

- Vision: $1.50 / 1k images. 30일 EvidenceCache → 같은 사진 재호출 X
- Claude haiku: 입력 $0.25/M, 출력 $1.25/M. 메뉴 1장당 ~$0.001
- 일일 호출 추정: 100 사용자 × 2회 = $0.50/일 미만. 모니터링은 콘솔.

---

## 🔁 시크릿 회전 정책 (S-11 §1.5)

| 키 | 권장 회전 주기 | 영향 |
|----|---------------|------|
| `JWT_SECRET` | 분기별 1회 | 모든 사용자 재로그인 필요 |
| `KAKAO_CLIENT_SECRET` | 연 1회 | 무영향 (서버 fetch만) |
| `GOOGLE_*` | 누출 의심 시 | EvidenceCache 무효화 |
| `NAVER_*` | 누출 의심 시 | (보유 토큰 재발급) |

회전 절차: Railway Variables 갱신 → 자동 재배포 → 헬스체크 → 화면 검증.
