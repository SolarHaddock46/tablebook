import { eq } from "drizzle-orm";
import { getDb, mapRestaurant, restaurants } from "@tablebook/db";
import { UpdateTablesSchema } from "@tablebook/shared";
import { jsonError, requireOwner } from "@/lib/auth-helpers";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    await requireOwner(request, id);
    const parsed = UpdateTablesSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const normalizedTables = parsed.data.tables.map((table, index) => ({
      ...table,
      id: table.id ?? `table-${index + 1}`
    }));

    const db = getDb();
    const [row] = await db
      .update(restaurants)
      .set({ tables: normalizedTables })
      .where(eq(restaurants.id, id))
      .returning();

    return Response.json(mapRestaurant(row));
  } catch (error) {
    return jsonError(error);
  }
}
