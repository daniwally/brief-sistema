"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Filters } from "@/components/shared/filters";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Factura, EstadoPago, Moneda } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";

interface FacturaRecord {
  id: string;
  fields: Omit<Factura, "id">;
}

interface PagoRecord {
  id: string;
  fields: {
    Neto: number | null;
    Impuestos: number | null;
    DetalleImpuestos: string | null;
    Monto: number;
    Moneda: string;
    Fecha: string;
    Pagador: string;
    FacturaRef: string | null;
    Descripcion: string | null;
    Pais: string;
  };
}

interface Cotizaciones {
  ARS: number;
  CLP: number;
  PYG: number;
  USD: number;
}

function toUsd(monto: number, moneda: Moneda, rates: Cotizaciones): number {
  const rate = rates[moneda];
  if (!rate || rate === 0) return 0;
  return monto / rate;
}

function isEnMora(fecha: string | undefined, estado: string): boolean {
  if (!fecha || estado === "Pagado") return false;
  const emision = new Date(fecha + "T00:00:00");
  const hoy = new Date();
  const diff = (hoy.getTime() - emision.getTime()) / (1000 * 60 * 60 * 24);
  return diff > 31;
}

function diasMora(fecha: string): number {
  const emision = new Date(fecha + "T00:00:00");
  const hoy = new Date();
  const totalDias = Math.floor((hoy.getTime() - emision.getTime()) / (1000 * 60 * 60 * 24));
  return totalDias - 31;
}

function findPago(factura: FacturaRecord, pagos: PagoRecord[]): PagoRecord | undefined {
  if (!factura.fields.Numero) return undefined;
  return pagos.find((p) =>
    p.fields.FacturaRef && (
      p.fields.FacturaRef === factura.fields.Numero ||
      p.fields.FacturaRef.includes(factura.fields.Numero!) ||
      (factura.fields.Numero && factura.fields.Numero.includes(p.fields.FacturaRef))
    )
  );
}

