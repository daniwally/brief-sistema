import { listRecords } from "@/lib/airtable";
import type { Categoria } from "@/lib/types";

type CategoriaFields = Omit<Categoria, "id">;

export async function GET() {
  const records = await listRecords<CategoriaFields>("Categorias", {
    sort: [{ field: "Nombre", direction: "asc" }],
  });
  return Response.json(records);
}
