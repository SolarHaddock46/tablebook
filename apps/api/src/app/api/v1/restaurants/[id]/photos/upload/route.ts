import { jsonError, requireOwner } from "@/lib/auth-helpers";
import { PhotoError, registerRestaurantPhoto } from "@/lib/restaurant-photos-service";
import { isS3Configured, saveLocalUpload } from "@/lib/storage";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    await requireOwner(request, id);

    if (isS3Configured()) {
      return Response.json(
        { error: "Use presigned upload when S3 is configured", code: "USE_PRESIGN" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Missing file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "image/jpeg";
    const saved = await saveLocalUpload(id, contentType, buffer, file.name, request);
    const photo = await registerRestaurantPhoto(id, {
      url: saved.public_url,
      storage_key: saved.storage_key
    });

    return Response.json({ photo }, { status: 201 });
  } catch (error) {
    if (error instanceof PhotoError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return jsonError(error);
  }
}
