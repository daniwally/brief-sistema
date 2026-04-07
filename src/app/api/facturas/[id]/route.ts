import { NextRequest } from "next/server";
import { updateRecord, deleteRecord } from "@/lib/airtable";
import type { Factura } from "@/lib/types";

type FacturaFields = Omit<Factura, "id">;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fields = await request.json();
  const record = await updateRecord<FacturaFields>("Facturas", id, fields);
  return Response.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await deleteRecord("Facturas", id);
  return Response.json(result);
}
