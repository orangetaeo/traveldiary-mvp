/** 온보딩 페이지 유틸리티 — 순수 함수. */

/** 날짜 문자열을 한국어 표시로 변환 (예: "5월 14일 (수)") */
export function formatStartDateKo(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

export function destinationToCode(name: string): string {
  return ({
    "푸꾸옥": "PQC", "다낭": "DAD", "호치민": "SGN",
    "하노이": "HAN", "나트랑": "NHA", "달랏": "DLI",
  } as Record<string, string>)[name] ?? "PQC";
}

export function paceLabelToCode(label: string): "relaxed" | "balanced" | "packed" {
  if (label === "여유롭게") return "relaxed";
  if (label === "최대한 많이") return "packed";
  return "balanced";
}
