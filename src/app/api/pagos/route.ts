import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { listRecords, createRecord, updateRecord, TABLE_IDS } from "@/lib/airtable";
import type { Pago } from "@/lib/types";

type PagoFields = Omit<Pago, "id">;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const pais = searchParams.get("pais");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const conditions: string[] = [];
    if (pais) conditions.push(`{Pais} = "${pais}"`);
    if (desde) conditions.push(`IS_AFTER({Fecha}, "${desde}")`);
    if (hasta) conditions.push(`IS_BEFORE({Fecha}, "${hasta}")`);

    const filterByFormula = conditions.length > 0 ? `AND(${conditions.join(",")})` : undefined;

    const records = await listRecords<PagoFields>(TABLE_IDS.Pagos, {
      filterByFormula,
      sort: [{ field: "Fecha", direction: "desc" }],
    });

    return Response.json(records);
  } catch (error) {
    console.error("Pagos GET error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fieldsJson = formData.get("fields") as string;
    const file = formData.get("file") as File | null;

    const fields = JSON.parse(fieldsJson);
    const record = await createRecord<PagoFields>(TABLE_IDS.Pagos, fields);

    let pdfUrl: string | null = null;
    if (file) {
      const blob = await put(`pagos/${record.id}/${file.name}`, file, {
        access: "public",
      });
      pdfUrl = blob.url;

      await updateRecord(TABLE_IDS.Pagos, record.id, {
        Archivo: [{ url: blob.url }],
      });
    }

    return Response.json({ ...record, pdfUrl }, { status: 201 });
  } catch (error) {
    console.error("Pagos POST error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
