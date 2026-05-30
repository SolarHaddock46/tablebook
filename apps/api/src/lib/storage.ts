import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type PresignedUpload = {
  upload_url: string;
  public_url: string;
  storage_key: string;
};

export type LocalUpload = {
  public_url: string;
  storage_key: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function isS3Configured(): boolean {
  return Boolean(readEnv("S3_BUCKET") && readEnv("AWS_ACCESS_KEY_ID") && readEnv("AWS_SECRET_ACCESS_KEY"));
}

function getS3Client(): S3Client {
  const region = readEnv("S3_REGION") ?? "us-east-1";
  const endpoint = readEnv("S3_ENDPOINT");
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: readEnv("AWS_ACCESS_KEY_ID")!,
      secretAccessKey: readEnv("AWS_SECRET_ACCESS_KEY")!
    }
  });
}

function buildPublicUrl(key: string): string {
  const customBase = readEnv("S3_PUBLIC_URL");
  if (customBase) {
    return `${customBase.replace(/\/$/, "")}/${key}`;
  }
  const bucket = readEnv("S3_BUCKET")!;
  const region = readEnv("S3_REGION") ?? "us-east-1";
  const endpoint = readEnv("S3_ENDPOINT");
  if (endpoint) {
    return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
  }
  if (region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function sanitizeExtension(contentType: string, fileName?: string): string {
  if (fileName) {
    const ext = path.extname(fileName).slice(1).toLowerCase();
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
      return ext === "jpeg" ? "jpg" : ext;
    }
  }
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

export function buildPhotoKey(restaurantId: string, contentType: string, fileName?: string): string {
  const extension = sanitizeExtension(contentType, fileName);
  return `restaurants/${restaurantId}/${randomUUID()}.${extension}`;
}

export async function createPresignedUpload(
  restaurantId: string,
  contentType: string,
  fileName?: string
): Promise<PresignedUpload> {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured");
  }

  const key = buildPhotoKey(restaurantId, contentType, fileName);
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: readEnv("S3_BUCKET")!,
    Key: key,
    ContentType: contentType
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: Constants.PresignExpiresSeconds });

  return {
    upload_url: uploadUrl,
    public_url: buildPublicUrl(key),
    storage_key: key
  };
}

export async function deleteStorageObject(storageKey: string | null | undefined): Promise<void> {
  if (!storageKey) {
    return;
  }

  if (isS3Configured()) {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: readEnv("S3_BUCKET")!,
        Key: storageKey
      })
    );
    return;
  }

  if (storageKey.startsWith("local/")) {
    const filePath = path.join(process.cwd(), "public", "uploads", storageKey.slice("local/".length));
    const { unlink } = await import("node:fs/promises");
    await unlink(filePath).catch(() => undefined);
  }
}

export async function saveLocalUpload(
  restaurantId: string,
  contentType: string,
  buffer: Buffer,
  fileName?: string,
  request?: Request
): Promise<LocalUpload> {
  const extension = sanitizeExtension(contentType, fileName);
  const relativePath = `${restaurantId}/${randomUUID()}.${extension}`;
  const storageKey = `local/${relativePath}`;
  const absoluteDir = path.join(process.cwd(), "public", "uploads", restaurantId);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, path.basename(relativePath)), buffer);

  const apiPublicUrl = resolveApiPublicUrl(request);
  return {
    public_url: `${apiPublicUrl}/uploads/${relativePath}`,
    storage_key: storageKey
  };
}

export function resolveApiPublicUrl(request?: Request): string {
  const fromEnv = readEnv("API_PUBLIC_URL");
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (request) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host) {
      const proto = request.headers.get("x-forwarded-proto") ?? "http";
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  }

  return "http://localhost:3000";
}

enum Constants {
  PresignExpiresSeconds = 900
}
