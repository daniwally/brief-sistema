import { NextRequest } from "next/server";
import { updateRecord, deleteRecord, TABLE_IDS } from "@/lib/airtable";
import type { Factura } from "@/lib/types";

type FacturaFields = Omit<Factura, "id">;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fields = await request.json();
  const record = await updateRecord<FacturaFields>(TABLE_IDS.Facturas, id, fields);
  return Response.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await deleteRecord(TABLE_IDS.Facturas, id);
  return Response.json(result);
}
