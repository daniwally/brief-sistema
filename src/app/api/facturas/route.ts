import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { listRecords, createRecord, updateRecord, TABLE_IDS } from "@/lib/airtable";
import type { Factura } from "@/lib/types";

type FacturaFields = Omit<Factura, "id">;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const pais = searchParams.get("pais");
    const estado = searchParams.get("estado");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const conditions: string[] = [];
    if (pais) conditions.push(`{Pais} = "${pais}"`);
    if (estado) conditions.push(`{Estado} = "${estado}"`);
    if (desde) conditions.push(`IS_AFTER({Fecha}, "${desde}")`);
    if (hasta) conditions.push(`IS_BEFORE({Fecha}, "${hasta}")`);

    const filterByFormula = conditions.length > 0 ? `AND(${conditions.join(",")})` : undefined;

    const records = await listRecords<FacturaFields>(TABLE_IDS.Facturas, {
      filterByFormula,
      sort: [{ field: "Fecha", direction: "desc" }],
    });

    return Response.json(records);
  } catch (error) {
    console.error("Facturas GET error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fieldsJson = formData.get("fields") as string;
    const file = formData.get("file") as File | null;

    const fields = JSON.parse(fieldsJson);
    const record = await createRecord<FacturaFields>(TABLE_IDS.Facturas, fields);

    // Upload PDF to Vercel Blob, then attach URL to Airtable record
    if (file) {
      try {
        const blob = await put(`facturas/${record.id}/${file.name}`, file, {
          access: "public",
        });

        // Update Airtable record with the attachment URL
        await updateRecord(TABLE_IDS.Facturas, record.id, {
          Archivo: [{ url: blob.url }],
        });
      } catch (err) {
        console.error("Failed to upload PDF:", err);
      }
    }

    return Response.json(record, { status: 201 });
  } catch (error) {
    console.error("Facturas POST error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
