# 시드 데이터 파이프라인

푸꾸옥 800곳 + 다낭 400곳 시드 데이터 자동 수집 파이프라인.

## 실행 순서

```bash
# 1. 환경변수 설정 (.env.local 또는 export)
export GOOGLE_PLACES_API_KEY=your_key_here
export NAVER_CLIENT_ID=your_id_here
export NAVER_CLIENT_SECRET=your_secret_here

# 2. 의존성 설치
npm install

# 3. 단계별 실행 (푸꾸옥)
npm run seed:nearby -- phu-quoc     # ~5분, API 호출 ~400회
npm run seed:details -- phu-quoc    # ~10분, API 호출 ~600회
npm run seed:naver -- phu-quoc      # ~15분, API 호출 ~600회
npm run seed:merge -- phu-quoc      # ~1초, 로컬 처리

# 또는 한 번에 실행
npm run seed:all -- phu-quoc

# 4. 다낭 실행
npm run seed:all -- da-nang
```

## 출력 파일

```
data/seeds/
  phu-quoc-nearby-raw.json    ← Phase A-1 (Google Nearby Search 원시)
  phu-quoc-details.json       ← Phase A-2 (Google Place Details)
  phu-quoc-naver-evidence.json← Phase A-3 (Naver 블로그 후기)
  phu-quoc-merged.json        ← Phase A-4 (최종 병합 결과)
  phu-quoc-stats.json         ← 통계 요약
```

## 중단 복구

모든 스크립트는 **중간 저장** 지원. 중단 후 재실행하면 이어서 처리.

## 비용 추정

| API | 호출 수 (푸꾸옥) | 비용 |
|-----|-----------------|------|
| Google Nearby Search | ~400 | ~$13 |
| Google Place Details | ~600 | ~$10 |
| Google Place Photos | 포함 | - |
| Naver Blog Search | ~600 | 무료 (일 25,000건) |
| **합계** | | **~$23** |

## 다음 단계 (Phase B~D)

- `05-translate-names.ts` — 베트남어→한글 번역 (Claude API)
- `06-categorize.ts` — 세부 카테고리 매핑
- `07-generate-evidence.ts` — Evidence 객체 자동 생성
- `08-quality-score.ts` — 품질 점수 재계산
- `09-verify-coordinates.ts` — 좌표 검증
- `10-verify-active.ts` — 폐업 확인
- `12-export-seed.ts` — SeedPlace[] TypeScript 출력
- `13-export-prisma.ts` — DB insert 스크립트
