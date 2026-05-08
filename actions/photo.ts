"use server";

/**
 * Photo Server Actions — E3 여행 사진 앨범.
 * cost.ts 패턴 답습. 감사 로그 절대 규칙 준수.
 */

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import {
  createPhoto,
  deletePhoto as deletePhotoFromDb,
  listPhotosByTrip,
  updatePhoto,
  type CreatePhotoInput,
} from "@/lib/repositories/photo.repository";
import { isDbConnected } from "@/lib/prisma";
import { getActorId } from "@/lib/auth/session";
import { canWriteTripOrViaShareLink } from "@/lib/auth/authorize";
import { resolveActorIdForTrip } from "@/lib/auth/actor-resolution";
import type { TripPhoto } from "@/lib/types";

export type PhotoActionResult<T = unknown> =
  | { ok: true; demo: true }
  | { ok: true; demo: false; data: T }
  | { ok: false; code: "forbidden" | "internal" | "not_found" | "invalid" };

// ═══════════════════════════════════════════════════════════════════
// addPhoto
// ═══════════════════════════════════════════════════════════════════

export async function addPhoto(input: {
  tripId: string;
  url: string;
  caption?: string;
  dayIndex?: number;
  shareKey?: string;
}): Promise<PhotoActionResult<TripPhoto>> {
  if (!input.url || typeof input.url !== "string" || input.url.length > 500) {
    return { ok: false, code: "invalid" };
  }

  if (!isDbConnected) {
    return { ok: true, demo: true };
  }

  if (!(await canWriteTripOrViaShareLink(input.tripId, input.shareKey))) {
    return { ok: false, code: "forbidden" };
  }

  const sessionActorId = await getActorId();
  const actorId = resolveActorIdForTrip(input.tripId, sessionActorId);

  const createInput: CreatePhotoInput = {
    tripId: input.tripId,
    actorId,
    url: input.url,
    caption: input.caption?.slice(0, 200),
    dayIndex: input.dayIndex,
  };

  const photo = await createPhoto(createInput);
  if (!photo) return { ok: false, code: "internal" };

  await writeAuditLog({
    actorId: sessionActorId,
    action: "photo.add",
    resource: "TripPhoto",
    resourceId: photo.id,
    after: { tripId: photo.tripId, url: photo.url, dayIndex: photo.dayIndex },
    metadata: { source: "web" },
  });

  revalidatePath(`/wrap-up/${input.tripId}`);
  revalidatePath(`/wrap-up/${input.tripId}/album`);
  return { ok: true, demo: false, data: photo };
}

// ═══════════════════════════════════════════════════════════════════
// removePhoto
// ═══════════════════════════════════════════════════════════════════

export async function removePhoto(input: {
  id: string;
  tripId: string;
  shareKey?: string;
}): Promise<PhotoActionResult<{ id: string }>> {
  if (!isDbConnected) {
    return { ok: true, demo: true };
  }

  if (!(await canWriteTripOrViaShareLink(input.tripId, input.shareKey))) {
    return { ok: false, code: "forbidden" };
  }

  const result = await deletePhotoFromDb(input.id);
  if (result === null) return { ok: false, code: "internal" };
  if (result === "not_found") return { ok: false, code: "not_found" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "photo.delete",
    resource: "TripPhoto",
    resourceId: input.id,
    before: { tripId: result.before.tripId, url: result.before.url },
    after: null,
    metadata: { source: "web" },
  });

  revalidatePath(`/wrap-up/${input.tripId}`);
  revalidatePath(`/wrap-up/${input.tripId}/album`);
  return { ok: true, demo: false, data: { id: input.id } };
}

// ═══════════════════════════════════════════════════════════════════
// editPhoto — 캡션 수정
// ═══════════════════════════════════════════════════════════════════

export async function editPhoto(input: {
  id: string;
  tripId: string;
  caption?: string;
  shareKey?: string;
}): Promise<PhotoActionResult<TripPhoto>> {
  if (!isDbConnected) {
    return { ok: true, demo: true };
  }

  if (!(await canWriteTripOrViaShareLink(input.tripId, input.shareKey))) {
    return { ok: false, code: "forbidden" };
  }

  const result = await updatePhoto(input.id, input.caption?.slice(0, 200));
  if (result === null) return { ok: false, code: "internal" };
  if (result === "not_found") return { ok: false, code: "not_found" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "photo.update",
    resource: "TripPhoto",
    resourceId: input.id,
    before: { caption: result.before.caption ?? null },
    after: { caption: result.after.caption ?? null },
    metadata: { source: "web" },
  });

  revalidatePath(`/wrap-up/${input.tripId}`);
  revalidatePath(`/wrap-up/${input.tripId}/album`);
  return { ok: true, demo: false, data: result.photo };
}

// ═══════════════════════════════════════════════════════════════════
// getPhotos — 여행 사진 목록 조회
// ═══════════════════════════════════════════════════════════════════

export async function getPhotos(tripId: string): Promise<TripPhoto[]> {
  if (!isDbConnected) return [];
  const photos = await listPhotosByTrip(tripId);
  return photos ?? [];
}
