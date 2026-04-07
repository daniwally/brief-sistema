import { NextRequest } from "next/server";
import { updateRecord, deleteRecord, TABLE_IDS } from "@/lib/airtable";
import type { Pago } from "@/lib/types";

type PagoFields = Omit<Pago, "id">;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fields = await request.json();
  const record = await updateRecord<PagoFields>(TABLE_IDS.Pagos, id, fields);
  return Response.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await deleteRecord(TABLE_IDS.Pagos, id);
  return Response.json(result);
}
