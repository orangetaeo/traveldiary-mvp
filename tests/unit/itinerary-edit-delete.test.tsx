/**
 * 일정 항목 수정/삭제 기능 검증.
 *
 * Repository → Action → UI 전 레이어 정적 소스 + 렌더 테스트.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/* ═══════ 소스 로딩 ═══════ */

const repoSrc = fs.readFileSync(
  path.resolve("lib/repositories/trip.repository.ts"),
  "utf-8",
);
const actionSrc = fs.readFileSync(
  path.resolve("actions/itinerary.ts"),
  "utf-8",
);
const cardSrc = fs.readFileSync(
  path.resolve("components/itinerary/ItineraryItemCard.tsx"),
  "utf-8",
);
const modalSrc = fs.readFileSync(
  path.resolve("components/itinerary/AddItemModal.tsx"),
  "utf-8",
);
const viewSrc = fs.readFileSync(
  path.resolve("components/itinerary/ItineraryView.tsx"),
  "utf-8",
);

/* ═══════ Repository ═══════ */

describe("trip.repository — updateItineraryItem", () => {
  it("함수 export 존재", () => {
    expect(repoSrc).toContain("export async function updateItineraryItem");
  });

  it("tripId + itemId로 findFirst (cross-trip 방어)", () => {
    expect(repoSrc).toContain("where: { id: input.itemId, tripId: input.tripId }");
  });

  it("before/after 스냅샷 반환", () => {
    expect(repoSrc).toContain("before: {");
    expect(repoSrc).toContain("after: {");
  });

  it("not_found 반환 처리", () => {
    expect(repoSrc).toMatch(/return "not_found" as const/);
  });

  it("Trip.updatedAt 갱신 (낙관적 동시성 신호)", () => {
    // updateItineraryItem 함수 내에서 trip.update 호출
    expect(repoSrc).toContain("// Trip.updatedAt 갱신 (낙관적 동시성 신호)");
  });
});

describe("trip.repository — deleteItineraryItem", () => {
  it("함수 export 존재", () => {
    expect(repoSrc).toContain("export async function deleteItineraryItem");
  });

  it("의존성 엣지 삭제 (dependentId OR dependencyId)", () => {
    expect(repoSrc).toContain("itineraryDependency.deleteMany");
    expect(repoSrc).toContain("dependentId: itemId");
    expect(repoSrc).toContain("dependencyId: itemId");
  });

  it("before 스냅샷으로 ItineraryItem 반환", () => {
    expect(repoSrc).toContain("before: rowToItineraryItem(before)");
  });
});

/* ═══════ Action ═══════ */

describe("actions/itinerary — editItineraryItem", () => {
  it("함수 export 존재", () => {
    expect(actionSrc).toContain("export async function editItineraryItem");
  });

  it("canWriteTripOrViaShareLink 권한 체크", () => {
    expect(actionSrc).toContain("canWriteTripOrViaShareLink");
  });

  it('audit log action: "itinerary.update"', () => {
    expect(actionSrc).toContain('action: "itinerary.update"');
  });

  it("DEMO_TRIP_ID 가드", () => {
    expect(actionSrc).toContain("DEMO_TRIP_ID");
  });

  it("revalidatePath 호출", () => {
    // editItineraryItem 내에서 revalidatePath 호출
    const editFnStart = actionSrc.indexOf("async function editItineraryItem");
    const editFnEnd = actionSrc.indexOf("async function removeItineraryItem");
    const editFnBody = actionSrc.slice(editFnStart, editFnEnd);
    expect(editFnBody).toContain("revalidatePath");
  });
});

describe("actions/itinerary — removeItineraryItem", () => {
  it("함수 export 존재", () => {
    expect(actionSrc).toContain("export async function removeItineraryItem");
  });

  it('audit log action: "itinerary.delete"', () => {
    expect(actionSrc).toContain('action: "itinerary.delete"');
  });

  it("before snapshot을 audit log에 기록", () => {
    expect(actionSrc).toContain("result.before.tripId");
    expect(actionSrc).toContain("result.before.name");
  });

  it("삭제 결과로 deletedId 반환", () => {
    expect(actionSrc).toContain("deletedId: input.itemId");
  });
});

/* ═══════ UI — ItineraryItemCard ═══════ */

