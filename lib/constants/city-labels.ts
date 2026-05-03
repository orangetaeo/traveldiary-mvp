/**
 * destinationCode → 한국어 도시 라벨 매핑 — 사이클 VVV.
 *
 * RR(M2 dashboard 도시별)에서 admin/m2-skip-reasons/page.tsx에 인라인 도입.
 * XXX(affiliate dashboard 시간 윈도우 + 도시별)에서 동일 매핑 재사용 예정 →
 * 2번째 사용처 등장 직전에 공유 lib로 추출 (T18 분석: 추출 패턴, 진화와 분리).
 *
 * 베트남 단일 국가 정책: 8 활성 도시 + 3 dormant(TYO/BKK/CNX) 안전망.
 *
 * 코드 표준 (T14 검증):
 *   - 우선 IATA 공항 코드: PQC, DAD, HAN, SGN, NHA, DLI, CNX
 *   - 비표준 약어: HOI(호이안 — IATA 부재), CTH(껀터 — 실 IATA "VCA"이나 우리 약어)
 *   - dormant: TYO/BKK는 ota-offers 시드만, trip 시드 부재 → 라이브 데이터 미발생 예상
 */

export const CITY_LABEL_KO: Readonly<Record<string, string>> = Object.freeze({
  PQC: "푸꾸옥",
  DAD: "다낭",
  HAN: "하노이",
  SGN: "호치민",
  HOI: "호이안",
  NHA: "나트랑",
  DLI: "달랏",
  CTH: "껀터",
  TYO: "도쿄",
  BKK: "방콕",
  CNX: "치앙마이",
  unknown: "(기록 이전)",
});

/**
 * destinationCode를 한국어 라벨로 변환.
 *
 * @param code destinationCode (예: "DAD", "SGN") — null/undefined/빈 문자열 허용
 * @returns 매핑된 한국어 라벨, 미매핑이면 원본 code, code 자체가 빈 값이면 "(unknown)"
 *
 * 호출부 fallback 노이즈 제거 — RR 패턴 `CITY_LABEL[d.code] ?? d.code`를 함수 1회 호출로 대체.
 */
export function getCityLabelKo(code: string | null | undefined): string {
  if (!code) return "(unknown)";
  return CITY_LABEL_KO[code] ?? code;
}
