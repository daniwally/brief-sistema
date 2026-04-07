import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedInvoice } from "./types";

const client = new Anthropic();

const EXTRACTION_PROMPT = `Sos un asistente que extrae datos de facturas latinoamericanas.
Extraé los siguientes campos de este PDF de factura. Devolvé SOLAMENTE JSON válido, sin markdown ni backticks:
{
  "numero": "número de factura",
  "monto": número sin símbolos de moneda,
  "moneda": "ARS" | "CLP" | "PYG" | "USD",
  "fecha": "YYYY-MM-DD",
  "emisor": "nombre del emisor/empresa",
  "cuit_rut_ruc": "número de identificación fiscal",
  "descripcion": "descripción breve de servicios/bienes",
  "pais": "Argentina" | "Chile" | "Paraguay"
}
Si un campo no se puede determinar, usá null.
Detectá el país según el formato de la factura, CUIT (Argentina), RUT (Chile), o RUC (Paraguay).`;

export async function extractInvoiceData(pdfBase64: string): Promise<ExtractedInvoice> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const parsed = JSON.parse(textContent.text);
  return parsed as ExtractedInvoice;
}
