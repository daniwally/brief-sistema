import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { listRecords, createRecord, updateRecord, TABLE_IDS } from "@/lib/airtable";
import type { Gasto } from "@/lib/types";

type GastoFields = Omit<Gasto, "id">;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const pais = searchParams.get("pais");
    const estado = searchParams.get("estado");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const categoria = searchParams.get("categoria");

    const conditions: string[] = [];
    if (pais) conditions.push(`{Pais} = "${pais}"`);
    if (estado) conditions.push(`{Estado} = "${estado}"`);
    if (desde) conditions.push(`IS_AFTER({Fecha}, "${desde}")`);
    if (hasta) conditions.push(`IS_BEFORE({Fecha}, "${hasta}")`);
    if (categoria) conditions.push(`FIND("${categoria}", ARRAYJOIN({Categoria}))`);

    const filterByFormula = conditions.length > 0 ? `AND(${conditions.join(",")})` : undefined;

    const records = await listRecords<GastoFields>(TABLE_IDS.Gastos, {
      filterByFormula,
      sort: [{ field: "Fecha", direction: "desc" }],
    });

    return Response.json(records);
  } catch (error) {
    console.error("Gastos GET error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fieldsJson = formData.get("fields") as string;
    const file = formData.get("file") as File | null;

    const fields = JSON.parse(fieldsJson);
    const record = await createRecord<GastoFields>(TABLE_IDS.Gastos, fields);

    let pdfUrl: string | null = null;
    if (file) {
      const blob = await put(`gastos/${record.id}/${file.name}`, file, {
        access: "public",
      });
      pdfUrl = blob.url;

      await updateRecord(TABLE_IDS.Gastos, record.id, {
        Archivo: [{ url: blob.url }],
      });
    }

    return Response.json({ ...record, pdfUrl }, { status: 201 });
  } catch (error) {
    console.error("Gastos POST error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
