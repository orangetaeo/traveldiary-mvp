/**
 * ShareLink Repository — 사이클 11a (ADR-024).
 */

import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import {
  fetchTripFromDb,
  type TripBundle,
} from "./trip.repository";
import type { ShareLink, SharePermission } from "../types";

type DbRow = Prisma.ShareLinkGetPayload<Record<string, never>>;

function rowToShareLink(row: DbRow): ShareLink {
  return {
    id: row.id,
    tripId: row.tripId,
    syncKey: row.syncKey,
    permission: row.permission as SharePermission,
    expiresAt: row.expiresAt?.toISOString(),
    createdBy: row.createdBy ?? undefined,
    createdAt: row.createdAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString(),
  };
}

export interface CreateShareLinkInput {
  tripId: string;
  syncKey: string;
  permission?: SharePermission;
  expiresAt?: Date;
  createdBy?: string | null;
}

export async function createShareLinkRow(
  input: CreateShareLinkInput,
): Promise<ShareLink | null> {
  if (!prisma) return null;
  try {
    const row = await prisma.shareLink.create({
      data: {
        tripId: input.tripId,
        syncKey: input.syncKey,
        permission: input.permission ?? "view",
        expiresAt: input.expiresAt,
        createdBy: input.createdBy ?? undefined,
      },
    });
    return rowToShareLink(row);
  } catch (err) {
    console.error("[share.repository] create failed", err);
    return null;
  }
}

export async function fetchShareLinkBySyncKey(
  syncKey: string,
): Promise<{ link: ShareLink; bundle: TripBundle } | null> {
  if (!prisma) return null;
  try {
    const row = await prisma.shareLink.findUnique({ where: { syncKey } });
    if (!row) return null;
    if (row.revokedAt) return null;
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;

    const bundle = await fetchTripFromDb(row.tripId);
    if (!bundle) return null;

    return { link: rowToShareLink(row), bundle };
  } catch (err) {
    console.error("[share.repository] fetchBySyncKey failed", err);
    return null;
  }
}

export async function revokeShareLink(
  id: string,
): Promise<{ revoked: boolean } | null> {
  if (!prisma) return null;
  try {
    await prisma.shareLink.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  } catch (err) {
    console.error("[share.repository] revoke failed", err);
    return null;
  }
}
