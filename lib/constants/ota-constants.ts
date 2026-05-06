/**
 * OTA 공급자 표시용 상수.
 * OtaCompareSection + admin/affiliate 공유.
 */

/** OTA → 사용자 노출 라벨 */
export const OTA_LABEL: Record<string, string> = {
  klook: "Klook",
  kkday: "KKday",
  agoda: "Agoda",
  unknown: "기타",
};

/** OTA → 배경 색상 (admin bar chart용) */
export const OTA_COLOR: Record<string, string> = {
  klook: "bg-purple",
  kkday: "bg-amber",
  agoda: "bg-success",
  unknown: "bg-ink-mute",
};

/** OTA → soft 톤 (카드/뱃지용) */
export const OTA_TONE: Record<string, string> = {
  klook: "bg-purple-soft text-purple-deep",
  kkday: "bg-amber-soft text-amber-deep",
  agoda: "bg-success-soft text-success-deep",
};
