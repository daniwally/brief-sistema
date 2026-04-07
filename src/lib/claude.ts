import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedInvoice, ExtractedPayment } from "./types";

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

  // Strip markdown code fences if Claude wraps the JSON
  let text = textContent.text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  const parsed = JSON.parse(text);
  return parsed as ExtractedInvoice;
}

const PAYMENT_EXTRACTION_PROMPT = `Sos un asistente que extrae datos de comprobantes de pago latinoamericanos.
Extraé los siguientes campos de este PDF de comprobante de pago/transferencia. Devolvé SOLAMENTE JSON válido, sin markdown ni backticks:
{
  "neto": importe neto (subtotal sin impuestos) como número,
  "impuestos": monto total de impuestos como número,
  "detalle_impuestos": "desglose de impuestos, ej: IVA 21%: $2100, Retenciones: $500",
  "monto": importe total del pago como número,
  "moneda": "ARS" | "CLP" | "PYG" | "USD",
  "fecha": "YYYY-MM-DD",
  "pagador": "nombre de quien realizó el pago",
  "numero_factura": "número de factura que se está pagando, si se menciona",
  "descripcion": "descripción o concepto del pago",
  "pais": "Argentina" | "Chile" | "Paraguay"
}
Si un campo no se puede determinar, usá null.

IMPORTES:
- "neto" es el subtotal ANTES de impuestos/retenciones
- "impuestos" es la SUMA de todos los impuestos o retenciones
- "monto" es el TOTAL final
- "detalle_impuestos" es un texto con el desglose de cada impuesto/retencion
- Si el comprobante no separa neto de impuestos, poné el total en "monto" y null en "neto" e "impuestos"

REGLAS PARA DETECTAR MONEDA:
- Si ves "$" o "ARS" o "Pesos" en un comprobante argentino (tiene CBU/CVU/CUIT) → "ARS"
- Si ves "$" o "CLP" o "Pesos" en un comprobante chileno (tiene RUT) → "CLP"
- Si ves "Gs" o "PYG" o "Guaraníes" en un comprobante paraguayo → "PYG"
- Si ves "US$" o "USD" o "Dólares" → "USD"

REGLAS PARA DETECTAR PAÍS:
- CBU, CVU, CUIT → Argentina
- RUT con formato XX.XXX.XXX-X → Chile
- RUC → Paraguay

IMPORTANTE: Buscá cualquier referencia a número de factura en el concepto o descripción del pago.`;

export async function extractPaymentData(pdfBase64: string): Promise<ExtractedPayment> {
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
            text: PAYMENT_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let text = textContent.text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  const parsed = JSON.parse(text);
  return parsed as ExtractedPayment;
}
