import { NextRequest } from "next/server";
import { extractPaymentData } from "@/lib/claude";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No se proporcionó archivo" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return Response.json({ error: "El archivo debe ser un PDF" }, { status: 400 });
  }

  if (file.size > 4 * 1024 * 1024) {
    return Response.json({ error: "El archivo no puede superar 4MB" }, { status: 413 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const extracted = await extractPaymentData(base64);
    return Response.json(extracted);
  } catch (error) {
    console.error("Extract payment error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
