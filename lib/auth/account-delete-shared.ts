/**
 * 계정 삭제 confirm 문구 + 검증 — 사이클 8 hotfix (G3, ADR-049).
 *
 * server-only 분리 사유: AccountDeleteConfirmModal(client)이 PHRASE 상수를
 * 사용하면서 server-only 모듈 전체를 client 번들에 끌어들여 빌드 실패.
 * 박제 패턴 [feedback_dry_extraction_with_reexport.md] 적용 — shared 신규
 * 파일에 PHRASE/validator 격리, account-delete.ts는 re-export로 외부 호환.
 */

export const ACCOUNT_DELETE_CONFIRM_PHRASE = "계정 삭제";

export function isValidAccountDeleteConfirm(input: unknown): boolean {
  return (
    typeof input === "string" &&
    input.trim() === ACCOUNT_DELETE_CONFIRM_PHRASE
  );
}
