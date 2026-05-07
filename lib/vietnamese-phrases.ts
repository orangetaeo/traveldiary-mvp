/**
 * 베트남어 핵심 문장 카드 데이터 (A3 디자인 갭, 사이클 W3 자율 영역).
 *
 * 자유여행자가 자주 마주치는 4 카테고리(식당/그랩/호텔/응급) 14 문장.
 * 한국어 문장 + 베트남어 + 한국어 발음 표기(IPA 아님 — 한국인 학습용 음역).
 *
 * 정적 데이터 — 외부 API 0, 의존성 0. R1 게이트 무관.
 *
 * 발음 표기는 베트남 북부 표준(하노이) 기준. 남부(호치민) 발음과 다소 차이 있음.
 */

export type PhraseCategory = "restaurant" | "grab" | "hotel" | "emergency";

export interface Phrase {
  id: string;
  category: PhraseCategory;
  /** 한국어 문장 */
  ko: string;
  /** 베트남어 문장 (Quốc ngữ 표기) */
  vi: string;
  /** 한국어 발음 음역 (한국인 학습용) */
  pronunciation: string;
  /** 사용 상황 메모 (선택) */
  context?: string;
}

export interface CategoryMeta {
  id: PhraseCategory;
  label: string;
  /** Material Symbols 이름 */
  icon: string;
  /** 카테고리 색상 토큰 (purple/amber/danger 등) */
  accent: "purple" | "amber" | "success" | "danger";
}

export const PHRASE_CATEGORIES: CategoryMeta[] = [
  { id: "restaurant", label: "식당", icon: "restaurant", accent: "amber" },
  { id: "grab", label: "그랩", icon: "local_taxi", accent: "purple" },
  { id: "hotel", label: "호텔", icon: "hotel", accent: "success" },
  { id: "emergency", label: "응급", icon: "emergency", accent: "danger" },
];

export const PHRASES: Phrase[] = [
  // 식당 (5)
  {
    id: "rest-1",
    category: "restaurant",
    ko: "메뉴 주세요",
    vi: "Cho tôi xem thực đơn",
    pronunciation: "쩌 또이 쌤 특 던",
    context: "주문 시작",
  },
  {
    id: "rest-2",
    category: "restaurant",
    ko: "이거 매워요?",
    vi: "Cái này có cay không?",
    pronunciation: "까이 나이 꼬 까이 콩",
    context: "매운 정도 확인",
  },
  {
    id: "rest-3",
    category: "restaurant",
    ko: "안 맵게 해주세요",
    vi: "Không cay nhé",
    pronunciation: "콩 까이 녜",
    context: "주문 시 요청",
  },
  {
    id: "rest-4",
    category: "restaurant",
    ko: "계산해 주세요",
    vi: "Tính tiền cho tôi",
    pronunciation: "띤 띠엔 쩌 또이",
    context: "결제 요청",
  },
  {
    id: "rest-5",
    category: "restaurant",
    ko: "맛있어요!",
    vi: "Ngon quá!",
    pronunciation: "응온 꽈",
    context: "맛 칭찬",
  },

  // 그랩 (3)
  {
    id: "grab-1",
    category: "grab",
    ko: "여기서 출발해요",
    vi: "Đi từ đây",
    pronunciation: "디 뜨 더이",
    context: "픽업 위치 확인",
  },
  {
    id: "grab-2",
    category: "grab",
    ko: "여기로 가주세요",
    vi: "Đến đây giúp tôi",
    pronunciation: "덴 더이 줍 또이",
    context: "목적지 안내",
  },
  {
    id: "grab-3",
    category: "grab",
    ko: "여기 다 왔어요. 세워주세요",
    vi: "Đến rồi, dừng đây nhé",
    pronunciation: "덴 조이, 즈응 더이 녜",
    context: "도착 알림",
  },

  // 호텔 (3)
  {
    id: "hotel-1",
    category: "hotel",
    ko: "체크인하고 싶어요",
    vi: "Tôi muốn nhận phòng",
    pronunciation: "또이 무온 년 펑",
    context: "프런트에서",
  },
  {
    id: "hotel-2",
    category: "hotel",
    ko: "와이파이 비밀번호 알려주세요",
    vi: "Cho tôi mật khẩu Wi-Fi với",
    pronunciation: "쩌 또이 멋 커우 와이파이 버이",
    context: "방 입실 후",
  },
  {
    id: "hotel-3",
    category: "hotel",
    ko: "짐 보관해 주세요",
    vi: "Cho tôi gửi hành lý",
    pronunciation: "쩌 또이 그이 한 리",
    context: "체크아웃 후 관광",
  },

  // 응급 (3)
  {
    id: "emer-1",
    category: "emergency",
    ko: "병원에 가야 해요",
    vi: "Tôi cần đến bệnh viện",
    pronunciation: "또이 껀 덴 벤 비엔",
    context: "몸이 안 좋을 때",
  },
  {
    id: "emer-2",
    category: "emergency",
    ko: "여권을 잃어버렸어요",
    vi: "Tôi bị mất hộ chiếu",
    pronunciation: "또이 비 멋 호 찌에우",
    context: "분실 신고",
  },
  {
    id: "emer-3",
    category: "emergency",
    ko: "도와주세요!",
    vi: "Cứu tôi với!",
    pronunciation: "끄우 또이 버이",
    context: "긴급 상황",
  },
];

/**
 * 카테고리별 문장 그룹화. UI에서 카테고리 뷰 렌더 시 사용.
 */
export function groupByCategory(): Record<PhraseCategory, Phrase[]> {
  const result = {
    restaurant: [] as Phrase[],
    grab: [] as Phrase[],
    hotel: [] as Phrase[],
    emergency: [] as Phrase[],
  };
  for (const p of PHRASES) {
    result[p.category].push(p);
  }
  return result;
}

/**
 * 단건 카테고리 메타 조회 (UNDEFINED 방어).
 */
export function getCategoryMeta(id: PhraseCategory): CategoryMeta {
  const found = PHRASE_CATEGORIES.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Unknown phrase category: ${id}`);
  }
  return found;
}