export function FacturaTable() {
  const [facturas, setFacturas] = useState<FacturaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [hoveredPagoId, setHoveredPagoId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [rates, setRates] = useState<Cotizaciones | null>(null);
  const [pagos, setPagos] = useState<PagoRecord[]>([]);
  const [pais, setPais] = useState("all");
  const [estado, setEstado] = useState("all");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  useEffect(() => {
    fetch("/api/cotizacion")
      .then((r) => r.json())
      .then(setRates)
      .catch(() => {});
    fetch("/api/pagos")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPagos(data); })
      .catch(() => {});
  }, []);

  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (pais !== "all") params.set("pais", pais);
      if (estado !== "all") params.set("estado", estado);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);

      const res = await fetch(`/api/facturas?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        setLoading(false);
        return;
      }
      setFacturas(data);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  }, [pais, estado, desde, hasta]);

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  async function toggleEstado(id: string, currentEstado: EstadoPago) {
    const newEstado = currentEstado === "Pagado" ? "Impago" : "Pagado";

    // Para marcar como Pagado, debe existir un pago registrado
    if (newEstado === "Pagado") {
      const factura = facturas.find((f) => f.id === id);
      if (factura) {
        const pago = findPago(factura, pagos);
        if (!pago) {
          toast.error("No se puede marcar como Pagada sin un comprobante de pago registrado. Registra un pago en la seccion Pagos.", { duration: 5000 });
          return;
        }
      }
    }

    setTogglingId(id);
    setFacturas((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, fields: { ...f.fields, Estado: newEstado } } : f
      )
    );

    await fetch(`/api/facturas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Estado: newEstado }),
    });
    setTogglingId(null);
  }

  async function deleteFactura(id: string) {
    if (!confirm("¿Eliminar esta venta?")) return;
    await fetch(`/api/facturas/${id}`, { method: "DELETE" });
    setFacturas((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ventas</h2>
          <p className="text-sm text-gray-400">Facturacion AR / CL / PY</p>
        </div>
        <Link href="/facturas/nueva">
          <Button className="rounded-xl bg-violet-500 hover:bg-violet-600 text-white shadow-sm">+ Nueva Venta</Button>
        </Link>
      </div>

      {/* Filters + Cotización */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <Filters
          pais={pais}
          setPais={setPais}
          estado={estado}
          setEstado={setEstado}
          desde={desde}
          setDesde={setDesde}
          hasta={hasta}
          setHasta={setHasta}
          onClear={() => {
            setPais("all");
            setEstado("all");
            setDesde("");
            setHasta("");
          }}
        />
        {rates && (
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">Cotizacion Ref.:</span>
            <span className="text-xs font-medium text-gray-600">
              USD/ARS <span className="text-violet-600 font-mono">$ {rates.ARS.toLocaleString("de-DE", { maximumFractionDigits: 2 })}</span>
            </span>
            <span className="text-xs font-medium text-gray-600">
              USD/CLP <span className="text-violet-600 font-mono">$ {rates.CLP.toLocaleString("de-DE", { maximumFractionDigits: 2 })}</span>
            </span>
            <span className="text-xs font-medium text-gray-600">
              USD/PYG <span className="text-violet-600 font-mono">Gs. {rates.PYG.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</span>
            </span>
            <span className="text-[10px] text-gray-300">dolarhoy.com</span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Cargando...</p>
      ) : error ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-red-500">Error al cargar ventas</p>
          <p className="text-xs text-muted-foreground font-mono break-all max-w-lg mx-auto">{error}</p>
        </div>
      ) : facturas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay ventas registradas</p>
          <Link href="/facturas/nueva">
            <Button variant="outline" className="mt-4">
              Registrar primera venta
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-7 px-1"></TableHead>
                <TableHead className="w-[80px] px-2">Fecha</TableHead>
                <TableHead className="w-[90px] px-2">Nro</TableHead>
                <TableHead className="px-2">Cliente / Emisor</TableHead>
                <TableHead className="w-[140px] px-2 text-right">Monto</TableHead>
                <TableHead className="w-[52px] px-2">Pais</TableHead>
                <TableHead className="w-[90px] px-2">Estado</TableHead>
                <TableHead className="w-[50px] px-2">PDF</TableHead>
                <TableHead className="w-[60px] px-1"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas.map((f) => {
                const moneda = f.fields.Moneda as Moneda;
                const usdAmount = rates ? toUsd(f.fields.Monto, moneda, rates) : null;
                const mora = isEnMora(f.fields.Fecha, f.fields.Estado as string);
                const pago = f.fields.Estado === "Pagado" ? findPago(f, pagos) : undefined;
                return (
                  <TableRow key={f.id} className={mora ? "bg-red-50 hover:bg-red-100" : ""}>
                    <TableCell className="text-center px-1">
                      {mora && (
                        <span title={`${diasMora(f.fields.Fecha!)} días en mora`} className="relative group">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-red-500 inline-block">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                            <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span className="absolute left-5 -top-1 hidden group-hover:block bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap z-10 shadow-sm">
                            {diasMora(f.fields.Fecha!)} días en mora
                          </span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={`px-2 whitespace-nowrap text-xs ${mora ? "text-red-700 font-medium" : ""}`}>
                      {f.fields.Fecha ? formatDate(f.fields.Fecha) : "-"}
                    </TableCell>
                    <TableCell className="px-2 text-xs truncate">{f.fields.Numero || "-"}</TableCell>
                    <TableCell className="px-2">
                      <div className="text-sm truncate">{f.fields.Cliente || "-"}</div>
                      {f.fields.Emisor && (
                        <div className="text-xs text-gray-400 truncate">{f.fields.Emisor}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono whitespace-nowrap">
                      <div className="text-sm">{formatCurrency(f.fields.Monto, moneda)}</div>
                      {usdAmount != null && moneda !== "USD" && (
                        <div className="text-[11px] text-gray-400">
                          US$ {usdAmount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-2 text-xs">{f.fields.Pais === "Argentina" ? "AR" : f.fields.Pais === "Chile" ? "CL" : f.fields.Pais === "Paraguay" ? "PY" : f.fields.Pais}</TableCell>
                    <TableCell className="px-2">
                      <div>
                        <StatusBadge
                          estado={f.fields.Estado as EstadoPago}
                          loading={togglingId === f.id}
                          onToggle={() =>
                            toggleEstado(f.id, f.fields.Estado as EstadoPago)
                          }
                        />
                        {pago && (
                          <p
                            className="text-[10px] text-violet-600 mt-0.5 cursor-default"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setPopoverPos({ top: rect.top, left: rect.left - 288 });
                              setHoveredPagoId(f.id);
                            }}
                            onMouseLeave={() => setHoveredPagoId(null)}
                          >
                            {formatDate(pago.fields.Fecha)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2">
                      {f.fields.Archivo && f.fields.Archivo.length > 0 ? (
                        <a
                          href={f.fields.Archivo[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          PDF
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 text-xs h-7 px-2"
                        onClick={() => deleteFactura(f.id)}
                      >
                        Borrar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Fixed popover for pago details */}
      {hoveredPagoId && popoverPos && (() => {
        const fac = facturas.find((f) => f.id === hoveredPagoId);
        const p = fac ? findPago(fac, pagos) : undefined;
        if (!p) return null;
        return (
          <div
            className="fixed bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 w-72"
            style={{ top: popoverPos.top - 8, left: popoverPos.left, transform: "translateY(-100%)" }}
            onMouseEnter={() => setHoveredPagoId(hoveredPagoId)}
            onMouseLeave={() => setHoveredPagoId(null)}
          >
            <p className="text-xs font-semibold text-gray-700 mb-3">Resumen del pago</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Pagador</span>
                <span className="font-medium text-gray-700">{p.fields.Pagador}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha pago</span>
                <span className="text-gray-700">{formatDate(p.fields.Fecha)}</span>
              </div>
              {p.fields.Descripcion && (
                <div>
                  <span className="text-gray-400">Concepto</span>
                  <p className="text-gray-600 mt-0.5">{p.fields.Descripcion}</p>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                {p.fields.Neto != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Neto</span>
                    <span className="font-mono text-gray-700">{formatCurrency(p.fields.Neto, p.fields.Moneda as Moneda)}</span>
                  </div>
                )}
                {p.fields.Impuestos != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Imp. /Ret.</span>
                    <span className="font-mono text-gray-700">{formatCurrency(p.fields.Impuestos, p.fields.Moneda as Moneda)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-500">Total</span>
                  <span className="font-mono text-violet-600">{formatCurrency(p.fields.Monto, p.fields.Moneda as Moneda)}</span>
                </div>
              </div>
              {p.fields.DetalleImpuestos && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-400 block mb-1">Detalle imp. /ret.</span>
                  <ul className="space-y-0.5 text-gray-600">
                    {p.fields.DetalleImpuestos.split(/[,;\n]/).map((item, i) => {
                      const trimmed = item.trim();
                      return trimmed ? <li key={i} className="flex items-start gap-1"><span className="text-gray-300 mt-px">-</span>{trimmed}</li> : null;
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
