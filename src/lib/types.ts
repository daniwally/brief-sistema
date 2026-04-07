export interface Factura {
  id: string;
  Numero: string | null;
  Monto: number;
  Moneda: "ARS" | "CLP" | "PYG" | "USD";
  Fecha: string;
  Emisor: string;
  CUIT_RUT_RUC: string | null;
  Cliente: string | null;
  CUIT_RUT_RUC_Cliente: string | null;
  Descripcion: string | null;
  Pais: "Argentina" | "Chile" | "Paraguay";
  Estado: "Pagado" | "Impago";
  Archivo?: AirtableAttachment[];
  Notas?: string | null;
}

export interface Gasto {
  id: string;
  Monto: number;
  Moneda: "ARS" | "CLP" | "PYG" | "USD";
  Fecha: string;
  Proveedor: string;
  Categoria?: string[];
  Descripcion: string | null;
  Pais: "Argentina" | "Chile" | "Paraguay";
  Estado: "Pagado" | "Impago";
  Archivo?: AirtableAttachment[];
  Notas?: string | null;
}

export interface Categoria {
  id: string;
  Nombre: string;
}

export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
}

export interface AirtableRecord<T> {
  id: string;
  fields: Omit<T, "id">;
  createdTime: string;
}

export interface AirtableListResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

export interface DashboardData {
  ingresos: Record<string, number>;
  gastos: Record<string, number>;
  balance: Record<string, number>;
  pendientes: {
    facturas_impagas: number;
    gastos_impagos: number;
  };
}

export interface ExtractedInvoice {
  numero: string | null;
  monto: number | null;
  moneda: "ARS" | "CLP" | "PYG" | "USD" | null;
  fecha: string | null;
  emisor: string | null;
  cuit_rut_ruc: string | null;
  cliente: string | null;
  cuit_rut_ruc_cliente: string | null;
  descripcion: string | null;
  pais: "Argentina" | "Chile" | "Paraguay" | null;
}

export type Moneda = "ARS" | "CLP" | "PYG" | "USD";
export type Pais = "Argentina" | "Chile" | "Paraguay";
export type EstadoPago = "Pagado" | "Impago";
