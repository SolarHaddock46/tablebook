import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb, mapRestaurantPhoto, restaurantPhotos } from "@tablebook/db";
import type { RestaurantPhoto } from "@tablebook/shared";
import { deleteStorageObject } from "./storage";

export async function listRestaurantPhotos(restaurantId: string): Promise<RestaurantPhoto[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(restaurantPhotos)
    .where(eq(restaurantPhotos.restaurantId, restaurantId))
    .orderBy(asc(restaurantPhotos.sortOrder), asc(restaurantPhotos.createdAt));
  return rows.map(mapRestaurantPhoto);
}

export async function loadAvatarUrls(restaurantIds: string[]): Promise<Map<string, string>> {
  if (restaurantIds.length === 0) {
    return new Map();
  }

  const db = getDb();
  const rows = await db
    .select({
      restaurantId: restaurantPhotos.restaurantId,
      url: restaurantPhotos.url
    })
    .from(restaurantPhotos)
    .where(and(inArray(restaurantPhotos.restaurantId, restaurantIds), eq(restaurantPhotos.isAvatar, true)));

  return new Map(rows.map((row) => [row.restaurantId, row.url]));
}

export async function registerRestaurantPhoto(
  restaurantId: string,
  input: { url: string; storage_key?: string; sort_order?: number }
): Promise<RestaurantPhoto> {
  const db = getDb();
  const existing = await listRestaurantPhotos(restaurantId);
  const sortOrder = input.sort_order ?? existing.length;
  const isFirstPhoto = existing.length === 0;

  const [row] = await db
    .insert(restaurantPhotos)
    .values({
      restaurantId,
      url: input.url,
      storageKey: input.storage_key ?? null,
      sortOrder,
      isAvatar: isFirstPhoto
    })
    .returning();

  return mapRestaurantPhoto(row);
}

export async function deleteRestaurantPhoto(restaurantId: string, photoId: string): Promise<void> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(restaurantPhotos)
    .where(and(eq(restaurantPhotos.id, photoId), eq(restaurantPhotos.restaurantId, restaurantId)))
    .limit(1);

  if (!row) {
    throw new PhotoError("Photo not found", 404);
  }

  await deleteStorageObject(row.storageKey);
  await db.delete(restaurantPhotos).where(eq(restaurantPhotos.id, photoId));

  if (row.isAvatar) {
    await promoteFirstPhotoToAvatar(restaurantId);
  }
}

export async function setRestaurantPhotoAvatar(restaurantId: string, photoId: string): Promise<RestaurantPhoto[]> {
  const db = getDb();
  const [target] = await db
    .select()
    .from(restaurantPhotos)
    .where(and(eq(restaurantPhotos.id, photoId), eq(restaurantPhotos.restaurantId, restaurantId)))
    .limit(1);

  if (!target) {
    throw new PhotoError("Photo not found", 404);
  }

  await db
    .update(restaurantPhotos)
    .set({ isAvatar: false })
    .where(eq(restaurantPhotos.restaurantId, restaurantId));

  await db.update(restaurantPhotos).set({ isAvatar: true }).where(eq(restaurantPhotos.id, photoId));

  return listRestaurantPhotos(restaurantId);
}

export async function reorderRestaurantPhotos(restaurantId: string, photoIds: string[]): Promise<RestaurantPhoto[]> {
  const db = getDb();
  const existing = await listRestaurantPhotos(restaurantId);
  const existingIds = new Set(existing.map((photo) => photo.id));
  if (photoIds.length !== existing.length || photoIds.some((id) => !existingIds.has(id))) {
    throw new PhotoError("Invalid photo order", 400);
  }

  await Promise.all(
    photoIds.map((photoId, index) =>
      db
        .update(restaurantPhotos)
        .set({ sortOrder: index })
        .where(and(eq(restaurantPhotos.id, photoId), eq(restaurantPhotos.restaurantId, restaurantId)))
    )
  );

  return listRestaurantPhotos(restaurantId);
}

async function promoteFirstPhotoToAvatar(restaurantId: string): Promise<void> {
  const db = getDb();
  const [next] = await db
    .select()
    .from(restaurantPhotos)
    .where(eq(restaurantPhotos.restaurantId, restaurantId))
    .orderBy(asc(restaurantPhotos.sortOrder), asc(restaurantPhotos.createdAt))
    .limit(1);

  if (!next) {
    return;
  }

  await db.update(restaurantPhotos).set({ isAvatar: true }).where(eq(restaurantPhotos.id, next.id));
}

export class PhotoError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
  }
}
