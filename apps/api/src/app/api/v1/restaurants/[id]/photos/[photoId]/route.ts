import { jsonError, requireOwner } from "@/lib/auth-helpers";
import { deleteRestaurantPhoto, PhotoError } from "@/lib/restaurant-photos-service";

type Props = {
  params: Promise<{ id: string; photoId: string }>;
};

export async function DELETE(request: Request, { params }: Props) {
  try {
    const { id, photoId } = await params;
    await requireOwner(request, id);
    await deleteRestaurantPhoto(id, photoId);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof PhotoError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return jsonError(error);
  }
}
