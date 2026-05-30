import { jsonError, requireOwner } from "@/lib/auth-helpers";
import { PhotoError, setRestaurantPhotoAvatar } from "@/lib/restaurant-photos-service";

type Props = {
  params: Promise<{ id: string; photoId: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { id, photoId } = await params;
    await requireOwner(request, id);
    const photos = await setRestaurantPhotoAvatar(id, photoId);
    return Response.json({ photos });
  } catch (error) {
    if (error instanceof PhotoError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return jsonError(error);
  }
}
