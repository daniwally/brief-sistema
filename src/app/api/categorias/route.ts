import { listRecords, TABLE_IDS } from "@/lib/airtable";
import type { Categoria } from "@/lib/types";

type CategoriaFields = Omit<Categoria, "id">;

export async function GET() {
  try {
    const records = await listRecords<CategoriaFields>(TABLE_IDS.Categorias, {
      sort: [{ field: "Nombre", direction: "asc" }],
    });
    return Response.json(records);
  } catch (error) {
    console.error("Categorias GET error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
