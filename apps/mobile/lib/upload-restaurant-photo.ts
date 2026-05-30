import { ApiError } from "@tablebook/api-client";
import type { RestaurantPhoto } from "@tablebook/shared";
import { api } from "./api";

type UploadInput = {
  restaurantId: string;
  uri: string;
  fileName: string;
  mimeType: string;
};

type UploadResult =
  | { photo: RestaurantPhoto; photos: RestaurantPhoto[] }
  | { photo: RestaurantPhoto };

type PresignResponse =
  | { mode: "local" }
  | { upload_url: string; public_url: string; storage_key: string };

export async function uploadRestaurantPhoto(input: UploadInput): Promise<UploadResult> {
  const blob = await fetchBlob(input.uri);
  const presign = await api.presignRestaurantPhoto(input.restaurantId, {
    content_type: input.mimeType,
    file_name: input.fileName
  }) as PresignResponse;

  if ("mode" in presign && presign.mode === "local") {
    return api.uploadRestaurantPhotoLocal(input.restaurantId, blob, input.fileName);
  }

  const uploadResponse = await fetch(presign.upload_url, {
    method: "PUT",
    headers: { "Content-Type": input.mimeType },
    body: blob
  });
  if (!uploadResponse.ok) {
    throw new Error("S3 upload failed");
  }
  return api.registerRestaurantPhoto(input.restaurantId, {
    url: presign.public_url,
    storage_key: presign.storage_key
  });
}

async function fetchBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}
