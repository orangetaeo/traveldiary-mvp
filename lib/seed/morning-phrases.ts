/**
 * 모닝 브리핑 — 오늘의 한 줄 베트남어 (A1 디자인 갭).
 *
 * day index(1-base) % phrases.length 회전. 7개로 일주일 순환.
 *
 * A3(`/phrases` 14문장 라우트, PR #270)와 별도 lib — 진입 컨텍스트가 다름.
 *   - A3: 카테고리 그리드 + Web Speech 발음 (식당/그랩/호텔/응급 14건)
 *   - A1: 모닝 카드 한 줄 인사말 위주 (생활/예의 7건)
 * 두 lib는 후속 사이클에서 통합 검토 (현재 사이클은 충돌 회피 위해 분리).
 */

export interface MorningPhrase {
  ko: string;
  vi: string;
  pronunciation: string;
}

const PHRASES: readonly MorningPhrase[] = [
  { ko: "안녕하세요", vi: "Xin chào", pronunciation: "신 짜오" },
  { ko: "감사합니다", vi: "Cảm ơn", pronunciation: "깜 언" },
  { ko: "맛있어요", vi: "Ngon quá", pronunciation: "응온 꽈" },
  { ko: "얼마예요?", vi: "Bao nhiêu tiền?", pronunciation: "바오 니에우 띠엔" },
  { ko: "괜찮아요", vi: "Không sao", pronunciation: "콩 사오" },
  { ko: "도와주세요", vi: "Giúp tôi với", pronunciation: "줍 또이 버이" },
  { ko: "잘 부탁드려요", vi: "Rất vui được gặp bạn", pronunciation: "젓 부이 드억 갑 반" },
];

export function getMorningPhrase(travelDay: number): MorningPhrase {
  const index = ((travelDay - 1) % PHRASES.length + PHRASES.length) % PHRASES.length;
  return PHRASES[index];
}

export const MORNING_PHRASE_COUNT = PHRASES.length;
