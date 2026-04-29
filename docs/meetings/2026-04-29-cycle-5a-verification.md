# 사이클 5a 다중 검증 리포트 — 외부 노출

**라이브 URL**: https://traveldiary-mvp-production.up.railway.app
**커밋**: `eec8df6` (Next 14.2.35 보안 패치 후)
**Region**: asia-southeast1-eqsg3a
**검증 시각**: 2026-04-29 19:59 +07 (베트남 붕따우)

---

## ① 자체 검증 + ② 빌드 게이트 통과

| 항목 | 결과 |
|------|------|
| GitHub 저장소 생성 | ✅ `orangetaeo/traveldiary-mvp` (private) |
| 첫 커밋 push | ✅ `f99062c` |
| Railway 자동 빌드 | ❌ → ✅ (1차 실패, 2차 성공) |
| 1차 실패 원인 | **Next.js 14.2.5 HIGH CVE 2건** (CVE-2025-55184, CVE-2025-67779) — Railway 보안 게이트 차단 |
| 보안 패치 | ✅ `eec8df6` Next 14.2.35로 업그레이드 + 의존성 분류 정리 (`@prisma/client` + `prisma`를 dependencies로) |
| 2차 빌드 | ✅ Initialization → Build image → Deploy → Network → Post-deploy |
| 도메인 발급 | ✅ `traveldiary-mvp-production.up.railway.app` |

## ③ QA 골든패스 (외부 curl 검증)

```
/api/health → 200 {"status":"demo","cycle":"5a","db":"demo"}
/                                              HTTP 200
/onboarding                                    HTTP 200 (푸꾸옥 우선)
/itinerary/creating                            HTTP 200
/itinerary/demo-trip-phu-quoc                  HTTP 200
/itinerary/demo-trip-phu-quoc/item/pq-item-1   HTTP 200
/travel/demo-trip-phu-quoc                     HTTP 200
/translate?trip=demo-trip-phu-quoc             HTTP 200
```

콘텐츠 노출 검증:
- M1 추천 근거: "왜 이걸 골랐나" / "네이버 후기 412건" / "즈엉동 야시장" ✅
- M3 Live Replan: "지연 시뮬레이션" CTA / "여행 중 모드" 진입 카드 ✅
- M4 메뉴 번역: "똠 훔" / "랍스터" / "메뉴 번역" 라벨 ✅

## ④ CTO 사인오프

| 영역 | 평가 |
|------|------|
| 인프라 분리 | ✅ Railway 별도 계정, 시드니 사이트 영향 0 |
| 보안 | ✅ Railway 보안 게이트 통과 (HIGH CVE 0건). Next 14.x 패치 ADR-001 메이저 변경 아님 — 자동 승인. |
| 비용 | ⚠️ Railway Hobby Plan 시작 — 월 $5 트라이얼 / 트래픽 미미 |
| 데모 라벨 | ✅ /api/health에 `cycle: "5a"` `status: "demo"` 명시 — 사용자가 실서비스로 오인 방지 |
| ADR | ✅ ADR-016 (Railway 데모 모드 배포) 작성·통과 |

### 사인오프: ✅ 사이클 5a 완료. **외부 사용자 시연 가능 상태**.

---

## 결과 요약

```
M1 추천 근거 패널 ✅
M2 D-Day 모드 전환 (데모 토글) ✅
M3 Live Replan (클라이언트 시뮬) ✅
M4 카메라 번역 (정적 메뉴 시드) ✅
+ 외부 URL ✅
```

다음 사이클 5b 후보:
- ADR-013: Prisma adapter + Railway PostgreSQL + 첫 mutation Server Action + writeAuditLog 실호출
- 외부 API 결합 (Google Vision·Claude·Naver) — 별도 ADR
- Geolocation 권한 (M2 자동 트리거) — Privacy ADR