describe("ItineraryItemCard — edit/delete 버튼", () => {
  it("onEdit prop 존재", () => {
    expect(cardSrc).toContain("onEdit?: (item: ItineraryItem) => void");
  });

  it("onDelete prop 존재", () => {
    expect(cardSrc).toContain("onDelete?: (item: ItineraryItem) => void");
  });

  it("수정 버튼 aria-label", () => {
    expect(cardSrc).toContain('aria-label="수정"');
  });

  it("삭제 버튼 aria-label", () => {
    expect(cardSrc).toContain('aria-label="삭제"');
  });

  it("edit 아이콘 사용", () => {
    expect(cardSrc).toMatch(/aria-hidden>\s*edit\s*<\/span>/);
  });

  it("delete 아이콘 사용", () => {
    expect(cardSrc).toMatch(/aria-hidden>\s*delete\s*<\/span>/);
  });

  it("onEdit 조건부 렌더링", () => {
    expect(cardSrc).toContain("{onEdit && (");
  });

  it("onDelete 조건부 렌더링", () => {
    expect(cardSrc).toContain("{onDelete && (");
  });
});

/* ═══════ UI — AddItemModal edit mode ═══════ */

describe("AddItemModal — edit mode", () => {
  it("editItem prop 존재", () => {
    expect(modalSrc).toContain("editItem?:");
  });

  it("isEditMode 계산", () => {
    expect(modalSrc).toContain("const isEditMode = Boolean(editItem)");
  });

  it("수정 모드 제목: 일정 수정", () => {
    expect(modalSrc).toContain('"일정 수정"');
  });

  it("수정 모드에서 AI 추천 숨김", () => {
    expect(modalSrc).toContain("!isEditMode && top5.length > 0");
  });

  it("수정 모드 버튼 텍스트", () => {
    expect(modalSrc).toContain('"수정 중…"');
    expect(modalSrc).toContain('"일정 수정"');
  });

  it("editItem 변경 시 폼 pre-fill", () => {
    expect(modalSrc).toContain("setName(editItem.name)");
    expect(modalSrc).toContain("setCategory(editItem.category)");
    expect(modalSrc).toContain("setDuration(editItem.durationMinutes)");
    expect(modalSrc).toContain("setFlexibility(editItem.flexibility)");
  });
});

/* ═══════ UI — ItineraryView 핸들러 ═══════ */

describe("ItineraryView — edit/delete 핸들러", () => {
  it("editItineraryItem import", () => {
    expect(viewSrc).toContain("editItineraryItem");
  });

  it("removeItineraryItem import", () => {
    expect(viewSrc).toContain("removeItineraryItem");
  });

  it("editingItem state", () => {
    expect(viewSrc).toContain("editingItem");
  });

  it("handleStartEdit 함수", () => {
    expect(viewSrc).toContain("function handleStartEdit");
  });

  it("handleEditItem 함수 — 낙관적 업데이트", () => {
    expect(viewSrc).toContain("function handleEditItem");
    expect(viewSrc).toContain("prev.map");
  });

  it("handleDeleteItem 함수 — confirm + 낙관적 삭제", () => {
    expect(viewSrc).toContain("function handleDeleteItem");
    expect(viewSrc).toContain("window.confirm");
    expect(viewSrc).toContain("prev.filter");
  });

  it("카드에 onEdit, onDelete 전달", () => {
    expect(viewSrc).toContain("onEdit={handleStartEdit}");
    expect(viewSrc).toContain("onDelete={handleDeleteItem}");
  });

  it("AddItemModal에 editItem prop 전달", () => {
    expect(viewSrc).toContain("editItem={editingItem");
  });

  it("수정 성공 시 toast 표시", () => {
    expect(viewSrc).toContain("수정됨 (DB 영속화)");
  });

  it("삭제 성공 시 toast 표시", () => {
    expect(viewSrc).toContain("삭제됨");
  });

  it("수정/삭제 실패 시 rollback", () => {
    // handleEditItem에서 prevItems로 롤백
    const editFnIdx = viewSrc.indexOf("function handleEditItem");
    const deleteFnIdx = viewSrc.indexOf("function handleDeleteItem");
    const editBody = viewSrc.slice(editFnIdx, deleteFnIdx);
    expect(editBody).toContain("setItems(prevItems)");
    // handleDeleteItem에서도 prevItems로 롤백
    const deleteBody = viewSrc.slice(deleteFnIdx, viewSrc.indexOf("function handleEnterTravelMode"));
    expect(deleteBody).toContain("setItems(prevItems)");
  });
});
