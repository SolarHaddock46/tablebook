import { jsonError, requireOwner } from "@/lib/auth-helpers";
import { createPresignedUpload, isS3Configured } from "@/lib/storage";
import { PresignPhotoSchema } from "@tablebook/shared";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    await requireOwner(request, id);

    if (!isS3Configured()) {
      return Response.json({ mode: "local" as const });
    }

    const parsed = PresignPhotoSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const presigned = await createPresignedUpload(id, parsed.data.content_type, parsed.data.file_name);
    return Response.json(presigned);
  } catch (error) {
    return jsonError(error);
  }
}
