import { jsonError, requireOwner } from "@/lib/auth-helpers";
import {
  listRestaurantPhotos,
  PhotoError,
  registerRestaurantPhoto,
  reorderRestaurantPhotos
} from "@/lib/restaurant-photos-service";
import { RegisterPhotoSchema, ReorderPhotosSchema } from "@tablebook/shared";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const photos = await listRestaurantPhotos(id);
    return Response.json({ photos });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    await requireOwner(request, id);
    const parsed = RegisterPhotoSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const photo = await registerRestaurantPhoto(id, parsed.data);
    const photos = await listRestaurantPhotos(id);
    return Response.json({ photo, photos }, { status: 201 });
  } catch (error) {
    if (error instanceof PhotoError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return jsonError(error);
  }
}

export async function PUT(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    await requireOwner(request, id);
    const parsed = ReorderPhotosSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const photos = await reorderRestaurantPhotos(id, parsed.data.photo_ids);
    return Response.json({ photos });
  } catch (error) {
    if (error instanceof PhotoError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return jsonError(error);
  }
}
