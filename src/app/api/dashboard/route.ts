import { NextRequest } from "next/server";
import { listRecords, checkConfig, TABLE_IDS } from "@/lib/airtable";
import type { Factura, Gasto, DashboardData, Moneda } from "@/lib/types";

type FacturaFields = Omit<Factura, "id">;
type GastoFields = Omit<Gasto, "id">;

const MONEDAS: Moneda[] = ["ARS", "CLP", "PYG", "USD"];

export async function GET(request: NextRequest) {
  try {
    const config = checkConfig();
    if (!config.hasApiKey || !config.hasBaseId) {
      return Response.json(
        { error: "Airtable no configurado", config },
        { status: 500 }
      );
    }

    const { searchParams } = request.nextUrl;
    const pais = searchParams.get("pais");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const conditions: string[] = [];
    if (pais) conditions.push(`{Pais} = "${pais}"`);
    if (desde) conditions.push(`IS_AFTER({Fecha}, "${desde}")`);
    if (hasta) conditions.push(`IS_BEFORE({Fecha}, "${hasta}")`);

    const filterByFormula = conditions.length > 0 ? `AND(${conditions.join(",")})` : undefined;

    // Facturacion del mes: siempre trae TODAS las facturas (sin filtros de dashboard)
    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();
    const mesFormula = `AND(DATETIME_FORMAT({Fecha},'YYYY')='${anioActual}',DATETIME_FORMAT({Fecha},'M')='${mesActual + 1}')`;

    const [facturas, gastos, facturasMes] = await Promise.all([
      listRecords<FacturaFields>(TABLE_IDS.Facturas, { filterByFormula }),
      listRecords<GastoFields>(TABLE_IDS.Gastos, { filterByFormula }),
      listRecords<FacturaFields>(TABLE_IDS.Facturas, { filterByFormula: mesFormula }),
    ]);

    const ingresos: Record<string, number> = {};
    const gastosTotal: Record<string, number> = {};
    const balance: Record<string, number> = {};

    for (const m of MONEDAS) {
      ingresos[m] = 0;
      gastosTotal[m] = 0;
      balance[m] = 0;
    }

    for (const f of facturas) {
      const moneda = f.fields.Moneda;
      if (moneda && f.fields.Monto) {
        ingresos[moneda] += f.fields.Monto;
      }
    }

    for (const g of gastos) {
      const moneda = g.fields.Moneda;
      if (moneda && g.fields.Monto) {
        gastosTotal[moneda] += g.fields.Monto;
      }
    }

    for (const m of MONEDAS) {
      balance[m] = ingresos[m] - gastosTotal[m];
    }

    const facturasImpagas = facturas.filter((f) => f.fields.Estado === "Impago").length;
    const gastosImpagos = gastos.filter((g) => g.fields.Estado === "Impago").length;

    // Facturacion del mes en curso por moneda (usa facturasMes sin filtros)
    const facturacionMes: Record<string, number> = {};
    for (const m of MONEDAS) facturacionMes[m] = 0;
    let facturasMesPagas = 0;
    let facturasMesImpagas = 0;

    for (const f of facturasMes) {
      if (f.fields.Moneda && f.fields.Monto) {
        facturacionMes[f.fields.Moneda] += f.fields.Monto;
      }
      if (f.fields.Estado === "Pagado") facturasMesPagas++;
      else facturasMesImpagas++;
    }

    const data: DashboardData & { _debug?: unknown } = {
      ingresos,
      gastos: gastosTotal,
      balance,
      pendientes: {
        facturas_impagas: facturasImpagas,
        gastos_impagos: gastosImpagos,
      },
      facturacionMes,
      facturasMesPagas,
      facturasMesImpagas,
      _debug: {
        mesFormula,
        facturasMesCount: facturasMes.length,
        totalFacturas: facturas.length,
        facturasConFecha: facturas.filter(f => f.fields.Fecha).map(f => ({ fecha: f.fields.Fecha, monto: f.fields.Monto, moneda: f.fields.Moneda })).slice(0, 5),
      },
    };

    return Response.json(data);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return Response.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
