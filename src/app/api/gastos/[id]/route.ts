import { NextRequest } from "next/server";
import { updateRecord, deleteRecord, TABLE_IDS } from "@/lib/airtable";
import type { Gasto } from "@/lib/types";

type GastoFields = Omit<Gasto, "id">;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fields = await request.json();
  const record = await updateRecord<GastoFields>(TABLE_IDS.Gastos, id, fields);
  return Response.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await deleteRecord(TABLE_IDS.Gastos, id);
  return Response.json(result);
}
