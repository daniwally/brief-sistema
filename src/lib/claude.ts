import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedInvoice } from "./types";

const client = new Anthropic();

const EXTRACTION_PROMPT = `Sos un asistente que extrae datos de facturas latinoamericanas.
Extraé los siguientes campos de este PDF de factura. Devolvé SOLAMENTE JSON válido, sin markdown ni backticks:
{
  "numero": "número de factura",
  "neto": importe neto (subtotal sin impuestos) como número,
  "impuestos": monto total de impuestos como número,
  "detalle_impuestos": "desglose de impuestos, ej: IVA 21%: $2100, IIBB 3%: $300",
  "monto": importe total (neto + impuestos) como número,
  "moneda": "ARS" | "CLP" | "PYG" | "USD",
  "fecha": "YYYY-MM-DD",
  "emisor": "nombre del emisor/empresa que emite la factura",
  "cuit_rut_ruc": "CUIT/RUT/RUC del emisor",
  "cliente": "nombre del cliente/receptor de la factura",
  "cuit_rut_ruc_cliente": "CUIT/RUT/RUC del cliente",
  "descripcion": "descripción breve de servicios/bienes",
  "pais": "Argentina" | "Chile" | "Paraguay"
}
Si un campo no se puede determinar, usá null.

IMPORTES:
- "neto" es el subtotal ANTES de impuestos
- "impuestos" es la SUMA de todos los impuestos (IVA, IIBB, percepciones, etc.)
- "monto" es el TOTAL final (neto + impuestos)
- "detalle_impuestos" es un texto con el desglose: qué impuesto y cuánto
- Si la factura no separa neto de impuestos, poné el total en "monto" y null en "neto" e "impuestos"

REGLAS PARA DETECTAR MONEDA:
- Si ves "$" o "ARS" o "Pesos" en una factura argentina (tiene CUIT con formato XX-XXXXXXXX-X) → "ARS"
- Si ves "$" o "CLP" o "Pesos" en una factura chilena (tiene RUT con formato XX.XXX.XXX-X) → "CLP"
- Si ves "Gs" o "PYG" o "Guaraníes" en una factura paraguaya (tiene RUC) → "PYG"
- Si ves "US$" o "USD" o "Dólares" → "USD"
- El símbolo "$" solo NO es suficiente para USD, fijate el país de origen.

REGLAS PARA DETECTAR PAÍS:
- CUIT (XX-XXXXXXXX-X) → Argentina
- RUT (XX.XXX.XXX-X) → Chile
- RUC → Paraguay
- También fijate en direcciones, códigos postales, o menciones explícitas del país.`;

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
